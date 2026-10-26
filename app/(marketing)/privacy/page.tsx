import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenPeople.ai",
  description:
    "Privacy Policy for OpenPeople.ai. Transparency, data minimization, and security by design.",
};

export default function PrivacyPage() {
  const lastUpdated = "January 20, 2026";

  return (
    <DeskPage
      kicker={`Privacy · Updated ${lastUpdated}`}
      title="Privacy policy"
      lede={
        <p>
          This Privacy Policy explains how OpenPeople.ai collects, uses, and protects information.
          We&apos;re based in St. John&apos;s, Newfoundland, and we build human-centric AI: clear
          controls, practical value, and strong security.
        </p>
      }
      verified={false}
      singleVoice
    >
      <DeskSection id="principles" wide>
        <div className="desk-grid-hair sm:grid-cols-3">
          <div className="p-5 sm:p-6">
            <h2 className="desk-h3">Transparency</h2>
            <p className="mt-2 sm:mt-3 text-sm text-[var(--ink-2)] leading-relaxed">
              We explain what we collect, why, and how long we keep it.
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <h2 className="desk-h3">Data minimization</h2>
            <p className="mt-2 sm:mt-3 text-sm text-[var(--ink-2)] leading-relaxed">
              We aim to collect only what we need to provide the service.
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <h2 className="desk-h3">Security</h2>
            <p className="mt-2 sm:mt-3 text-sm text-[var(--ink-2)] leading-relaxed">
              Layered safeguards protect your data in transit and at rest.
            </p>
          </div>
        </div>
      </DeskSection>

      <DeskSection id="policy">
        <div className="desk-legal">
          <h2>1. Information we collect</h2>
          <p>
            We may collect information you provide directly, information we generate when you use
            the service, and technical information needed for reliability and security.
          </p>
          <ul>
            <li>
              <strong>Account information</strong> (e.g., name, email, authentication details).
            </li>
            <li>
              <strong>Usage information</strong> (e.g., feature usage, timestamps, activity logs).
            </li>
            <li>
              <strong>Device and technical information</strong> (e.g., IP address, browser type,
              device identifiers).
            </li>
            <li>
              <strong>Communications</strong> (e.g., support requests and feedback you send).
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
            We may share information with service providers who help us run our services (e.g.,
            hosting, email delivery, analytics) and when required by law. We also may share
            information in connection with a merger, acquisition, or sale of assets.
          </p>

          <h2>4. Cookies and analytics</h2>
          <p>
            We may use cookies or similar technologies to keep you signed in, remember preferences,
            and understand product usage. You can control cookies through your browser settings.
          </p>

          <h2>5. Data retention</h2>
          <p>
            We retain information for as long as needed to provide the service, meet contractual
            commitments, and comply with legal obligations. Retention periods can vary by data type
            and context.
          </p>

          <h2>6. Your rights and choices</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, or export
            your personal information, and to object to or restrict certain processing.
          </p>
          <p>
            To make a request, email{" "}
            <a href="mailto:privacy@openpeople.ai">privacy@openpeople.ai</a>.
          </p>

          <h2>7. International data transfers</h2>
          <p>
            If we transfer personal information across borders, we take steps to protect it
            consistent with this policy and applicable law.
          </p>

          <h2>8. Security</h2>
          <p>
            We use administrative, technical, and organizational measures designed to protect
            information. No method of transmission or storage is 100% secure, but we continuously
            improve our safeguards.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href="mailto:privacy@openpeople.ai">privacy@openpeople.ai</a>.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="desk-link">
            Back to home
          </Link>
          <Link href="/terms" className="desk-link">
            Read Terms
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
