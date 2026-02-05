import { createResendClient } from "./resend";
import { EmailWorkspaceService } from "./workspace";

type ResendClient = ReturnType<typeof createResendClient>;

type ResendEmailListItem = {
  id: string;
  to?: string[];
  created_at: string;
};

type ResendEmailListResponse = {
  data?: ResendEmailListItem[];
  next?: string;
};

type ResendReceivingEmail = {
  message_id?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  created_at?: string;
  attachments?: unknown[];
  in_reply_to?: string;
  references?: string[];
};

type ForwardedEmail = {
  id?: string;
  message_id?: string;
  from?: string;
  to?: string[];
  subject?: string;
  text?: string;
  html?: string;
  date?: string;
  created_at?: string;
  attachments?: unknown[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   Email Backfill Service
   Imports historical emails from Resend and other providers
   ═══════════════════════════════════════════════════════════════════════════ */

export class EmailBackfillService {
  private workspace = new EmailWorkspaceService();

  /**
   * Backfill emails from Resend for all managed domains
   */
  async backfillResendEmails(options: {
    tenantId?: string;
    domain?: string;
    daysBack?: number;
    batchSize?: number;
  } = {}) {
    const { tenantId, domain, daysBack = 30, batchSize = 50 } = options;

    console.log("[Email Backfill] Starting Resend backfill");

    try {
      const resend = createResendClient();

      // Get domains to backfill
      const domainsToProcess = await this.getDomainsToBackfill(tenantId, domain);

      let totalProcessed = 0;

      for (const domainInfo of domainsToProcess) {
        console.log("[Email Backfill] Processing managed domain");

        const emails = await this.fetchResendEmailsForDomain(resend, domainInfo.domain, daysBack, batchSize);

        for (const email of emails) {
          try {
            // Fetch full email content using the receiving API
            console.log("[Email Backfill] Fetching full email content");

            const { data: fullEmail, error: fetchError } = await resend.emails.receiving.get(email.id);

            if (fetchError) {
              console.error("[Email Backfill] Failed to fetch full email:", fetchError);
              continue;
            }
            if (!fullEmail) {
              continue;
            }

            const received = fullEmail as ResendReceivingEmail;

            // Create webhook payload with full content
            const inReplyTo =
              "in_reply_to" in received ? received.in_reply_to : undefined;
            const references =
              "references" in received ? received.references : undefined;

            const webhookPayload = {
              type: "email.received",
              data: {
                email_id: email.id,
                message_id: received.message_id || email.id,
                from: received.from,
                to: received.to,
                cc: received.cc,
                subject: received.subject,
                text: received.text,
                html: received.html,
                created_at: received.created_at,
                attachments: received.attachments || [],
                ...(inReplyTo ? { in_reply_to: inReplyTo } : {}),
                ...(references ? { references } : {}),
              },
            };

            const result = await this.workspace.processInboundWebhook(
              webhookPayload,
              "backfill-signature", // Skip signature verification for backfill
              "dummy-secret"
            );

            if (result.success) {
              totalProcessed++;
              console.log("[Email Backfill] Successfully processed email");
            } else {
              console.error("[Email Backfill] Failed to process email:", result.error);
            }

            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error("[Email Backfill] Error processing email:", error);
          }
        }
      }

      console.log(`[Email Backfill] Completed. Processed ${totalProcessed} emails.`);
      return { success: true, processed: totalProcessed };

    } catch (error) {
      console.error("[Email Backfill] Failed:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Fetch emails from Resend API for a specific domain
   * Uses Resend's receiving API to get historical emails
   */
  private async fetchResendEmailsForDomain(
    resend: ResendClient,
    domain: string,
    daysBack: number,
    batchSize: number
  ): Promise<ResendEmailListItem[]> {
    const emails: ResendEmailListItem[] = [];
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    console.log("[Email Backfill] Fetching received emails");

    try {
      let hasMore = true;
      let cursor: string | undefined;

      while (hasMore && emails.length < 1000) { // Safety limit
        const params: { limit: number; cursor?: string } = {
          limit: Math.min(batchSize, 100), // Resend limit is 100
        };

        if (cursor) {
          params.cursor = cursor;
        }

        console.log("[Email Backfill] Fetching batch");

        // Use Resend's receiving API
        const { data, error } = await resend.emails.receiving.list(params) as {
          data?: ResendEmailListResponse;
          error?: { message?: string } | null;
        };

        if (error) {
          console.error("[Email Backfill] Error fetching emails:", error);
          break;
        }

        if (data?.data && Array.isArray(data.data)) {
          // Filter emails for our domain and date range
          const domainEmails = data.data.filter((email) => {
            const emailDomain = email.to?.[0]?.split('@')[1];
            const emailDate = new Date(email.created_at);

            return emailDomain === domain && emailDate >= cutoffDate;
          });

          emails.push(...domainEmails);

          console.log(`[Email Backfill] Found ${domainEmails.length} emails in this batch`);

          // Check if there are more pages
          if (data.next && emails.length < 1000) {
            cursor = data.next;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error("[Email Backfill] Error fetching emails:", error);
    }

    console.log(`[Email Backfill] Total emails found: ${emails.length}`);
    return emails;
  }

  /**
   * Alternative: Backfill from email forwarding or manual import
   */
  async backfillFromForwardedEmails(tenantId: string, emailData: ForwardedEmail[]) {
    console.log(`[Email Backfill] Processing ${emailData.length} forwarded emails`);
    void tenantId;

    let processed = 0;

    for (const email of emailData) {
      try {
        // Convert forwarded email format to webhook payload
        const webhookPayload = {
          type: "email.received",
          data: {
            email_id: email.id || `forwarded-${Date.now()}-${Math.random()}`,
            message_id: email.message_id || `msg-${Date.now()}`,
            from: email.from,
            to: email.to,
            subject: email.subject,
            text: email.text,
            html: email.html,
            created_at: email.date || email.created_at || new Date().toISOString(),
            attachments: email.attachments || [],
          },
        };

        const result = await this.workspace.processInboundWebhook(
          webhookPayload,
          "forwarded-signature",
          "dummy-secret"
        );

        if (result.success) {
          processed++;
        }

      } catch (error) {
        console.error("[Email Backfill] Error processing forwarded email:", error);
      }
    }

    return { success: true, processed };
  }

  /**
   * Get domains that need backfilling
   */
  private async getDomainsToBackfill(
    tenantId?: string,
    domain?: string
  ): Promise<Array<{ domain: string; tenant_id: string }>> {
    // This would query the database for domains to backfill
    // For now, return a placeholder
    void tenantId;
    void domain;
    return [
      // This should be replaced with actual database query
      // SELECT domain, tenant_id FROM managed_email_domains WHERE status = 'verified'
    ];
  }

  /**
   * Backfill emails from IMAP/POP3 accounts
   */
  async backfillImapEmails(accountId: string, options: {
    daysBack?: number;
    batchSize?: number;
  } = {}) {
    // Implementation for IMAP/POP3 backfill would go here
    // This would connect to IMAP servers and fetch historical emails
    void accountId;
    void options;
    console.log("[Email Backfill] IMAP backfill not implemented yet for account");
    return { success: false, error: "IMAP backfill not implemented" };
  }
}

// Export singleton instance
export const emailBackfill = new EmailBackfillService();
