import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — OpenPeople.ai",
  description:
    "Contact OpenPeople.ai. Ask questions, request a demo, or get help choosing the right setup for your team.",
};

export default function ContactPage() {
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
                Contact
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Let&apos;s talk{" "}
              <span className="text-gradient-lime italic block sm:inline">
                about your workflows
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Ask a question, request a demo, or get help choosing the right setup.
              We typically respond within 24 hours. Based in St. John&apos;s, Newfoundland.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Form */}
            <div className="glass-card p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                Send a message
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                This will open your email client with a pre-filled message.
              </p>

              <ContactForm />
            </div>

            {/* Quick contact cards */}
            <div className="space-y-4 sm:space-y-6">
              {[
                {
                  title: "Support",
                  desc: "Questions, issues, or guidance getting started.",
                  href: "mailto:support@openpeople.ai",
                  cta: "support@openpeople.ai",
                },
                {
                  title: "Privacy",
                  desc: "Privacy requests, data subject requests, and policy questions.",
                  href: "mailto:privacy@openpeople.ai",
                  cta: "privacy@openpeople.ai",
                },
                {
                  title: "Legal",
                  desc: "DPAs, agreements, and compliance documentation.",
                  href: "mailto:legal@openpeople.ai",
                  cta: "legal@openpeople.ai",
                },
              ].map((c) => (
                <div key={c.title} className="glass-card p-5 sm:p-6 md:p-7">
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                    {c.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{c.desc}</p>
                  <a
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--electric-lime)] hover:opacity-80"
                    href={c.href}
                  >
                    {c.cta}
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
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M21 3l-9 9m0 0H7.5m4.5 0V7.5"
                      />
                    </svg>
                  </a>
                </div>
              ))}

              <div className="glass-card p-5 sm:p-6 md:p-7">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Looking for docs?
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  If you’re stuck, our Support page and docs are the fastest way to find answers.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link href="/support" className="btn-secondary w-full sm:w-auto justify-center">
                    Support
                  </Link>
                  <Link
                    href="/api-reference"
                    className="btn-secondary w-full sm:w-auto justify-center"
                  >
                    API Reference
                  </Link>
                </div>
              </div>
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

