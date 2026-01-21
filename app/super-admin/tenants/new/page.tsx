"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TenantWizard } from "@/components/super-admin/TenantWizard";

/* ═══════════════════════════════════════════════════════════════════════════
   Create New Tenant Page
   Multi-step tenant creation wizard
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CreateTenantPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(true);

  const handleTenantCreated = (tenantId: string) => {
    router.push(`/super-admin/tenants/${tenantId}`);
  };

  const handleCancel = () => {
    router.push('/super-admin/tenants');
  };

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      {showWizard ? (
        <TenantWizard
          onComplete={handleTenantCreated}
          onCancel={handleCancel}
        />
      ) : (
        <div className="p-8">
          <Link
            href="/super-admin/tenants"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← Back to tenants
          </Link>
        </div>
      )}
    </div>
  );
}
