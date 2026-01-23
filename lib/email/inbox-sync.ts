import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchInboxEmails, parsedMessageToDbFormat } from "@/lib/email/providers";
import { emailOAuth } from "@/lib/email/oauth";

type EmailAccountRecord = {
  id: string;
  tenant_id: string;
  provider?: string | null;
  sync_enabled?: boolean | null;
  last_sync_uid?: string | null;
  [key: string]: unknown;
};

type SyncInboxOptions = {
  limit?: number;
  mailbox?: string;
  fullSync?: boolean;
};

export type SyncInboxResult = {
  success: boolean;
  fetched?: number;
  new?: number;
  updated?: number;
  duplicates?: number;
  lastUID?: string;
  error?: string;
};

export async function syncInboxForAccount(
  supabase: SupabaseClient,
  account: EmailAccountRecord,
  tenantId: string,
  options: SyncInboxOptions = {}
): Promise<SyncInboxResult> {
  const { limit = 50, mailbox = "INBOX", fullSync = false } = options;

  if (account.tenant_id !== tenantId) {
    return { success: false, error: "Account tenant mismatch" };
  }

  if (account.sync_enabled === false) {
    return { success: false, error: "Sync is disabled for this account" };
  }

  const provider = account.provider;
  if (provider === "gmail") {
    const result = await emailOAuth.syncGmailAccount(account.id);
    if (!result.success) {
      return { success: false, error: result.error || "Gmail sync failed" };
    }
    await supabase
      .from("email_accounts")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
      })
      .eq("id", account.id);
    return { success: true, fetched: result.synced || 0, new: result.synced || 0, updated: 0, duplicates: 0 };
  }

  if (provider === "outlook") {
    const result = await emailOAuth.syncOutlookAccount(account.id);
    if (!result.success) {
      return { success: false, error: result.error || "Outlook sync failed" };
    }
    await supabase
      .from("email_accounts")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
      })
      .eq("id", account.id);
    return { success: true, fetched: result.synced || 0, new: result.synced || 0, updated: 0, duplicates: 0 };
  }

  if (provider === "managed" || provider === "resend") {
    return { success: true, fetched: 0, new: 0, updated: 0, duplicates: 0 };
  }

  const fetchOptions: { limit?: number; since?: Date; sinceUID?: string; mailbox?: string; includeRead?: boolean } = {
    limit,
    mailbox,
    includeRead: fullSync || false,
  };
  if (!fullSync && account.last_sync_uid) {
    fetchOptions.sinceUID = account.last_sync_uid;
  }
  const fetchResult = await fetchInboxEmails(account, fetchOptions);

  if (!fetchResult.success) {
    await supabase
      .from("email_accounts")
      .update({
        last_sync_error: fetchResult.error,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    const errorMessage = fetchResult.error ?? "Inbox fetch failed";
    return { success: false, error: errorMessage };
  }

  const messages = fetchResult.messages || [];
  const messageIds = messages.map((parsed) => parsed.messageId).filter(Boolean) as string[];
  const providerKeys = messages.map((parsed) => `${parsed.uid}:${parsed.mailbox}`);

  const existingByMessageId = new Set<string>();
  const existingByProviderKey = new Set<string>();

  if (messageIds.length > 0) {
    const { data: existingByMessage } = await supabase
      .from("email_messages")
      .select("message_id")
      .eq("account_id", account.id)
      .in("message_id", messageIds);

    for (const row of existingByMessage || []) {
      if (row.message_id) existingByMessageId.add(row.message_id);
    }
  }

  if (providerKeys.length > 0) {
    const providerIds = messages.map((parsed) => parsed.uid);
    const { data: existingByProvider } = await supabase
      .from("email_messages")
      .select("provider_id, mailbox")
      .eq("account_id", account.id)
      .in("provider_id", providerIds);

    for (const row of existingByProvider || []) {
      if (row.provider_id && row.mailbox) {
        existingByProviderKey.add(`${row.provider_id}:${row.mailbox}`);
      }
    }
  }

  const insertsByMessageId: Record<string, unknown>[] = [];
  const insertsByProvider: Record<string, unknown>[] = [];
  let newCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;

  for (const parsed of messages) {
    const providerKey = `${parsed.uid}:${parsed.mailbox}`;
    const hasMessageId = Boolean(parsed.messageId);
    const exists =
      (hasMessageId && parsed.messageId ? existingByMessageId.has(parsed.messageId) : false) ||
      existingByProviderKey.has(providerKey);

    if (!fullSync && exists) {
      duplicateCount++;
      continue;
    }

    const messageData = parsedMessageToDbFormat(parsed, account.id, tenantId, "inbound");
    if (exists) {
      updatedCount++;
    } else {
      newCount++;
    }

    if (hasMessageId) {
      insertsByMessageId.push(messageData);
    } else {
      insertsByProvider.push(messageData);
    }
  }

  if (insertsByMessageId.length > 0) {
    await supabase
      .from("email_messages")
      .upsert(insertsByMessageId, { onConflict: "account_id,message_id" });
  }

  if (insertsByProvider.length > 0) {
    await supabase
      .from("email_messages")
      .upsert(insertsByProvider, { onConflict: "account_id,provider_id,mailbox" });
  }

  await supabase
    .from("email_accounts")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
      last_sync_uid: fetchResult.lastUID || account.last_sync_uid,
    })
    .eq("id", account.id);

  return {
    success: true,
    fetched: messages.length,
    new: newCount,
    updated: updatedCount,
    duplicates: duplicateCount,
    ...(fetchResult.lastUID ? { lastUID: fetchResult.lastUID } : {}),
  };
}
