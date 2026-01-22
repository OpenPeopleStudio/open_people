import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Careers — OpenPeople.ai",
  description:
    "Build human-centric AI at OpenPeople.ai. We’re based in St. John’s, Newfoundland.",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      {/* Navigation */}
      <NavBar />

      <main className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-52 lg:pb-32">
        <div className="container">
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in">
              <span className="badge text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
                Careers · St. John&apos;s, NL · Remote-friendly
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-7xl font-display tracking-tight animate-slide-up">
              Build human-centric AI{" "}
              <span className="text-gradient-lime italic block sm:inline">with us</span>
            </h1>

            <p className="mt-5 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              OpenPeople.ai is based in St. John&apos;s, Newfoundland. We&apos;re
              building tools that keep people in control: privacy-forward,
              practical AI that makes your data safer, more useful, and truly
              yours. We work remotely with a tight cadence and high ownership.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-start gap-3 sm:gap-4 animate-slide-up delay-200">
              <a href="mailto:careers@openpeople.ai" className="btn-primary w-full sm:w-auto justify-center">
                Email us
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
              </a>
              <Link href="/" className="btn-secondary w-full sm:w-auto justify-center">
                Back to home
              </Link>
            </div>
          </div>

          {/* Remote work highlights */}
          <section className="mt-10 sm:mt-12 glass-card p-5 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display text-[var(--text-primary)]">
                  Remote-first, craft-forward
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  We hire for ownership and clarity. Our default is async work, clear
                  written decisions, and focused deep-work blocks.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-muted)]">
                <span className="px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                  Async by default
                </span>
                <span className="px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                  Deep work
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Distributed with intent",
                  body:
                    "We keep a small overlap window for collaboration, then let people do their best work on their own schedule.",
                },
                {
                  title: "Documentation is the product",
                  body:
                    "Decisions live in writing. You can onboard fast and move confidently without pinging a dozen people.",
                },
                {
                  title: "Impact over optics",
                  body:
                    "We care about outcomes, not busywork. If your work moves the needle, it wins.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Values cards */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <div className="glass-card p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Work with intent
              </h2>
              <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                We care about outcomes, craft, and trust. We build carefully and
                ship what people actually need.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Build for humans
              </h2>
              <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                Our default is dignity: transparency, user control, and systems
                that are safe by design.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 sm:col-span-2 md:col-span-1">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Small team, high ownership
              </h2>
              <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                If you like autonomy, clear standards, and direct impact, you&apos;ll
                feel at home here.
              </p>
            </div>
          </div>

          {/* Open roles */}
          <section className="mt-8 sm:mt-10 glass-card p-5 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display text-[var(--text-primary)]">
              Open roles
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              We&apos;re early. Roles change quickly. If you think you can help,
              send a short note about what you want to build and why, plus links
              to work you&apos;re proud of.
            </p>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-[var(--text-muted)]">
              Email{" "}
              <a
                href="mailto:careers@openpeople.ai"
                className="underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors"
              >
                careers@openpeople.ai
              </a>{" "}
              · Based in St. John&apos;s, Newfoundland
            </p>
          </section>
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
