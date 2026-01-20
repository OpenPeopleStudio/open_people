"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function encodeMailto(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = `OpenPeople.ai — Contact${company ? ` (${company})` : ""}`;
    const body = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `Company: ${company || "-"}`,
      "",
      message || "-",
      "",
      "— sent from openpeople.ai/contact",
    ].join("\n");
    return `mailto:support@openpeople.ai?subject=${encodeMailto(subject)}&body=${encodeMailto(body)}`;
  }, [company, email, message, name]);

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
            placeholder="you@company.com"
            inputMode="email"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">Company (optional)</span>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-2 w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
          placeholder="Company name"
        />
      </label>

      <label className="block">
        <span className="text-xs text-[var(--text-muted)]">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="mt-2 w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors resize-none"
          placeholder="What are you trying to achieve with AI?"
        />
      </label>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a href={mailtoHref} className="btn-primary w-full sm:w-auto justify-center">
          Email us
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <Link href="/documentation" className="btn-secondary w-full sm:w-auto justify-center">
          Browse docs
        </Link>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Prefer direct email?{" "}
        <a className="text-[var(--electric-lime)] hover:opacity-80" href="mailto:support@openpeople.ai">
          support@openpeople.ai
        </a>
      </p>
    </div>
  );
}

