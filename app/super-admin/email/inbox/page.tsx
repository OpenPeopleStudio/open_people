import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminEmailInboxClient } from "./SuperAdminEmailInboxClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Page (Super Admin)
   Platform-wide inbox monitoring and email management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getInboxData() {
  const supabase = await createSupabaseServer();

  // Get all email accounts across tenants
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
    .order("created_at", { ascending: false });

  // Get recent messages across all tenants
  const { data: messages } = await supabase
    .from("email_messages")
    .select("*, account:email_accounts(id, name, email_address)")
    .eq("is_deleted", false)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Get tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("status", "active")
    .order("name");

  // Compute stats
  const stats = {
    total_messages: 0,
    unread_messages: 0,
    starred_messages: 0,
    draft_messages: 0,
    sent_messages: 0,
    spam_messages: 0,
    archived_messages: 0,
  };

  for (const msg of messages || []) {
    stats.total_messages++;
    if (!msg.is_read && msg.direction === "inbound") stats.unread_messages++;
    if (msg.is_starred) stats.starred_messages++;
    if (msg.is_archived) stats.archived_messages++;
    if (msg.is_spam) stats.spam_messages++;
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
    stats,
    tenants: tenants || [],
  };
}

export default async function EmailInboxPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify super admin access
  const { data: profile } = await supabase
    .from("709_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/login");
  }

  const data = await getInboxData();

  return (
    <SuperAdminEmailInboxClient
      accounts={data.accounts}
      messages={data.messages}
      stats={data.stats}
      tenants={data.tenants}
    />
  );
}
