"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoiceToggle } from "./voice";

const LINKS = [
  { href: "/brief", label: "Brief" },
  { href: "/tracker", label: "Tracker" },
  { href: "/industries", label: "Industries" },
  { href: "/costs", label: "Costs" },
  { href: "/letter", label: "Letter" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 border-b transition-colors ${
          scrolled || open
            ? "bg-[rgba(4,4,4,0.92)] backdrop-blur-md border-[var(--border-subtle)]"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-3 px-4 sm:px-6 lg:gap-4">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-primary)] no-underline"
            onClick={() => setOpen(false)}
          >
            Open People<span className="text-[var(--plasma)]"> · NL</span>
          </Link>

          <div className="ml-auto hidden items-center gap-3 lg:flex lg:gap-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--plasma)]"
              >
                {l.label}
              </Link>
            ))}
            <VoiceToggle />
            <Link
              href="/engage"
              className="rounded border border-[var(--border-medium)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--plasma)] hover:text-[var(--plasma)]"
            >
              Keep power here
            </Link>
          </div>

          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded border border-[var(--border-subtle)] text-[var(--text-primary)] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="font-mono text-lg leading-none">{open ? "×" : "≡"}</span>
          </button>
        </div>

        {!open ? (
          <div className="border-t border-[var(--border-subtle)] px-4 py-2 lg:hidden">
            <VoiceToggle className="flex w-full" />
          </div>
        ) : null}
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 bg-[rgba(4,4,4,0.97)] pt-20 lg:hidden">
          <div className="px-6 pb-2">
            <VoiceToggle className="flex w-full" />
          </div>
          <ul className="space-y-1 px-6">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block py-4 font-display text-2xl text-[var(--text-primary)] no-underline hover:text-[var(--plasma)]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/engage"
                className="block py-4 font-display text-2xl text-[var(--text-primary)] no-underline hover:text-[var(--plasma)]"
                onClick={() => setOpen(false)}
              >
                Engage
              </Link>
            </li>
          </ul>
          <div className="mt-8 border-t border-[var(--border-subtle)] px-6 pt-6">
            <Link
              href="/engage"
              className="btn-primary w-full justify-center py-4 text-base"
              onClick={() => setOpen(false)}
            >
              Get involved — keep firm power here
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
