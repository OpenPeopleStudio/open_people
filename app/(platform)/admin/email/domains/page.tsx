import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailDomainsClient } from "./EmailDomainsClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Domains Page (Tenant Admin)
   Manage custom domains for email sending
   ═══════════════════════════════════════════════════════════════════════════ */

async function getDomainsData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get managed domains
  const { data: managedDomains } = await supabase
    .from("managed_email_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get legacy domains (if any)
  const { data: legacyDomains } = await supabase
    .from("email_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return {
    managedDomains: managedDomains || [],
    legacyDomains: legacyDomains || [],
  };
}

export default async function EmailDomainsPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("709_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getDomainsData(profile.tenant_id);

  return (
    <EmailDomainsClient
      managedDomains={data.managedDomains}
      legacyDomains={data.legacyDomains}
      tenantId={profile.tenant_id}
    />
  );
}
