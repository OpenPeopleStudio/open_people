import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Changelog — OpenPeople.ai",
  description:
    "Product updates, improvements, and fixes for OpenPeople.ai.",
};

const ENTRIES = [
  {
    date: "2026-01-20",
    title: "Marketing + docs surface refresh",
    bullets: [
      "New marketing pages: Docs, API Reference, Support.",
      "Mobile-first navigation and CTA improvements.",
      "Updated dashboard mockup to better match the current app.",
    ],
  },
  {
    date: "2026-01-19",
    title: "Email + onboarding foundations",
    bullets: [
      "Initial email accounts/inbox schema and routes.",
      "Tenant onboarding schema and endpoints.",
      "Ops worker schema and unit test coverage started.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      <NavBar />

      <main className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in">
              <span className="badge text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
                Changelog
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Updates{" "}
              <span className="text-gradient-lime italic block sm:inline">and improvements</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Product changes—what shipped, what changed, and why it matters.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 space-y-4 sm:space-y-6">
            {ENTRIES.map((e) => (
              <div key={e.date} className="glass-card p-5 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                    {e.title}
                  </h2>
                  <time className="text-xs sm:text-sm text-[var(--text-muted)]">
                    {e.date}
                  </time>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  {e.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--electric-lime)] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Want to follow along?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Browse the documentation or reach out with feedback—we ship fast and iterate with users.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/documentation" className="btn-primary w-full sm:w-auto justify-center">
                Documentation
              </Link>
              <Link href="/contact" className="btn-secondary w-full sm:w-auto justify-center">
                Share feedback
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-8 sm:py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} OpenPeople.ai
          </p>
          <div className="flex items-center gap-5 sm:gap-4 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

