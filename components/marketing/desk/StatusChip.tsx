export type DeskChromeStatus =
  | "signed"
  | "framework"
  | "endorsed"
  | "open"
  | "unknown"
  | "heritage"
  | "structure"
  | "published-rate"
  | "reported"
  | "first"
  | "cited"
  | "secondary";

const LABEL: Record<DeskChromeStatus, string> = {
  signed: "Signed",
  framework: "Framework",
  endorsed: "Endorsed",
  open: "Open",
  unknown: "UNKNOWN",
  heritage: "Heritage",
  structure: "Structure",
  "published-rate": "Published rate",
  reported: "Reported",
  first: "Mining first",
  cited: "Cited",
  secondary: "Secondary",
};

/** Semantic colour only — no fills, no gradients. */
const TONE: Record<DeskChromeStatus, string> = {
  signed: "var(--ok)",
  endorsed: "var(--plasma)",
  "published-rate": "var(--steel-bright)",
  framework: "var(--plasma)",
  structure: "var(--plasma)",
  first: "var(--plasma)",
  open: "var(--amber)",
  reported: "var(--amber)",
  unknown: "var(--alert)",
  heritage: "var(--steel)",
  cited: "var(--steel)",
  secondary: "var(--steel)",
};

export function StatusPill({ status }: { status: DeskChromeStatus }) {
  const color = TONE[status];
  return (
    <span className="desk-chip" data-status={status} style={{ color, borderColor: color }}>
      {LABEL[status]}
    </span>
  );
}
