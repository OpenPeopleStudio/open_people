import Link from "next/link";
import { DESK_VERIFIED } from "@/lib/desk";

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/ask", label: "Ask" },
  { href: "/contact", label: "Contact" },
];

const TRACKS = [
  { href: "/build", label: "Build" },
  { href: "/capital", label: "Capital" },
  { href: "/consent", label: "Consent" },
  { href: "/power", label: "Power" },
];

const BUILD_RECORD = [{ href: "/compute", label: "Compute plan" }];

const POWER_RECORD = [
  { href: "/tracker", label: "Tracker" },
  { href: "/industries", label: "Industries" },
  { href: "/costs", label: "Costs" },
  { href: "/brief", label: "Brief" },
  { href: "/letter", label: "Letter" },
  { href: "/engage", label: "Engage" },
];

export default function SiteFooter() {
  return (
    <footer className="desk-footer border-t border-[var(--hairline)]">
      <div className="desk-footer-main">
        <div>
          <div className="desk-brand">Open People</div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink-2)]">
            Open People is building a proposed 500 MW Labrador campus and a research campus, in
            feasibility. Mines and existing industry are real constraints.
          </p>
          <p className="desk-fact mt-4 text-[var(--ink-3)]">
            Last verified {DESK_VERIFIED} · public documents only · UNKNOWN labelled
          </p>
          <p className="desk-fact mt-2 text-[var(--ink-3)]">
            St. John&apos;s, Newfoundland and Labrador
          </p>
        </div>

        <div className="desk-footer-links">
          {[
            ["Company", COMPANY],
            ["Tracks", TRACKS],
            ["Build record", BUILD_RECORD],
            ["Power record", POWER_RECORD],
          ].map(([label, links]) => (
            <div key={label as string} className="flex flex-wrap gap-x-8 gap-y-3">
              <span className="desk-kicker w-full">{label as string}</span>
              {(links as { href: string; label: string }[]).map((link) => (
                <Link key={link.href} href={link.href} className="desk-nav-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <a href="mailto:tom@openpeople.ai" className="desk-nav-link normal-case tracking-normal">
            tom@openpeople.ai
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-[var(--wide)] flex-col gap-2 px-[var(--gutter)] py-5 desk-fact text-[var(--ink-3)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Open People</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="no-underline hover:text-[var(--plasma)]">
              Privacy
            </Link>
            <Link href="/terms" className="no-underline hover:text-[var(--plasma)]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
