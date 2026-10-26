import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Terms of Service — OpenPeople.ai",
  description:
    "Terms of Service for OpenPeople.ai. Please read these terms carefully before using the site and services.",
};

export default function TermsPage() {
  const lastUpdated = "January 20, 2026";

  return (
    <DeskPage
      kicker={`Terms · Updated ${lastUpdated}`}
      title="Terms of service"
      lede={
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of
          OpenPeople.ai&apos;s website and services. By using the Services, you agree to these
          Terms.
        </p>
      }
      verified={false}
      singleVoice
    >
      <DeskSection id="terms">
        <div className="desk-legal">
          <h2>1. Who we are</h2>
          <p>
            OpenPeople.ai provides human-centric AI tools for organizations. We&apos;re based in St.
            John&apos;s, Newfoundland.
          </p>

          <h2>2. Accounts</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
            <li>You agree to provide accurate information and keep it up to date.</li>
            <li>You must notify us promptly of unauthorized use of your account.</li>
          </ul>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Services to break the law or harm others</li>
            <li>
              Attempt to access accounts, data, or systems you do not have permission to access
            </li>
            <li>Interfere with or disrupt the Services</li>
            <li>Reverse engineer the Services except where prohibited by law</li>
          </ul>

          <h2>4. Customer content</h2>
          <p>
            You retain your rights in the content and data you submit to the Services
            (&quot;Customer Content&quot;). You grant us a limited license to host, process, and
            transmit Customer Content solely to provide and secure the Services.
          </p>

          <h2>5. AI features and outputs</h2>
          <p>
            Some features may generate outputs based on the inputs you provide. Outputs can be
            incorrect or incomplete and should be reviewed before use. You are responsible for
            decisions you make using the Services.
          </p>

          <h2>6. Third-party services</h2>
          <p>
            The Services may integrate with third-party services. Your use of third-party services
            is subject to their terms and policies.
          </p>

          <h2>7. Fees and billing</h2>
          <p>
            If you purchase paid Services, you agree to pay the applicable fees. Additional billing
            terms may apply at checkout or in an order form.
          </p>

          <h2>8. Termination</h2>
          <p>
            You may stop using the Services at any time. We may suspend or terminate access to the
            Services if you materially breach these Terms or if necessary to protect the Services
            and other users.
          </p>

          <h2>9. Disclaimers</h2>
          <p>
            The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To
            the fullest extent permitted by law, we disclaim all warranties, express or implied.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, OpenPeople.ai will not be liable for indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits, data,
            or goodwill.
          </p>

          <h2>11. Governing law</h2>
          <p>
            These Terms are governed by the laws of the Province of Newfoundland and Labrador and
            the federal laws of Canada applicable therein, without regard to conflict of laws
            rules.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a href="mailto:legal@openpeople.ai">legal@openpeople.ai</a> or{" "}
            <a href="mailto:support@openpeople.ai">support@openpeople.ai</a>.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="desk-link">
            Back to home
          </Link>
          <Link href="/privacy" className="desk-link">
            Read Privacy
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
