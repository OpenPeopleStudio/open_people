export const ENGAGE_TO = "tom@openpeople.ai";
export const ENGAGE_URL = "https://openpeople.ai/engage";
export const ENGAGE_SHARE_TITLE = "Keep firm power in Newfoundland and Labrador";
export const ENGAGE_SHARE_BLURB =
  "The House endorsed the Churchill Falls / Gull Island DCIA 21–18. That is not a contract. Keep firm power in NL — mines first. https://openpeople.ai/engage";

export const ENGAGE_INTERESTS = [
  { id: "firm-power", label: "Firm in-province power" },
  { id: "mining", label: "Mining / resources" },
  { id: "compute", label: "Compute optionality" },
  { id: "transparency", label: "Transparency of the contracts" },
] as const;

export type EngageInterestId = (typeof ENGAGE_INTERESTS)[number]["id"];

export type EngageFormValues = {
  name: string;
  email: string;
  org?: string;
  note?: string;
  interests: EngageInterestId[];
};

export function encodeMailto(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function interestLabels(ids: EngageInterestId[]) {
  return ENGAGE_INTERESTS.filter((item) => ids.includes(item.id)).map((item) => item.label);
}

export function buildEngageSubject(values: Pick<EngageFormValues, "name">) {
  return `Keep firm power in NL${values.name.trim() ? ` — ${values.name.trim()}` : ""}`;
}

export function buildEngageMessage(values: EngageFormValues) {
  const interests = interestLabels(values.interests);
  return [
    `Name: ${values.name.trim() || "-"}`,
    `Email: ${values.email.trim() || "-"}`,
    `Org: ${values.org?.trim() || "-"}`,
    `Interests: ${interests.length ? interests.join("; ") : "-"}`,
    "",
    values.note?.trim() || "-",
    "",
    "— sent from openpeople.ai/engage",
    "Open People is a constituent / catalyst voice. Not a DCIA party, offtake seat, or demand seat.",
  ].join("\n");
}

export function buildEngageClipboard(values: EngageFormValues) {
  return `To: ${ENGAGE_TO}\nSubject: ${buildEngageSubject(values)}\n\n${buildEngageMessage(values)}`;
}

export function buildEngageMailto(values: EngageFormValues) {
  return `mailto:${ENGAGE_TO}?subject=${encodeMailto(buildEngageSubject(values))}&body=${encodeMailto(buildEngageMessage(values))}`;
}

export function buildEngageSharePayload() {
  return {
    title: ENGAGE_SHARE_TITLE,
    text: ENGAGE_SHARE_BLURB,
    url: ENGAGE_URL,
  };
}
