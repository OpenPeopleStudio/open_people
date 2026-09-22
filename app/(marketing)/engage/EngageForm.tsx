"use client";

import { useMemo, useState } from "react";
import {
  ENGAGE_INTERESTS,
  ENGAGE_TO,
  type EngageInterestId,
  buildEngageClipboard,
  buildEngageMailto,
} from "@/lib/marketing/engage";

const EMPTY_INTERESTS: EngageInterestId[] = [];

export default function EngageForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [note, setNote] = useState("");
  const [interests, setInterests] = useState<EngageInterestId[]>(EMPTY_INTERESTS);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const values = useMemo(
    () => ({ name, email, org, note, interests }),
    [name, email, org, note, interests]
  );

  function clearCopied() {
    if (copied) setCopied(false);
  }

  function toggleInterest(id: EngageInterestId) {
    clearCopied();
    setInterests((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function validate() {
    if (!name.trim()) return "Add your name so Tom knows who wrote.";
    if (!email.trim() || !email.includes("@")) return "Add an email Tom can answer.";
    return null;
  }

  function onMailto(event: React.MouseEvent<HTMLAnchorElement>) {
    const nextError = validate();
    if (nextError) {
      event.preventDefault();
      setError(nextError);
      return;
    }
    setError(null);
  }

  async function onCopy() {
    const nextError = validate();
    if (nextError) {
      setError(nextError);
      return;
    }
    setError(null);
    try {
      await navigator.clipboard.writeText(buildEngageClipboard(values));
      setCopied(true);
    } catch {
      setError("Could not copy. Select the text below, or write tom@openpeople.ai directly.");
    }
  }

  const inputClass =
    "mt-2 w-full rounded border border-[var(--border-subtle)] bg-[var(--void)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--plasma)] focus:outline-none";

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => {
              clearCopied();
              setName(e.target.value);
            }}
            className={inputClass}
            autoComplete="name"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Email
          </span>
          <input
            value={email}
            onChange={(e) => {
              clearCopied();
              setEmail(e.target.value);
            }}
            className={inputClass}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="block">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Organisation (optional)
        </span>
        <input
          value={org}
          onChange={(e) => {
            clearCopied();
            setOrg(e.target.value);
          }}
          className={inputClass}
          autoComplete="organization"
          placeholder="Company, union, town, or leave blank"
        />
      </label>

      <fieldset>
        <legend className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          What you care about
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ENGAGE_INTERESTS.map((item) => {
            const checked = interests.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded border px-4 py-3 text-sm ${
                  checked
                    ? "border-[var(--plasma)] bg-[var(--plasma-soft)] text-[var(--text-primary)]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleInterest(item.id)}
                  className="mt-0.5 accent-[var(--plasma)]"
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Note (optional)
        </span>
        <textarea
          value={note}
          onChange={(e) => {
            clearCopied();
            setNote(e.target.value);
          }}
          rows={5}
          className={`${inputClass} resize-y`}
          placeholder="Where you live, what you want kept in-province, or a door you can walk through."
        />
      </label>

      {error ? (
        <p className="text-sm text-[var(--warning)]" role="alert">
          {error}
        </p>
      ) : null}

      {copied ? (
        <p
          className="rounded border border-[rgba(95,168,124,0.35)] bg-[rgba(95,168,124,0.08)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)]"
          role="status"
        >
          Copied. Paste into an email to {ENGAGE_TO}. Open People does not store this form, and Tom
          sends nothing automatically.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCopy}
          className="btn-primary justify-center px-6 py-3 text-sm"
        >
          {copied ? "Copied — paste to Tom" : "Copy message"}
        </button>
        <a
          href={buildEngageMailto(values)}
          onClick={onMailto}
          className="btn-secondary justify-center px-6 py-3 text-sm"
        >
          Open mail app
        </a>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        Copy is the reliable path — long mailto links often fail on phones. Mail app is a shortcut
        if yours can handle it. Either way the text goes to {ENGAGE_TO} from your own inbox.
      </p>
    </form>
  );
}
