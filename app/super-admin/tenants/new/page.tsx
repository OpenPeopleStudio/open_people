"use client";

import { useRouter } from "next/navigation";
import { TenantWizard } from "@/components/super-admin/TenantWizard";

/* ═══════════════════════════════════════════════════════════════════════════
   Create New Tenant Page
   Multi-step tenant creation wizard
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CreateTenantPage() {
  const router = useRouter();

  const handleTenantCreated = (tenantId: string) => {
    router.push(`/super-admin/tenants/${tenantId}`);
  };

  const handleCancel = () => {
    router.push('/super-admin/tenants');
  };

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <TenantWizard
        onComplete={handleTenantCreated}
        onCancel={handleCancel}
      />
    </div>
  );
}
