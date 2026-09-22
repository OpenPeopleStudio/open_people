"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tracker", label: "Tracker" },
  { href: "/industries", label: "Industries" },
  { href: "/costs", label: "Costs" },
  { href: "/brief", label: "Brief" },
  { href: "/letter", label: "Letter" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close the sheet on navigation (links also close it on click).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <nav className="desk-nav" aria-label="Primary">
        <div className="desk-nav-inner">
          <Link href="/" className="desk-brand">
            Open People <b>· Churchill River desk</b>
          </Link>

          <div className="desk-nav-links">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="desk-nav-link"
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/engage" className="desk-nav-cta">
              Keep power here
            </Link>
          </div>

          <button
            type="button"
            className="desk-nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "×" : "≡"}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="desk-nav-sheet">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/engage" onClick={() => setOpen(false)}>
            Engage
          </Link>
          <Link href="/compute" onClick={() => setOpen(false)} className="text-[var(--ink-3)]">
            Compute plan
          </Link>
          <div className="mt-8">
            <Link href="/engage" className="btn-primary w-full" onClick={() => setOpen(false)}>
              Get involved — keep firm power here
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
