"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/navigation";
import { superAdminNavSections } from "@/lib/navigation";
import { NotificationTray } from "@/components/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Layout
   Platform administration shell with navigation
   Desktop: collapsible sidebar  |  Mobile: top bar + overlay drawer
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const brandIcon = (
    <svg
      className="w-4 h-4 text-[var(--void)]"
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
  );

  const footerContent = (
    <div>
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--void)]">SA</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            Super Admin
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            Platform Owner
          </p>
        </div>
      </div>
      <button
        onClick={async () => {
          const { getSupabaseClient } = await import("@/lib/supabase/client");
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--void)] flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--void)] sticky top-0 z-40">
        <Link href="/super-admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center">
            {brandIcon}
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">OpenPeople</span>
            <span className="block text-xs text-[var(--text-muted)]">Super Admin</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationTray notificationsHref="/super-admin/analytics?tab=notifications" />
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -mr-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <SidebarNav
        sections={superAdminNavSections}
        brandName="OpenPeople"
        brandSubtitle="Super Admin"
        brandHref="/super-admin"
        brandIcon={brandIcon}
        storageKey="super-admin-sidebar"
        footerContent={footerContent}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop top bar with notifications */}
        <header className="hidden md:flex items-center justify-end h-14 px-6 border-b border-[var(--border-subtle)] bg-[var(--void)] shrink-0">
          <NotificationTray notificationsHref="/super-admin/analytics?tab=notifications" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
