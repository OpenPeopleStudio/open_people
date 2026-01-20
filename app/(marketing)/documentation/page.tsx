import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Documentation — OpenPeople.ai",
  description:
    "Comprehensive documentation for OpenPeople.ai. Guides, tutorials, and reference materials to help you get started and succeed.",
};

const DOC_SECTIONS = [
  {
    title: "Getting Started",
    description: "Set up your account and start using OpenPeople.ai in minutes",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    links: [
      { label: "Quick Start Guide", href: "/docs/getting-started" },
      { label: "Account Setup", href: "/docs/account-setup" },
      { label: "First AI Model", href: "/docs/first-model" },
      { label: "Invite Team Members", href: "/docs/team" },
    ],
    color: "var(--electric-lime)",
  },
  {
    title: "Platform Features",
    description: "Deep dive into AI governance, workflows, and collaboration tools",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    links: [
      { label: "AI Team & Workers", href: "/docs/ai-team" },
      { label: "Notes & Knowledge", href: "/docs/notes" },
      { label: "Email Integration", href: "/docs/email" },
      { label: "Workflows & Tasks", href: "/docs/workflows" },
    ],
    color: "var(--electric-cyan)",
  },
  {
    title: "Security & Privacy",
    description: "Understand how we protect your data and maintain compliance",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    links: [
      { label: "Security Overview", href: "/docs/security" },
      { label: "Data Encryption", href: "/docs/encryption" },
      { label: "Compliance (GDPR)", href: "/docs/compliance" },
      { label: "Access Controls", href: "/docs/access-controls" },
    ],
    color: "#10B981",
  },
  {
    title: "API & Integrations",
    description: "Connect OpenPeople.ai to your existing tools and workflows",
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    links: [
      { label: "API Overview", href: "/api-reference" },
      { label: "Authentication", href: "/docs/api-auth" },
      { label: "Webhooks", href: "/docs/webhooks" },
      { label: "SDKs & Libraries", href: "/docs/sdks" },
    ],
    color: "#8B5CF6",
  },
];

const QUICK_LINKS = [
  { label: "FAQ", href: "/support", description: "Common questions answered" },
  { label: "API Reference", href: "/api-reference", description: "Complete API documentation" },
  { label: "Changelog", href: "/changelog", description: "Latest updates and releases" },
  { label: "Status Page", href: "https://status.openpeople.ai", description: "Service health", external: true },
];

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      {/* Navigation */}
      <NavBar />

      <main className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
        <div className="container">
          {/* Header */}
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in">
              <span className="badge text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
                Documentation
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Learn how to use{" "}
              <span className="text-gradient-lime italic block sm:inline">OpenPeople.ai</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Guides, tutorials, and reference materials to help you get the most out of
              our human-centric AI platform. Built in St. John&apos;s, Newfoundland.
            </p>

            {/* Search placeholder */}
            <div className="mt-8 sm:mt-10 animate-slide-up delay-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 pl-12 sm:pl-14 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                />
                <svg
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Doc sections grid */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {DOC_SECTIONS.map((section, index) => (
              <div
                key={section.title}
                className="glass-card p-5 sm:p-6 md:p-8 group hover:border-[var(--border-medium)] transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${section.color}20` }}
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{ color: section.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                      {section.title}
                    </h2>
                    <p className="mt-1 sm:mt-2 text-sm text-[var(--text-secondary)]">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 sm:mt-6 space-y-2 sm:space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--electric-lime)] transition-colors py-1"
                      >
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 sm:mb-6">
              Quick Links
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="glass-card p-4 sm:p-5 hover:border-[var(--electric-lime)] transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm sm:text-base font-medium text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                      {link.label}
                    </span>
                    {link.external && (
                      <svg
                        className="w-3 h-3 text-[var(--text-muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Help CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Our support team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/support" className="btn-primary w-full sm:w-auto justify-center">
                Contact Support
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
              <a
                href="mailto:support@openpeople.ai"
                className="btn-secondary w-full sm:w-auto justify-center"
              >
                Email us directly
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
