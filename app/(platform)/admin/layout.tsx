"use client";

import { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { SidebarNav } from "@/components/navigation";
import { tenantAdminNavSections } from "@/lib/navigation";
import { NotificationTray } from "@/components/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin Layout
   Workspace administration shell with navigation for enabled modules
   Desktop: collapsible sidebar  |  Mobile: top bar + overlay drawer
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = useTenant();
  const brandName = tenant.settings.theme?.brand_name || tenant.name || "Workspace";
  const features = tenant.settings.features || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const footerContent = (
    <div className="space-y-1">
      <Link
        href="/shop"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
      >
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
        View Shop
      </Link>
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--void)]">
            {brandName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {brandName}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {tenant.slug}.openpeople.ai
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--void)] flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--void)] sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--void)]">{brandName.charAt(0)}</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{brandName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationTray notificationsHref="/admin/notifications" />
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
        sections={tenantAdminNavSections}
        brandName={brandName}
        brandSubtitle="Workspace"
        brandHref="/admin"
        features={features}
        storageKey="tenant-admin-sidebar"
        footerContent={footerContent}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop top bar with notifications */}
        <header className="hidden md:flex items-center justify-end h-14 px-6 border-b border-[var(--border-subtle)] bg-[var(--void)] shrink-0">
          <NotificationTray notificationsHref="/admin/notifications" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
