"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Bar Component
   Collapses into logo menu on scroll with cosmic transformation
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      if (window.scrollY <= 50) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="container">
        <div
          className={`flex items-center justify-between transition-all duration-500 ${
            scrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo - always visible, clickable for menu when scrolled */}
          <div className="relative">
            <button
              onClick={() => scrolled && setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2 group ${
                scrolled ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`rounded-lg bg-[var(--electric-lime)] flex items-center justify-center transition-all duration-500 ${
                  scrolled ? "w-8 h-8" : "w-9 h-9"
                } group-hover:scale-105`}
              >
                {scrolled ? (
                  // Menu icon when scrolled
                  <svg
                    className={`w-4 h-4 text-[var(--void)] transition-transform duration-300 ${
                      menuOpen ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                ) : (
                  // People icon when at top
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
                )}
              </div>
              <span
                className={`font-semibold text-[var(--text-primary)] transition-all duration-500 ${
                  scrolled ? "text-lg" : "text-xl"
                }`}
              >
                OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
              </span>
              
              {/* Cosmic particles when scrolled */}
              {scrolled && (
                <span className="absolute -right-1 -top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--electric-lime)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--electric-lime)]"></span>
                </span>
              )}
            </button>

            {/* Dropdown menu - appears when scrolled and clicked */}
            {scrolled && menuOpen && (
              <div className="absolute top-full left-0 mt-2 py-2 w-48 rounded-xl bg-[var(--surface-1)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl animate-fade-in">
                {/* Arrow pointer */}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-[var(--surface-1)] border-l border-t border-[var(--border-subtle)] transform rotate-45"></div>
                
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-[var(--border-subtle)] my-2"></div>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-[var(--electric-lime)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Get started →
                </Link>
              </div>
            )}
          </div>

          {/* Nav Links - hidden when scrolled */}
          <div
            className={`hidden md:flex items-center gap-8 transition-all duration-500 ${
              scrolled ? "opacity-0 pointer-events-none scale-95" : "opacity-100"
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

          {/* CTA Buttons - hidden when scrolled */}
          <div
            className={`flex items-center gap-3 transition-all duration-500 ${
              scrolled ? "opacity-0 pointer-events-none scale-95" : "opacity-100"
            }`}
          >
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
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
        </div>
      </div>
      
      {/* Backdrop blur bar when scrolled */}
      <div
        className={`absolute inset-0 -z-10 transition-all duration-500 ${
          scrolled
            ? "bg-[var(--void)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]"
            : "bg-transparent"
        }`}
      />
    </nav>
  );
}
