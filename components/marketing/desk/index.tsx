import type { ReactNode } from "react";
import Link from "next/link";
import type { DeskSource } from "@/lib/desk";

export function DeskKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
      {children}
    </p>
  );
}

export function DeskVerified({ date }: { date: string }) {
  return (
    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
      Last verified {date} · public documents only · UNKNOWN labelled
    </p>
  );
}

export function StatusPill({
  status,
}: {
  status: "signed" | "framework" | "endorsed" | "open" | "unknown" | "heritage" | "structure" | "published-rate" | "reported" | "first" | "cited" | "secondary";
}) {
  const label =
    status === "signed"
      ? "Signed"
      : status === "framework"
        ? "Framework"
        : status === "endorsed"
          ? "Endorsed"
          : status === "open"
            ? "Open"
            : status === "heritage"
              ? "Heritage"
              : status === "structure"
                ? "Structure"
                : status === "published-rate"
                  ? "Published rate"
                  : status === "reported"
                    ? "Reported"
                    : status === "first"
                      ? "Mining first"
                      : status === "cited"
                        ? "Cited"
                        : status === "secondary"
                          ? "Secondary"
                          : "UNKNOWN";
  const warn = status === "unknown" || status === "open" || status === "reported";
  return (
    <span
      className={`inline-flex font-mono text-[10px] uppercase tracking-[0.12em] ${
        warn ? "text-[var(--warning)]" : "text-[var(--plasma)]"
      }`}
    >
      {label}
    </span>
  );
}

export function SourceLinks({ sources }: { sources: DeskSource[] }) {
  return (
    <ul className="mt-3 space-y-1">
      {sources.map((source) => (
        <li key={source.id}>
          <a
            href={source.href}
            className="font-mono text-[11px] text-[var(--plasma)] no-underline hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {source.label} →
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DeskCtas() {
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
        Get involved — keep firm power here
      </Link>
      <Link href="/tracker" className="btn-secondary justify-center px-6 py-3 text-sm">
        Living tracker
      </Link>
    </div>
  );
}
