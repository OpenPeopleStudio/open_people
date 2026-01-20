"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Worker Coming Soon Shell
   Used for planned workers so their routes aren't blank.
   ═══════════════════════════════════════════════════════════════════════════ */

export function WorkerComingSoonShell({
  title,
  description,
  iconPath,
  gradient,
  outputs,
}: {
  title: string;
  description: string;
  iconPath: string;
  gradient: { from: string; to: string };
  outputs?: string[];
}) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-16">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${gradient.from}40, ${gradient.to}40)`,
          }}
        >
          <svg className="w-8 h-8" style={{ color: gradient.from }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        <div className="flex items-center gap-2 justify-center mb-2">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--text-muted)]/10 text-[var(--text-muted)]">Planned</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">{description}</p>

        {outputs && outputs.length > 0 && (
          <div className="inline-flex flex-wrap gap-2 justify-center">
            {outputs.map((o) => (
              <span key={o} className="text-xs px-2 py-1 rounded-full bg-[var(--surface-1)] text-[var(--text-muted)]">
                Outputs: {o}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

