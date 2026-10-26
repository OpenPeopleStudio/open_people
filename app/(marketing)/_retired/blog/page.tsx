import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Blog — OpenPeople.ai",
  description:
    "Notes on building human-centric AI: product thinking, security, and practical workflows.",
};

const POSTS = [
  {
    title: "Human-centric AI: what it means (and what it isn’t)",
    date: "Coming soon",
    desc: "Our design principles for AI that respects teams, data, and decision-making.",
    href: "/contact",
  },
  {
    title: "From decisions to execution: building Ops Worker",
    date: "Coming soon",
    desc: "How we translate messy real-world inputs into actionable task proposals (with human approval).",
    href: "/documentation",
  },
  {
    title: "Security by default in a multi-tenant world",
    date: "Coming soon",
    desc: "How isolation, authorization, and encryption fit together in OpenPeople.ai.",
    href: "/security",
  },
];

export default function BlogPage() {
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
                Blog
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Building{" "}
              <span className="text-gradient-lime italic block sm:inline">with people in mind</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Product notes and practical guides as we build OpenPeople.ai.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {POSTS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="glass-card p-5 sm:p-6 md:p-8 hover:border-[var(--electric-lime)] transition-all group"
              >
                <div className="text-xs text-[var(--text-muted)]">{p.date}</div>
                <h2 className="mt-2 text-base sm:text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.desc}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--electric-lime)]">
                  Read
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Want an update when posts go live?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              For now, send us a quick note and we&apos;ll loop you in when we publish.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto justify-center">
                Contact us
              </Link>
              <Link href="/changelog" className="btn-secondary w-full sm:w-auto justify-center">
                Changelog
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

