import { headers } from "next/headers";
import { getTenantFromHeaders } from "@/lib/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Shop Page
   
   This is the main storefront page for individual tenants.
   In production, this would be replaced with the full shop experience
   from the 709exclusive codebase.
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function TenantShopPage() {
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
              className="text-sm text-[var(--electric-lime)] font-medium"
            >
              Shop
            </a>
            <a
              href="/account"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Account
            </a>
            <a
              href="/cart"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cart
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display text-[var(--text-primary)] mb-6">
            {tenant.settings.content?.hero?.headline || `Welcome to ${brandName}`}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            {tenant.settings.content?.hero?.subhead ||
              "Discover our curated collection of authentic products."}
          </p>
        </div>
      </section>

      {/* Products placeholder */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-8">
            Featured Products
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Placeholder product cards */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden"
              >
                <div className="aspect-square bg-[var(--surface-2)] flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Brand</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    Product Name
                  </p>
                  <p className="text-sm text-[var(--electric-lime)] font-semibold">
                    $199
                  </p>
                </div>
              </div>
            ))}
          </div>
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
