import { createResendClient } from "./resend";
import { EmailWorkspaceService } from "./workspace";

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

    console.log(`[Email Backfill] Starting Resend backfill`, { tenantId, domain, daysBack, batchSize });

    try {
      const resend = createResendClient();

      // Get domains to backfill
      const domainsToProcess = await this.getDomainsToBackfill(tenantId, domain);

      let totalProcessed = 0;

      for (const domainInfo of domainsToProcess) {
        console.log(`[Email Backfill] Processing domain: ${domainInfo.domain} for tenant: ${domainInfo.tenant_id}`);

        const emails = await this.fetchResendEmailsForDomain(resend, domainInfo.domain, daysBack, batchSize);

        for (const email of emails) {
          try {
            // Fetch full email content using the receiving API
            console.log(`[Email Backfill] Fetching full content for email: ${email.id}`);

            const { data: fullEmail, error: fetchError } = await resend.emails.receiving.get(email.id);

            if (fetchError) {
              console.error(`[Email Backfill] Failed to fetch full email ${email.id}:`, fetchError);
              continue;
            }

            // Create webhook payload with full content
            const webhookPayload = {
              type: "email.received",
              data: {
                email_id: email.id,
                message_id: fullEmail.message_id || email.id,
                from: fullEmail.from,
                to: fullEmail.to,
                cc: fullEmail.cc,
                subject: fullEmail.subject,
                text: fullEmail.text,
                html: fullEmail.html,
                created_at: fullEmail.created_at,
                attachments: fullEmail.attachments || [],
                in_reply_to: fullEmail.in_reply_to,
                references: fullEmail.references,
              },
            };

            const result = await this.workspace.processInboundWebhook(
              webhookPayload,
              "backfill-signature", // Skip signature verification for backfill
              "dummy-secret"
            );

            if (result.success) {
              totalProcessed++;
              console.log(`[Email Backfill] Successfully processed email: ${email.id}`);
            } else {
              console.error(`[Email Backfill] Failed to process email ${email.id}:`, result.error);
            }

            // Small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error(`[Email Backfill] Error processing email ${email.id}:`, error);
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
    resend: any,
    domain: string,
    daysBack: number,
    batchSize: number
  ): Promise<any[]> {
    const emails: any[] = [];
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    console.log(`[Email Backfill] Fetching received emails for domain: ${domain}, days back: ${daysBack}`);

    try {
      let hasMore = true;
      let cursor: string | undefined;

      while (hasMore && emails.length < 1000) { // Safety limit
        const params: any = {
          limit: Math.min(batchSize, 100), // Resend limit is 100
        };

        if (cursor) {
          params.cursor = cursor;
        }

        console.log(`[Email Backfill] Fetching batch with params:`, params);

        // Use Resend's receiving API
        const { data, error } = await resend.emails.receiving.list(params);

        if (error) {
          console.error(`[Email Backfill] Error fetching emails for ${domain}:`, error);
          break;
        }

        if (data?.data && Array.isArray(data.data)) {
          // Filter emails for our domain and date range
          const domainEmails = data.data.filter((email: any) => {
            const emailDomain = email.to?.[0]?.split('@')[1];
            const emailDate = new Date(email.created_at);

            return emailDomain === domain && emailDate >= cutoffDate;
          });

          emails.push(...domainEmails);

          console.log(`[Email Backfill] Found ${domainEmails.length} emails for ${domain} in this batch`);

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
      console.error(`[Email Backfill] Error fetching emails for domain ${domain}:`, error);
    }

    console.log(`[Email Backfill] Total emails found for ${domain}: ${emails.length}`);
    return emails;
  }

  /**
   * Alternative: Backfill from email forwarding or manual import
   */
  async backfillFromForwardedEmails(tenantId: string, emailData: any[]) {
    console.log(`[Email Backfill] Processing ${emailData.length} forwarded emails for tenant ${tenantId}`);

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
        console.error(`[Email Backfill] Error processing forwarded email:`, error);
      }
    }

    return { success: true, processed };
  }

  /**
   * Get domains that need backfilling
   */
  private async getDomainsToBackfill(tenantId?: string, domain?: string): Promise<Array<{domain: string, tenant_id: string}>> {
    // This would query the database for domains to backfill
    // For now, return a placeholder
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
    console.log(`[Email Backfill] IMAP backfill not implemented yet for account: ${accountId}`);
    return { success: false, error: "IMAP backfill not implemented" };
  }
}

// Export singleton instance
export const emailBackfill = new EmailBackfillService();
