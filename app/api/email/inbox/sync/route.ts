import { createSupabaseServer } from "@/lib/supabase/server";
import { fetchInboxEmails, parsedMessageToDbFormat } from "@/lib/email/providers";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Sync API
   POST /api/email/inbox/sync - Sync emails from provider
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, mailbox, limit, fullSync } = body;

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Get the account with credentials
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.sync_enabled) {
      return NextResponse.json({ error: "Sync is disabled for this account" }, { status: 400 });
    }

    // Fetch emails from provider
    // fullSync: true = fetch all emails (including read) from the beginning, and update existing
    const fetchResult = await fetchInboxEmails(account, {
      limit: limit || 50,
      sinceUID: fullSync ? undefined : (account.last_sync_uid || undefined),
      mailbox: mailbox || "INBOX",
      includeRead: fullSync || false,
    });

    if (!fetchResult.success) {
      // Update account with sync error
      await supabase
        .from("email_accounts")
        .update({
          last_sync_error: fetchResult.error,
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", accountId);

      return NextResponse.json({ error: fetchResult.error }, { status: 500 });
    }

    // Store new messages or update existing ones
    let newCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;

    for (const parsed of fetchResult.messages) {
      const messageData = parsedMessageToDbFormat(parsed, accountId, profile.tenant_id, "inbound");

      // Check for duplicate by message_id or provider_id
      if (parsed.messageId) {
        const { data: existing } = await supabase
          .from("email_messages")
          .select("id")
          .eq("account_id", accountId)
          .eq("message_id", parsed.messageId)
          .limit(1)
          .single();

        if (existing) {
          if (fullSync) {
            // In full sync mode, update existing messages
            const { error: updateError } = await supabase
              .from("email_messages")
              .update({
                is_read: messageData.is_read,
                is_starred: messageData.is_starred,
                is_deleted: messageData.is_deleted,
                mailbox: messageData.mailbox,
                // Keep the original received_at, but update other fields if needed
              })
              .eq("id", existing.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            duplicateCount++;
          }
          continue;
        }
      }

      const { error: insertError } = await supabase
        .from("email_messages")
        .insert(messageData);

      if (!insertError) {
        newCount++;
      }
    }

    // Update account sync status
    await supabase
      .from("email_accounts")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
        last_sync_uid: fetchResult.lastUID || account.last_sync_uid,
      })
      .eq("id", accountId);

    return NextResponse.json({
      success: true,
      fetched: fetchResult.messages.length,
      new: newCount,
      updated: updatedCount,
      duplicates: duplicateCount,
    });
  } catch (error) {
    console.error("Sync inbox error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
