import { createSupabaseServer } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { sendSMS, type TwilioCredentials } from "./twilio";
import {
  NOTIFICATION_PLANS,
  interpolateTemplate,
  type NotificationChannel,
} from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Notification Event Dispatcher
   Normalizes product events into multi-channel deliveries (in-app, email, 
   webhook, push) respecting user/tenant preferences and logging for history.
   ═══════════════════════════════════════════════════════════════════════════ */

// Event types that can trigger notifications
export type NotificationEventType =
  // System alerts
  | "system.maintenance_scheduled"
  | "system.incident_reported"
  | "system.incident_resolved"
  // Tenant lifecycle
  | "tenant.onboarding_complete"
  | "tenant.usage_threshold_reached"
  | "tenant.plan_upgraded"
  | "tenant.plan_downgraded"
  | "tenant.billing_failed"
  | "tenant.billing_success"
  // Email domain events
  | "email.domain_verified"
  | "email.domain_verification_failed"
  | "email.delivery_failed"
  | "email.bounce_threshold"
  // AI/Ops worker events
  | "ai.worker_failed"
  | "ai.worker_completed"
  | "ai.quota_exceeded"
  | "ops.task_failed"
  | "ops.task_completed"
  // Storage events
  | "storage.quota_warning"
  | "storage.quota_exceeded"
  // Product updates
  | "product.feature_released"
  | "product.changelog_published";

// Notification priority levels
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

// Channel delivery preferences
export type ChannelPreferences = {
  inApp: boolean;
  email: boolean;
  webhook: boolean;
  push: boolean;
};

// The shape of a notification event
export type NotificationEvent = {
  type: NotificationEventType;
  tenantId: string;
  userId?: string; // Target user (if user-specific)
  title: string;
  body: string;
  priority: NotificationPriority;
  channels?: Partial<ChannelPreferences>; // Override default channels
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  templateVariables?: Record<string, string>;
};

// Delivery result for a single channel
export type ChannelDeliveryResult = {
  channel: NotificationChannel | "email" | "webhook";
  success: boolean;
  providerId?: string;
  error?: string;
};

// Result from dispatching a notification event
export type NotificationDispatchResult = {
  eventType: NotificationEventType;
  deliveries: ChannelDeliveryResult[];
  auditId?: string;
};

// Default channel preferences by event type
const DEFAULT_CHANNEL_PREFERENCES: Record<NotificationEventType, ChannelPreferences> = {
  // System alerts - high visibility
  "system.maintenance_scheduled": { inApp: true, email: true, webhook: true, push: false },
  "system.incident_reported": { inApp: true, email: true, webhook: true, push: false },
  "system.incident_resolved": { inApp: true, email: true, webhook: true, push: false },
  // Tenant lifecycle
  "tenant.onboarding_complete": { inApp: true, email: true, webhook: false, push: false },
  "tenant.usage_threshold_reached": { inApp: true, email: true, webhook: true, push: false },
  "tenant.plan_upgraded": { inApp: true, email: true, webhook: false, push: false },
  "tenant.plan_downgraded": { inApp: true, email: true, webhook: false, push: false },
  "tenant.billing_failed": { inApp: true, email: true, webhook: true, push: false },
  "tenant.billing_success": { inApp: true, email: false, webhook: false, push: false },
  // Email domain events
  "email.domain_verified": { inApp: true, email: true, webhook: false, push: false },
  "email.domain_verification_failed": { inApp: true, email: true, webhook: false, push: false },
  "email.delivery_failed": { inApp: true, email: false, webhook: true, push: false },
  "email.bounce_threshold": { inApp: true, email: true, webhook: true, push: false },
  // AI/Ops worker events
  "ai.worker_failed": { inApp: true, email: false, webhook: true, push: false },
  "ai.worker_completed": { inApp: false, email: false, webhook: true, push: false },
  "ai.quota_exceeded": { inApp: true, email: true, webhook: true, push: false },
  "ops.task_failed": { inApp: true, email: false, webhook: true, push: false },
  "ops.task_completed": { inApp: false, email: false, webhook: true, push: false },
  // Storage events
  "storage.quota_warning": { inApp: true, email: true, webhook: false, push: false },
  "storage.quota_exceeded": { inApp: true, email: true, webhook: true, push: false },
  // Product updates
  "product.feature_released": { inApp: true, email: false, webhook: false, push: false },
  "product.changelog_published": { inApp: true, email: false, webhook: false, push: false },
};

/**
 * Dispatch a notification event to all configured channels.
 * This is the main entry point for triggering notifications from product events.
 */
export async function dispatchNotificationEvent(
  event: NotificationEvent
): Promise<NotificationDispatchResult> {
  const supabase = await createSupabaseServer();
  const deliveries: ChannelDeliveryResult[] = [];

  // Merge default and event-specific channel preferences
  const defaultPrefs = DEFAULT_CHANNEL_PREFERENCES[event.type] || {
    inApp: true,
    email: false,
    webhook: false,
    push: false,
  };
  const channels: ChannelPreferences = {
    ...defaultPrefs,
    ...event.channels,
  };

  // Get tenant info for context
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, settings")
    .eq("id", event.tenantId)
    .single();

  if (!tenant) {
    return {
      eventType: event.type,
      deliveries: [{ channel: "in_app", success: false, error: "Tenant not found" }],
    };
  }

  // Get notification subscription for webhook/limit checks
  const { data: subscription } = await supabase
    .from("notification_subscriptions")
    .select("*")
    .eq("tenant_id", event.tenantId)
    .single();

  // Get current month period for usage tracking
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const periodStart = startOfMonth.toISOString().split("T")[0];

  // Get or determine target users for user-specific notifications
  let targetUserIds: string[] = [];
  if (event.userId) {
    targetUserIds = [event.userId];
  } else {
    // Get admin users for the tenant
    const { data: adminProfiles } = await supabase
      .from("709_profiles")
      .select("id")
      .eq("tenant_id", event.tenantId)
      .eq("role", "admin");
    targetUserIds = (adminProfiles || []).map((p) => p.id);
  }

  // Create audit record for this dispatch
  const { data: auditRecord } = await supabase
    .from("notification_deliveries")
    .insert({
      tenant_id: event.tenantId,
      channel: "in_app", // Primary channel for audit
      recipient: event.userId || event.tenantId,
      recipient_user_id: event.userId || null,
      subject: event.title,
      body: event.body,
      status: "queued",
      metadata: {
        event_type: event.type,
        priority: event.priority,
        channels,
        ...event.metadata,
      },
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // 1. In-App Notifications
  if (channels.inApp && targetUserIds.length > 0) {
    for (const userId of targetUserIds) {
      try {
        // Check user preferences
        const { data: userPref } = await supabase
          .from("user_notification_preferences")
          .select("enabled")
          .eq("user_id", userId)
          .eq("tenant_id", event.tenantId)
          .eq("channel", "in_app")
          .single();

        if (userPref?.enabled === false) {
          deliveries.push({
            channel: "in_app",
            success: false,
            error: "User disabled in-app notifications",
          });
          continue;
        }

        const { data: inAppNotif } = await supabase
          .from("in_app_notifications")
          .insert({
            tenant_id: event.tenantId,
            user_id: userId,
            title: event.title,
            body: event.body,
            action_url: event.actionUrl || null,
            icon: getIconForEventType(event.type),
          })
          .select("id")
          .single();

        deliveries.push({
          channel: "in_app",
          success: true,
          providerId: inAppNotif?.id,
        });

        // Update usage
        await supabase.rpc("increment_notification_usage", {
          p_tenant_id: event.tenantId,
          p_period_start: periodStart,
          p_field: "in_app_sent",
          p_increment: 1,
        });
      } catch (error) {
        deliveries.push({
          channel: "in_app",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // 2. Email Notifications
  if (channels.email && targetUserIds.length > 0) {
    for (const userId of targetUserIds) {
      try {
        // Check user preferences
        const { data: userPref } = await supabase
          .from("user_notification_preferences")
          .select("enabled")
          .eq("user_id", userId)
          .eq("tenant_id", event.tenantId)
          .eq("channel", "email")
          .single();

        if (userPref?.enabled === false) {
          deliveries.push({
            channel: "email",
            success: false,
            error: "User disabled email notifications",
          });
          continue;
        }

        // Get user email
        const { data: profile } = await supabase
          .from("709_profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          deliveries.push({
            channel: "email",
            success: false,
            error: "User email not found",
          });
          continue;
        }

        const emailResult = await sendEmail(
          event.tenantId,
          tenant.slug,
          {
            to: profile.email,
            subject: event.title,
            html: generateEmailHtml(event),
            text: event.body,
          },
          null
        );

        deliveries.push({
          channel: "email",
          success: emailResult.success,
          providerId: emailResult.emailId,
          error: emailResult.error,
        });
      } catch (error) {
        deliveries.push({
          channel: "email",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // 3. Webhook Notifications
  if (channels.webhook) {
    try {
      // Get tenant webhook configuration
      const tenantSettings = tenant.settings as Record<string, unknown> | null;
      const webhookUrl = tenantSettings?.notification_webhook_url as string | undefined;

      if (webhookUrl) {
        const webhookPayload = {
          event: event.type,
          tenant_id: event.tenantId,
          title: event.title,
          body: event.body,
          priority: event.priority,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-OpenPeople-Event": event.type,
            "X-OpenPeople-Signature": generateWebhookSignature(webhookPayload, tenant.id),
          },
          body: JSON.stringify(webhookPayload),
        });

        deliveries.push({
          channel: "webhook",
          success: response.ok,
          providerId: response.ok ? `webhook-${Date.now()}` : undefined,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } else {
        deliveries.push({
          channel: "webhook",
          success: false,
          error: "No webhook URL configured",
        });
      }
    } catch (error) {
      deliveries.push({
        channel: "webhook",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 4. Push Notifications (placeholder for future implementation)
  if (channels.push) {
    deliveries.push({
      channel: "push",
      success: false,
      error: "Push notifications not yet implemented",
    });
  }

  // Update audit record with final status
  const allSucceeded = deliveries.every((d) => d.success);
  const anySucceeded = deliveries.some((d) => d.success);

  if (auditRecord?.id) {
    await supabase
      .from("notification_deliveries")
      .update({
        status: allSucceeded ? "delivered" : anySucceeded ? "sent" : "failed",
        delivered_at: anySucceeded ? new Date().toISOString() : null,
        metadata: {
          event_type: event.type,
          priority: event.priority,
          channels,
          deliveries,
          ...event.metadata,
        },
      })
      .eq("id", auditRecord.id);
  }

  return {
    eventType: event.type,
    deliveries,
    auditId: auditRecord?.id,
  };
}

/**
 * Send a simple notification to specific users without going through the event system.
 * Useful for ad-hoc notifications from admin actions.
 */
export async function sendDirectNotification(
  tenantId: string,
  userIds: string[],
  title: string,
  body: string,
  channels: Partial<ChannelPreferences> = { inApp: true }
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "product.feature_released", // Generic type for direct notifications
    tenantId,
    title,
    body,
    priority: "medium",
    channels,
  });
}

// Helper: Generate HTML email content
function generateEmailHtml(event: NotificationEvent): string {
  const priorityColor = {
    low: "#6b7280",
    medium: "#3b82f6",
    high: "#f59e0b",
    urgent: "#ef4444",
  }[event.priority];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; overflow: hidden;">
    <div style="padding: 24px; border-bottom: 1px solid #2a2a2a;">
      <div style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}20; color: ${priorityColor}; border-radius: 20px; font-size: 12px; font-weight: 500; text-transform: uppercase;">
        ${event.priority}
      </div>
    </div>
    <div style="padding: 32px 24px;">
      <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
        ${event.title}
      </h1>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #a1a1a1;">
        ${event.body}
      </p>
      ${event.actionUrl ? `
      <a href="${event.actionUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background-color: #d4ff00; color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Details
      </a>
      ` : ""}
    </div>
    <div style="padding: 16px 24px; background-color: #111111; font-size: 12px; color: #6b7280;">
      Sent by OpenPeople · <a href="https://openpeople.ai" style="color: #6b7280;">Manage preferences</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Helper: Get icon for event type
function getIconForEventType(type: NotificationEventType): string {
  const iconMap: Record<string, string> = {
    "system.maintenance_scheduled": "wrench",
    "system.incident_reported": "exclamation-triangle",
    "system.incident_resolved": "check-circle",
    "tenant.onboarding_complete": "flag",
    "tenant.usage_threshold_reached": "chart-bar",
    "tenant.plan_upgraded": "arrow-up",
    "tenant.plan_downgraded": "arrow-down",
    "tenant.billing_failed": "credit-card",
    "tenant.billing_success": "check-badge",
    "email.domain_verified": "shield-check",
    "email.domain_verification_failed": "shield-exclamation",
    "email.delivery_failed": "envelope-x",
    "email.bounce_threshold": "bounce",
    "ai.worker_failed": "cpu",
    "ai.worker_completed": "cpu",
    "ai.quota_exceeded": "chart-bar",
    "ops.task_failed": "cog",
    "ops.task_completed": "cog",
    "storage.quota_warning": "database",
    "storage.quota_exceeded": "database",
    "product.feature_released": "sparkles",
    "product.changelog_published": "document-text",
  };
  return iconMap[type] || "bell";
}

// Helper: Generate webhook signature for verification
function generateWebhookSignature(
  payload: Record<string, unknown>,
  tenantId: string
): string {
  // Simple HMAC-like signature (in production, use proper HMAC with tenant secret)
  const data = JSON.stringify(payload) + tenantId;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `sha256=${Math.abs(hash).toString(16)}`;
}

// Convenience functions for common notification events

export async function notifyOnboardingComplete(
  tenantId: string,
  tenantName: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "tenant.onboarding_complete",
    tenantId,
    title: "Welcome to OpenPeople!",
    body: `${tenantName} onboarding is complete. You're all set to start using the platform.`,
    priority: "medium",
    actionUrl: "/admin",
  });
}

export async function notifyUsageThreshold(
  tenantId: string,
  resource: string,
  percentage: number
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "tenant.usage_threshold_reached",
    tenantId,
    title: `${resource} usage at ${percentage}%`,
    body: `Your ${resource.toLowerCase()} usage has reached ${percentage}% of your plan limit. Consider upgrading to avoid service interruptions.`,
    priority: percentage >= 90 ? "high" : "medium",
    actionUrl: "/admin/billing",
    metadata: { resource, percentage },
  });
}

export async function notifyEmailDomainVerified(
  tenantId: string,
  domain: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "email.domain_verified",
    tenantId,
    title: "Email domain verified",
    body: `Your domain ${domain} has been verified and is now ready to send emails.`,
    priority: "medium",
    actionUrl: "/admin/email/domains",
    metadata: { domain },
  });
}

export async function notifyEmailDomainVerificationFailed(
  tenantId: string,
  domain: string,
  reason: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "email.domain_verification_failed",
    tenantId,
    title: "Email domain verification failed",
    body: `Domain ${domain} verification failed: ${reason}. Please check your DNS records.`,
    priority: "high",
    actionUrl: "/admin/email/domains",
    metadata: { domain, reason },
  });
}

export async function notifyAIWorkerFailed(
  tenantId: string,
  workerId: string,
  workerName: string,
  error: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "ai.worker_failed",
    tenantId,
    title: `AI Worker "${workerName}" failed`,
    body: `The AI worker encountered an error: ${error}`,
    priority: "high",
    actionUrl: `/admin/ai/workers/${workerId}`,
    metadata: { workerId, workerName, error },
  });
}

export async function notifyOpsTaskFailed(
  tenantId: string,
  taskId: string,
  taskName: string,
  error: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "ops.task_failed",
    tenantId,
    title: `Ops task "${taskName}" failed`,
    body: `The scheduled task encountered an error: ${error}`,
    priority: "high",
    actionUrl: `/admin/ops/tasks/${taskId}`,
    metadata: { taskId, taskName, error },
  });
}

export async function notifyStorageQuotaWarning(
  tenantId: string,
  usedBytes: number,
  limitBytes: number
): Promise<NotificationDispatchResult> {
  const percentage = Math.round((usedBytes / limitBytes) * 100);
  return dispatchNotificationEvent({
    type: "storage.quota_warning",
    tenantId,
    title: `Storage at ${percentage}% capacity`,
    body: `Your storage usage is approaching the limit. Consider upgrading your plan or cleaning up unused files.`,
    priority: percentage >= 90 ? "high" : "medium",
    actionUrl: "/admin/storage",
    metadata: { usedBytes, limitBytes, percentage },
  });
}

export async function notifyBillingFailed(
  tenantId: string,
  reason: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "tenant.billing_failed",
    tenantId,
    title: "Payment failed",
    body: `Your payment could not be processed: ${reason}. Please update your payment method to avoid service interruption.`,
    priority: "urgent",
    actionUrl: "/admin/billing",
    metadata: { reason },
  });
}

export async function notifySystemMaintenance(
  tenantId: string,
  scheduledAt: Date,
  estimatedDuration: string,
  description: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "system.maintenance_scheduled",
    tenantId,
    title: "Scheduled maintenance",
    body: `Maintenance scheduled for ${scheduledAt.toLocaleString()}. Estimated duration: ${estimatedDuration}. ${description}`,
    priority: "medium",
    metadata: { scheduledAt: scheduledAt.toISOString(), estimatedDuration, description },
  });
}
