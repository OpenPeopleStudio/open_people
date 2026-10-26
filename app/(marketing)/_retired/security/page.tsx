import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Security — OpenPeople.ai",
  description:
    "Security and privacy by default. Learn how OpenPeople.ai protects your data with encryption, tenant isolation, and access controls.",
};

const SECURITY_PILLARS = [
  {
    title: "Tenant isolation",
    description:
      "Multi-tenant architecture with database row-level security (RLS) to keep tenant data separated by default.",
  },
  {
    title: "Encryption",
    description:
      "TLS for data in transit and strong encryption at rest across our managed infrastructure and storage providers.",
  },
  {
    title: "Access controls",
    description:
      "Role-based access patterns and server-side authorization checks per endpoint—designed for least privilege.",
  },
  {
    title: "Operational transparency",
    description:
      "Audit-friendly history and predictable workflows so teams can validate what happened and why.",
  },
];

const VENDORS = [
  { name: "Supabase", purpose: "PostgreSQL database + authentication" },
  { name: "Cloudflare R2", purpose: "File storage (objects, downloads/uploads)" },
  { name: "Resend", purpose: "Transactional email delivery" },
  { name: "Vercel", purpose: "Application hosting & deployment" },
];

export default function SecurityPage() {
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
                Security
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Security & privacy{" "}
              <span className="text-gradient-lime italic block sm:inline">
                by default
              </span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              We build OpenPeople.ai so teams can adopt AI without giving up control.
              Your data stays safe, useful, and yours.
            </p>
          </div>

          {/* Pillars */}
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {SECURITY_PILLARS.map((p) => (
              <div key={p.title} className="glass-card p-5 sm:p-6 md:p-7">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  {p.description}
                </p>
              </div>
            ))}
          </div>

          {/* Practical details */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                What we do
              </h2>
              <ul className="mt-5 space-y-3 text-sm sm:text-base text-[var(--text-secondary)]">
                {[
                  "Use row-level security (RLS) to isolate tenant data.",
                  "Authenticate API access using Supabase Auth (session cookies or bearer tokens).",
                  "Authorize requests per endpoint (tenant scope + role checks).",
                  "Encrypt data in transit and at rest via managed providers.",
                  "Maintain audit-friendly history for operational visibility.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--electric-lime)] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs sm:text-sm text-[var(--text-muted)]">
                For details, see our{" "}
                <Link href="/privacy" className="text-[var(--electric-lime)] hover:opacity-80">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                Vendors
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                We rely on established providers for core infrastructure:
              </p>
              <div className="mt-5 space-y-3">
                {VENDORS.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-start justify-between gap-4 p-3 bg-[var(--surface-2)] rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {v.name}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--text-muted)]">
                        {v.purpose}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs sm:text-sm text-[var(--text-muted)]">
                Need a security review, DPA, or vendor list? Email{" "}
                <a
                  className="text-[var(--electric-lime)] hover:opacity-80"
                  href="mailto:legal@openpeople.ai"
                >
                  legal@openpeople.ai
                </a>
                .
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Have a security question?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              We&apos;ll help you evaluate OpenPeople.ai for your environment and requirements.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/contact" className="btn-primary w-full sm:w-auto justify-center">
                Contact us
              </Link>
              <Link href="/documentation" className="btn-secondary w-full sm:w-auto justify-center">
                Read docs
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

