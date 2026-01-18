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

// Pre-built template snippets
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
