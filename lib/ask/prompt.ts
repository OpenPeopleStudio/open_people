export const ASK_MODEL_DEFAULT = "openai/gpt-4.1-mini";

export function askModel(): string {
  return process.env.AI_GATEWAY_MODEL?.trim() || ASK_MODEL_DEFAULT;
}

/**
 * AI Gateway auth: an explicit key, a pulled OIDC env token, the runtime
 * `x-vercel-oidc-token` header, or a Vercel deployment (the AI SDK then
 * loads OIDC from request context — it is not always in process.env).
 */
export function gatewayConfigured(req?: Request): boolean {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return true;
  if (process.env.VERCEL_OIDC_TOKEN?.trim()) return true;
  if (req?.headers.get("x-vercel-oidc-token")?.trim()) return true;
  return process.env.VERCEL === "1";
}

export function assistantConfigured(req?: Request): boolean {
  return gatewayConfigured(req) || Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Team OpenAI BYOK on AI Gateway requires paid Gateway credits and 403s
 * (`byok_requires_paid_credits`). Route gpt-4.1-mini through Azure system
 * credentials instead.
 */
export function askGatewayProviderOptions(): {
  gateway: { only: ["azure"] };
} {
  return { gateway: { only: ["azure"] } };
}

export function messageText(
  message: { parts?: Array<{ type: string; text?: string }> },
): string {
  return (message.parts ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}

export function lastUserText(
  messages: { role: string; parts?: Array<{ type: string; text?: string }> }[],
): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = messageText(message);
    if (text) return text;
  }
  return "";
}

export function answerLooksCovered(text: string): boolean {
  return !/\bUNKNOWN\b|not in the (knowledge|proposal) file|not covered|don't know yet|do not know yet|follow-up form/i.test(
    text,
  );
}

export function buildAskInstructions(knowledge: string): string {
  return `You are the public AI assistant for Open People (openpeople.ai), a Newfoundland and Labrador company. You are transparent about being an AI. You answer questions about Open People's preliminary proposal.

You may use ONLY the knowledge file below. If a fact is not in that file, say so. Do not use training data to fill gaps. Do not browse. Do not invent.

Labels — every factual claim must carry one:
- CONFIRMED: stated as a fact in the knowledge file
- REPORTED: attributed to a named public source in the knowledge file
- ESTIMATE: an estimate in the knowledge file, labelled as such
- UNKNOWN: not in the knowledge file, or the file is still a placeholder

Hard rules:
- Never invent numbers, dollar figures, megawatts, dates, or headcount.
- Never claim a partner, tenant, nation, utility, funder, or government has agreed.
- Never mention snōw white laundry, SWL, Brendan, phone numbers, street addresses, or personal matters.
- Do not discuss Open People's parked SaaS product as the public story.
- If the knowledge file is a placeholder or the question is not covered, answer briefly, label UNKNOWN, and tell the person to use the follow-up form on this page so Tom can email them. Contact is tom@openpeople.ai only.

Keep answers short. English. No markdown tables.

--- KNOWLEDGE FILE START ---
${knowledge}
--- KNOWLEDGE FILE END ---`;
}
