#!/usr/bin/env node
/**
 * Compacts personal_events rows into NDJSON (and optional Parquet) in Minio,
 * marks rows as compacted, and records curated paths.
 */
const { createClient } = require("@supabase/supabase-js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { execFileSync } = require("node:child_process");
const { URL } = require("node:url");

const supabaseUrl =
  process.env.PERSONAL_DATA_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.PERSONAL_DATA_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL/key missing for compaction");
  process.exit(1);
}

const s3Endpoint =
  process.env.PERSONAL_DATA_S3_ENDPOINT ?? "http://127.0.0.1:9000";
const s3Region = process.env.PERSONAL_DATA_S3_REGION ?? "us-east-1";
const s3AccessKey =
  process.env.PERSONAL_DATA_S3_ACCESS_KEY ?? process.env.MINIO_ROOT_USER;
const s3SecretKey =
  process.env.PERSONAL_DATA_S3_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD;
const rawBucket = process.env.PERSONAL_DATA_S3_BUCKET_RAW ?? "personal-raw";
const curatedBucket =
  process.env.PERSONAL_DATA_S3_BUCKET_CURATED ?? "personal-curated";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const s3 = new S3Client({
  region: s3Region,
  endpoint: s3Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: s3AccessKey ?? "",
    secretAccessKey: s3SecretKey ?? "",
  },
});

const BATCH_SIZE = Number(process.env.PERSONAL_DATA_COMPACT_BATCH ?? 500);

async function fetchBatch() {
  const { data, error } = await supabase
    .from("personal_events")
    .select(
      "id, source, kind, ts, payload, hash, signature, blob_path, ingest_method, ingest_meta"
    )
    .is("compacted_at", null)
    .order("ts", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;
  return data ?? [];
}

function toNdjson(events) {
  return events
    .map((e) =>
      JSON.stringify({
        id: e.id,
        source: e.source,
        kind: e.kind,
        ts: e.ts,
        payload: e.payload,
        hash: e.hash,
        signature: e.signature,
        blob_path: e.blob_path,
        ingest_method: e.ingest_method,
        ingest_meta: e.ingest_meta,
      })
    )
    .join("\n");
}

async function uploadNdjson(events) {
  if (!events.length) return null;
  const ts = new Date(events[0].ts ?? Date.now());
  const key = [
    "ndjson",
    ts.getUTCFullYear(),
    String(ts.getUTCMonth() + 1).padStart(2, "0"),
    String(ts.getUTCDate()).padStart(2, "0"),
    `${events[0].source}-${Date.now()}.ndjson`,
  ].join("/");

  const body = toNdjson(events);
  await s3.send(
    new PutObjectCommand({
      Bucket: curatedBucket,
      Key: key,
      Body: body,
      ContentType: "application/x-ndjson",
    })
  );

  return key;
}

function tryParquet(ndjsonKey) {
  if (!process.env.PERSONAL_DATA_WRITE_PARQUET) return null;

  const duckdbBin = process.env.DUCKDB_BIN ?? "duckdb";
  const ndjsonUrl = `s3://${curatedBucket}/${ndjsonKey}`;
  const parquetKey = ndjsonKey.replace(/\.ndjson$/, ".parquet");
  const parquetUrl = `s3://${curatedBucket}/${parquetKey}`;

  const endpoint = new URL(s3Endpoint);
  const s3Host = endpoint.host;
  const useSsl = endpoint.protocol === "https:";

  const sql = `
    INSTALL httpfs;
    LOAD httpfs;
    SET s3_endpoint='${s3Host}';
    SET s3_url_style='path';
    SET s3_use_ssl=${useSsl};
    SET s3_access_key_id='${s3AccessKey}';
    SET s3_secret_access_key='${s3SecretKey}';
    COPY (
      SELECT * FROM read_ndjson_auto('${ndjsonUrl}')
    ) TO '${parquetUrl}' (FORMAT 'parquet');
  `;

  try {
    execFileSync(duckdbBin, ["-c", sql], { stdio: "inherit" });
    return parquetKey;
  } catch (err) {
    console.warn("Parquet conversion skipped:", err.message);
    return null;
  }
}

async function markCompacted(ids, curatedPath) {
  if (!ids.length) return;
  const { error } = await supabase
    .from("personal_events")
    .update({
      compacted_at: new Date().toISOString(),
      curated_path: curatedPath ?? null,
    })
    .in("id", ids);
  if (error) throw error;
}

async function runOnce() {
  const events = await fetchBatch();
  if (!events.length) {
    console.log("No events to compact");
    return false;
  }

  const ndjsonKey = await uploadNdjson(events);
  const parquetKey = ndjsonKey ? tryParquet(ndjsonKey) : null;
  const curatedPath = parquetKey ?? ndjsonKey;

  await markCompacted(
    events.map((e) => e.id),
    curatedPath
  );

  console.log(
    `Compacted ${events.length} events -> ${curatedPath ?? "skipped upload"}`
  );
  return events.length === BATCH_SIZE;
}

async function main() {
  let more = true;
  while (more) {
    more = await runOnce();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
