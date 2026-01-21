"use client";

type Mode = "thoughtful" | "meme" | "discount";

type Props = {
  mode: Mode;
  subject: string;
  body: string;
  onModeChange: (mode: Mode) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onApplyTemplate: (mode: Mode) => void;
};

const modeCopy: Record<Mode, { title: string; hint: string }> = {
  thoughtful: { title: "Thoughtful", hint: "Warm, curious note" },
  meme: { title: "Meme", hint: "Lightweight, funny opener" },
  discount: { title: "Discount ask", hint: "Kind ask for better pricing" },
};

export function MessageBuilder({
  mode,
  subject,
  body,
  onModeChange,
  onSubjectChange,
  onBodyChange,
  onApplyTemplate,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Message</h2>
        <div className="flex gap-2">
          {(["thoughtful", "meme", "discount"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                onModeChange(m);
                onApplyTemplate(m);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                mode === m
                  ? "border-[var(--electric-lime)] text-[var(--electric-lime)] bg-[var(--electric-lime)]/10"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >
              {modeCopy[m].title}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">{modeCopy[mode].hint}</p>

      <div className="space-y-2">
        <label className="text-xs text-[var(--text-muted)]">Subject</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Subject line"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[var(--text-muted)]">Body</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm min-h-[180px]"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write or paste your note. We'll keep it in draft mode."
        />
      </div>
    </div>
  );
}

"use client";

type Mode = "thoughtful" | "meme" | "discount";

type Props = {
  mode: Mode;
  subject: string;
  body: string;
  onModeChange: (mode: Mode) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onApplyTemplate: (mode: Mode) => void;
};

const modeCopy: Record<Mode, { title: string; hint: string }> = {
  thoughtful: { title: "Thoughtful", hint: "Warm, curious note" },
  meme: { title: "Meme", hint: "Lightweight, funny opener" },
  discount: { title: "Discount ask", hint: "Kind ask for better pricing" },
};

export function MessageBuilder({
  mode,
  subject,
  body,
  onModeChange,
  onSubjectChange,
  onBodyChange,
  onApplyTemplate,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Message</h2>
        <div className="flex gap-2">
          {(["thoughtful", "meme", "discount"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                onModeChange(m);
                onApplyTemplate(m);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                mode === m
                  ? "border-[var(--electric-lime)] text-[var(--electric-lime)] bg-[var(--electric-lime)]/10"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >
              {modeCopy[m].title}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)]">{modeCopy[mode].hint}</p>

      <div className="space-y-2">
        <label className="text-xs text-[var(--text-muted)]">Subject</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Subject line"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[var(--text-muted)]">Body</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm min-h-[180px]"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write or paste your note. We'll keep it in draft mode."
        />
      </div>
    </div>
  );
}

