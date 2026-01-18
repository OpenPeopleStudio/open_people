import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TenantProvider } from "@/context/TenantContext";
import { getTenantFromHeaders, isMarketingDomain } from "@/lib/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Platform Layout
   
   This layout wraps all tenant-specific routes. It:
   1. Resolves the tenant from the request host
   2. Redirects to marketing if on a marketing domain
   3. Provides tenant context to all child routes
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const host = headerStore.get("host") || "";

  // If somehow we're on a marketing domain, redirect to marketing
  if (isMarketingDomain(host)) {
    redirect("/");
  }

  // Resolve tenant from host
  const tenant = await getTenantFromHeaders(headerStore);

  // If no tenant found and not on marketing domain, show error
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--void)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Store not found
          </h1>
          <p className="text-[var(--text-secondary)]">
            The store you&apos;re looking for doesn&apos;t exist or has been
            deactivated.
          </p>
        </div>
      </div>
    );
  }

  // Check tenant status
  if (tenant.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--void)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Store suspended
          </h1>
          <p className="text-[var(--text-secondary)]">
            This store has been temporarily suspended. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return <TenantProvider tenant={tenant}>{children}</TenantProvider>;
}
