import { logAskFollowUp } from "./log";
import { insertAskFollowUp } from "./store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QUESTION = 4000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;

export type FollowUpInput = {
  name: string;
  email: string;
  question: string;
};

export type FollowUpParse =
  | { ok: true; spam: true }
  | { ok: true; spam: false; value: FollowUpInput }
  | { ok: false; error: string };

export function parseFollowUp(body: unknown): FollowUpParse {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Send name (optional), email, and the question." };
  }
  const record = body as Record<string, unknown>;
  const honeypot = String(record.company_website ?? record.website ?? "").trim();
  if (honeypot) {
    return { ok: true, spam: true };
  }

  const name = String(record.name ?? "").trim().slice(0, MAX_NAME);
  const email = String(record.email ?? "").trim().slice(0, MAX_EMAIL);
  const question = String(record.question ?? "").trim().slice(0, MAX_QUESTION);

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "A working email is required so Tom can reply." };
  }
  if (question.length < 8) {
    return { ok: false, error: "Write a short question we can follow up on." };
  }

  return { ok: true, spam: false, value: { name, email, question } };
}

export async function storeFollowUp(input: FollowUpInput): Promise<{ id: string }> {
  const stored = await insertAskFollowUp(input);
  logAskFollowUp({ question: input.question, id: stored.id });
  return stored;
}
