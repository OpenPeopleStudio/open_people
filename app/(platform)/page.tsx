import { headers } from "next/headers";
import { getTenantFromHeaders } from "@/lib/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Home Page
   
   This is the landing page for individual tenant storefronts.
   In production, this would be replaced with the full shop experience
   from the 709exclusive codebase.
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function TenantHomePage() {
  const headerStore = await headers();
  const tenant = await getTenantFromHeaders(headerStore);

  if (!tenant) {
    return null; // Layout handles this case
  }

  const brandName = tenant.settings.theme?.brand_name || tenant.name;

  return (
    <div className="min-h-screen bg-[var(--void)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center">
              <span className="text-[var(--void)] font-bold text-sm">
                {brandName.charAt(0)}
              </span>
            </div>
            <span className="font-semibold text-[var(--text-primary)]">
              {brandName}
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/shop"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Shop
            </a>
            <a
              href="/account"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Account
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-display text-[var(--text-primary)] mb-6">
            {tenant.settings.content?.hero?.headline || `Welcome to ${brandName}`}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            {tenant.settings.content?.hero?.subhead ||
              "Discover our curated collection of authentic products."}
          </p>
          <a
            href={tenant.settings.content?.hero?.primary_cta?.href || "/shop"}
            className="btn-primary inline-flex"
          >
            {tenant.settings.content?.hero?.primary_cta?.label || "Shop now"}
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
          </a>
        </div>
      </section>

      {/* Tenant Info (Debug) */}
      <section className="py-12 border-t border-[var(--border-subtle)]">
        <div className="container mx-auto px-6">
          <div className="glass-card p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Tenant Context (Debug)
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Tenant ID</dt>
                <dd className="text-[var(--text-secondary)] font-mono">
                  {tenant.id}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Slug</dt>
                <dd className="text-[var(--text-secondary)]">{tenant.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Name</dt>
                <dd className="text-[var(--text-secondary)]">{tenant.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Status</dt>
                <dd className="text-[var(--success)]">{tenant.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Primary Domain</dt>
                <dd className="text-[var(--text-secondary)]">
                  {tenant.primary_domain || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
