import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Terms of Service — OpenPeople.ai",
  description:
    "Terms of Service for OpenPeople.ai. Please read these terms carefully before using the site and services.",
};

export default function TermsPage() {
  const lastUpdated = "January 20, 2026";

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
                Terms · Updated {lastUpdated}
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-7xl font-display tracking-tight animate-slide-up">
              The terms that{" "}
              <span className="text-gradient-lime italic block sm:inline">keep things clear</span>
            </h1>

            <p className="mt-5 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              These Terms of Service ("Terms") govern your access to and use of
              OpenPeople.ai&apos;s website and services. By using the Services, you agree 
              to these Terms.
            </p>
          </div>

          {/* Terms content */}
          <section className="mt-8 sm:mt-10 md:mt-12 glass-card p-5 sm:p-6 md:p-8">
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-[var(--text-primary)] prose-headings:font-display prose-headings:text-lg sm:prose-headings:text-xl prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-a:text-[var(--electric-lime)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--text-primary)]">
              <h2>1. Who we are</h2>
              <p>
                OpenPeople.ai provides human-centric AI tools for organizations.
                We&apos;re based in St. John&apos;s, Newfoundland.
              </p>

              <h2>2. Accounts</h2>
              <ul>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your credentials.
                </li>
                <li>
                  You agree to provide accurate information and keep it up to
                  date.
                </li>
                <li>
                  You must notify us promptly of unauthorized use of your
                  account.
                </li>
              </ul>

              <h2>3. Acceptable use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Services to break the law or harm others</li>
                <li>
                  Attempt to access accounts, data, or systems you do not have
                  permission to access
                </li>
                <li>Interfere with or disrupt the Services</li>
                <li>
                  Reverse engineer the Services except where prohibited by law
                </li>
              </ul>

              <h2>4. Customer content</h2>
              <p>
                You retain your rights in the content and data you submit to the
                Services ("Customer Content"). You grant us a limited license to
                host, process, and transmit Customer Content solely to provide
                and secure the Services.
              </p>

              <h2>5. AI features and outputs</h2>
              <p>
                Some features may generate outputs based on the inputs you
                provide. Outputs can be incorrect or incomplete and should be
                reviewed before use. You are responsible for decisions you make
                using the Services.
              </p>

              <h2>6. Third-party services</h2>
              <p>
                The Services may integrate with third-party services. Your use
                of third-party services is subject to their terms and policies.
              </p>

              <h2>7. Fees and billing</h2>
              <p>
                If you purchase paid Services, you agree to pay the applicable
                fees. Additional billing terms may apply at checkout or in an
                order form.
              </p>

              <h2>8. Termination</h2>
              <p>
                You may stop using the Services at any time. We may suspend or
                terminate access to the Services if you materially breach these
                Terms or if necessary to protect the Services and other users.
              </p>

              <h2>9. Disclaimers</h2>
              <p>
                The Services are provided on an "as is" and "as available"
                basis. To the fullest extent permitted by law, we disclaim all
                warranties, express or implied.
              </p>

              <h2>10. Limitation of liability</h2>
              <p>
                To the fullest extent permitted by law, OpenPeople.ai will not
                be liable for indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits, data, or goodwill.
              </p>

              <h2>11. Governing law</h2>
              <p>
                These Terms are governed by the laws of the Province of
                Newfoundland and Labrador and the federal laws of Canada
                applicable therein, without regard to conflict of laws rules.
              </p>

              <h2>12. Contact</h2>
              <p>
                Questions about these Terms? Email{" "}
                <a href="mailto:legal@openpeople.ai">legal@openpeople.ai</a> or{" "}
                <a href="mailto:support@openpeople.ai">support@openpeople.ai</a>.
              </p>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <Link href="/" className="btn-secondary w-full sm:w-auto justify-center">
                Back to home
              </Link>
              <Link href="/privacy" className="btn-primary w-full sm:w-auto justify-center">
                Read Privacy
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
          </section>
        </div>
      </main>
    </div>
  );
}
