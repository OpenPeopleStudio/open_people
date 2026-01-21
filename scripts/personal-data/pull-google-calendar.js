#!/usr/bin/env node
/* Pulls Google Calendar events and ships them to the ingestion API. */
const { google } = require("googleapis");

const ingestUrl =
  process.env.PERSONAL_DATA_INGEST_URL ??
  "http://localhost:3000/api/personal-data/ingest";
const ingestKey = process.env.PERSONAL_DATA_INGEST_KEY;

if (!ingestKey) {
  console.error("PERSONAL_DATA_INGEST_KEY is required");
  process.exit(1);
}

async function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth env vars");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function fetchEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: nextWeek.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 200,
  });

  const items = res.data.items ?? [];
  return items.map((item) => ({
    source: "google-calendar",
    kind: "calendar",
    ts: item.start?.dateTime ?? item.start?.date ?? now.toISOString(),
    payload: {
      id: item.id,
      summary: item.summary,
      description: item.description,
      start: item.start,
      end: item.end,
      attendees: item.attendees,
      status: item.status,
      created: item.created,
      updated: item.updated,
    },
  }));
}

async function ship(events) {
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
}

async function main() {
  const client = await getClient();
  const events = await fetchEvents(client);
  if (!events.length) {
    console.log("No events to ship");
    return;
  }
  await ship(events);
  console.log(`Shipped ${events.length} calendar events -> ${ingestUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
