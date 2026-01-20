# Platform Event Backbone

> **Status:** Active  
> **Version:** 1.0.0  
> **Last Updated:** January 2026

## Overview

The platform event backbone provides a unified, transactional event system for internal communication between subsystems. Events are written to an outbox table within the same database transaction as domain changes, then dispatched asynchronously to various sinks (notifications, webhooks, analytics).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENT BACKBONE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Domain     │     │   Event      │     │   Outbox     │                 │
│  │   Service    │────▶│   Emitter    │────▶│   Table      │                 │
│  │              │     │              │     │              │                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│        │                                          │                          │
│        │ (same transaction)                       │                          │
│        ▼                                          ▼                          │
│  ┌──────────────┐                         ┌──────────────┐                  │
│  │   Domain     │                         │  Dispatcher  │                  │
│  │   Tables     │                         │   Worker     │                  │
│  └──────────────┘                         └──────────────┘                  │
│                                                   │                          │
│                                    ┌──────────────┼──────────────┐          │
│                                    ▼              ▼              ▼          │
│                             ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│                             │ Notif.   │  │ Webhook  │  │ Audit/   │       │
│                             │ Bridge   │  │ Publisher│  │ Analytics│       │
│                             └──────────┘  └──────────┘  └──────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Envelope

Every event follows a standard envelope format:

```typescript
interface EventEnvelope<T = unknown> {
  // Identity
  id: string;                    // UUID v7 (time-ordered)
  type: string;                  // Canonical event type (e.g., "ai.request.completed")
  version: string;               // Schema version (semver, e.g., "1.0.0")
  
  // Context
  tenant_id: string | null;      // Tenant scope (null for platform events)
  actor_id: string | null;       // User/service that caused the event
  correlation_id: string | null; // Request/trace correlation
  causation_id: string | null;   // ID of event that caused this event
  
  // Timing
  occurred_at: string;           // ISO 8601 timestamp when event occurred
  
  // Payload
  data: T;                       // Event-specific payload
  
  // Metadata
  source: string;                // Service/component that emitted (e.g., "api.ai")
  metadata?: Record<string, unknown>;
}
```

## Event Categories

| Category | Prefix | Description |
|----------|--------|-------------|
| AI Operations | `ai.*` | AI request lifecycle, worker jobs, model events |
| Policy | `policy.*` | Policy evaluation, decisions, violations |
| Guardrails | `guardrail.*` | Safety checks, content filtering |
| PII | `pii.*` | PII detection, redaction, compliance |
| HITL | `hitl.*` | Human-in-the-loop items, approvals |
| Quality | `quality.*` | Quality scoring, evaluation |
| Drift | `drift.*` | Model/data drift detection |
| Incidents | `incident.*` | Incident lifecycle, alerts |
| Tenant | `tenant.*` | Tenant lifecycle, billing, usage |
| System | `system.*` | Platform health, maintenance |

## Versioning Strategy

Events use semantic versioning for their schemas:

- **Major (1.x.x → 2.x.x)**: Breaking changes requiring consumer updates
- **Minor (1.0.x → 1.1.x)**: Backwards-compatible additions
- **Patch (1.0.0 → 1.0.1)**: Documentation or metadata fixes

Consumers should:
1. Handle unknown fields gracefully (forward compatibility)
2. Subscribe to specific major versions
3. Use schema validation on critical paths

## Related Documentation

- [Event Catalog](./catalog.md) - Complete list of event types
- [Schemas](./schemas/) - JSON Schema definitions
- [Migration Guide](./migrations.md) - Schema upgrade paths
