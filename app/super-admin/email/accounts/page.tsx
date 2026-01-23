import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminEmailAccountsClient } from "./SuperAdminEmailAccountsClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Accounts Page (Super Admin)
   Platform-wide email account management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getAccountsData() {
  // Use admin client to bypass RLS - super admin can see all accounts including platform-level (tenant_id = null)
  const supabase = await createSupabaseAdmin();

  // Get all email accounts across tenants (for super admin)
  const { data: accounts, error: accountsError } = await supabase
    .from("email_accounts")
    .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, managed_domain_id, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (accountsError) {
    console.error("[getAccountsData] Error fetching accounts:", accountsError);
  }
  console.log("[getAccountsData] Found accounts:", accounts?.length || 0);

  // Get managed domains
  const { data: managedDomains } = await supabase
    .from("managed_email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  // Get tenants for filtering/display
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  return {
    accounts: accounts || [],
    managedDomains: managedDomains || [],
    tenants: tenants || [],
  };
}

export default async function EmailAccountsPage() {
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

  const data = await getAccountsData();

  return (
    <SuperAdminEmailAccountsClient
      accounts={data.accounts}
      managedDomains={data.managedDomains}
      tenants={data.tenants}
    />
  );
}
