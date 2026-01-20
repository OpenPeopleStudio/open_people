import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailAccountsClient } from "./EmailAccountsClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Accounts Page (Tenant Admin)
   Dedicated page for email account management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getAccountsData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get email accounts
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, managed_domain_id, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  // Get managed domains
  const { data: managedDomains } = await supabase
    .from("managed_email_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return {
    accounts: accounts || [],
    managedDomains: managedDomains || [],
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

  const { data: profile } = await supabase
    .from("709_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getAccountsData(profile.tenant_id);

  return (
    <EmailAccountsClient
      accounts={data.accounts}
      managedDomains={data.managedDomains}
      tenantId={profile.tenant_id}
    />
  );
}
