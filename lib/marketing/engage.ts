export const ENGAGE_TO = "tom@openpeople.ai";

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

export function buildEngageMailto(values: EngageFormValues) {
  const subject = `Keep firm power in NL${values.name.trim() ? ` — ${values.name.trim()}` : ""}`;
  return `mailto:${ENGAGE_TO}?subject=${encodeMailto(subject)}&body=${encodeMailto(buildEngageMessage(values))}`;
}
