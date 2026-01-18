import type {
  SendNotificationRequest,
  SendNotificationResponse,
  InAppNotification,
  UserNotificationPreference,
  NotificationChannel,
} from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   OpenPeople Notifications Client
   Helper for sending notifications and managing inbox
   ═══════════════════════════════════════════════════════════════════════════ */

// Server-side: Send a notification
export async function sendNotification(
  request: SendNotificationRequest
): Promise<SendNotificationResponse> {
  try {
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Failed to send notification",
      };
    }

    return {
      success: true,
      deliveryId: data.deliveryId,
      providerId: data.providerId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send SMS shorthand
export async function sendSMS(
  phoneNumber: string,
  message: string,
  options?: {
    templateId?: string;
    templateVariables?: Record<string, string>;
    recipientUserId?: string;
  }
): Promise<SendNotificationResponse> {
  return sendNotification({
    channel: "sms",
    recipient: phoneNumber,
    body: message,
    ...options,
  });
}

// Send in-app notification shorthand
export async function sendInAppNotification(
  userId: string,
  title: string,
  body: string,
  options?: {
    actionUrl?: string;
    icon?: string;
    templateId?: string;
    templateVariables?: Record<string, string>;
  }
): Promise<SendNotificationResponse> {
  return sendNotification({
    channel: "in_app",
    recipient: userId,
    recipientUserId: userId,
    subject: title,
    body,
    metadata: {
      action_url: options?.actionUrl,
      icon: options?.icon,
    },
    templateId: options?.templateId,
    templateVariables: options?.templateVariables,
  });
}

// Client-side: Fetch user's inbox
export async function fetchInbox(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  notifications: InAppNotification[];
  total: number;
  unread: number;
}> {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set("unread", "true");
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());

  const res = await fetch(`/api/notifications/inbox?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch inbox");
  }

  return {
    notifications: data.notifications,
    total: data.total,
    unread: data.unread,
  };
}

// Client-side: Mark notifications as read
export async function markAsRead(
  notificationIds: string[]
): Promise<boolean> {
  const res = await fetch("/api/notifications/inbox", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationIds }),
  });

  return res.ok;
}

// Client-side: Mark all as read
export async function markAllAsRead(): Promise<boolean> {
  const res = await fetch("/api/notifications/inbox", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markAllRead: true }),
  });

  return res.ok;
}

// Client-side: Fetch user preferences
export async function fetchPreferences(): Promise<
  Record<NotificationChannel, {
    enabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }>
> {
  const res = await fetch("/api/notifications/preferences");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch preferences");
  }

  return data.preferences;
}

// Client-side: Update user preference
export async function updatePreference(
  channel: NotificationChannel,
  enabled: boolean,
  quietHours?: { start: string; end: string }
): Promise<boolean> {
  const res = await fetch("/api/notifications/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel,
      enabled,
      quietHoursStart: quietHours?.start,
      quietHoursEnd: quietHours?.end,
    }),
  });

  return res.ok;
}

// React hook for in-app notifications
export function useNotifications() {
  if (typeof window === "undefined") {
    return {
      fetchInbox: async () => ({ notifications: [], total: 0, unread: 0 }),
      markAsRead: async () => false,
      markAllAsRead: async () => false,
      fetchPreferences: async () => ({}),
      updatePreference: async () => false,
    };
  }

  return {
    fetchInbox,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreference,
  };
}
