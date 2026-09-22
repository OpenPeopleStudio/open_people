"use client";

import { useState } from "react";
import { ENGAGE_SHARE_BLURB, ENGAGE_URL, buildEngageSharePayload } from "@/lib/marketing/engage";

export default function ShareEngage() {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");

  async function share() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(buildEngageSharePayload());
        setStatus("shared");
        return;
      }
      await navigator.clipboard.writeText(ENGAGE_SHARE_BLURB);
      setStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(ENGAGE_URL);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
    }
  }

  const label =
    status === "shared" ? "Shared" : status === "copied" ? "Link copied" : "Share this page";

  return (
    <div className="mt-8 rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
        Share
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {ENGAGE_SHARE_BLURB}
      </p>
      <button
        type="button"
        onClick={share}
        className="mt-4 rounded border border-[var(--border-medium)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] hover:border-[var(--plasma)] hover:text-[var(--plasma)]"
      >
        {label}
      </button>
      {status === "error" ? (
        <p className="mt-3 text-sm text-[var(--warning)]" role="alert">
          Copy {ENGAGE_URL} by hand if share is blocked.
        </p>
      ) : null}
    </div>
  );
}
