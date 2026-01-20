import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailInboxClient } from "./EmailInboxClient";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Page (Tenant Admin)
   Unified inbox view for all email accounts
   ═══════════════════════════════════════════════════════════════════════════ */

async function getInboxData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get email accounts
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
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
    .limit(100);

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
    accounts: accounts || [],
    messages: (messages || []).map((msg) => ({
      ...msg,
      account: Array.isArray(msg.account) ? msg.account[0] : msg.account,
    })),
    stats,
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

  const { data: profile } = await supabase
    .from("709_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getInboxData(profile.tenant_id);

  return (
    <EmailInboxClient
      accounts={data.accounts}
      messages={data.messages}
      stats={data.stats}
      tenantId={profile.tenant_id}
    />
  );
}
