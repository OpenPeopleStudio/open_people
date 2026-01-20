import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Integrations — OpenPeople.ai",
  description:
    "Connect OpenPeople.ai to the tools you already use: AI providers, email, and secure storage.",
};

const INTEGRATIONS = [
  {
    title: "AI providers",
    description:
      "Use the providers you trust—OpenAI, Anthropic, Azure OpenAI, AWS Bedrock, or custom endpoints.",
    items: ["OpenAI", "Anthropic", "Azure OpenAI", "AWS Bedrock", "Custom endpoints"],
  },
  {
    title: "Email",
    description:
      "Connect inboxes and templates so your team can triage, draft, and send with context.",
    items: ["Accounts", "Inbox", "Templates", "Domains", "Sending"],
  },
  {
    title: "Storage",
    description:
      "Store and retrieve files securely with bucketed storage and presigned uploads/downloads.",
    items: ["Buckets", "Files", "Presigned upload", "Presigned download"],
  },
];

export default function IntegrationsPage() {
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
                Integrations
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Plug into{" "}
              <span className="text-gradient-lime italic block sm:inline">
                how you already work
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              OpenPeople.ai integrates across your AI stack, communication, and storage—so you
              can adopt AI without rebuilding your processes.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {INTEGRATIONS.map((section) => (
              <div key={section.title} className="glass-card p-5 sm:p-6 md:p-8">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{section.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-[var(--text-muted)]">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--electric-lime)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Want a custom integration?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Tell us what you&apos;re connecting—API, data source, or workflow—and we&apos;ll help
              you design the right approach.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto justify-center">
                Talk to us
              </Link>
              <Link href="/api-reference" className="btn-secondary w-full sm:w-auto justify-center">
                API Reference
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

