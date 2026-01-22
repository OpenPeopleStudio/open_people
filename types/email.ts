/* ═══════════════════════════════════════════════════════════════════════════
   Email Types
   Types for the Resend-powered email add-on
   ═══════════════════════════════════════════════════════════════════════════ */

export type EmailTier = "free" | "starter" | "pro" | "enterprise";

export type EmailPlan = {
  tier: EmailTier;
  name: string;
  price: number; // monthly price in dollars
  emailsPerMonth: number;
  customDomains: number;
  templates: number;
  features: string[];
};

export const EMAIL_PLANS: Record<EmailTier, EmailPlan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    emailsPerMonth: 100,
    customDomains: 0,
    templates: 3,
    features: [
      "100 emails/month",
      "Basic templates",
      "OpenPeople.ai sender",
      "7-day log retention",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 19,
    emailsPerMonth: 5000,
    customDomains: 1,
    templates: 10,
    features: [
      "5,000 emails/month",
      "1 custom domain",
      "10 templates",
      "30-day log retention",
      "Basic analytics",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 49,
    emailsPerMonth: 50000,
    customDomains: 5,
    templates: 50,
    features: [
      "50,000 emails/month",
      "5 custom domains",
      "50 templates",
      "90-day log retention",
      "Advanced analytics",
      "Webhooks",
      "Priority support",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 199,
    emailsPerMonth: 500000,
    customDomains: 20,
    templates: -1, // unlimited
    features: [
      "500,000 emails/month",
      "20 custom domains",
      "Unlimited templates",
      "1-year log retention",
      "Dedicated IP",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
};

export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

export type EmailTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  variables: string[]; // e.g., ["name", "company", "link"]
  category: "transactional" | "marketing" | "notification";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailLog = {
  id: string;
  tenant_id: string;
  template_id: string | null;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string;
  status: EmailStatus;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type EmailDomain = {
  id: string;
  tenant_id: string;
  domain: string;
  resend_domain_id: string | null;
  status: "pending" | "verified" | "failed";
  dns_records: {
    type: string;
    name: string;
    value: string;
    status: "pending" | "verified";
  }[] | null;
  created_at: string;
  verified_at: string | null;
};

export type EmailSubscription = {
  id: string;
  tenant_id: string;
  tier: EmailTier;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
};

export type EmailUsage = {
  tenant_id: string;
  period_start: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  emails_complained: number;
};

export type SendEmailRequest = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  from?: string; // Override default sender
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: Record<string, string>;
};

export type SendEmailResponse = {
  success: boolean;
  emailId?: string;
  resendId?: string;
  error?: string;
};

// Helper functions
export function formatEmailCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function getEmailUsagePercent(used: number, limit: number): number {
  return Math.min((used / limit) * 100, 100);
}

export function canSendEmail(
  currentUsage: number,
  plan: EmailPlan
): { allowed: boolean; reason?: string } {
  if (currentUsage >= plan.emailsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly email limit reached (${formatEmailCount(plan.emailsPerMonth)}). Upgrade your plan for more emails.`,
    };
  }
  return { allowed: true };
}

export function getDefaultFromEmail(tenantSlug: string): string {
  return `${tenantSlug}@mail.openpeople.ai`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Email Accounts Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Email provider types:
 * - managed: DNS-only setup, we handle send/receive via our infrastructure
 * - smtp: Custom SMTP only (send)
 * - imap: Custom IMAP only (receive)
 * - pop3: Custom POP3 (receive)
 * - smtp_imap: Custom SMTP + IMAP (send & receive)
 * - resend: Direct Resend API (send only, no inbox)
 */
export type EmailProvider = "managed" | "smtp" | "imap" | "pop3" | "resend" | "smtp_imap";

/**
 * Whether an account uses managed (DNS-only) or custom (SMTP/IMAP) setup
 */
export type EmailAccountMode = "managed" | "custom";

/**
 * DNS record required for managed email setup
 */
export type DNSRecord = {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  value: string;
  priority?: number;  // For MX records
  status: "pending" | "verified" | "failed";
  purpose: "dkim" | "spf" | "mx" | "return-path" | "verification";
};

/**
 * Managed domain configuration for DNS-only email setup
 */
export type ManagedEmailDomain = {
  id: string;
  tenant_id: string;
  account_id: string;
  domain: string;
  status: "pending" | "verifying" | "verified" | "failed";
  dns_records: DNSRecord[];
  resend_domain_id?: string;
  verified_at?: string;
  last_check_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
};

export type EmailAccount = {
  id: string;
  tenant_id: string;
  name: string;
  email_address: string;
  is_default: boolean;
  is_active: boolean;
  provider: EmailProvider;

  // Mode: managed (DNS-only) or custom (SMTP/IMAP credentials)
  mode: EmailAccountMode;

  // Managed domain ID (for managed mode)
  managed_domain_id?: string;

  // SMTP settings (for custom mode)
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;

  // IMAP settings (for custom mode)
  imap_host?: string;
  imap_port?: number;
  imap_secure?: boolean;
  imap_user?: string;

  // POP3 settings (for custom mode)
  pop3_host?: string;
  pop3_port?: number;
  pop3_secure?: boolean;
  pop3_user?: string;

  // Resend settings
  resend_api_key_id?: string;
  resend_domain?: string;

  // Sync settings
  sync_enabled: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  last_sync_error?: string;
  last_sync_uid?: string; // For IMAP UID tracking

  // OAuth settings (for Gmail/Outlook)
  oauth_access_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_at?: number; // Unix timestamp
  oauth_token_type?: string;

  created_at: string;
  updated_at: string;
};

export type EmailAccountCreateRequest = {
  name: string;
  email_address: string;
  is_default?: boolean;
  provider: EmailProvider;
  mode: EmailAccountMode;
  
  // Domain for managed mode (will generate DNS records)
  domain?: string;
  
  // SMTP (for custom mode)
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_password?: string;
  
  // IMAP (for custom mode)
  imap_host?: string;
  imap_port?: number;
  imap_secure?: boolean;
  imap_user?: string;
  imap_password?: string;
  
  // POP3 (for custom mode)
  pop3_host?: string;
  pop3_port?: number;
  pop3_secure?: boolean;
  pop3_user?: string;
  pop3_password?: string;
  
  // Resend
  resend_api_key_id?: string;
  resend_domain?: string;
  
  sync_enabled?: boolean;
  sync_interval_minutes?: number;
};

/**
 * Generate DNS records required for a managed email domain
 */
/**
 * Generate fallback DNS records for managed email domains.
 * These are only used if Resend doesn't return records.
 * The actual DKIM record should come from Resend's API response.
 */
export function generateManagedDNSRecords(domain: string): Omit<DNSRecord, "status">[] {
  return [
    {
      type: "TXT",
      name: `_dmarc.${domain}`,
      value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@openpeople.ai",
      purpose: "verification",
    },
    {
      type: "TXT",
      name: domain,
      value: "v=spf1 include:amazonses.com include:resend.com ~all",
      purpose: "spf",
    },
    // Note: MX and DKIM records should come from Resend's API.
    // These are placeholders shown if Resend API fails.
  ];
}

/**
 * Check if an account is in managed mode
 */
export function isManagedAccount(account: EmailAccount): boolean {
  return account.mode === "managed" || account.provider === "managed";
}

// ═══════════════════════════════════════════════════════════════════════════
// Email Messages / Inbox Types
// ═══════════════════════════════════════════════════════════════════════════

export type EmailDirection = "inbound" | "outbound";

export type EmailMessageStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "received"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed";

export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailAttachmentMeta = {
  filename: string;
  content_type?: string;
  size?: number;
  storage_key?: string;
};

export type EmailMessage = {
  id: string;
  tenant_id: string;
  account_id: string;
  
  message_id?: string;
  provider_id?: string;
  thread_id?: string;
  in_reply_to?: string;
  
  direction: EmailDirection;
  
  from_address: string;
  from_name?: string;
  to_addresses: EmailAddress[];
  cc_addresses?: EmailAddress[];
  bcc_addresses?: EmailAddress[];
  reply_to?: string;
  
  subject?: string;
  body_text?: string;
  body_html?: string;
  body_preview?: string;
  
  attachments: EmailAttachmentMeta[];
  has_attachments: boolean;
  
  status: EmailMessageStatus;
  mailbox: string;
  
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_spam: boolean;
  
  labels: string[];
  
  sent_at?: string;
  received_at?: string;
  opened_at?: string;
  
  error_message?: string;
  raw_headers?: Record<string, string>;
  
  created_at: string;
  updated_at: string;
};

export type EmailInboxStats = {
  total_messages: number;
  unread_messages: number;
  starred_messages: number;
  draft_messages: number;
  sent_messages: number;
  spam_messages: number;
  archived_messages: number;
};

export type ComposeEmailRequest = {
  account_id: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html?: string;
  body_text?: string;
  reply_to?: string;
  in_reply_to?: string;
  thread_id?: string;
  attachments?: { filename: string; content: string; content_type: string }[];
  save_as_draft?: boolean;
};

// Pre-built template snippets
// ═══════════════════════════════════════════════════════════════════════════
// Email Workspace Types (AI-first SMB email)
// ═══════════════════════════════════════════════════════════════════════════

export type EmailThreadStatus = "active" | "resolved" | "archived" | "spam";

export type EmailThread = {
  id: string;
  tenant_id: string;
  subject: string;
  participants: EmailParticipant[];
  message_count: number;
  last_message_at: string;
  ai_summary?: string;
  ai_priority_score?: number;
  ai_intent?: "support" | "sales" | "admin" | "internal" | "spam" | "unknown";
  ai_sentiment?: "positive" | "neutral" | "negative";
  ai_processed_at?: string;
  status: EmailThreadStatus;
  created_at: string;
  updated_at: string;
};

export type EmailParticipant = {
  email: string;
  name?: string;
  role: "from" | "to" | "cc" | "bcc";
};

export type EmailLabel = {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  is_system: boolean;
  created_at: string;
};

export type EmailAssignmentStatus = "active" | "completed" | "escalated";

export type EmailAssignment = {
  id: string;
  tenant_id: string;
  thread_id: string;
  assignee_id: string;
  assigned_by: string;
  assigned_at: string;
  due_at?: string;
  status: EmailAssignmentStatus;
  notes?: string;
};

export type EmailComment = {
  id: string;
  tenant_id: string;
  thread_id: string;
  author_id: string;
  content: string;
  mentions: EmailMention[];
  is_internal: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailMention = {
  user_id: string;
  username: string;
};

export type EmailSLA = {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  priority: "urgent" | "high" | "normal" | "low";
  response_time_hours: number;
  resolution_time_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailAIQueueStatus = "pending" | "processing" | "completed" | "failed";

export type EmailAIQueue = {
  id: string;
  tenant_id: string;
  message_id: string;
  thread_id?: string;
  status: EmailAIQueueStatus;
  priority: number;
  tasks: string[];
  results: Record<string, unknown>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
};

export type EmailRule = {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  conditions: EmailRuleCondition[];
  actions: EmailRuleAction[];
  priority: number;
  created_at: string;
  updated_at: string;
};

export type EmailRuleCondition = {
  field: string;
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "matches_regex";
  value: string;
};

export type EmailRuleAction = {
  type: "label" | "assign" | "sla" | "webhook" | "archive" | "mark_spam";
  config: Record<string, unknown>;
};

export type EmailSuggestion = {
  id: string;
  tenant_id: string;
  message_id: string;
  thread_id: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  confidence_score?: number;
  used_at?: string;
  used_by?: string;
  created_at: string;
};

export type EmailPolicy = {
  id: string;
  tenant_id: string;
  signature_template?: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
  max_attachment_size_mb: number;
  require_tls: boolean;
  dlp_patterns: EmailDLPPattern[];
  auto_archive_days: number;
  auto_delete_spam_days: number;
  created_at: string;
  updated_at: string;
};

export type EmailDLPPattern = {
  name: string;
  pattern: string;
  action: "block" | "warn" | "allow";
};

export type EmailAuditEvent = {
  id: string;
  tenant_id: string;
  event_type: string;
  event_subtype?: string;
  user_id?: string;
  thread_id?: string;
  message_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

export type EmailRateLimit = {
  tenant_id: string;
  user_id: string;
  minute_count: number;
  minute_window: string;
  hour_count: number;
  hour_window: string;
  day_count: number;
  day_window: string;
  is_blocked: boolean;
  blocked_until?: string;
  block_reason?: string;
  updated_at: string;
};

export type EmailMetrics = {
  tenant_id: string;
  period_start: string;
  messages_received: number;
  messages_sent: number;
  messages_inbound: number;
  messages_outbound: number;
  avg_response_time_hours?: number;
  sla_hit_rate?: number;
  resolution_rate?: number;
  ai_processed_messages: number;
  ai_suggestion_usage_rate?: number;
  time_saved_hours?: number;
  active_users: number;
  assignments_completed: number;
  updated_at: string;
};

export type EmailUserActivity = {
  tenant_id: string;
  user_id: string;
  period_start: string;
  messages_read: number;
  messages_sent: number;
  assignments_taken: number;
  assignments_completed: number;
  comments_added: number;
  time_spent_minutes: number;
  ai_suggestions_used: number;
  updated_at: string;
};

export type EmailWorkspaceStats = {
  total_threads: number;
  active_threads: number;
  resolved_threads: number;
  urgent_threads: number;
  assigned_threads: number;
  unassigned_threads: number;
  overdue_assignments: number;
};

export type EmailInboxView = {
  threads: EmailThread[];
  total_count: number;
  unread_count: number;
  has_more: boolean;
};

export type EmailTriageView = "inbox" | "urgent" | "assigned" | "waiting" | "delegated" | "spam";

export const DEFAULT_TEMPLATES = {
  welcome: {
    name: "Welcome Email",
    slug: "welcome",
    subject: "Welcome to {{company_name}}!",
    category: "transactional" as const,
    variables: ["name", "company_name", "login_url"],
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Welcome, {{name}}! 👋</h1>
  <p>Thanks for joining <strong>{{company_name}}</strong>. We're excited to have you on board.</p>
  <p>Get started by logging in to your account:</p>
  <a href="{{login_url}}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Log In Now</a>
  <p style="color: #666; font-size: 14px; margin-top: 32px;">If you have any questions, just reply to this email.</p>
</body>
</html>`,
    text_body: `Welcome, {{name}}!

Thanks for joining {{company_name}}. We're excited to have you on board.

Get started by logging in: {{login_url}}

If you have any questions, just reply to this email.`,
  },
  passwordReset: {
    name: "Password Reset",
    slug: "password-reset",
    subject: "Reset your password",
    category: "transactional" as const,
    variables: ["name", "reset_url", "expires_in"],
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Reset Your Password</h1>
  <p>Hi {{name}},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  <a href="{{reset_url}}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
  <p style="color: #666; font-size: 14px;">This link expires in {{expires_in}}.</p>
  <p style="color: #666; font-size: 14px; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`,
    text_body: `Reset Your Password

Hi {{name}},

We received a request to reset your password. Visit this link to create a new password:

{{reset_url}}

This link expires in {{expires_in}}.

If you didn't request this, you can safely ignore this email.`,
  },
  orderConfirmation: {
    name: "Order Confirmation",
    slug: "order-confirmation",
    subject: "Order #{{order_number}} confirmed",
    category: "transactional" as const,
    variables: ["name", "order_number", "order_total", "order_url"],
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #111; margin-bottom: 24px;">Order Confirmed! ✅</h1>
  <p>Hi {{name}},</p>
  <p>Thank you for your order. We've received it and will process it shortly.</p>
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Order Number:</strong> #{{order_number}}</p>
    <p style="margin: 8px 0 0;"><strong>Total:</strong> {{order_total}}</p>
  </div>
  <a href="{{order_url}}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Order</a>
</body>
</html>`,
    text_body: `Order Confirmed!

Hi {{name}},

Thank you for your order. We've received it and will process it shortly.

Order Number: #{{order_number}}
Total: {{order_total}}

View your order: {{order_url}}`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Campaign Drafts (Super Admin)
// ═══════════════════════════════════════════════════════════════════════════

export type EmailCampaignStatus = "draft";

export type EmailCampaignDraft = {
  id: string;
  tenant_id: string | null;
  name: string;
  subject?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  status: EmailCampaignStatus;
  audience_description?: string | null;
  generated_via_ai: boolean;
  generation_prompt?: string | null;
  sender_account_id?: string | null;
  total_recipients: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EmailCampaignRecipientStatus = "draft" | "excluded";

export type EmailCampaignRecipient = {
  id: string;
  campaign_id: string;
  company_id?: string | null;
  to_email: string;
  to_name?: string | null;
  status: EmailCampaignRecipientStatus;
  reason?: string | null;
  created_at: string;
};

export type CreateCampaignDraftInput = {
  name: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  audience_description?: string;
  generated_via_ai?: boolean;
  generation_prompt?: string;
  sender_account_id?: string;
  recipients: { company_id?: string; to_email: string; to_name?: string; status?: EmailCampaignRecipientStatus; reason?: string }[];
};
