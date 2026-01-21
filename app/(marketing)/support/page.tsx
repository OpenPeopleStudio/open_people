import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Support — OpenPeople.ai",
  description:
    "Get help with OpenPeople.ai. FAQs, troubleshooting guides, and contact options for our support team.",
};

const FAQ_ITEMS = [
  {
    question: "What is OpenPeople.ai?",
    answer:
      "OpenPeople.ai is a human-centric AI platform that helps businesses manage AI tools, workflows, and data. We focus on keeping you in control—your data stays safe, useful, and yours.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Visit our signup page, enter your email and password, verify your email, and complete your organization setup. You get a 14-day free trial of Pro features—no credit card required.",
  },
  {
    question: "What AI providers do you support?",
    answer:
      "We support OpenAI (GPT-4, etc.), Anthropic (Claude), Azure OpenAI, AWS Bedrock, and custom endpoints. You can register any AI model accessible via API.",
  },
  {
    question: "Is my data isolated from other customers?",
    answer:
      "Yes. We use Row-Level Security (RLS) at the database level. Queries automatically filter to your tenant's data, and no code path can accidentally access other tenants' data.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! Go to Settings → Domains, add your custom domain (e.g., ai.yourcompany.com), add the DNS records we provide, and your domain will be active within 24 hours.",
  },
  {
    question: "How does billing work?",
    answer:
      "We bill monthly or annually (annual saves 20%). Usage-based add-ons like AI calls and storage are billed monthly. You can upgrade, downgrade, or cancel anytime.",
  },
  {
    question: "Do you have an API?",
    answer:
      "Yes! We have a full REST API with authentication via Supabase tokens. Check out our API Reference for complete documentation.",
  },
  {
    question: "What compliance frameworks do you support?",
    answer:
      "We support GDPR, CCPA, and are working toward SOC 2 Type II certification (targeted Q3 2026). Enterprise customers can request specific compliance documentation.",
  },
];

const CONTACT_OPTIONS = [
  {
    title: "Email Support",
    description: "Get help from our team within 24 hours",
    action: "support@openpeople.ai",
    href: "mailto:support@openpeople.ai",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    color: "var(--electric-lime)",
  },
  {
    title: "Documentation",
    description: "Guides, tutorials, and reference materials",
    action: "Browse docs",
    href: "/documentation",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    color: "var(--electric-cyan)",
  },
  {
    title: "Status Page",
    description: "Check service health and incidents",
    action: "View status",
    href: "https://status.openpeople.ai",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#10B981",
    external: true,
  },
];

export default function SupportPage() {
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
                Support
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              How can we{" "}
              <span className="text-gradient-lime italic block sm:inline">help you?</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Find answers to common questions, troubleshoot issues, or get in touch with
              our support team. We&apos;re based in St. John&apos;s, Newfoundland and here to help.
            </p>
          </div>

          {/* Contact options */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 animate-slide-up delay-200">
            {CONTACT_OPTIONS.map((option) => (
              <Link
                key={option.title}
                href={option.href}
                target={option.external ? "_blank" : undefined}
                rel={option.external ? "noopener noreferrer" : undefined}
                className="glass-card p-5 sm:p-6 hover:border-[var(--electric-lime)] transition-all group"
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${option.color}20` }}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: option.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                  {option.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {option.description}
                </p>
                <p className="mt-3 text-sm text-[var(--electric-lime)] flex items-center gap-1">
                  {option.action}
                  {option.external && (
                    <svg
                      className="w-3 h-3"
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
                </p>
              </Link>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)] mb-6 sm:mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 sm:space-y-5">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={index}
                  className="glass-card group"
                >
                  <summary className="p-5 sm:p-6 cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                      {item.question}
                    </h3>
                    <svg
                      className="w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Troubleshooting quick links */}
          <div className="mt-12 sm:mt-16 glass-card p-5 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 sm:mb-6">
              Common Issues
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Login problems", href: "/docs/troubleshooting#login" },
                { label: "API authentication", href: "/docs/troubleshooting#api-auth" },
                { label: "Email not sending", href: "/docs/troubleshooting#email" },
                { label: "File upload errors", href: "/docs/troubleshooting#storage" },
                { label: "AI worker issues", href: "/docs/troubleshooting#ai-workers" },
                { label: "Billing questions", href: "/docs/troubleshooting#billing" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--surface-2)] rounded-lg hover:bg-[var(--surface-3)] transition-colors group"
                >
                  <svg
                    className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--electric-lime)] transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    />
                  </svg>
                  <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Still need help?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Our support team typically responds within 24 hours. For urgent issues, 
              include &quot;URGENT&quot; in your subject line.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <a
                href="mailto:support@openpeople.ai"
                className="btn-primary w-full sm:w-auto justify-center"
              >
                Email Support
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
              <Link href="/documentation" className="btn-secondary w-full sm:w-auto justify-center">
                Browse Documentation
              </Link>
            </div>
            <p className="mt-6 text-xs sm:text-sm text-[var(--text-muted)]">
              Business hours: Monday–Friday, 9am–5pm NST (St. John&apos;s, Newfoundland)
            </p>
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
