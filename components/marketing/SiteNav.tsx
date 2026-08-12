"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/brief", label: "The case" },
  { href: "/approach", label: "Approach" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
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
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-primary)] no-underline"
            onClick={() => setOpen(false)}
          >
            Open People<span className="text-[var(--plasma)]"> · NL</span>
          </Link>

          <div className="ml-auto hidden items-center gap-6 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--plasma)]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:tom@openpeople.ai"
              className="rounded border border-[var(--border-medium)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--plasma)] hover:text-[var(--plasma)]"
            >
              Email
            </a>
          </div>

          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded border border-[var(--border-subtle)] text-[var(--text-primary)] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="font-mono text-lg leading-none">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 bg-[rgba(4,4,4,0.97)] pt-20 md:hidden">
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
          </ul>
          <div className="mt-8 border-t border-[var(--border-subtle)] px-6 pt-6">
            <a
              href="mailto:tom@openpeople.ai"
              className="btn-primary w-full justify-center py-4 text-base"
              onClick={() => setOpen(false)}
            >
              tom@openpeople.ai
            </a>
          </div>
        </div>
      )}
    </>
  );
}
