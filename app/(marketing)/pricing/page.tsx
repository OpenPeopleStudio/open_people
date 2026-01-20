import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Pricing — OpenPeople.ai",
  description:
    "Simple pricing for human-centric AI. Start free, upgrade when you’re ready, and scale with your team.",
};

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "per month",
    highlight: false,
    tagline: "For individuals and small teams getting started.",
    features: [
      "14-day Pro trial included",
      "AI Team basics",
      "Notes & knowledge",
      "Workflows & tasks",
      "Secure storage",
      "Community support",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$49",
    period: "per user / month",
    highlight: true,
    tagline: "For teams that need reliable execution and clarity.",
    features: [
      "Everything in Starter",
      "Email inbox + templates",
      "AI Worker planning (weekly)",
      "Ops Worker proposals",
      "Audit-friendly history",
      "Priority support",
    ],
    cta: "Start Pro trial",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    highlight: false,
    tagline: "For larger orgs with advanced controls and support.",
    features: [
      "Custom limits & rollouts",
      "Dedicated onboarding",
      "Security & compliance review",
      "SLA options",
      "Custom integrations",
      "Vendor + data processing docs",
    ],
    cta: "Talk to sales",
    href: "/contact",
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes. New accounts get a 14-day free trial of Pro features. No credit card required to start.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes—upgrade or downgrade anytime. Changes take effect immediately (prorated where applicable).",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Annual billing typically includes a discount for Pro. Contact us for Enterprise terms.",
  },
  {
    q: "Do you support custom domains?",
    a: "Yes. You can add a custom domain to your tenant in settings and verify DNS records.",
  },
];

export default function PricingPage() {
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
                Pricing
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Simple pricing{" "}
              <span className="text-gradient-lime italic block sm:inline">
                for real teams
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Start free. Upgrade when your team needs deeper workflows, inbox tooling, and
              operational AI support.
            </p>
          </div>

          {/* Plans */}
          <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative glass-card p-6 sm:p-7 md:p-8 ${
                  p.highlight
                    ? "border-[var(--electric-lime)] shadow-[0_0_40px_-10px_var(--glow-lime)]"
                    : ""
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge text-[10px] sm:text-xs">Most popular</span>
                  </div>
                )}

                <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                  {p.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{p.tagline}</p>

                <div className="mt-5 flex items-end gap-2">
                  <div className="text-3xl sm:text-4xl font-display text-[var(--text-primary)]">
                    {p.price}
                  </div>
                  {p.period && (
                    <div className="text-xs sm:text-sm text-[var(--text-muted)] pb-1">
                      {p.period}
                    </div>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <svg
                        className="w-4 h-4 text-[var(--electric-lime)] shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`mt-7 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all active:scale-[0.98] ${
                    p.highlight
                      ? "bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-90"
                      : "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] hover:text-[var(--electric-lime)]"
                  }`}
                >
                  {p.cta}
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
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Pricing FAQ
            </h2>
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
              {FAQ.map((item, i) => (
                <details key={i} className="glass-card group">
                  <summary className="p-5 sm:p-6 cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                      {item.q}
                    </h3>
                    <svg
                      className="w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Not sure which plan fits?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Tell us what you&apos;re trying to achieve—we&apos;ll recommend the right setup.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto justify-center">
                Talk to us
              </Link>
              <Link href="/documentation" className="btn-secondary w-full sm:w-auto justify-center">
                Browse docs
              </Link>
            </div>
            <p className="mt-6 text-xs sm:text-sm text-[var(--text-muted)]">
              Prices shown are placeholders until public launch.
            </p>
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

