import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/server";

type IngestEvent = {
  source: string;
  kind: string;
  ts: string;
  payload: Record<string, unknown>;
  signature?: string;
  blobBase64?: string;
  blobContentType?: string;
  ingestMeta?: Record<string, unknown>;
};

const ingestKey = process.env.PERSONAL_DATA_INGEST_KEY;

const s3Client =
  process.env.PERSONAL_DATA_S3_ENDPOINT &&
  process.env.PERSONAL_DATA_S3_ACCESS_KEY &&
  process.env.PERSONAL_DATA_S3_SECRET_KEY
    ? new S3Client({
        region: process.env.PERSONAL_DATA_S3_REGION ?? "us-east-1",
        endpoint: process.env.PERSONAL_DATA_S3_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.PERSONAL_DATA_S3_ACCESS_KEY,
          secretAccessKey: process.env.PERSONAL_DATA_S3_SECRET_KEY,
        },
      })
    : null;

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function toBytea(hex: string) {
  return `\\x${hex}`;
}

async function persistBlob(
  event: IngestEvent,
  bodyBuffer: Buffer
): Promise<string | null> {
  if (!s3Client) return null;

  const bucket = process.env.PERSONAL_DATA_S3_BUCKET_RAW ?? "personal-raw";
  const ts = new Date(event.ts);
  const key = [
    "raw",
    ts.getUTCFullYear(),
    String(ts.getUTCMonth() + 1).padStart(2, "0"),
    String(ts.getUTCDate()).padStart(2, "0"),
    event.source.replace(/[^a-zA-Z0-9_-]/g, "_"),
    `${event.kind}-${Date.now()}.bin`,
  ].join("/");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: event.blobContentType ?? "application/octet-stream",
      ServerSideEncryption:
        process.env.PERSONAL_DATA_S3_SSE ?? undefined, // optional
    })
  );

  return key;
}

function normalizeEvents(input: unknown): IngestEvent[] {
  const rawEvents = Array.isArray((input as { events?: unknown }).events)
    ? (input as { events: unknown[] }).events
    : Array.isArray(input)
    ? (input as unknown[])
    : [input];

  return rawEvents.flatMap((raw) => {
    const candidate = raw as Partial<IngestEvent>;
    if (
      !candidate ||
      typeof candidate !== "object" ||
      !candidate.source ||
      !candidate.kind ||
      !candidate.ts ||
      !candidate.payload
    ) {
      return [];
    }
    return [
      {
        source: String(candidate.source),
        kind: String(candidate.kind),
        ts: new Date(candidate.ts).toISOString(),
        payload: candidate.payload as Record<string, unknown>,
        signature: candidate.signature,
        blobBase64: candidate.blobBase64,
        blobContentType: candidate.blobContentType,
        ingestMeta: candidate.ingestMeta ?? {},
      },
    ];
  });
}

async function getSupabase(): Promise<SupabaseClient> {
  const url =
    process.env.PERSONAL_DATA_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.PERSONAL_DATA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return createSupabaseAdmin();
}

export async function POST(req: NextRequest) {
  if (!ingestKey) {
    return NextResponse.json(
      { error: "Ingestion key not configured" },
      { status: 500 }
    );
  }

  const providedKey = req.headers.get("x-ingest-key");
  if (providedKey !== ingestKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const events = normalizeEvents(payload);
  if (!events.length) {
    return NextResponse.json({ error: "No valid events" }, { status: 400 });
  }

  const admin = await getSupabase();

  const rows = [];
  for (const event of events) {
    const hashed = sha256Hex(
      JSON.stringify({
        source: event.source,
        kind: event.kind,
        ts: event.ts,
        payload: event.payload,
      })
    );

    let blobPath: string | null = null;
    if (event.blobBase64) {
      const buffer = Buffer.from(event.blobBase64, "base64");
      blobPath = await persistBlob(event, buffer);
    }

    rows.push({
      source: event.source,
      kind: event.kind,
      ts: event.ts,
      payload: event.payload,
      hash: toBytea(hashed),
      signature: event.signature,
      blob_path: blobPath,
      ingest_method: "api",
      ingest_meta: event.ingestMeta ?? {},
    });
  }

  const { error } = await admin.from("personal_events").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
