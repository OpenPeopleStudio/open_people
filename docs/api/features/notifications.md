# Notifications API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

This document covers how to add notifications to your features in OpenPeople. The notification system supports multiple channels (in-app, email, webhook, push) with customizable delivery preferences per event type.

## Overview

The notification system consists of:

1. **Event Dispatcher** (`lib/notifications/events.ts`) - Central hub for dispatching notification events
2. **Channel Handlers** - Deliver notifications via in-app, email, SMS, webhook, or push
3. **User Preferences** - Allow users to control which notifications they receive
4. **Audit Trail** - All notifications are logged in `notification_deliveries` for history

## Quick Start

### 1. Import the Dispatcher

```typescript
import { dispatchNotificationEvent, type NotificationEvent } from "@/lib/notifications/events";
```

### 2. Dispatch an Event

```typescript
await dispatchNotificationEvent({
  type: "tenant.usage_threshold_reached",
  tenantId: "uuid-here",
  title: "Storage at 80%",
  body: "Your storage usage is approaching the limit.",
  priority: "medium",
  actionUrl: "/admin/storage",
  metadata: { resource: "storage", percentage: 80 },
});
```

### 3. Use Convenience Functions

For common events, use the pre-built helpers:

```typescript
import {
  notifyOnboardingComplete,
  notifyUsageThreshold,
  notifyEmailDomainVerified,
  notifyAIWorkerFailed,
  notifyOpsTaskFailed,
  notifyStorageQuotaWarning,
  notifyBillingFailed,
  notifySystemMaintenance,
} from "@/lib/notifications/events";

// Example: Notify when onboarding completes
await notifyOnboardingComplete(tenantId, tenantName);

// Example: Notify about usage threshold
await notifyUsageThreshold(tenantId, "API Calls", 90);
```

## Event Types

The following event types are supported with default channel preferences:

| Event Type | In-App | Email | Webhook | Push |
|------------|--------|-------|---------|------|
| `system.maintenance_scheduled` | ✅ | ✅ | ✅ | ❌ |
| `system.incident_reported` | ✅ | ✅ | ✅ | ❌ |
| `system.incident_resolved` | ✅ | ✅ | ✅ | ❌ |
| `tenant.onboarding_complete` | ✅ | ✅ | ❌ | ❌ |
| `tenant.usage_threshold_reached` | ✅ | ✅ | ✅ | ❌ |
| `tenant.plan_upgraded` | ✅ | ✅ | ❌ | ❌ |
| `tenant.plan_downgraded` | ✅ | ✅ | ❌ | ❌ |
| `tenant.billing_failed` | ✅ | ✅ | ✅ | ❌ |
| `tenant.billing_success` | ✅ | ❌ | ❌ | ❌ |
| `email.domain_verified` | ✅ | ✅ | ❌ | ❌ |
| `email.domain_verification_failed` | ✅ | ✅ | ❌ | ❌ |
| `email.delivery_failed` | ✅ | ❌ | ✅ | ❌ |
| `email.bounce_threshold` | ✅ | ✅ | ✅ | ❌ |
| `ai.worker_failed` | ✅ | ❌ | ✅ | ❌ |
| `ai.worker_completed` | ❌ | ❌ | ✅ | ❌ |
| `ai.quota_exceeded` | ✅ | ✅ | ✅ | ❌ |
| `ops.task_failed` | ✅ | ❌ | ✅ | ❌ |
| `ops.task_completed` | ❌ | ❌ | ✅ | ❌ |
| `storage.quota_warning` | ✅ | ✅ | ❌ | ❌ |
| `storage.quota_exceeded` | ✅ | ✅ | ✅ | ❌ |
| `product.feature_released` | ✅ | ❌ | ❌ | ❌ |
| `product.changelog_published` | ✅ | ❌ | ❌ | ❌ |

## Adding a New Event Type

### Step 1: Add the Event Type

In `lib/notifications/events.ts`, add your new event type to the `NotificationEventType` union:

```typescript
export type NotificationEventType =
  // ... existing types
  | "your_feature.event_name";
```

### Step 2: Set Default Channel Preferences

Add the default channel preferences for your event:

```typescript
const DEFAULT_CHANNEL_PREFERENCES: Record<NotificationEventType, ChannelPreferences> = {
  // ... existing preferences
  "your_feature.event_name": { inApp: true, email: false, webhook: true, push: false },
};
```

### Step 3: Add a Convenience Function (Optional)

Create a helper function for easy dispatching:

```typescript
export async function notifyYourFeatureEvent(
  tenantId: string,
  customParam: string
): Promise<NotificationDispatchResult> {
  return dispatchNotificationEvent({
    type: "your_feature.event_name",
    tenantId,
    title: "Your Feature Event Title",
    body: `Something happened with ${customParam}.`,
    priority: "medium",
    actionUrl: `/admin/your-feature`,
    metadata: { customParam },
  });
}
```

### Step 4: Hook Into Your Feature

In your API route or service, import and call the dispatcher:

```typescript
import { notifyYourFeatureEvent } from "@/lib/notifications/events";

// In your route handler or service
if (someCondition) {
  // Fire and forget - don't block the response
  notifyYourFeatureEvent(tenantId, someValue).catch((err) => {
    console.error("Failed to send notification:", err);
  });
}
```

## Notification Priority

Priority levels affect the visual styling and urgency of notifications:

- `low` - Informational, non-urgent
- `medium` - Standard importance
- `high` - Requires attention
- `urgent` - Critical, requires immediate action

## Channel Configuration

### In-App Notifications

In-app notifications appear in the user's notification inbox. They are stored in the `in_app_notifications` table with read/unread state.

### Email Notifications

Email notifications are sent via Resend. They use a consistent HTML template with the notification title, body, and optional action button.

### Webhook Notifications

Webhooks POST to the tenant's configured `notification_webhook_url` (stored in `tenants.settings`). The payload includes:

```json
{
  "event": "event.type.here",
  "tenant_id": "uuid",
  "title": "Notification title",
  "body": "Notification body text",
  "priority": "medium",
  "metadata": { ... },
  "timestamp": "2026-01-20T12:00:00Z"
}
```

Webhooks include these headers:
- `X-OpenPeople-Event` - The event type
- `X-OpenPeople-Signature` - HMAC signature for verification

### Push Notifications (Coming Soon)

Push notifications will integrate with FCM for mobile apps.

## User Preferences

Users can control their notification preferences per channel:

```typescript
// Check if user has disabled a channel
const { data: userPref } = await supabase
  .from("user_notification_preferences")
  .select("enabled, quiet_hours_start, quiet_hours_end")
  .eq("user_id", userId)
  .eq("tenant_id", tenantId)
  .eq("channel", "email")
  .single();

if (userPref?.enabled === false) {
  // Skip sending to this channel
}
```

## Overriding Default Channels

You can override the default channels when dispatching:

```typescript
await dispatchNotificationEvent({
  type: "tenant.usage_threshold_reached",
  tenantId,
  title: "Critical: Storage Full",
  body: "Your storage is completely full.",
  priority: "urgent",
  channels: {
    inApp: true,
    email: true,
    webhook: true,
    push: true, // Enable push even though default is false
  },
});
```

## Audit Trail

All dispatched notifications are logged in `notification_deliveries` with:
- Event type and metadata
- Channel delivery results
- Success/failure status
- Timestamps

Query the audit trail:

```typescript
const { data: history } = await supabase
  .from("notification_deliveries")
  .select("*")
  .eq("tenant_id", tenantId)
  .order("created_at", { ascending: false })
  .limit(50);
```

## Best Practices

1. **Fire and Forget** - Don't await notifications in critical paths; use `.catch()` to log errors without blocking.

2. **Be Specific** - Use specific event types rather than generic ones for better analytics.

3. **Include Action URLs** - Always include an `actionUrl` when the user should take action.

4. **Use Appropriate Priority** - Reserve `urgent` for truly critical events.

5. **Add Metadata** - Include relevant metadata for debugging and analytics.

6. **Test Channels** - Verify all channels work during development.

7. **Document New Events** - Update this documentation when adding new event types.

## Analytics

Notification metrics are available in the Super Admin Analytics dashboard under the "Notifications" tab, showing:
- SMS/In-App/Push counts and delivery rates
- Top tenants by notification volume
- Subscription tiers and MRR
- Recent subscriptions

## Related Files

- `lib/notifications/events.ts` - Event dispatcher
- `lib/notifications/client.ts` - Client-side helpers
- `lib/notifications/twilio.ts` - SMS via Twilio
- `types/notifications.ts` - Type definitions
- `lib/analytics/notification-metrics.ts` - Analytics helper
- `app/api/notifications/` - Notification API routes
