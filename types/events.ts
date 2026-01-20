/**
 * Platform Event Types
 *
 * Canonical event types for the internal event backbone.
 * Events are written transactionally to an outbox, then dispatched
 * asynchronously to various sinks (notifications, webhooks, analytics).
 */

// ═══════════════════════════════════════════════════════════════════════════
// Event Envelope
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard envelope wrapping all platform events.
 * Every event follows this structure for consistent handling.
 */
export interface EventEnvelope<T = unknown> {
  /** Unique event identifier (UUID v7 for time-ordering) */
  id: string;
  /** Canonical event type (e.g., "ai.request.completed") */
  type: EventType;
  /** Schema version (semver, e.g., "1.0.0") */
  version: string;

  /** Tenant scope (null for platform-wide events) */
  tenant_id: string | null;
  /** User or service that caused this event */
  actor_id: string | null;
  /** Request/trace correlation identifier */
  correlation_id: string | null;
  /** ID of the event that caused this event (event chaining) */
  causation_id: string | null;

  /** When the event occurred (ISO 8601) */
  occurred_at: string;

  /** Service/component that emitted this event */
  source: string;
  /** Event-specific payload */
  data: T;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Type Taxonomy
// ═══════════════════════════════════════════════════════════════════════════

/** AI operation events */
export type AIEventType =
  | "ai.request.started"
  | "ai.request.completed"
  | "ai.request.failed"
  | "ai.request.blocked"
  | "ai.worker.queued"
  | "ai.worker.started"
  | "ai.worker.completed"
  | "ai.worker.failed"
  | "ai.quota.warning"
  | "ai.quota.exceeded";

/** Policy evaluation events */
export type PolicyEventType =
  | "policy.evaluated"
  | "policy.decision.made"
  | "policy.violated"
  | "policy.created"
  | "policy.updated";

/** Guardrail events */
export type GuardrailEventType =
  | "guardrail.triggered"
  | "guardrail.bypassed";

/** PII handling events */
export type PIIEventType =
  | "pii.detected"
  | "pii.redacted"
  | "pii.access.logged";

/** Human-in-the-loop events */
export type HITLEventType =
  | "hitl.item.created"
  | "hitl.item.assigned"
  | "hitl.item.completed"
  | "hitl.item.escalated";

/** Quality evaluation events */
export type QualityEventType =
  | "quality.scored"
  | "quality.threshold.breached"
  | "quality.evaluation.completed";

/** Drift detection events */
export type DriftEventType =
  | "drift.detected"
  | "drift.alert.created"
  | "drift.baseline.updated";

/** Incident management events */
export type IncidentEventType =
  | "incident.created"
  | "incident.updated"
  | "incident.resolved"
  | "incident.postmortem.created";

/** Tenant lifecycle events */
export type TenantEventType =
  | "tenant.created"
  | "tenant.onboarding.started"
  | "tenant.onboarding.completed"
  | "tenant.plan.changed"
  | "tenant.usage.threshold"
  | "tenant.billing.event";

/** System/platform events */
export type SystemEventType =
  | "system.health.changed"
  | "system.maintenance.scheduled"
  | "system.maintenance.started"
  | "system.maintenance.completed"
  | "system.deployment.completed";

/** All event types */
export type EventType =
  | AIEventType
  | PolicyEventType
  | GuardrailEventType
  | PIIEventType
  | HITLEventType
  | QualityEventType
  | DriftEventType
  | IncidentEventType
  | TenantEventType
  | SystemEventType;

// ═══════════════════════════════════════════════════════════════════════════
// Event Payload Types
// ═══════════════════════════════════════════════════════════════════════════

// --- AI Events ---

export interface AIRequestStartedData {
  request_id: string;
  model: string;
  application_id?: string;
  input_tokens?: number;
}

export interface AIRequestCompletedData {
  request_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cached?: boolean;
}

export interface AIRequestFailedData {
  request_id: string;
  error_code: string;
  error_message: string;
  retryable: boolean;
}

export interface AIRequestBlockedData {
  request_id: string;
  reason: string;
  policy_id?: string;
  guardrail_id?: string;
}

export interface AIWorkerQueuedData {
  job_id: string;
  worker_id: string;
  job_type: string;
  priority?: number;
}

export interface AIWorkerStartedData {
  job_id: string;
  worker_id: string;
  runner_id: string;
}

export interface AIWorkerCompletedData {
  job_id: string;
  worker_id: string;
  duration_ms: number;
  result_summary?: Record<string, unknown>;
}

export interface AIWorkerFailedData {
  job_id: string;
  worker_id: string;
  error_code: string;
  error_message: string;
  attempt: number;
  will_retry: boolean;
}

export interface AIQuotaWarningData {
  quota_type: "tokens" | "requests" | "cost";
  current_usage: number;
  limit: number;
  percentage: number;
}

export interface AIQuotaExceededData {
  quota_type: "tokens" | "requests" | "cost";
  current_usage: number;
  limit: number;
  action_taken: "blocked" | "throttled" | "warned";
}

// --- Policy Events ---

export interface PolicyEvaluatedData {
  policy_id: string;
  policy_name: string;
  context_type: string;
  result: "allow" | "deny" | "warn";
  evaluation_ms: number;
}

export interface PolicyDecisionMadeData {
  policy_id: string;
  decision: string;
  confidence: number;
  factors: Array<{ factor: string; weight: number }>;
}

export interface PolicyViolatedData {
  policy_id: string;
  violation_type: string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
}

// --- Guardrail Events ---

export interface GuardrailTriggeredData {
  guardrail_id: string;
  guardrail_type: "content" | "safety" | "format";
  trigger_reason: string;
  action_taken: "block" | "warn" | "modify" | "log";
  confidence: number;
}

export interface GuardrailBypassedData {
  guardrail_id: string;
  bypass_reason: string;
  authorized_by: string;
  expiry?: string;
}

// --- PII Events ---

export interface PIIDetectedData {
  detection_id: string;
  pii_types: string[];
  location: "input" | "output" | "both";
  action_taken: "redact" | "warn" | "block" | "log";
  count: number;
}

export interface PIIRedactedData {
  detection_id: string;
  pii_types: string[];
  redaction_method: string;
  count: number;
}

// --- HITL Events ---

export interface HITLItemCreatedData {
  item_id: string;
  item_type: string;
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  deadline?: string;
}

export interface HITLItemCompletedData {
  item_id: string;
  reviewer_id: string;
  decision: "approve" | "reject" | "escalate";
  duration_ms: number;
  notes?: string;
}

// --- Quality Events ---

export interface QualityScoredData {
  score_id: string;
  target_type: string;
  target_id: string;
  overall_score: number;
  dimensions: Record<string, number>;
}

export interface QualityThresholdBreachedData {
  threshold_id: string;
  metric: string;
  expected: number;
  actual: number;
  window: string;
}

// --- Drift Events ---

export interface DriftDetectedData {
  drift_id: string;
  drift_type: "model" | "data" | "concept" | "performance";
  severity: "low" | "medium" | "high";
  metric: string;
  baseline: number;
  current: number;
  deviation: number;
}

// --- Incident Events ---

export interface IncidentCreatedData {
  incident_id: string;
  title: string;
  severity: "sev1" | "sev2" | "sev3" | "sev4";
  source: string;
  affected_services: string[];
}

export interface IncidentResolvedData {
  incident_id: string;
  resolution: string;
  duration_minutes: number;
  resolved_by: string;
}

// --- Tenant Events ---

export interface TenantCreatedData {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  created_by: string;
}

export interface TenantPlanChangedData {
  tenant_id: string;
  old_plan: string;
  new_plan: string;
  change_type: "upgrade" | "downgrade" | "cancel";
}

export interface TenantUsageThresholdData {
  tenant_id: string;
  resource: string;
  threshold: number;
  current_usage: number;
  limit: number;
}

// --- System Events ---

export interface SystemHealthChangedData {
  component: string;
  old_status: string;
  new_status: string;
  reason?: string;
}

export interface SystemMaintenanceScheduledData {
  maintenance_id: string;
  scheduled_start: string;
  scheduled_end: string;
  affected_services: string[];
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Outbox Types
// ═══════════════════════════════════════════════════════════════════════════

/** Status of an event in the outbox */
export type OutboxStatus = "pending" | "processing" | "dispatched" | "failed" | "dlq";

/** Event outbox row (mirrors DB schema) */
export interface EventOutboxRow {
  id: string;
  event_id: string;
  event_type: EventType;
  event_version: string;
  tenant_id: string | null;
  actor_id: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  source: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  status: OutboxStatus;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  last_error: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  dispatched_at: string | null;
}

/** Dead letter queue row */
export interface EventDLQRow {
  id: string;
  outbox_id: string;
  event_type: EventType;
  tenant_id: string | null;
  payload: Record<string, unknown>;
  final_error: string;
  total_attempts: number;
  can_replay: boolean;
  replayed_at: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatch Types
// ═══════════════════════════════════════════════════════════════════════════

/** Target sink for event dispatch */
export type EventSink = "notification" | "webhook" | "audit" | "analytics";

/** Dispatch result for a single sink */
export interface SinkDispatchResult {
  sink: EventSink;
  success: boolean;
  sink_id?: string;
  error?: string;
  latency_ms: number;
}

/** Configuration for event routing to sinks */
export interface EventSinkConfig {
  sink: EventSink;
  enabled: boolean;
  event_types?: EventType[];
  filter?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Types
// ═══════════════════════════════════════════════════════════════════════════

/** Options for emitting an event */
export interface EmitEventOptions {
  /** Idempotency key for deduplication */
  idempotency_key?: string;
  /** Correlation ID for request tracing */
  correlation_id?: string;
  /** ID of causing event (for event chains) */
  causation_id?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Delay dispatch (ISO 8601 timestamp) */
  delay_until?: string;
}

/** Context passed to event emission */
export interface EventContext {
  tenant_id: string | null;
  actor_id: string | null;
  source: string;
}

/** Event subscription for reactive handlers */
export interface EventSubscription {
  id: string;
  event_types: EventType[];
  handler: string;
  filter?: Record<string, unknown>;
  enabled: boolean;
}
