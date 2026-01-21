#!/usr/bin/env node
/**
 * Quick CLI to log a manual event to the ingestion API.
 *
 * Usage:
 *   node scripts/personal-data/log-manual.js timeblock '{"label":"Focus","duration_ms":3600000}'
 */

const ingestUrl =
  process.env.PERSONAL_DATA_INGEST_URL ??
  "http://localhost:3000/api/personal-data/ingest";
const ingestKey = process.env.PERSONAL_DATA_INGEST_KEY;

if (!ingestKey) {
  console.error("PERSONAL_DATA_INGEST_KEY is required");
  process.exit(1);
}

async function main() {
  const kind = process.argv[2];
  const payloadRaw = process.argv[3];
  if (!kind || !payloadRaw) {
    console.error("Usage: log-manual.js <kind> '<payload json>'");
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch (err) {
    console.error("Invalid JSON payload", err);
    process.exit(1);
  }

  const ts = new Date().toISOString();
  const events = [
    {
      source: process.env.PERSONAL_DATA_SOURCE ?? "manual-cli",
      kind,
      ts,
      payload,
    },
  ];

  const res = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-key": ingestKey,
    },
    body: JSON.stringify({ events }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ingest failed ${res.status}: ${text}`);
  }

  console.log(`Logged ${kind} at ${ts}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
