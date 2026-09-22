import Link from "next/link";
import { DESK_VERIFIED } from "@/lib/desk";

const DESK = [
  { href: "/tracker", label: "Tracker" },
  { href: "/industries", label: "Industries" },
  { href: "/costs", label: "Costs" },
  { href: "/brief", label: "Brief" },
  { href: "/engage", label: "Engage" },
  { href: "/letter", label: "Letter" },
];

const SECONDARY = [
  { href: "/compute", label: "Compute plan" },
  { href: "/approach", label: "Approach" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--hairline)]">
      <div className="mx-auto flex max-w-[var(--wide)] flex-col gap-10 px-[var(--gutter)] py-14 sm:py-20 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="desk-brand">
            Open People <b>· Churchill River desk</b>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ink-2)]">
            What is signed, what is open, and what the public text still does not say about
            Churchill Falls / Gull Island firm power. Mining first. Open People is a constituent
            and catalyst voice, not a party to the agreement.
          </p>
          <p className="desk-fact mt-4 text-[var(--ink-3)]">
            Last verified {DESK_VERIFIED} · public documents only · UNKNOWN labelled
          </p>
          <p className="desk-fact mt-2 text-[var(--ink-3)]">
            St. John&apos;s, Newfoundland and Labrador
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {DESK.map((link) => (
              <Link key={link.href} href={link.href} className="desk-nav-link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {SECONDARY.map((link) => (
              <Link key={link.href} href={link.href} className="desk-nav-link">
                {link.label}
              </Link>
            ))}
            <a href="mailto:tom@openpeople.ai" className="desk-nav-link normal-case tracking-normal">
              tom@openpeople.ai
            </a>
          </div>
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
