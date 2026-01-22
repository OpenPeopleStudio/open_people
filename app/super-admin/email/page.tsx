import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { EMAIL_PLANS } from "@/types/email";
import { EmailWorkspace } from "@/components/email";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Email Platform
   Full email workspace for platform administration
   
   Note: Email analytics have been moved to the Analytics page
   ═══════════════════════════════════════════════════════════════════════════ */

async function getEmailData() {
  // Use admin client to bypass RLS - super admin can see all accounts including platform-level
  const supabase = await createSupabaseAdmin();

  // For super-admin, we show a platform-level view
  // Get all email accounts across tenants (for overview)
  const { data: accounts, error: accountsError } = await supabase
    .from("email_accounts")
    .select(
      "id, tenant_id, name, email_address, is_default, is_active, provider, mode, managed_domain_id, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  console.log("[getEmailData] Accounts query:", { count: accounts?.length, error: accountsError?.message });

  // Get recent messages across platform
  const { data: messages } = await supabase
    .from("email_messages")
    .select("*, account:email_accounts(id, name, email_address)")
    .eq("is_deleted", false)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  // Get all templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get all domains
  const { data: domains } = await supabase
    .from("email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  // Get managed domains (for DNS-only email)
  const { data: managedDomains } = await supabase
    .from("managed_email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  // Get recent logs
  const { data: recentLogs } = await supabase
    .from("email_logs")
    .select("*, template:email_templates(name)")
    .order("created_at", { ascending: false })
    .limit(30);

  // Get aggregate stats
  const { data: messagesForStats } = await supabase
    .from("email_messages")
    .select("is_read, is_starred, is_archived, is_spam, is_deleted, direction, status");

  const stats = {
    total_messages: 0,
    unread_messages: 0,
    starred_messages: 0,
    draft_messages: 0,
    sent_messages: 0,
    spam_messages: 0,
    archived_messages: 0,
  };

  for (const msg of messagesForStats || []) {
    if (!msg.is_deleted) {
      stats.total_messages++;
      if (!msg.is_read && msg.direction === "inbound") stats.unread_messages++;
      if (msg.is_starred) stats.starred_messages++;
      if (msg.is_archived) stats.archived_messages++;
      if (msg.is_spam) stats.spam_messages++;
    }
    if (msg.status === "draft") stats.draft_messages++;
    if (msg.direction === "outbound" && ["sent", "delivered"].includes(msg.status)) {
      stats.sent_messages++;
    }
  }

  return {
    accounts: accounts || [],
    messages: (messages || []).map((msg) => ({
      ...msg,
      account: Array.isArray(msg.account) ? msg.account[0] : msg.account,
    })),
    templates: templates || [],
    domains: domains || [],
    managedDomains: managedDomains || [],
    recentLogs: (recentLogs || []).map((log) => ({
      ...log,
      template: Array.isArray(log.template) ? log.template[0] : log.template,
    })),
    stats,
  };
}

export default async function SuperAdminEmailPage() {
  const supabase = await createSupabaseServer();
  
  // Get current user and their profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get profile to check tenant_id (super admins might still have a tenant)
  let tenantId: string | undefined;
  let tenantSlug = "platform";
  
  if (user) {
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    
    if (profile?.tenant_id) {
      tenantId = profile.tenant_id;
      // Get tenant slug
      const { data: tenant } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .single();
      
      if (tenant?.slug) {
        tenantSlug = tenant.slug;
      }
    }
  }

  const data = await getEmailData();
  const plan = EMAIL_PLANS.enterprise; // Super admin has full access

  return (
    <div className="flex flex-col h-screen">
      {/* Header with link to analytics */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Email Platform
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Send emails, manage accounts, and view inbox
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/email/campaigns"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
            </svg>
            Campaign drafts
          </Link>
          <Link
            href="/super-admin/analytics"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Email Analytics
          </Link>
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
            Platform Admin
          </span>
        </div>
      </div>

      {/* Email Workspace */}
      <div className="flex-1">
        <EmailWorkspace
          accounts={data.accounts}
          messages={data.messages}
          templates={data.templates}
          domains={data.domains}
          managedDomains={data.managedDomains}
          recentLogs={data.recentLogs}
          stats={data.stats}
          plan={plan}
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          isSuperAdmin={true}
        />
      </div>
    </div>
  );
}
