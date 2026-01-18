/* ═══════════════════════════════════════════════════════════════════════════
   Notifications Types
   Types for multichannel notifications (SMS, in-app, push)
   ═══════════════════════════════════════════════════════════════════════════ */

export type NotificationTier = "free" | "starter" | "pro" | "enterprise";

export type NotificationPlan = {
  tier: NotificationTier;
  name: string;
  price: number;
  smsPerMonth: number; // -1 = unlimited
  inAppPerMonth: number; // -1 = unlimited
  pushPerMonth: number; // -1 = unlimited
  templates: number; // -1 = unlimited
  features: string[];
};

export const NOTIFICATION_PLANS: Record<NotificationTier, NotificationPlan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    smsPerMonth: 50,
    inAppPerMonth: 500,
    pushPerMonth: 0,
    templates: 3,
    features: [
      "50 SMS/month",
      "500 in-app/month",
      "3 templates",
      "Basic delivery tracking",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 29,
    smsPerMonth: 1000,
    inAppPerMonth: 10000,
    pushPerMonth: 5000,
    templates: 10,
    features: [
      "1,000 SMS/month",
      "10,000 in-app/month",
      "5,000 push/month",
      "10 templates",
      "User preferences",
      "Delivery analytics",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 99,
    smsPerMonth: 10000,
    inAppPerMonth: 100000,
    pushPerMonth: 50000,
    templates: 50,
    features: [
      "10,000 SMS/month",
      "100,000 in-app/month",
      "50,000 push/month",
      "50 templates",
      "User preferences",
      "Advanced analytics",
      "Webhooks",
      "Custom sender IDs",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 249,
    smsPerMonth: -1,
    inAppPerMonth: -1,
    pushPerMonth: -1,
    templates: -1,
    features: [
      "Unlimited SMS",
      "Unlimited in-app",
      "Unlimited push",
      "Unlimited templates",
      "Dedicated numbers",
      "SLA guarantee",
      "Priority support",
    ],
  },
};

export type NotificationChannel = "sms" | "in_app" | "push" | "email";

export type NotificationStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "read";

export type NotificationTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  channel: NotificationChannel;
  subject: string | null; // For push/in-app title
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationDelivery = {
  id: string;
  tenant_id: string;
  template_id: string | null;
  channel: NotificationChannel;
  recipient: string; // phone, user_id, device_token
  recipient_user_id: string | null;
  subject: string | null;
  body: string;
  status: NotificationStatus;
  provider_id: string | null; // Twilio SID, FCM ID
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type UserNotificationPreference = {
  id: string;
  user_id: string;
  tenant_id: string;
  channel: NotificationChannel;
  enabled: boolean;
  quiet_hours_start: string | null; // HH:MM format
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
};

export type InAppNotification = {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  body: string;
  action_url: string | null;
  icon: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationSubscription = {
  id: string;
  tenant_id: string;
  tier: NotificationTier;
  status: "active" | "trialing" | "canceled" | "past_due";
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_from_number: string | null;
  fcm_server_key: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
};

export type NotificationUsage = {
  tenant_id: string;
  period_start: string;
  sms_sent: number;
  sms_delivered: number;
  sms_failed: number;
  in_app_sent: number;
  in_app_read: number;
  push_sent: number;
  push_delivered: number;
  updated_at: string;
};

// API types
export type SendNotificationRequest = {
  channel: NotificationChannel;
  recipient: string;
  recipientUserId?: string;
  subject?: string;
  body?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type SendNotificationResponse = {
  success: boolean;
  deliveryId?: string;
  providerId?: string;
  error?: string;
};

// Helper functions
export function formatNotificationCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function canSendNotification(
  channel: NotificationChannel,
  currentUsage: NotificationUsage,
  plan: NotificationPlan
): { allowed: boolean; reason?: string } {
  let limit: number;
  let used: number;

  switch (channel) {
    case "sms":
      limit = plan.smsPerMonth;
      used = currentUsage.sms_sent;
      break;
    case "in_app":
      limit = plan.inAppPerMonth;
      used = currentUsage.in_app_sent;
      break;
    case "push":
      limit = plan.pushPerMonth;
      used = currentUsage.push_sent;
      break;
    default:
      return { allowed: true };
  }

  if (limit === -1) return { allowed: true };

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Monthly ${channel.replace("_", "-")} limit reached (${formatNotificationCount(limit)}). Upgrade your plan.`,
    };
  }

  return { allowed: true };
}

export function canCreateTemplate(
  currentCount: number,
  plan: NotificationPlan
): { allowed: boolean; reason?: string } {
  if (plan.templates === -1) return { allowed: true };

  if (currentCount >= plan.templates) {
    return {
      allowed: false,
      reason: `Template limit reached (${plan.templates}). Upgrade your plan.`,
    };
  }

  return { allowed: true };
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

export function isInQuietHours(
  start: string | null,
  end: string | null
): boolean {
  if (!start || !end) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// Default templates
export const DEFAULT_NOTIFICATION_TEMPLATES = {
  orderConfirmation: {
    name: "Order Confirmation",
    slug: "order-confirmation",
    channel: "sms" as NotificationChannel,
    body: "Hi {{name}}! Your order #{{order_number}} has been confirmed. Total: {{total}}. Track at: {{tracking_url}}",
    variables: ["name", "order_number", "total", "tracking_url"],
  },
  shippingUpdate: {
    name: "Shipping Update",
    slug: "shipping-update",
    channel: "sms" as NotificationChannel,
    body: "{{name}}, your order #{{order_number}} has shipped! Tracking: {{tracking_number}}. Estimated delivery: {{delivery_date}}",
    variables: ["name", "order_number", "tracking_number", "delivery_date"],
  },
  welcomeMessage: {
    name: "Welcome Message",
    slug: "welcome",
    channel: "in_app" as NotificationChannel,
    subject: "Welcome to {{company_name}}!",
    body: "Thanks for joining us, {{name}}! Explore our products and enjoy your first purchase.",
    variables: ["name", "company_name"],
  },
};
