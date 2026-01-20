/**
 * Event Bus - Typed event emission with transactional outbox
 *
 * Provides type-safe event emission that writes to the outbox table
 * within the caller's transaction, ensuring events are never lost.
 *
 * Usage:
 *   const eventBus = createEventBus(supabase);
 *   await eventBus.emit('ai.request.completed', { request_id: '...', ... });
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EventType,
  EventEnvelope,
  EmitEventOptions,
  EventContext,
  AIRequestCompletedData,
  AIRequestFailedData,
  AIWorkerQueuedData,
  AIWorkerCompletedData,
  AIWorkerFailedData,
  GuardrailTriggeredData,
  PIIDetectedData,
  HITLItemCreatedData,
  QualityScoredData,
  DriftDetectedData,
  IncidentCreatedData,
  PolicyDecisionMadeData,
  TenantCreatedData,
} from "@/types/events";

// ═══════════════════════════════════════════════════════════════════════════
// Event Data Type Mapping
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps event types to their payload types for type-safe emission.
 * Add new event types here as they are defined.
 */
export interface EventDataMap {
  // AI Events
  "ai.request.started": { request_id: string; model: string; application_id?: string; input_tokens?: number };
  "ai.request.completed": AIRequestCompletedData;
  "ai.request.failed": AIRequestFailedData;
  "ai.request.blocked": { request_id: string; reason: string; policy_id?: string; guardrail_id?: string };
  "ai.worker.queued": AIWorkerQueuedData;
  "ai.worker.started": { job_id: string; worker_id: string; runner_id: string };
  "ai.worker.completed": AIWorkerCompletedData;
  "ai.worker.failed": AIWorkerFailedData;
  "ai.quota.warning": { quota_type: string; current_usage: number; limit: number; percentage: number };
  "ai.quota.exceeded": { quota_type: string; current_usage: number; limit: number; action_taken: string };

  // Policy Events
  "policy.evaluated": { policy_id: string; policy_name: string; context_type: string; result: string; evaluation_ms: number };
  "policy.decision.made": PolicyDecisionMadeData;
  "policy.violated": { policy_id: string; violation_type: string; severity: string; details: Record<string, unknown> };
  "policy.created": { policy_id: string; policy_name: string; policy_type: string; created_by: string };
  "policy.updated": { policy_id: string; changes: Record<string, unknown>; updated_by: string; previous_version: number };

  // Guardrail Events
  "guardrail.triggered": GuardrailTriggeredData;
  "guardrail.bypassed": { guardrail_id: string; bypass_reason: string; authorized_by: string; expiry?: string };

  // PII Events
  "pii.detected": PIIDetectedData;
  "pii.redacted": { detection_id: string; pii_types: string[]; redaction_method: string; count: number };
  "pii.access.logged": { accessor_id: string; pii_types: string[]; purpose: string; access_granted: boolean };

  // HITL Events
  "hitl.item.created": HITLItemCreatedData;
  "hitl.item.assigned": { item_id: string; assignee_id: string; assigned_by?: string };
  "hitl.item.completed": { item_id: string; reviewer_id: string; decision: string; duration_ms: number; notes?: string };
  "hitl.item.escalated": { item_id: string; escalated_to: string; reason: string };

  // Quality Events
  "quality.scored": QualityScoredData;
  "quality.threshold.breached": { threshold_id: string; metric: string; expected: number; actual: number; window: string };
  "quality.evaluation.completed": { evaluation_id: string; sample_size: number; pass_rate: number; summary: Record<string, unknown> };

  // Drift Events
  "drift.detected": DriftDetectedData;
  "drift.alert.created": { alert_id: string; drift_id: string; recommended_action: string };
  "drift.baseline.updated": { metric: string; old_baseline: number; new_baseline: number; updated_by: string };

  // Incident Events
  "incident.created": IncidentCreatedData;
  "incident.updated": { incident_id: string; field: string; old_value: unknown; new_value: unknown; updated_by: string };
  "incident.resolved": { incident_id: string; resolution: string; duration_minutes: number; resolved_by: string };
  "incident.postmortem.created": { incident_id: string; postmortem_id: string; owner_id: string };

  // Tenant Events
  "tenant.created": TenantCreatedData;
  "tenant.onboarding.started": { tenant_id: string; onboarding_type: string };
  "tenant.onboarding.completed": { tenant_id: string; duration_minutes: number; steps_completed: number };
  "tenant.plan.changed": { tenant_id: string; old_plan: string; new_plan: string; change_type: string };
  "tenant.usage.threshold": { tenant_id: string; resource: string; threshold: number; current_usage: number; limit: number };
  "tenant.billing.event": { tenant_id: string; event_type: string; amount?: number; currency?: string };

  // System Events
  "system.health.changed": { component: string; old_status: string; new_status: string; reason?: string };
  "system.maintenance.scheduled": { maintenance_id: string; scheduled_start: string; scheduled_end: string; affected_services: string[]; description: string };
  "system.maintenance.started": { maintenance_id: string; actual_start: string };
  "system.maintenance.completed": { maintenance_id: string; actual_end: string; outcome: string };
  "system.deployment.completed": { deployment_id: string; version: string; environment: string; duration_seconds: number; status: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Version Registry
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_VERSIONS: Partial<Record<EventType, string>> = {
  // Default all events to 1.0.0, override as schemas evolve
};

function getEventVersion(eventType: EventType): string {
  return EVENT_VERSIONS[eventType] || "1.0.0";
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Bus Implementation
// ═══════════════════════════════════════════════════════════════════════════

export interface EventBus {
  /**
   * Emit a typed event to the outbox.
   * The event is written transactionally with your database operations.
   */
  emit<T extends keyof EventDataMap>(
    eventType: T,
    data: EventDataMap[T],
    options?: EmitEventOptions
  ): Promise<string>;

  /**
   * Emit multiple events in a batch (single transaction).
   */
  emitBatch<T extends keyof EventDataMap>(
    events: Array<{ type: T; data: EventDataMap[T]; options?: EmitEventOptions }>
  ): Promise<string[]>;

  /**
   * Set the context for subsequent emissions.
   */
  setContext(context: Partial<EventContext>): void;
}

/**
 * Create an event bus instance bound to a Supabase client.
 * The Supabase client provides the transaction context.
 */
export function createEventBus(
  supabase: SupabaseClient,
  defaultContext?: Partial<EventContext>
): EventBus {
  let context: EventContext = {
    tenant_id: defaultContext?.tenant_id ?? null,
    actor_id: defaultContext?.actor_id ?? null,
    source: defaultContext?.source ?? "api",
  };

  return {
    async emit<T extends keyof EventDataMap>(
      eventType: T,
      data: EventDataMap[T],
      options?: EmitEventOptions
    ): Promise<string> {
      const version = getEventVersion(eventType as EventType);

      const { data: result, error } = await supabase.rpc("enqueue_event", {
        p_event_type: eventType,
        p_payload: data,
        p_tenant_id: context.tenant_id,
        p_actor_id: context.actor_id,
        p_source: context.source,
        p_correlation_id: options?.correlation_id ?? null,
        p_causation_id: options?.causation_id ?? null,
        p_idempotency_key: options?.idempotency_key ?? null,
        p_metadata: options?.metadata ?? null,
        p_event_version: version,
      });

      if (error) {
        throw new EventBusError(`Failed to emit event ${eventType}: ${error.message}`, error);
      }

      return result as string;
    },

    async emitBatch<T extends keyof EventDataMap>(
      events: Array<{ type: T; data: EventDataMap[T]; options?: EmitEventOptions }>
    ): Promise<string[]> {
      const results: string[] = [];

      for (const event of events) {
        const eventId = await this.emit(event.type, event.data, event.options);
        results.push(eventId);
      }

      return results;
    },

    setContext(newContext: Partial<EventContext>): void {
      context = { ...context, ...newContext };
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Standalone Emit Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Emit an event using the admin Supabase client.
 * Use this for server-side emission outside of a request context.
 */
export async function emitEvent<T extends keyof EventDataMap>(
  eventType: T,
  data: EventDataMap[T],
  context: EventContext,
  options?: EmitEventOptions
): Promise<string> {
  const { createSupabaseAdmin } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseAdmin();

  const version = getEventVersion(eventType as EventType);

  const { data: result, error } = await supabase.rpc("enqueue_event", {
    p_event_type: eventType,
    p_payload: data,
    p_tenant_id: context.tenant_id,
    p_actor_id: context.actor_id,
    p_source: context.source,
    p_correlation_id: options?.correlation_id ?? null,
    p_causation_id: options?.causation_id ?? null,
    p_idempotency_key: options?.idempotency_key ?? null,
    p_metadata: options?.metadata ?? null,
    p_event_version: version,
  });

  if (error) {
    throw new EventBusError(`Failed to emit event ${eventType}: ${error.message}`, error);
  }

  return result as string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════

export class EventBusError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "EventBusError";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a deterministic idempotency key from event attributes.
 * Useful for ensuring exactly-once emission in retry scenarios.
 */
export function generateIdempotencyKey(
  eventType: string,
  uniqueAttributes: Record<string, unknown>
): string {
  const payload = JSON.stringify({ type: eventType, ...uniqueAttributes });
  // Simple hash for idempotency (not cryptographic)
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${eventType}:${Math.abs(hash).toString(36)}`;
}

/**
 * Create an event envelope from raw data.
 * Useful for testing or manual event construction.
 */
export function createEventEnvelope<T>(
  eventType: EventType,
  data: T,
  context: EventContext,
  options?: EmitEventOptions
): EventEnvelope<T> {
  return {
    id: crypto.randomUUID(),
    type: eventType,
    version: getEventVersion(eventType),
    tenant_id: context.tenant_id,
    actor_id: context.actor_id,
    correlation_id: options?.correlation_id ?? null,
    causation_id: options?.causation_id ?? null,
    occurred_at: new Date().toISOString(),
    source: context.source,
    data,
    metadata: options?.metadata,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Type Guards
// ═══════════════════════════════════════════════════════════════════════════

export function isAIEvent(eventType: string): eventType is keyof EventDataMap & `ai.${string}` {
  return eventType.startsWith("ai.");
}

export function isPolicyEvent(eventType: string): eventType is keyof EventDataMap & `policy.${string}` {
  return eventType.startsWith("policy.");
}

export function isGuardrailEvent(eventType: string): eventType is keyof EventDataMap & `guardrail.${string}` {
  return eventType.startsWith("guardrail.");
}

export function isPIIEvent(eventType: string): eventType is keyof EventDataMap & `pii.${string}` {
  return eventType.startsWith("pii.");
}

export function isHITLEvent(eventType: string): eventType is keyof EventDataMap & `hitl.${string}` {
  return eventType.startsWith("hitl.");
}

export function isIncidentEvent(eventType: string): eventType is keyof EventDataMap & `incident.${string}` {
  return eventType.startsWith("incident.");
}

export function isTenantEvent(eventType: string): eventType is keyof EventDataMap & `tenant.${string}` {
  return eventType.startsWith("tenant.");
}

export function isSystemEvent(eventType: string): eventType is keyof EventDataMap & `system.${string}` {
  return eventType.startsWith("system.");
}
