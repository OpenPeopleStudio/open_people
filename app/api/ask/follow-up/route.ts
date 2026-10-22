import { parseFollowUp, storeFollowUp } from "@/lib/ask/follow-up";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const parsed = parseFollowUp(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.spam) {
    return Response.json({ ok: true });
  }

  try {
    await storeFollowUp(parsed.value);
    return Response.json({
      ok: true,
      stored: true,
      message: "Saved. We'll find out and email you from tom@openpeople.ai.",
    });
  } catch {
    return Response.json(
      { error: "Could not save just now. Email tom@openpeople.ai directly." },
      { status: 502 },
    );
  }
}
