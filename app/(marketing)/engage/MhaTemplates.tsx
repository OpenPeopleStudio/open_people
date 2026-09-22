"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    id: "transparency",
    title: "Transparency before the contracts lock",
    body: `I am writing as a constituent about the Churchill Falls / Gull Island DCIA.

The House endorsed the framework 21–18 on 17 September 2026. That vote does not create binding power-purchase agreements. Binding definitive agreements are still targeted around 31 December 2026; the DCIA instrument can run to 31 March 2027.

Please press for the long-form text — or a public summary a voter can check — on:

1. How in-province power will be metered and scheduled, year by year.
2. The definition of domestic / in-province load in the contracts.
3. Whether unused retained power defaults to export, and on what notice and price.
4. How much firm power remains available in Labrador for mines and other industry, including any compute load, before Hydro-Québec takes the rest.

I am not asking you to kill the deal. I am asking that Newfoundland and Labrador keep the option to use firm power here, in writing, before the paper hardens.`,
  },
  {
    id: "recall",
    title: "Recall mechanics in the contract text",
    body: `I am writing as a constituent about recall of Churchill Falls / Gull Island power for use in Newfoundland and Labrador.

During the special sitting, consultant Jason Chee-Aloy of Power Advisory told the House there could be a three-year notice recall so the province can keep more power at home. That statement is not the same as signed contract language.

Please confirm, in public:

1. Whether a recall right is in the draft definitive agreements.
2. The notice period, the volumes, and who pays.
3. Whether recall can be used for Labrador industry (mining first; other industrial load including compute if the province chooses), or only for a narrower class of load.

If it is not in the text, please say so plainly before year-end.`,
  },
  {
    id: "headroom",
    title: "Mining first, with industrial headroom left",
    body: `I am writing as a constituent about keeping firm Churchill Falls / Gull Island power in this province.

Public framing is that Newfoundland and Labrador would retain about 2,350 MW from Churchill Falls and Gull Island, plus wind if it is built. That is announcement language, not a signed industrial allocation. Mining and Labrador resources should be first in line. Compute is one possible use of leftover firm power — it is not confirmed as reserved, priced, or queued.

Please ask, before definitive agreements lock:

1. What firm megawatts are actually available in Labrador this decade, on which line, at a published industrial rate.
2. How mines and towns are served first without the unused remainder sliding west by default.
3. Whether industrial uses beyond mining — including compute — are eligible at all, or silently excluded.

Keep the power here. Use it here. Export what we choose to export, not what we forget to keep.`,
  },
] as const;

export default function MhaTemplates() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body.trim());
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="space-y-4">
      {TEMPLATES.map((template) => (
        <article
          key={template.id}
          className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="font-display text-xl font-normal tracking-[-0.015em] text-[var(--text-primary)]">
              {template.title}
            </h3>
            <button
              type="button"
              onClick={() => copy(template.id, template.body)}
              className="shrink-0 self-start rounded border border-[var(--border-medium)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] hover:border-[var(--plasma)] hover:text-[var(--plasma)]"
            >
              {copiedId === template.id ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
            {template.body.trim()}
          </pre>
        </article>
      ))}
    </div>
  );
}
