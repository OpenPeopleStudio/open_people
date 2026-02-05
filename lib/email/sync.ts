import { createSupabaseAdmin } from "@/lib/supabase/server";
import { emailWorkspace } from "./workspace";
import { emailOAuth } from "./oauth";
import { fetchIMAPEmails } from "./imap";
import type { EmailAddress, EmailAttachmentMeta } from "@/types/email";

type ImapAccountRow = {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_user: string;
  imap_password_encrypted: string;
  imap_password_iv: string;
  last_sync_uid?: string | number | null;
};

type ParsedImapEmail = {
  message_id: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  text: string;
  html: string | null;
  date: string;
  attachments: EmailAttachmentMeta[];
  in_reply_to?: string;
  references: string[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   Email Sync Service
   Syncs emails from IMAP/POP3 accounts and external providers
   ═══════════════════════════════════════════════════════════════════════════ */

export class EmailSyncService {
  private supabase = createSupabaseAdmin();

  /**
   * Sync emails from IMAP account
   */
  async syncImapAccount(accountId: string, options: {
    fullSync?: boolean;
    maxEmails?: number;
  } = {}) {
    const { fullSync = false, maxEmails = 50 } = options;

    console.log("[Email Sync] Starting IMAP sync");

    try {
      // Get account details
      const { data: account, error: accountError } = await this.supabase
        .from("email_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (accountError || !account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      if (account.provider !== "imap" && account.provider !== "smtp_imap") {
        throw new Error(`Account ${accountId} is not configured for IMAP`);
      }

      // This would implement actual IMAP connection
      // For now, it's a placeholder showing the structure

      const syncedEmails = await this.performImapSync(account, {
        fullSync,
        maxEmails,
      });

      // Update last sync time
      await this.supabase
        .from("email_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);

      console.log(`[Email Sync] Completed IMAP sync. Synced ${syncedEmails} emails.`);

      return { success: true, synced: syncedEmails };

    } catch (error) {
      console.error("[Email Sync] IMAP sync failed:", error);

      // Update sync error
      await this.supabase
        .from("email_accounts")
        .update({
          last_sync_error: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);

      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Perform actual IMAP synchronization
   */
  private async performImapSync(account: ImapAccountRow, options: { fullSync: boolean; maxEmails: number }): Promise<number> {
    const { fullSync, maxEmails } = options;

    console.log("[Email Sync] Starting IMAP sync for account");

    let processed = 0;

    try {
      const config = {
        host: account.imap_host,
        port: account.imap_port,
        secure: account.imap_secure,
        user: account.imap_user,
        password: this.decryptPassword(account.imap_password_encrypted, account.imap_password_iv),
      };

      const sinceUID = !fullSync && account.last_sync_uid ? account.last_sync_uid.toString() : undefined;
      const fetchResult = await fetchIMAPEmails(config, {
        mailbox: "INBOX",
        limit: maxEmails,
        includeRead: true,
        ...(sinceUID ? { sinceUID } : {}),
        markSeen: false,
      });

      if (!fetchResult.success) {
        throw new Error(fetchResult.error || "IMAP fetch failed");
      }

      const sortedMessages = fetchResult.messages
        .slice()
        .sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

      for (const message of sortedMessages) {
        try {
          const emailData = this.parseImapMessage(message, account.id);

          const existingCheck = await this.supabase
            .from("email_messages")
            .select("id")
            .eq("provider_id", emailData.message_id)
            .single();

          if (existingCheck.data) {
            console.log("[Email Sync] Skipping already processed message");
            continue;
          }

          const webhookPayload = {
            type: "email.received",
            data: {
              email_id: emailData.message_id,
              message_id: emailData.message_id,
              from: emailData.from,
              to: emailData.to,
              cc: emailData.cc,
              subject: emailData.subject,
              text: emailData.text,
              html: emailData.html,
              created_at: emailData.date,
              attachments: emailData.attachments,
              in_reply_to: emailData.in_reply_to,
              references: emailData.references,
            },
          };

          const result = await emailWorkspace.processInboundWebhook(
            webhookPayload,
            "imap-sync-signature",
            "dummy-secret"
          );

          if (result.success) {
            processed++;
            console.log("[Email Sync] Successfully processed IMAP email");
          } else {
            console.error("[Email Sync] Failed to process IMAP email:", result.error);
          }
        } catch (error) {
          console.error("[Email Sync] Error processing IMAP message:", error);
        }
      }

      const maxUid = fetchResult.messages.reduce<number | null>((current, message) => {
        const uidValue = Number.parseInt(message.uid, 10);
        if (!Number.isFinite(uidValue)) return current;
        return current === null ? uidValue : Math.max(current, uidValue);
      }, null);

      const lastUid = fetchResult.lastUID || (maxUid !== null ? maxUid.toString() : undefined);
      if (lastUid) {
        await this.supabase
          .from("email_accounts")
          .update({ last_sync_uid: lastUid })
          .eq("id", account.id);
      }
    } catch (error) {
      console.error("[Email Sync] IMAP sync failed:", error);

      // Update sync error
      await this.supabase
        .from("email_accounts")
        .update({
          last_sync_error: error instanceof Error ? error.message : "Unknown IMAP error",
        })
        .eq("id", account.id);

      throw error;
    }

    return processed;
  }

  /**
   * Parse IMAP message into email format
   */
  private parseImapMessage(message: {
    uid: string;
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    subject?: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments: EmailAttachmentMeta[];
    date?: Date;
  }, accountId: string): ParsedImapEmail {
    const from = message.from?.email || "";
    const to = (message.to || []).map((entry) => entry.email).filter(Boolean);
    const cc = (message.cc || []).map((entry) => entry.email).filter(Boolean);
    const messageId = message.messageId;
    const subject = message.subject || "";
    const inReplyTo = message.inReplyTo;
    const references = message.references || [];

    const parsed: ParsedImapEmail = {
      message_id: messageId || `imap-${accountId}-${message.uid}`,
      from,
      to,
      cc,
      subject,
      text: message.bodyText || "",
      html: message.bodyHtml || null,
      date: message.date ? message.date.toISOString() : new Date().toISOString(),
      attachments: message.attachments || [],
      references,
    };

    if (inReplyTo) {
      parsed.in_reply_to = inReplyTo;
    }

    return parsed;
  }

  /**
   * Decrypt stored password
   */
  private decryptPassword(encrypted: string, iv: string): string {
    // Implementation would use your encryption utilities
    // For now, return as-is (assuming it's stored in plain text for testing)
    // In production, use proper decryption
    void iv;
    return encrypted;
  }

  /**
   * Sync emails from Gmail API (for OAuth-connected accounts)
   */
  async syncGmailAccount(accountId: string): Promise<{ success: boolean; synced?: number; error?: string }> {
    return await emailOAuth.syncGmailAccount(accountId);
  }

  /**
   * Sync emails from Outlook/Office 365
   */
  async syncOutlookAccount(accountId: string): Promise<{ success: boolean; synced?: number; error?: string }> {
    return await emailOAuth.syncOutlookAccount(accountId);
  }

  /**
   * Start periodic sync for all active accounts
   */
  async startPeriodicSync() {
    console.log("[Email Sync] Starting periodic sync for all accounts");

    try {
      // Get all accounts that need syncing
      const { data: accounts, error } = await this.supabase
        .from("email_accounts")
        .select("id, provider, sync_enabled, last_sync_at, sync_interval_minutes")
        .eq("sync_enabled", true)
        .eq("is_active", true);

      if (error) {
        console.error("[Email Sync] Error fetching accounts for sync:", error);
        return;
      }

      for (const account of accounts || []) {
        try {
          // Check if it's time to sync
          const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : new Date(0);
          const syncInterval = account.sync_interval_minutes || 5;
          const nextSync = new Date(lastSync.getTime() + syncInterval * 60 * 1000);

          if (nextSync > new Date()) {
            continue; // Not time to sync yet
          }

          // Perform sync based on provider
          switch (account.provider) {
            case "imap":
            case "smtp_imap":
              await this.syncImapAccount(account.id);
              break;
            case "gmail":
              await this.syncGmailAccount(account.id);
              break;
            case "outlook":
              await this.syncOutlookAccount(account.id);
              break;
            default:
              console.log("[Email Sync] Skipping account - provider not supported for sync");
          }

        } catch (accountError) {
          console.error("[Email Sync] Error syncing account:", accountError);
        }
      }

      console.log("[Email Sync] Periodic sync completed");

    } catch (error) {
      console.error("[Email Sync] Periodic sync failed:", error);
    }
  }
}

// Export singleton instance
export const emailSync = new EmailSyncService();
