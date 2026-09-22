import type { ReactNode } from "react";
import Link from "next/link";
import type { DeskSource } from "@/lib/desk";

/** Always-visible one-breath human takeaway. Numbers belong after this, not instead of it. */
export function LeadTakeaway({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={className ? `desk-takeaway ${className}` : "desk-takeaway"}>{children}</p>;
}

export function PrimarySource({ source }: { source: DeskSource }) {
  return (
    <p className="mt-3">
      <a
        href={source.href}
        className="desk-fact text-[var(--plasma)] no-underline hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        {source.label} →
      </a>
    </p>
  );
}

export function DeskKicker({
  children,
  quiet = false,
}: {
  children: ReactNode;
  quiet?: boolean;
}) {
  return <p className={`desk-kicker${quiet ? " desk-kicker-quiet" : ""}`}>{children}</p>;
}

export function DeskVerified({
  date,
  sticky = false,
}: {
  date: string;
  sticky?: boolean;
}) {
  const line = (
    <p className="desk-fact text-[var(--text-muted)]">
      Last verified <time dateTime={date}>{date}</time>
      <span aria-hidden> · </span>
      public documents only
      <span aria-hidden> · </span>
      UNKNOWN labelled
    </p>
  );

  if (!sticky) {
    return <div className="mt-6">{line}</div>;
  }

  return (
    <div className="desk-verified-strip">
      <div className="mx-auto flex max-w-[1080px] items-center px-4 py-2.5 sm:px-6">{line}</div>
    </div>
  );
}

export function SourceLinks({ sources }: { sources: DeskSource[] }) {
  if (sources.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1">
      {sources.map((source) => (
        <li key={source.id}>
          <a
            href={source.href}
            className="desk-fact text-[var(--plasma)] no-underline hover:underline"
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
    <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
        Get involved — keep firm power here
      </Link>
      <Link href="/tracker" className="btn-secondary justify-center px-6 py-3 text-sm">
        Living tracker
      </Link>
    </div>
  );
}
