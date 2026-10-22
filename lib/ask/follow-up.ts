import { Resend } from "resend";
import { logAskFollowUp } from "./log";

export const ASK_TO_DEFAULT = "tom@openpeople.ai";
export const ASK_FROM_DEFAULT = "Open People <tom@openpeople.ai>";

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

export function askToEmail(): string {
  return process.env.ASK_TO_EMAIL?.trim() || ASK_TO_DEFAULT;
}

export function askFromEmail(): string {
  return process.env.ASK_FROM_EMAIL?.trim() || ASK_FROM_DEFAULT;
}

export async function deliverFollowUp(input: FollowUpInput): Promise<{ delivered: "email" | "log" }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = askToEmail();
  const from = askFromEmail();
  const who = input.name ? `${input.name} <${input.email}>` : input.email;
  const text = [
    `Follow-up from openpeople.ai/ask`,
    `From: ${who}`,
    ``,
    input.question,
  ].join("\n");

  if (key) {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from,
      to,
      replyTo: input.email,
      subject: `Ask follow-up: ${input.question.slice(0, 72)}`,
      text,
    });
    if (result.error) {
      logAskFollowUp({
        question: input.question,
        delivered: "log",
        name: input.name,
        email: input.email,
      });
      throw new Error(result.error.message);
    }
    logAskFollowUp({ question: input.question, delivered: "email" });
    return { delivered: "email" };
  }

  logAskFollowUp({
    question: input.question,
    delivered: "log",
    name: input.name,
    email: input.email,
  });
  return { delivered: "log" };
}
