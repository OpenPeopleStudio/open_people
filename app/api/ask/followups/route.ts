import { askAdminConfigured, authorizeAskAdmin } from "@/lib/ask/admin";
import { listAskFollowUps, markAskFollowUpsAnswered, parseFollowupsStatus, parseMarkAnswered } from "@/lib/ask/store";

export const runtime = "nodejs";

function unauthorized() {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}

function unconfigured() {
  return Response.json({ error: "Ask admin is not configured." }, { status: 503 });
}

function gate(req: Request): Response | null {
  if (!askAdminConfigured()) return unconfigured();
  if (!authorizeAskAdmin(req)) return unauthorized();
  return null;
}

export async function GET(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;

  const status = parseFollowupsStatus(new URL(req.url).searchParams.get("status"));
  try {
    const followups = await listAskFollowUps(status);
    return Response.json({ ok: true, status, followups });
  } catch {
    return Response.json({ error: "Could not read follow-ups." }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }

  const parsed = parseMarkAnswered(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const updated = await markAskFollowUpsAnswered(parsed.ids);
    return Response.json({ ok: true, updated });
  } catch {
    return Response.json({ error: "Could not mark answered." }, { status: 502 });
  }
}
