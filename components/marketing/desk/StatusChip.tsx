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
  signed: "var(--success)",
  endorsed: "var(--success)",
  "published-rate": "var(--success)",
  framework: "var(--plasma)",
  structure: "var(--plasma)",
  first: "var(--plasma)",
  open: "var(--warning)",
  reported: "var(--warning)",
  unknown: "var(--error)",
  heritage: "var(--text-muted)",
  cited: "var(--text-muted)",
  secondary: "var(--text-muted)",
};

export function StatusPill({ status }: { status: DeskChromeStatus }) {
  const color = TONE[status];
  return (
    <span className="desk-chip" style={{ color, borderColor: color }}>
      {LABEL[status]}
    </span>
  );
}
