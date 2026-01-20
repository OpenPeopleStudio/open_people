import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenPeople.ai",
  description:
    "Privacy Policy for OpenPeople.ai. Transparency, data minimization, and security by design.",
};

export default function PrivacyPage() {
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
                Privacy · Updated {lastUpdated}
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-7xl font-display tracking-tight animate-slide-up">
              Privacy,{" "}
              <span className="text-gradient-lime italic block sm:inline">by design</span>
            </h1>

            <p className="mt-5 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              This Privacy Policy explains how OpenPeople.ai collects, uses, and protects 
              information. We&apos;re based in St. John&apos;s, Newfoundland, and we build 
              human-centric AI: clear controls, practical value, and strong security.
            </p>

            {/* Principles cards */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 animate-slide-up delay-200">
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Transparency
                </h2>
                <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  We explain what we collect, why, and how long we keep it.
                </p>
              </div>
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Data minimization
                </h2>
                <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  We aim to collect only what we need to provide the service.
                </p>
              </div>
              <div className="glass-card p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Security
                </h2>
                <p className="mt-2 sm:mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  Layered safeguards protect your data in transit and at rest.
                </p>
              </div>
            </div>
          </div>

          {/* Policy content */}
          <section className="mt-8 sm:mt-10 md:mt-12 glass-card p-5 sm:p-6 md:p-8">
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-[var(--text-primary)] prose-headings:font-display prose-headings:text-lg sm:prose-headings:text-xl prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] prose-a:text-[var(--electric-lime)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--text-primary)]">
              <h2>1. Information we collect</h2>
              <p>
                We may collect information you provide directly, information we
                generate when you use the service, and technical information
                needed for reliability and security.
              </p>
              <ul>
                <li>
                  <strong>Account information</strong> (e.g., name, email,
                  authentication details).
                </li>
                <li>
                  <strong>Usage information</strong> (e.g., feature usage,
                  timestamps, activity logs).
                </li>
                <li>
                  <strong>Device and technical information</strong> (e.g., IP
                  address, browser type, device identifiers).
                </li>
                <li>
                  <strong>Communications</strong> (e.g., support requests and
                  feedback you send).
                </li>
              </ul>

              <h2>2. How we use information</h2>
              <ul>
                <li>Provide, operate, and maintain the service</li>
                <li>Authenticate users and prevent fraud/abuse</li>
                <li>Improve product performance and usability</li>
                <li>Communicate service updates and support responses</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>3. Sharing and disclosures</h2>
              <p>
                We may share information with service providers who help us run
                our services (e.g., hosting, email delivery, analytics) and when
                required by law. We also may share information in connection
                with a merger, acquisition, or sale of assets.
              </p>

              <h2>4. Cookies and analytics</h2>
              <p>
                We may use cookies or similar technologies to keep you signed
                in, remember preferences, and understand product usage. You can
                control cookies through your browser settings.
              </p>

              <h2>5. Data retention</h2>
              <p>
                We retain information for as long as needed to provide the
                service, meet contractual commitments, and comply with legal
                obligations. Retention periods can vary by data type and
                context.
              </p>

              <h2>6. Your rights and choices</h2>
              <p>
                Depending on your location, you may have rights to access,
                correct, delete, or export your personal information, and to
                object to or restrict certain processing.
              </p>
              <p>
                To make a request, email{" "}
                <a href="mailto:privacy@openpeople.ai">privacy@openpeople.ai</a>.
              </p>

              <h2>7. International data transfers</h2>
              <p>
                If we transfer personal information across borders, we take
                steps to protect it consistent with this policy and applicable
                law.
              </p>

              <h2>8. Security</h2>
              <p>
                We use administrative, technical, and organizational measures
                designed to protect information. No method of transmission or
                storage is 100% secure, but we continuously improve our
                safeguards.
              </p>

              <h2>9. Contact</h2>
              <p>
                Questions about this policy? Email{" "}
                <a href="mailto:privacy@openpeople.ai">privacy@openpeople.ai</a>.
              </p>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <Link href="/" className="btn-secondary w-full sm:w-auto justify-center">
                Back to home
              </Link>
              <Link href="/terms" className="btn-primary w-full sm:w-auto justify-center">
                Read Terms
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
