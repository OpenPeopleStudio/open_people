import { createSupabaseAdmin } from "@/lib/supabase/server";
import { JobPriority, JobType } from "@/lib/jobs/queue";
import { createResendClient, parseWebhookEvent, mapWebhookEventToStatus } from "./resend";
import type {
  EmailMessage,
  EmailThread,
  EmailAccount,
  EmailSuggestion,
  ComposeEmailRequest,
} from "@/types/email";
import crypto from "crypto";

type SupabaseAdminClient = Awaited<ReturnType<typeof createSupabaseAdmin>>;

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Service
   Handles inbound/outbound email flow, threading, AI processing queue
   ═══════════════════════════════════════════════════════════════════════════ */

export class EmailWorkspaceService {
  private supabase: SupabaseAdminClient | null = null;

  private async getSupabase(): Promise<SupabaseAdminClient> {
    if (!this.supabase) {
      this.supabase = await createSupabaseAdmin();
    }
    return this.supabase;
  }

  /**
   * Process inbound email webhook from Resend
   */
  async processInboundWebhook(
    payload: unknown,
    signature: string,
    webhookSecret: string
  ): Promise<{ success: boolean; threadId?: string; messageId?: string; error?: string }> {
    try {
      console.log("[Email Webhook] Processing webhook payload");

      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error("[Email Webhook] Invalid webhook signature");
        return { success: false, error: "Invalid webhook signature" };
      }

      // Parse the webhook event
      const event = parseWebhookEvent(payload);
      if (!event) {
        console.error("[Email Webhook] Invalid webhook payload");
        return { success: false, error: "Invalid webhook payload" };
      }

      console.log(`[Email Webhook] Processing event type: ${event.type}, emailId: ${event.emailId}`);

      // Handle different event types
      switch (event.type) {
        case "email.received":
          return await this.processInboundEmail(event.data);
        case "email.sent":
        case "email.delivered":
        case "email.opened":
        case "email.clicked":
        case "email.bounced":
        case "email.complained":
          return await this.processOutboundEvent(event);
        default:
          console.log(`[Email Webhook] Ignoring unknown event type: ${event.type}`);
          return { success: true }; // Ignore unknown events
      }
    } catch (error) {
      console.error("[Email Webhook] Processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Verify Resend webhook signature
   */
  private verifyWebhookSignature(
    payload: unknown,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Process inbound email from webhook
   */
  private async processInboundEmail(data: Record<string, unknown>): Promise<{
    success: boolean;
    threadId?: string;
    messageId?: string;
    error?: string;
  }> {
    const supabase = await this.getSupabase();

    console.log("[Email Webhook] Processing inbound email");

    const {
      email_id: resendId,
      from: fromAddress,
      to: toAddresses,
      subject,
      html: bodyHtml,
      text: bodyText,
      created_at: receivedAt,
      attachments = [],
    } = data;

    const toAddressList = Array.isArray(toAddresses)
      ? (toAddresses as string[])
      : typeof toAddresses === "string"
        ? [toAddresses]
        : [];
    const primaryRecipient = toAddressList[0];

    if (!resendId || !fromAddress || toAddressList.length === 0) {
      console.error("[Email Webhook] Missing required email data");
      return { success: false, error: "Missing required email data" };
    }

    // Find the appropriate account for this email
    const account = await this.findAccountForInboundEmail(toAddressList);

    // If no account found through proper tenant routing, this indicates a configuration issue
    if (!account) {
      console.error("[Email Webhook] Email routing failed - no account found");
      console.error("[Email Webhook] Check that:");
      console.error("[Email Webhook] 1. The domain is properly configured for a tenant");
      console.error("[Email Webhook] 2. The tenant has email accounts set up");
      console.error("[Email Webhook] 3. DNS records are properly configured");

      return {
        success: false,
        error: `No email account configured to receive emails for ${primaryRecipient ?? "recipient"}`,
      };
    }

    console.log("[Email Webhook] Account resolved for inbound email");

    // Check if message already exists (globally, not just per account)
    const { data: existingMessage } = await supabase
      .from("email_messages")
      .select("id, thread_id")
      .eq("provider_id", resendId)
      .single();

    if (existingMessage) {
    console.log("[Email Webhook] Duplicate message already processed");
      return { success: true, messageId: existingMessage.id };
    }

    // Parse email addresses
    const parsedFrom = this.parseEmailAddress(fromAddress as string);
    const parsedTo = toAddressList.map((addr) => this.parseEmailAddress(addr));

    // Create email message record
    const { data: message, error: messageError } = await supabase
      .from("email_messages")
      .insert({
        tenant_id: account.tenant_id,
        account_id: account.id,
        message_id: resendId as string,
        provider_id: resendId as string,
        direction: "inbound",
        from_address: parsedFrom.email,
        from_name: parsedFrom.name,
        to_addresses: parsedTo,
        subject: subject as string,
        body_html: bodyHtml as string,
        body_text: bodyText as string,
        body_preview: this.generatePreview(bodyText as string || bodyHtml as string),
        has_attachments: attachments && (attachments as unknown[]).length > 0,
        attachments: attachments,
        status: "received",
        received_at: receivedAt as string,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return { success: false, error: messageError.message };
    }

    // Find or create thread
    const threadId = await this.findOrCreateThread(message);
    const threadIdValue = threadId ?? undefined;
    if (threadIdValue) {
      // Update message with thread_id
      await supabase
        .from("email_messages")
        .update({ thread_id: threadIdValue })
        .eq("id", message.id);
    }

    // Queue for AI processing
    await this.queueForAIProcessing(message.id, threadIdValue);

    // Log audit event
    await supabase.rpc("log_email_event", {
      p_tenant_id: account.tenant_id,
      p_event_type: "receive",
      p_event_subtype: "inbound",
      p_message_id: message.id,
      p_thread_id: threadIdValue ?? null,
    });

    return threadIdValue
      ? { success: true, messageId: message.id, threadId: threadIdValue }
      : { success: true, messageId: message.id };
  }

  /**
   * Process outbound email events (sent, delivered, etc.)
   */
  private async processOutboundEvent(event: {
    type: string;
    emailId: string;
    data: Record<string, unknown>;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = await this.getSupabase();
    const status = mapWebhookEventToStatus(event.type);
    if (!status) {
      return { success: true }; // Ignore unmapped events
    }

    const updateData: Partial<EmailMessage> & {
      sent_at?: string;
      opened_at?: string;
      clicked_at?: string;
      bounced_at?: string;
      error_message?: string;
    } = { status };
    const timestamp = event.data.created_at as string;

    // Set specific timestamps based on event type
    switch (status) {
      case "sent":
        break; // Already set
      case "delivered":
        updateData.sent_at = timestamp;
        break;
      case "opened":
        updateData.opened_at = timestamp;
        break;
      case "clicked":
        updateData.clicked_at = timestamp;
        break;
      case "bounced":
        updateData.bounced_at = timestamp;
        updateData.error_message = event.data.bounce_reason as string;
        break;
      case "complained":
        updateData.bounced_at = timestamp;
        updateData.error_message = "Marked as spam by recipient";
        break;
    }

    const { error } = await supabase
      .from("email_messages")
      .update(updateData)
      .eq("provider_id", event.emailId);

    if (error) {
      console.error("Error updating message status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Find the appropriate account for inbound email
   */
  /**
   * Multi-tenant email routing: Find the correct account for inbound email
   * Handles routing across different tenants based on domain ownership
   */
  private async findAccountForInboundEmail(toAddresses: string[]): Promise<EmailAccount | null> {
    const supabase = await this.getSupabase();

    // Extract domain from first recipient
    const firstTo = toAddresses[0];
    if (!firstTo) return null;

    const domain = firstTo.split("@")[1]?.toLowerCase();
    if (!domain) return null;

    console.log("[Email Routing] Routing inbound email");

    // Step 1: Find which tenant owns this domain
    const tenantId = await this.findTenantForDomain(supabase, domain);
    if (!tenantId) {
      console.log("[Email Routing] No tenant found for inbound domain");
      return null;
    }

    console.log("[Email Routing] Tenant found for inbound domain");

    // Step 2: Within the tenant, find the appropriate account
    const account = await this.findAccountInTenant(supabase, tenantId, domain, firstTo);
    if (account) {
      console.log("[Email Routing] Found account for inbound email");
      return account;
    }

    console.log("[Email Routing] No account found for inbound email");
    return null;
  }

  /**
   * Find which tenant owns a given domain
   */
  private async findTenantForDomain(supabase: SupabaseAdminClient, domain: string): Promise<string | null> {
    // Check managed email domains first (these are explicitly configured for email)
    const { data: managedDomain } = await supabase
      .from("managed_email_domains")
      .select("tenant_id")
      .eq("domain", domain)
      .eq("status", "verified")
      .single();

    if (managedDomain?.tenant_id) {
      return managedDomain.tenant_id;
    }

    // Check tenant domains (custom domains that tenants own)
    const { data: tenantDomain } = await supabase
      .from("tenant_domains")
      .select("tenant_id")
      .eq("domain", domain)
      .not("verified_at", "is", null) // Must be verified
      .single();

    if (tenantDomain?.tenant_id) {
      return tenantDomain.tenant_id;
    }

    // Check tenant primary domains
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("primary_domain", domain)
      .single();

    if (tenant?.id) {
      return tenant.id;
    }

    // Check for subdomain routing (e.g., tenant.openpeople.ai)
    const subdomainMatch = domain.match(/^([^.]+)\.openpeople\.ai$/);
    if (subdomainMatch) {
      const tenantSlug = subdomainMatch[1];
      const { data: tenantBySlug } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (tenantBySlug?.id) {
        return tenantBySlug.id;
      }
    }

    return null;
  }

  /**
   * Find the appropriate account within a tenant for an email address
   */
  private async findAccountInTenant(
    supabase: SupabaseAdminClient,
    tenantId: string,
    domain: string,
    fullEmailAddress: string
  ): Promise<EmailAccount | null> {
    console.log("[Email Routing] Looking for account in tenant");

    // 1. Check for exact email address match (highest priority)
    const { data: exactMatchAccount } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("email_address", fullEmailAddress)
      .single();

    if (exactMatchAccount) {
      console.log("[Email Routing] Found exact match account");
      return exactMatchAccount;
    }

    // 2. Check for managed domain accounts (specific domain routing)
    const { data: managedDomainAccount } = await supabase
      .from("email_accounts")
      .select(`
        *,
        managed_email_domains!inner(domain)
      `)
      .eq("tenant_id", tenantId)
      .eq("managed_email_domains.domain", domain)
      .eq("mode", "managed")
      .single();

    if (managedDomainAccount) {
      console.log("[Email Routing] Found managed domain account");
      return managedDomainAccount;
    }

    // 3. Check for tenant-level catch-all account (receives all emails for tenant domains)
    const { data: tenantCatchAll } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("mode", "managed")
      .is("managed_domain_id", null) // Not tied to specific domain = tenant catch-all
      .single();

    if (tenantCatchAll) {
      console.log("[Email Routing] Using tenant catch-all account");
      return tenantCatchAll;
    }

    // 4. Find default managed account for the tenant
    const { data: defaultAccount } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("mode", "managed")
      .eq("is_default", true)
      .single();

    if (defaultAccount) {
      console.log("[Email Routing] Using tenant default account");
      return defaultAccount;
    }

    // 5. Last resort: any managed account for the tenant
    const { data: anyManagedAccount } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("mode", "managed")
      .limit(1)
      .single();

    if (anyManagedAccount) {
      console.log("[Email Routing] Using fallback managed account");
      return anyManagedAccount;
    }

    console.log("[Email Routing] No suitable account found in tenant");
    return null;
  }

  /**
   * Parse email address string into {email, name} object
   */
  private parseEmailAddress(address: string): { email: string; name?: string } {
    const match = address.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: address.trim() };
  }

  /**
   * Generate preview text from email body
   */
  private generatePreview(body: string, maxLength = 200): string {
    if (!body) return "";

    // Remove HTML tags if present
    const textOnly = body.replace(/<[^>]*>/g, "");

    // Remove extra whitespace
    const clean = textOnly.replace(/\s+/g, " ").trim();

    // Truncate and add ellipsis if needed
    return clean.length <= maxLength ? clean : clean.substring(0, maxLength - 3) + "...";
  }

  /**
   * Find or create thread for a message
   */
  private async findOrCreateThread(message: EmailMessage): Promise<string | null> {
    const supabase = await this.getSupabase();

    // Try to find existing thread by subject and participants
    const { data: existingThread } = await supabase
      .from("email_threads")
      .select("id")
      .eq("tenant_id", message.tenant_id)
      .eq("subject", message.subject)
      .contains("participants", [
        { email: message.from_address, role: "from" }
      ])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingThread) {
      // Add message to existing thread
      await supabase.rpc("add_message_to_thread", {
        p_message_id: message.id,
        p_thread_id: existingThread.id,
      });
      return existingThread.id;
    }

    // Create new thread
    const { data: threadId } = await supabase.rpc("create_thread_from_message", {
      p_message_id: message.id,
      p_subject: message.subject,
    });

    return threadId;
  }

  /**
   * Queue message/thread for AI processing
   */
  private async queueForAIProcessing(messageId: string, threadId?: string): Promise<void> {
    const supabase = await this.getSupabase();

    const tasks = ["summarize", "classify", "suggest_reply"];

    await supabase.from("email_ai_queue").insert({
      tenant_id: (await supabase
        .from("email_messages")
        .select("tenant_id")
        .eq("id", messageId)
        .single()).data?.tenant_id,
      message_id: messageId,
      thread_id: threadId,
      tasks,
      priority: 0, // Default priority
    });

    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await supabase.from("job_queue").insert({
        id: jobId,
        type: JobType.EMAIL_TRIAGE,
        priority: JobPriority.NORMAL,
        data: { messageId, threadId },
        status: "pending",
        max_retries: 3,
        retry_count: 0,
        next_run_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Email AI Queue] Failed to enqueue job");
      console.error(error);
    }
  }

  /**
   * Send outbound email via workspace
   */
  async sendEmail(
    accountId: string,
    request: ComposeEmailRequest
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const supabase = await this.getSupabase();

    try {
      // Get account details
      const { data: account, error: accountError } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (accountError || !account) {
        return { success: false, error: "Account not found" };
      }

      // Check rate limits
      const { data: rateLimitCheck } = await supabase.rpc("check_email_rate_limit", {
        p_tenant_id: account.tenant_id,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (!rateLimitCheck?.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again after ${rateLimitCheck.reset_at}`,
        };
      }

      // Apply policies and DLP checks
      const policyCheck = await this.checkEmailPolicies(account.tenant_id, request);
      if (!policyCheck.allowed) {
        return policyCheck.reason
          ? { success: false, error: policyCheck.reason }
          : { success: false };
      }

      // Create message record first
      const toList = Array.isArray(request.to) ? request.to : [request.to];
      const ccList = request.cc && request.cc.length > 0 ? request.cc : undefined;
      const bccList = request.bcc && request.bcc.length > 0 ? request.bcc : undefined;
      const { data: message, error: messageError } = await supabase
        .from("email_messages")
        .insert({
          tenant_id: account.tenant_id,
          account_id: account.id,
          direction: "outbound",
          from_address: account.email_address,
          from_name: account.name,
          to_addresses: toList.map((email) => ({ email })),
          ...(ccList ? { cc_addresses: ccList.map((email) => ({ email })) } : {}),
          ...(bccList ? { bcc_addresses: bccList.map((email) => ({ email })) } : {}),
          subject: request.subject,
          body_html: request.body_html,
          body_text: request.body_text,
          ...(request.reply_to ? { reply_to: request.reply_to } : {}),
          status: "queued",
          ...(request.thread_id ? { thread_id: request.thread_id } : {}),
          ...(request.in_reply_to ? { in_reply_to: request.in_reply_to } : {}),
        })
        .select()
        .single();

      if (messageError) {
        return { success: false, error: messageError.message };
      }

      // Send via Resend
      const resend = createResendClient();
      const html = request.body_html?.trim() || undefined;
      const text = request.body_text?.trim() || undefined;

      if (!html && !text) {
        return { success: false, error: "Email body is required" };
      }

      const basePayload = {
        from: `${account.name} <${account.email_address}>`,
        to: toList,
        ...(ccList ? { cc: ccList } : {}),
        ...(bccList ? { bcc: bccList } : {}),
        subject: request.subject,
        ...(request.reply_to ? { reply_to: request.reply_to } : {}),
      };

      const resendPayload: Parameters<typeof resend.emails.send>[0] = html
        ? { ...basePayload, html, ...(text ? { text } : {}) }
        : { ...basePayload, text: text as string };

      const { data: resendResult, error: resendError } = await resend.emails.send(resendPayload);

      if (resendError) {
        // Update message status to failed
        await supabase
          .from("email_messages")
          .update({
            status: "failed",
            error_message: resendError.message,
          })
          .eq("id", message.id);

        return { success: false, error: resendError.message };
      }

      // Update message with Resend ID and mark as sending
      await supabase
        .from("email_messages")
        .update({
          provider_id: resendResult.id,
          status: "sending",
        })
        .eq("id", message.id);

      // Increment rate limit counters
      await supabase.rpc("increment_rate_limit", {
        p_tenant_id: account.tenant_id,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      // Log audit event
      await supabase.rpc("log_email_event", {
        p_tenant_id: account.tenant_id,
        p_event_type: "send",
        p_event_subtype: "outbound",
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_message_id: message.id,
        p_thread_id: request.thread_id ?? null,
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      console.error("Send email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check email policies and DLP rules
   */
  private async checkEmailPolicies(
    tenantId: string,
    request: ComposeEmailRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await this.getSupabase();

    // Get tenant policies
    const { data: policies } = await supabase
      .from("email_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (!policies) {
      return { allowed: true }; // No policies configured
    }

    // Check blocked domains
    const toList = Array.isArray(request.to) ? request.to : [request.to];
    const allRecipients = [...toList, ...(request.cc || []), ...(request.bcc || [])];
    const blockedDomains = policies.blocked_domains || [];

    for (const recipient of allRecipients) {
      const domain = recipient.split("@")[1];
      if (!domain) continue;
      if (blockedDomains.includes(domain)) {
        return { allowed: false, reason: `Sending to blocked domain: ${domain}` };
      }
    }

    // Check DLP patterns (simplified - would need more sophisticated regex matching)
    if (policies.dlp_patterns) {
      const content = [request.subject, request.body_html, request.body_text].filter(Boolean).join(" ");

      for (const pattern of policies.dlp_patterns) {
        const regex = new RegExp(pattern.pattern, "i");
        if (regex.test(content)) {
          if (pattern.action === "block") {
            return { allowed: false, reason: `Content violates policy: ${pattern.name}` };
          }
          // For "warn", we could return a warning but allow sending
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Get inbox threads for a user
   */
  async getInboxThreads(
    tenantId: string,
    accountId?: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: "inbox" | "urgent" | "assigned" | "waiting" | "delegated" | "spam";
      search?: string;
    } = {}
  ): Promise<{ threads: EmailThread[]; total: number }> {
    const supabase = await this.getSupabase();
    const { limit = 50, offset = 0, filter, search } = options;

    // Get threads that have messages from the specified account (or all accounts if none specified)
    let threadIdQuery = supabase
      .from("email_messages")
      .select("thread_id")
      .eq("tenant_id", tenantId)
      .not("thread_id", "is", null);

    if (accountId) {
      threadIdQuery = threadIdQuery.eq("account_id", accountId);
    }

    const { data: threadIds, error: threadIdError } = await threadIdQuery;

    if (threadIdError || !threadIds || threadIds.length === 0) {
      return { threads: [], total: 0 };
    }

    const uniqueThreadIds = [...new Set(threadIds.map((t: { thread_id: string }) => t.thread_id))];

    // Now get the threads
    let query = supabase
      .from("email_threads")
      .select(`
        *,
        email_assignments!left(assignee_id, status, due_at)
      `, { count: "exact" })
      .eq("tenant_id", tenantId)
      .in("id", uniqueThreadIds)
      .neq("status", "archived")
      .order("last_message_at", { ascending: false });

    // Apply filters
    switch (filter) {
      case "inbox":
        // Default inbox - show all non-spam threads
        query = query.neq("status", "spam");
        break;
      case "urgent":
        query = query.gte("ai_priority_score", 0.8);
        break;
      case "assigned":
        query = query.not("email_assignments", "is", null);
        break;
      case "waiting":
        // Messages waiting for response - threads with inbound messages but no recent outbound
        query = query.neq("status", "spam");
        break;
      case "spam":
        query = query.eq("status", "spam");
        break;
      default:
        // Default inbox view - show all non-archived, non-spam threads
        query = query.neq("status", "spam");
        break;
    }

    // Apply search if provided
    if (search) {
      query = query.or(`subject.ilike.%${search}%,participants.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      console.error("Error fetching threads:", error);
      return { threads: [], total: 0 };
    }

    return { threads: threads || [], total: count || 0 };
  }

  /**
   * Get AI suggestions for a thread
   */
  async getThreadSuggestions(threadId: string): Promise<EmailSuggestion[]> {
    const supabase = await this.getSupabase();

    const { data: suggestions, error } = await supabase
      .from("email_suggestions")
      .select("*")
      .eq("thread_id", threadId)
      .order("confidence_score", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching suggestions:", error);
      return [];
    }

    return suggestions || [];
  }

  /**
   * Use an AI suggestion (mark as used)
   */
  async useSuggestion(suggestionId: string): Promise<boolean> {
    const supabase = await this.getSupabase();

    const { error } = await supabase
      .from("email_suggestions")
      .update({
        used_at: new Date().toISOString(),
        used_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq("id", suggestionId);

    return !error;
  }
}

// Export singleton instance
export const emailWorkspace = new EmailWorkspaceService();
