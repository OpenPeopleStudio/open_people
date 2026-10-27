/**
 * Public /ask "How this works" copy.
 * Name models at provider/family level only. Do not print model ids,
 * env names, or keys. Describe only what the live code does.
 */

export const ASK_HOW_HEADING = "How this works";

export const ASK_HOW_GROUNDING =
  "Answers come from a large language model grounded only in our written proposal record. If a fact is not in that record, it says so.";

export const ASK_HOW_MODELS =
  "Google Gemini answers first. If it is unavailable, an open-weights model via OpenRouter takes over.";

export const ASK_HOW_GUARDRAILS =
  "Every factual claim is labelled CONFIRMED, REPORTED, ESTIMATE, or UNKNOWN. It does not invent figures. It does not claim a partner, nation, utility, funder, or government has agreed.";

export const ASK_HOW_PRIVACY =
  "Questions typed in the assistant are logged as text, without names. Emails are not written into that log. The follow-up form below is separate: it collects an email so Tom can reply, and a name only if you give one.";

export function askHowItWorksText() {
  return [
    ASK_HOW_HEADING,
    ASK_HOW_GROUNDING,
    ASK_HOW_MODELS,
    ASK_HOW_GUARDRAILS,
    ASK_HOW_PRIVACY,
  ].join("\n");
}
