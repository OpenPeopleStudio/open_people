/**
 * Event Backbone - Public API
 *
 * Provides the event bus for emitting events to the transactional outbox,
 * plus utilities for event handling and dispatch.
 */

// Event bus for emission
export {
  createEventBus,
  emitEvent,
  generateIdempotencyKey,
  createEventEnvelope,
  EventBusError,
  type EventBus,
  type EventDataMap,
} from "./bus";

// Type guards
export {
  isAIEvent,
  isPolicyEvent,
  isGuardrailEvent,
  isPIIEvent,
  isHITLEvent,
  isIncidentEvent,
  isTenantEvent,
  isSystemEvent,
} from "./bus";

// Re-export types from types/events.ts
export type {
  EventType,
  EventEnvelope,
  EmitEventOptions,
  EventContext,
  OutboxStatus,
  EventOutboxRow,
  EventDLQRow,
  EventSink,
  SinkDispatchResult,
  EventSinkConfig,
  EventSubscription,
  // AI Events
  AIEventType,
  AIRequestCompletedData,
  AIRequestFailedData,
  AIWorkerQueuedData,
  AIWorkerCompletedData,
  AIWorkerFailedData,
  // Policy Events
  PolicyEventType,
  PolicyDecisionMadeData,
  PolicyViolatedData,
  // Guardrail Events
  GuardrailEventType,
  GuardrailTriggeredData,
  // PII Events
  PIIEventType,
  PIIDetectedData,
  // HITL Events
  HITLEventType,
  HITLItemCreatedData,
  HITLItemCompletedData,
  // Quality Events
  QualityEventType,
  QualityScoredData,
  // Drift Events
  DriftEventType,
  DriftDetectedData,
  // Incident Events
  IncidentEventType,
  IncidentCreatedData,
  // Tenant Events
  TenantEventType,
  TenantCreatedData,
  // System Events
  SystemEventType,
} from "@/types/events";
