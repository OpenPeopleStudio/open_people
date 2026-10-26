"use client";

import { useChat } from "@ai-sdk/react";
import { track } from "@vercel/analytics";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";

function messageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text ?? "")
    .join("");
}

export function AskDesk() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ask" }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [followQuestion, setFollowQuestion] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [followStatus, setFollowStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [followNote, setFollowNote] = useState("");

  const busy = status === "submitted" || status === "streaming";

  async function onAsk(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    track("Ask question submitted");
    await sendMessage({ text });
  }

  async function onFollowUp(event: React.FormEvent) {
    event.preventDefault();
    if (followStatus === "sending") return;
    setFollowStatus("sending");
    setFollowNote("");
    try {
      const res = await fetch("/api/ask/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          question: followQuestion,
          company_website: honeypot,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setFollowStatus("error");
        setFollowNote(data.error || "Could not send.");
        return;
      }
      track("Ask follow-up submitted");
      setFollowStatus("sent");
      setFollowNote(data.message || "Sent.");
      setFollowQuestion("");
    } catch {
      setFollowStatus("error");
      setFollowNote("Could not send. Email tom@openpeople.ai.");
    }
  }

  return (
    <div className="grid gap-10">
      <section className="desk-surface p-5 sm:p-6" aria-label="Ask the proposal">
        <p className="desk-kicker">Assistant</p>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-3)]">
          An AI assistant for Open People. It answers only from a knowledge file. Claims are labelled
          CONFIRMED, REPORTED, ESTIMATE, or UNKNOWN.
        </p>

        <div className="mt-6 grid gap-4">
          {messages.length === 0 ? (
            <p className="text-[15px] leading-relaxed text-[var(--ink-3)]">
              Ask about the preliminary proposal. If the file does not cover it, you will get UNKNOWN
              and the follow-up form below.
            </p>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "border-l-2 border-[var(--plasma)] pl-4"
                  : "border-l-2 border-[var(--steel)] pl-4"
              }
            >
              <p className="desk-kicker" style={{ color: message.role === "user" ? "var(--plasma)" : "var(--steel)" }}>
                {message.role === "user" ? "You" : "Open People assistant"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink-2)]">
                {messageText(message.parts)}
              </p>
            </div>
          ))}
          {busy ? (
            <p className="desk-fact text-[var(--ink-3)]">Looking in the knowledge file…</p>
          ) : null}
          {status === "error" ? (
            <p className="text-[15px] leading-relaxed text-[var(--amber)]">
              {error?.message ||
                "The assistant is not available on this environment. Use the follow-up form."}
            </p>
          ) : null}
        </div>

        <form onSubmit={onAsk} className="mt-6 grid gap-3">
          <label className="desk-kicker" htmlFor="ask-q">
            Question
          </label>
          <textarea
            id="ask-q"
            className="ask-field"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="What is still unknown in the proposal?"
            disabled={busy}
            maxLength={4000}
          />
          <button type="submit" className="btn-primary w-fit" disabled={busy || !input.trim()}>
            Ask
          </button>
        </form>
        <p className="desk-fact mt-4 leading-relaxed text-[var(--ink-3)]">
          Questions may be processed by a third-party AI provider.
        </p>
      </section>

      <section id="follow-up" className="desk-surface p-5 sm:p-6" aria-label="Follow-up form">
        <p className="desk-kicker">If we don&apos;t know yet</p>
        <h2 className="desk-h3 mt-3">Email Tom a follow-up</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
          Name is optional. Email is required. We&apos;ll find out and email you.
        </p>
        <form onSubmit={onFollowUp} className="mt-6 grid gap-4">
          <label className="ask-hp" aria-hidden="true">
            Company website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="desk-kicker">Name (optional)</span>
              <input
                className="ask-field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={120}
              />
            </label>
            <label className="grid gap-2">
              <span className="desk-kicker">Email</span>
              <input
                className="ask-field"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
              />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="desk-kicker">Question</span>
            <textarea
              className="ask-field"
              required
              rows={4}
              value={followQuestion}
              onChange={(event) => setFollowQuestion(event.target.value)}
              maxLength={4000}
            />
          </label>
          <button type="submit" className="btn-primary w-fit" disabled={followStatus === "sending"}>
            {followStatus === "sending" ? "Sending…" : "Send to Tom"}
          </button>
          {followNote ? (
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: followStatus === "error" ? "var(--amber)" : "var(--ok)" }}
            >
              {followNote}
            </p>
          ) : null}
        </form>
      </section>

      <p className="desk-fact leading-relaxed text-[var(--ink-3)]">
        Privacy: the question you type is logged (text + whether it was covered) so we can improve
        the proposal answers. Emails are not written into that question log. The follow-up form
        collects your email (required) and name (optional) so Tom can reply from tom@openpeople.ai.
        Follow-ups are stored privately so we can find out and email you. We do not sell this. The
        site uses Vercel Web Analytics for aggregate page views. Submitting a question records the
        event name only, not the question text.
      </p>
    </div>
  );
}
