import { createSupabaseAdmin } from "@/lib/supabase/server";
import { emailWorkspace } from "./workspace";
import { emailOAuth } from "./oauth";
import * as imap from "imap-simple";

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

    console.log(`[Email Sync] Starting IMAP sync for account: ${accountId}`);

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

      console.log(`[Email Sync] Completed IMAP sync for ${accountId}. Synced ${syncedEmails} emails.`);

      return { success: true, synced: syncedEmails };

    } catch (error) {
      console.error(`[Email Sync] IMAP sync failed for account ${accountId}:`, error);

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
  private async performImapSync(account: any, options: { fullSync: boolean; maxEmails: number }): Promise<number> {
    const { fullSync, maxEmails } = options;

    console.log(`[Email Sync] Starting IMAP sync for account: ${account.email_address}`);
    console.log(`[Email Sync] Connecting to: ${account.imap_host}:${account.imap_port}`);

    let processed = 0;

    try {
      // IMAP connection config
      const config = {
        imap: {
          user: account.imap_user,
          password: this.decryptPassword(account.imap_password_encrypted, account.imap_password_iv),
          host: account.imap_host,
          port: account.imap_port,
          tls: account.imap_secure,
          tlsOptions: {
            rejectUnauthorized: false, // For self-signed certificates
          },
          authTimeout: 30000,
        },
      };

      console.log(`[Email Sync] Connecting to IMAP server...`);

      // Connect to IMAP server
      const connection = await imap.connect(config);

      try {
        // Open INBOX mailbox
        await connection.openBox("INBOX");
        console.log(`[Email Sync] Opened INBOX for ${account.email_address}`);

        // Get mailbox info
        const box = connection.imap.box;
        console.log(`[Email Sync] Mailbox has ${box.messages.total} total messages`);

        // Determine which messages to fetch
        let fetchRange: string;

        if (fullSync || !account.last_sync_uid) {
          // Fetch recent messages (last maxEmails)
          const startSeq = Math.max(1, box.messages.total - maxEmails + 1);
          fetchRange = `${startSeq}:${box.messages.total}`;
          console.log(`[Email Sync] Full sync: fetching messages ${startSeq} to ${box.messages.total}`);
        } else {
          // Fetch messages since last sync UID
          fetchRange = `${account.last_sync_uid}:*`;
          console.log(`[Email Sync] Incremental sync: fetching from UID ${account.last_sync_uid}`);
        }

        // Search for messages in range
        const searchCriteria = ["ALL"];
        const fetchOptions = {
          bodies: ["HEADER", "TEXT"],
          markSeen: false, // Don't mark as read
          struct: true,    // Include structure info for attachments
        };

        console.log(`[Email Sync] Searching for messages with criteria:`, searchCriteria);

        const messages = await connection.search(searchCriteria, fetchOptions);

        console.log(`[Email Sync] Found ${messages.length} messages to process`);

        // Sort messages by date (newest first) and limit
        const sortedMessages = messages
          .sort((a: any, b: any) => {
            const dateA = new Date(a.parts[0].body.date || 0);
            const dateB = new Date(b.parts[0].body.date || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, maxEmails);

        // Process each message
        for (const message of sortedMessages) {
          try {
            const emailData = this.parseImapMessage(message);

            // Skip if we already processed this message
            const existingCheck = await this.supabase
              .from("email_messages")
              .select("id")
              .eq("provider_id", emailData.message_id)
              .single();

            if (existingCheck.data) {
              console.log(`[Email Sync] Skipping already processed message: ${emailData.message_id}`);
              continue;
            }

            // Process through email workspace
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
              console.log(`[Email Sync] Successfully processed IMAP email: ${emailData.message_id}`);
            } else {
              console.error(`[Email Sync] Failed to process IMAP email ${emailData.message_id}:`, result.error);
            }

          } catch (error) {
            console.error(`[Email Sync] Error processing IMAP message:`, error);
          }
        }

        // Update last sync UID
        const lastMessage = sortedMessages[0];
        if (lastMessage) {
          const lastUid = lastMessage.attributes.uid;
          await this.supabase
            .from("email_accounts")
            .update({ last_sync_uid: lastUid.toString() })
            .eq("id", account.id);
        }

      } finally {
        // Close connection
        connection.end();
        console.log(`[Email Sync] Closed IMAP connection for ${account.email_address}`);
      }

    } catch (error) {
      console.error(`[Email Sync] IMAP sync failed for ${account.email_address}:`, error);

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
  private parseImapMessage(message: any): any {
    const header = message.parts[0].body;
    const text = message.parts[1]?.body || "";

    // Parse email addresses
    const parseAddress = (addr: string) => {
      if (!addr) return "";
      const match = addr.match(/<([^>]+)>/);
      return match ? match[1] : addr;
    };

    const from = Array.isArray(header.from) ? header.from[0] : header.from;
    const to = Array.isArray(header.to) ? header.to.map(parseAddress) : [parseAddress(header.to)];
    const cc = header.cc ? (Array.isArray(header.cc) ? header.cc.map(parseAddress) : [parseAddress(header.cc)]) : [];

    return {
      message_id: header["message-id"]?.[0] || `imap-${Date.now()}`,
      from: parseAddress(from),
      to: to,
      cc: cc,
      subject: header.subject?.[0] || "",
      text: text,
      html: null, // IMAP simple doesn't parse HTML by default
      date: header.date?.[0] ? new Date(header.date[0]).toISOString() : new Date().toISOString(),
      attachments: [], // Would need additional parsing for attachments
      in_reply_to: header["in-reply-to"]?.[0],
      references: header.references?.[0]?.split(/\s+/) || [],
    };
  }

  /**
   * Decrypt stored password
   */
  private decryptPassword(encrypted: string, iv: string): string {
    // Implementation would use your encryption utilities
    // For now, return as-is (assuming it's stored in plain text for testing)
    // In production, use proper decryption
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
              console.log(`[Email Sync] Skipping account ${account.id} - provider ${account.provider} not supported for sync`);
          }

        } catch (accountError) {
          console.error(`[Email Sync] Error syncing account ${account.id}:`, accountError);
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
