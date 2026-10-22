import { deliverFollowUp, parseFollowUp } from "@/lib/ask/follow-up";

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
    const { delivered } = await deliverFollowUp(parsed.value);
    return Response.json({
      ok: true,
      delivered,
      message:
        delivered === "email"
          ? "Sent to Tom. He will reply from tom@openpeople.ai."
          : "Saved for Tom. Email is not configured on this environment, so this was stored in the server log.",
    });
  } catch {
    return Response.json(
      { error: "Could not send just now. Email tom@openpeople.ai directly." },
      { status: 502 },
    );
  }
}
