import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminEmailDomainsClient } from "./SuperAdminEmailDomainsClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Domains Page (Super Admin)
   Platform-wide domain management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getDomainsData() {
  const supabase = await createSupabaseServer();

  // Get all managed domains
  const { data: managedDomains } = await supabase
    .from("managed_email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  // Get tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  return {
    managedDomains: managedDomains || [],
    tenants: tenants || [],
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

  // Verify super admin access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/login");
  }

  const data = await getDomainsData();

  return (
    <SuperAdminEmailDomainsClient
      managedDomains={data.managedDomains}
      tenants={data.tenants}
    />
  );
}
