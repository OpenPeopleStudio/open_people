import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "About — OpenPeople.ai",
  description:
    "OpenPeople.ai is a human-centric AI platform built to help teams stay aligned and execute—without giving up control of their data.",
};

const VALUES = [
  {
    title: "Human-first",
    description:
      "AI should amplify people and teams—not replace them. We design for clarity, consent, and control.",
  },
  {
    title: "Privacy by default",
    description:
      "Security, isolation, and access controls are foundational. Your data stays safe, useful, and yours.",
  },
  {
    title: "Operational reality",
    description:
      "We build around how work actually happens: decisions, notes, emails, tasks, and follow-through.",
  },
  {
    title: "Trust through transparency",
    description:
      "Clear behavior, predictable systems, and explainable workflows—so you can adopt AI with confidence.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      <NavBar />

      <main className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
        <div className="container">
          {/* Header */}
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in">
              <span className="badge text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
                About
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Human-centric AI{" "}
              <span className="text-gradient-lime italic block sm:inline">
                that respects your business
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              OpenPeople.ai is built to help teams plan, execute, and stay aligned—across
              notes, workflows, email, and secure storage. We&apos;re based in St.
              John&apos;s, Newfoundland.
            </p>
          </div>

          {/* What we do */}
          <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "Turn decisions into action",
                desc: "Capture decisions and convert them into clear next steps, owners, and follow-ups.",
              },
              {
                title: "Keep knowledge organized",
                desc: "Notes become searchable, linkable, and usable across your team—not lost in chats.",
              },
              {
                title: "Integrate where work lives",
                desc: "Email, storage, and tools you already use—so AI fits into your day, not around it.",
              },
            ].map((card) => (
              <div key={card.title} className="glass-card p-5 sm:p-6 md:p-7">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Our principles
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl">
              We care about shipping fast—but never at the cost of safety, privacy, or
              trust.
            </p>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="glass-card p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Ready to see OpenPeople.ai in action?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Start with a free trial or reach out—we&apos;ll help you map AI to your
              real workflows.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/signup" className="btn-primary w-full sm:w-auto justify-center">
                Start free trial
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="btn-secondary w-full sm:w-auto justify-center"
              >
                Talk to us
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

