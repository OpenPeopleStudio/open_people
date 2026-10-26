"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/build", label: "Build" },
  { href: "/capital", label: "Capital" },
  { href: "/consent", label: "Consent" },
  { href: "/power", label: "Power" },
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
          <Link href="/" className="desk-brand" aria-label="Open People">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/op-lockup-horizontal-reversed.svg"
              alt=""
              width={200}
              height={28}
            />
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
        </div>
      ) : null}
    </>
  );
}
