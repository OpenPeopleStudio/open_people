"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Bar Component
   Mobile-first with full-screen menu overlay
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/documentation", label: "Docs" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="container">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? "h-14" : "h-16 sm:h-20"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group relative z-50">
              <div
                className={`rounded-lg bg-[var(--electric-lime)] flex items-center justify-center transition-all duration-300 ${
                  scrolled ? "w-8 h-8" : "w-9 h-9"
                } group-hover:scale-105 group-active:scale-95`}
              >
                <svg
                  className="w-5 h-5 text-[var(--void)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span
                className={`font-semibold text-[var(--text-primary)] transition-all duration-300 ${
                  scrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                }`}
              >
                OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div
              className={`hidden md:flex items-center gap-8 transition-all duration-300 ${
                scrolled ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA + Mobile Menu Button */}
            <div className="flex items-center gap-3">
              {/* Desktop CTAs - hidden on mobile */}
              <div
                className={`hidden sm:flex items-center gap-3 transition-all duration-300 ${
                  scrolled ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
                >
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-sm">
                  Get started
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

              {/* Mobile menu button - always visible on mobile, or when scrolled on desktop */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`relative z-50 w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 ${
                  menuOpen
                    ? "bg-[var(--surface-2)]"
                    : scrolled
                    ? "bg-[var(--surface-2)] md:bg-[var(--electric-lime)]"
                    : "bg-[var(--surface-2)] sm:hidden"
                } ${!scrolled && "sm:hidden"} ${scrolled && "md:flex"}`}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <svg
                  className={`w-5 h-5 transition-all duration-300 ${
                    menuOpen
                      ? "text-[var(--text-primary)] rotate-90"
                      : scrolled
                      ? "text-[var(--text-primary)] md:text-[var(--void)]"
                      : "text-[var(--text-primary)]"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Backdrop blur bar */}
        <div
          className={`absolute inset-0 -z-10 transition-all duration-300 ${
            scrolled || menuOpen
              ? "bg-[var(--void)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)]"
              : "bg-transparent"
          }`}
        />
      </nav>

      {/* Full-screen mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-[var(--void)]/95 backdrop-blur-xl"
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Menu content */}
        <div className={`relative z-10 h-full flex flex-col pt-20 sm:pt-24 pb-8 px-6 transition-all duration-300 ${
          menuOpen ? "translate-y-0" : "-translate-y-4"
        }`}>
          {/* Nav links */}
          <nav className="flex-1">
            <ul className="space-y-1">
              {navLinks.map((link, i) => (
                <li 
                  key={link.href}
                  style={{ 
                    transitionDelay: menuOpen ? `${i * 50}ms` : "0ms",
                  }}
                  className={`transition-all duration-300 ${
                    menuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-4 text-2xl sm:text-3xl font-display text-[var(--text-primary)] hover:text-[var(--electric-lime)] transition-colors active:scale-[0.98]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom CTAs */}
          <div 
            className={`space-y-3 pt-8 border-t border-[var(--border-subtle)] transition-all duration-300 ${
              menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: menuOpen ? "200ms" : "0ms" }}
          >
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="btn-primary w-full justify-center text-base py-4"
            >
              Get started free
              <svg
                className="w-5 h-5"
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
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="btn-secondary w-full justify-center text-base py-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
