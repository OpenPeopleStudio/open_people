import Link from "next/link";

const DESK = [
  { href: "/brief", label: "Brief" },
  { href: "/tracker", label: "Tracker" },
  { href: "/industries", label: "Industries" },
  { href: "/costs", label: "Costs" },
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
    <footer className="border-t border-[var(--border-subtle)]">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-14 sm:px-6 sm:py-20 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-primary)]">
            Open People<span className="text-[var(--plasma)]"> · horizon desk</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Churchill River / Labrador power information desk. Firm in-province power for industry.
            Mining first. Open People is a constituent and catalyst — not a DCIA party.
          </p>
          <p className="mt-3 font-mono text-[11px] text-[var(--text-muted)]">
            Based in St. John&apos;s, Newfoundland and Labrador
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[12px]">
            {DESK.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[12px]">
            {SECONDARY.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:tom@openpeople.ai"
              className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
            >
              tom@openpeople.ai
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-2 px-4 py-5 font-mono text-[10.5px] text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
