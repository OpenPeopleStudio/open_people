import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EMAIL_PLANS } from "@/types/email";
import { EmailWorkspace } from "@/components/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Email Dashboard
   Full email workspace with inbox, compose, templates, and accounts
   ═══════════════════════════════════════════════════════════════════════════ */

async function getEmailData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription
  const { data: subscription } = await supabase
    .from("email_subscriptions")
    .select("tier, status, current_period_end")
    .eq("tenant_id", tenantId)
    .single();

  // Get email accounts
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  // Get recent messages
  const { data: messages } = await supabase
    .from("email_messages")
    .select("*, account:email_accounts(id, name, email_address)")
    .eq("tenant_id", tenantId)
    .eq("is_deleted", false)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  // Get templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get domains
  const { data: domains } = await supabase
    .from("email_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get recent logs
  const { data: recentLogs } = await supabase
    .from("email_logs")
    .select("*, template:email_templates(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get inbox stats
  const { data: messagesForStats } = await supabase
    .from("email_messages")
    .select("is_read, is_starred, is_archived, is_spam, is_deleted, direction, status")
    .eq("tenant_id", tenantId);

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
    subscription: subscription || { tier: "free", status: "active", current_period_end: null },
    accounts: accounts || [],
    messages: (messages || []).map((msg) => ({
      ...msg,
      account: Array.isArray(msg.account) ? msg.account[0] : msg.account,
    })),
    templates: templates || [],
    domains: domains || [],
    recentLogs: (recentLogs || []).map((log) => ({
      ...log,
      template: Array.isArray(log.template) ? log.template[0] : log.template,
    })),
    stats,
  };
}

export default async function EmailPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  // Get tenant slug for sender address
  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", profile.tenant_id)
    .single();

  const data = await getEmailData(profile.tenant_id);
  const plan = EMAIL_PLANS[data.subscription.tier as keyof typeof EMAIL_PLANS] || EMAIL_PLANS.free;

  return (
    <EmailWorkspace
      accounts={data.accounts}
      messages={data.messages}
      templates={data.templates}
      domains={data.domains}
      recentLogs={data.recentLogs}
      stats={data.stats}
      plan={plan}
      tenantSlug={tenant?.slug || ""}
      tenantId={profile.tenant_id}
      isSuperAdmin={false}
    />
  );
}
