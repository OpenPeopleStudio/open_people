/**
 * Notification Bridge
 *
 * Maps platform events to the existing notification system.
 * This bridges the new event backbone to the legacy notification dispatcher.
 */

import type { EventOutboxRow } from "@/types/events";
import type { NotificationEvent, NotificationPriority } from "@/lib/notifications/events";

// ═══════════════════════════════════════════════════════════════════════════
// Event to Notification Mapping
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map an event to a notification (if applicable).
 * Not all events generate notifications - this filters and transforms.
 */
export function mapEventToNotification(
  event: EventOutboxRow
): NotificationEvent | null {
  const mapper = EVENT_NOTIFICATION_MAP[event.event_type];
  if (!mapper) {
    return null;
  }

  return mapper(event);
}

// ═══════════════════════════════════════════════════════════════════════════
// Mapping Configuration
// ═══════════════════════════════════════════════════════════════════════════

type NotificationMapper = (event: EventOutboxRow) => NotificationEvent | null;

const EVENT_NOTIFICATION_MAP: Record<string, NotificationMapper> = {
  // AI Worker Events
  "ai.worker.completed": (event) => {
    const data = event.payload as { job_id: string; worker_id: string };
    if (!event.tenant_id) return null;

    return {
      type: "ai.worker_completed",
      tenantId: event.tenant_id,
      title: `${humanizeWorkerId(data.worker_id)} completed`,
      body: `Your ${humanizeWorkerId(data.worker_id)} job has finished.`,
      priority: "low" as NotificationPriority,
      actionUrl: `/admin/ai/team/${data.worker_id}?job=${data.job_id}`,
      metadata: { job_id: data.job_id, worker_id: data.worker_id },
      ...(event.actor_id ? { userId: event.actor_id } : {}),
    };
  },

  "ai.worker.failed": (event) => {
    const data = event.payload as { job_id: string; worker_id: string; error_message: string };
    if (!event.tenant_id) return null;

    return {
      type: "ai.worker_failed",
      tenantId: event.tenant_id,
      title: `${humanizeWorkerId(data.worker_id)} failed`,
      body: data.error_message || "The job encountered an error.",
      priority: "high" as NotificationPriority,
      actionUrl: `/admin/ai/team/${data.worker_id}?job=${data.job_id}`,
      metadata: { job_id: data.job_id, worker_id: data.worker_id },
      ...(event.actor_id ? { userId: event.actor_id } : {}),
    };
  },

  "ai.quota.warning": (event) => {
    const data = event.payload as { quota_type: string; percentage: number };
    if (!event.tenant_id) return null;

    return {
      type: "ai.quota_exceeded", // Reuse existing type
      tenantId: event.tenant_id,
      title: "AI Usage Warning",
      body: `You've used ${data.percentage}% of your ${data.quota_type} quota.`,
      priority: "medium" as NotificationPriority,
      metadata: data,
    };
  },

  "ai.quota.exceeded": (event) => {
    const data = event.payload as { quota_type: string; action_taken: string };
    if (!event.tenant_id) return null;

    return {
      type: "ai.quota_exceeded",
      tenantId: event.tenant_id,
      title: "AI Quota Exceeded",
      body: `Your ${data.quota_type} quota has been exceeded. ${data.action_taken === "blocked" ? "Requests are being blocked." : ""}`,
      priority: "urgent" as NotificationPriority,
      metadata: data,
    };
  },

  // Guardrail Events
  "guardrail.triggered": (event) => {
    const data = event.payload as { guardrail_type: string; action_taken: string; trigger_reason: string };
    if (!event.tenant_id) return null;

    // Only notify on blocking actions
    if (data.action_taken !== "block") return null;

    return {
      type: "system.incident_reported", // Map to existing type
      tenantId: event.tenant_id,
      title: "Content Blocked",
      body: `A ${data.guardrail_type} guardrail was triggered: ${data.trigger_reason}`,
      priority: "high" as NotificationPriority,
      metadata: data,
    };
  },

  // PII Events
  "pii.detected": (event) => {
    const data = event.payload as { pii_types: string[]; action_taken: string; count: number };
    if (!event.tenant_id) return null;

    // Only notify if not just logged
    if (data.action_taken === "log") return null;

    return {
      type: "system.incident_reported",
      tenantId: event.tenant_id,
      title: "PII Detected",
      body: `${data.count} PII instance(s) detected (${data.pii_types.join(", ")}). Action: ${data.action_taken}`,
      priority: "high" as NotificationPriority,
      metadata: data,
    };
  },

  // HITL Events
  "hitl.item.created": (event) => {
    const data = event.payload as { item_id: string; item_type: string; reason: string; priority: string };
    if (!event.tenant_id) return null;

    return {
      type: "system.incident_reported",
      tenantId: event.tenant_id,
      title: "Review Required",
      body: `A ${data.item_type} requires human review: ${data.reason}`,
      priority: mapPriority(data.priority),
      actionUrl: `/admin/hitl/queue/${data.item_id}`,
      metadata: data,
    };
  },

  // Incident Events
  "incident.created": (event) => {
    const data = event.payload as { incident_id: string; title: string; severity: string };
    if (!event.tenant_id) return null;

    return {
      type: "system.incident_reported",
      tenantId: event.tenant_id,
      title: `Incident: ${data.title}`,
      body: `A ${data.severity} incident has been created.`,
      priority: mapSeverityToPriority(data.severity),
      actionUrl: `/admin/incidents/${data.incident_id}`,
      metadata: data,
    };
  },

  "incident.resolved": (event) => {
    const data = event.payload as { incident_id: string; resolution: string };
    if (!event.tenant_id) return null;

    return {
      type: "system.incident_resolved",
      tenantId: event.tenant_id,
      title: "Incident Resolved",
      body: data.resolution,
      priority: "low" as NotificationPriority,
      actionUrl: `/admin/incidents/${data.incident_id}`,
      metadata: data,
    };
  },

  // Tenant Events
  "tenant.onboarding.completed": (event) => {
    if (!event.tenant_id) return null;

    return {
      type: "tenant.onboarding_complete",
      tenantId: event.tenant_id,
      title: "Welcome to OpenPeople!",
      body: "Your workspace is ready. Let's get started!",
      priority: "medium" as NotificationPriority,
      actionUrl: "/admin",
    };
  },

  "tenant.plan.changed": (event) => {
    const data = event.payload as { old_plan: string; new_plan: string; change_type: string };
    if (!event.tenant_id) return null;

    const typeMap: Record<string, "tenant.plan_upgraded" | "tenant.plan_downgraded"> = {
      upgrade: "tenant.plan_upgraded",
      downgrade: "tenant.plan_downgraded",
    };

    return {
      type: typeMap[data.change_type] ?? "tenant.plan_upgraded",
      tenantId: event.tenant_id,
      title: `Plan ${data.change_type === "upgrade" ? "Upgraded" : "Changed"}`,
      body: `Your plan has been changed from ${data.old_plan} to ${data.new_plan}.`,
      priority: "medium" as NotificationPriority,
      actionUrl: "/admin/billing",
      metadata: data,
    };
  },

  "tenant.usage.threshold": (event) => {
    const data = event.payload as { resource: string; threshold: number; current_usage: number; limit: number };
    if (!event.tenant_id) return null;

    return {
      type: "tenant.usage_threshold_reached",
      tenantId: event.tenant_id,
      title: `${data.resource} Usage Alert`,
      body: `You've reached ${data.threshold}% of your ${data.resource} limit.`,
      priority: data.threshold >= 90 ? "high" : ("medium" as NotificationPriority),
      actionUrl: "/admin/usage",
      metadata: data,
    };
  },

  // System Events
  "system.maintenance.scheduled": (event) => {
    const data = event.payload as { scheduled_start: string; description: string };
    // Platform-wide event, notify all tenants
    if (!event.tenant_id) return null;

    return {
      type: "system.maintenance_scheduled",
      tenantId: event.tenant_id,
      title: "Scheduled Maintenance",
      body: `${data.description} Starting: ${new Date(data.scheduled_start).toLocaleString()}`,
      priority: "medium" as NotificationPriority,
      metadata: data,
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function humanizeWorkerId(workerId: string): string {
  const names: Record<string, string> = {
    "chief-of-staff": "Chief of Staff",
    ops: "Ops Worker",
    "sales-desk": "Sales Desk",
    researcher: "Researcher",
    writer: "Writer",
    "inbox-triage": "Inbox Triage",
    analyst: "Analyst",
  };
  return names[workerId] || workerId;
}

function mapPriority(priority: string): NotificationPriority {
  const map: Record<string, NotificationPriority> = {
    low: "low",
    medium: "medium",
    high: "high",
    urgent: "urgent",
  };
  return map[priority] ?? "medium";
}

function mapSeverityToPriority(severity: string): NotificationPriority {
  const map: Record<string, NotificationPriority> = {
    sev1: "urgent",
    sev2: "high",
    sev3: "medium",
    sev4: "low",
  };
  return map[severity] ?? "medium";
}
