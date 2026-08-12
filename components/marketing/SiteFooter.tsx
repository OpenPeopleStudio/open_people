import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)]">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-primary)]">
            Open People<span className="text-[var(--plasma)]"> · Phase 2</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Labrador green electrons → sovereign AI compute. Capital-light demand
            and software — partners carry the steel.
          </p>
          <p className="mt-3 font-mono text-[11px] text-[var(--text-muted)]">
            Based in St. John&apos;s, Newfoundland and Labrador
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[12px]">
          <Link href="/brief" className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]">
            The case
          </Link>
          <Link href="/approach" className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]">
            Approach
          </Link>
          <Link href="/about" className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]">
            About
          </Link>
          <Link href="/contact" className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]">
            Contact
          </Link>
          <a
            href="mailto:tom@openpeople.ai"
            className="text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
          >
            tom@openpeople.ai
          </a>
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
