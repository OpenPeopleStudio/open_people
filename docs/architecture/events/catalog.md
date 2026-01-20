# Event Catalog

> **Version:** 1.0.0  
> **Last Updated:** January 2026

This document catalogs all canonical event types in the platform event backbone.

---

## AI Operations (`ai.*`)

Events related to AI request processing, worker jobs, and model operations.

### `ai.request.started`
Emitted when an AI request begins processing.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique request identifier |
| `model` | string | Model being used |
| `application_id` | string? | Application context |
| `input_tokens` | number? | Estimated input tokens |

### `ai.request.completed`
Emitted when an AI request completes successfully.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique request identifier |
| `model` | string | Model used |
| `input_tokens` | number | Actual input tokens |
| `output_tokens` | number | Output tokens generated |
| `latency_ms` | number | Total processing time |
| `cached` | boolean | Whether response was cached |

### `ai.request.failed`
Emitted when an AI request fails.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique request identifier |
| `error_code` | string | Error classification |
| `error_message` | string | Human-readable error |
| `retryable` | boolean | Whether request can be retried |

### `ai.request.blocked`
Emitted when an AI request is blocked by policy or guardrails.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Unique request identifier |
| `reason` | string | Block reason category |
| `policy_id` | string? | Policy that triggered block |
| `guardrail_id` | string? | Guardrail that triggered block |

### `ai.worker.queued`
Emitted when a background AI worker job is queued.

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `worker_id` | string | Worker type (chief-of-staff, ops, etc.) |
| `job_type` | string | Specific job type |
| `priority` | number | Job priority (higher = sooner) |

### `ai.worker.started`
Emitted when a worker begins processing a job.

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `worker_id` | string | Worker type |
| `runner_id` | string | Runner instance ID |

### `ai.worker.completed`
Emitted when a worker job completes successfully.

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `worker_id` | string | Worker type |
| `duration_ms` | number | Processing duration |
| `result_summary` | object? | Optional result metadata |

### `ai.worker.failed`
Emitted when a worker job fails.

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | Job identifier |
| `worker_id` | string | Worker type |
| `error_code` | string | Error classification |
| `error_message` | string | Human-readable error |
| `attempt` | number | Attempt number |
| `will_retry` | boolean | Whether job will be retried |

### `ai.quota.warning`
Emitted when AI usage approaches quota limits.

| Field | Type | Description |
|-------|------|-------------|
| `quota_type` | string | Type of quota (tokens, requests, cost) |
| `current_usage` | number | Current usage amount |
| `limit` | number | Configured limit |
| `percentage` | number | Usage percentage (0-100) |

### `ai.quota.exceeded`
Emitted when AI usage exceeds quota limits.

| Field | Type | Description |
|-------|------|-------------|
| `quota_type` | string | Type of quota |
| `current_usage` | number | Current usage amount |
| `limit` | number | Configured limit |
| `action_taken` | string | What action was taken (blocked, throttled) |

---

## Policy (`policy.*`)

Events related to policy evaluation and enforcement.

### `policy.evaluated`
Emitted when a policy is evaluated (regardless of outcome).

| Field | Type | Description |
|-------|------|-------------|
| `policy_id` | string | Policy identifier |
| `policy_name` | string | Policy display name |
| `context_type` | string | Evaluation context (request, response, etc.) |
| `result` | string | allow, deny, or warn |
| `evaluation_ms` | number | Evaluation duration |

### `policy.decision.made`
Emitted when a policy makes an enforcement decision.

| Field | Type | Description |
|-------|------|-------------|
| `policy_id` | string | Policy identifier |
| `decision` | string | The decision made |
| `confidence` | number | Decision confidence (0-1) |
| `factors` | object[] | Contributing factors |

### `policy.violated`
Emitted when a policy violation is detected.

| Field | Type | Description |
|-------|------|-------------|
| `policy_id` | string | Policy identifier |
| `violation_type` | string | Type of violation |
| `severity` | string | low, medium, high, critical |
| `details` | object | Violation details |

### `policy.created`
Emitted when a new policy is created.

| Field | Type | Description |
|-------|------|-------------|
| `policy_id` | string | Policy identifier |
| `policy_name` | string | Policy display name |
| `policy_type` | string | Policy category |
| `created_by` | string | User who created |

### `policy.updated`
Emitted when a policy is modified.

| Field | Type | Description |
|-------|------|-------------|
| `policy_id` | string | Policy identifier |
| `changes` | object | What changed |
| `updated_by` | string | User who updated |
| `previous_version` | number | Previous version number |

---

## Guardrails (`guardrail.*`)

Events related to safety guardrails and content filtering.

### `guardrail.triggered`
Emitted when a guardrail check triggers.

| Field | Type | Description |
|-------|------|-------------|
| `guardrail_id` | string | Guardrail identifier |
| `guardrail_type` | string | Type (content, safety, format) |
| `trigger_reason` | string | Why it triggered |
| `action_taken` | string | block, warn, modify, log |
| `confidence` | number | Detection confidence (0-1) |

### `guardrail.bypassed`
Emitted when a guardrail is bypassed (authorized override).

| Field | Type | Description |
|-------|------|-------------|
| `guardrail_id` | string | Guardrail identifier |
| `bypass_reason` | string | Reason for bypass |
| `authorized_by` | string | Who authorized |
| `expiry` | string? | When bypass expires |

---

## PII (`pii.*`)

Events related to personally identifiable information handling.

### `pii.detected`
Emitted when PII is detected in content.

| Field | Type | Description |
|-------|------|-------------|
| `detection_id` | string | Detection instance ID |
| `pii_types` | string[] | Types detected (email, phone, ssn, etc.) |
| `location` | string | input, output, or both |
| `action_taken` | string | redact, warn, block, log |
| `count` | number | Number of PII instances |

### `pii.redacted`
Emitted when PII is redacted from content.

| Field | Type | Description |
|-------|------|-------------|
| `detection_id` | string | Detection instance ID |
| `pii_types` | string[] | Types redacted |
| `redaction_method` | string | How it was redacted |
| `count` | number | Number of redactions |

### `pii.access.logged`
Emitted when PII access is logged for compliance.

| Field | Type | Description |
|-------|------|-------------|
| `accessor_id` | string | Who accessed |
| `pii_types` | string[] | Types accessed |
| `purpose` | string | Access purpose |
| `access_granted` | boolean | Whether access was granted |

---

## Human-in-the-Loop (`hitl.*`)

Events related to human review and approval workflows.

### `hitl.item.created`
Emitted when a HITL review item is created.

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | string | Review item ID |
| `item_type` | string | Type of item |
| `priority` | string | low, medium, high, urgent |
| `reason` | string | Why review is needed |
| `deadline` | string? | Review deadline |

### `hitl.item.assigned`
Emitted when a HITL item is assigned to a reviewer.

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | string | Review item ID |
| `assignee_id` | string | Assigned reviewer |
| `assigned_by` | string? | Who assigned (or auto) |

### `hitl.item.completed`
Emitted when a HITL review is completed.

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | string | Review item ID |
| `reviewer_id` | string | Who reviewed |
| `decision` | string | approve, reject, escalate |
| `duration_ms` | number | Time to review |
| `notes` | string? | Reviewer notes |

### `hitl.item.escalated`
Emitted when a HITL item is escalated.

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | string | Review item ID |
| `escalated_to` | string | Escalation target |
| `reason` | string | Escalation reason |

---

## Quality (`quality.*`)

Events related to output quality and evaluation.

### `quality.scored`
Emitted when quality scoring is performed.

| Field | Type | Description |
|-------|------|-------------|
| `score_id` | string | Score instance ID |
| `target_type` | string | What was scored (response, conversation) |
| `target_id` | string | ID of scored item |
| `overall_score` | number | Overall quality (0-1) |
| `dimensions` | object | Per-dimension scores |

### `quality.threshold.breached`
Emitted when quality falls below threshold.

| Field | Type | Description |
|-------|------|-------------|
| `threshold_id` | string | Threshold configuration ID |
| `metric` | string | Which metric breached |
| `expected` | number | Expected minimum |
| `actual` | number | Actual value |
| `window` | string | Time window evaluated |

### `quality.evaluation.completed`
Emitted when a batch quality evaluation completes.

| Field | Type | Description |
|-------|------|-------------|
| `evaluation_id` | string | Evaluation run ID |
| `sample_size` | number | Number of samples evaluated |
| `pass_rate` | number | Percentage passing |
| `summary` | object | Evaluation summary |

---

## Drift (`drift.*`)

Events related to model and data drift detection.

### `drift.detected`
Emitted when drift is detected.

| Field | Type | Description |
|-------|------|-------------|
| `drift_id` | string | Drift detection ID |
| `drift_type` | string | model, data, concept, performance |
| `severity` | string | low, medium, high |
| `metric` | string | Affected metric |
| `baseline` | number | Baseline value |
| `current` | number | Current value |
| `deviation` | number | Deviation amount |

### `drift.alert.created`
Emitted when drift triggers an alert.

| Field | Type | Description |
|-------|------|-------------|
| `alert_id` | string | Alert ID |
| `drift_id` | string | Related drift detection |
| `recommended_action` | string | Suggested remediation |

### `drift.baseline.updated`
Emitted when drift baseline is recalibrated.

| Field | Type | Description |
|-------|------|-------------|
| `metric` | string | Metric being baselined |
| `old_baseline` | number | Previous baseline |
| `new_baseline` | number | New baseline |
| `updated_by` | string | User or auto |

---

## Incidents (`incident.*`)

Events related to incident management.

### `incident.created`
Emitted when an incident is created.

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | string | Incident ID |
| `title` | string | Incident title |
| `severity` | string | sev1, sev2, sev3, sev4 |
| `source` | string | What triggered (alert, manual, etc.) |
| `affected_services` | string[] | Services affected |

### `incident.updated`
Emitted when incident status/details change.

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | string | Incident ID |
| `field` | string | What changed |
| `old_value` | unknown | Previous value |
| `new_value` | unknown | New value |
| `updated_by` | string | Who updated |

### `incident.resolved`
Emitted when an incident is resolved.

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | string | Incident ID |
| `resolution` | string | How it was resolved |
| `duration_minutes` | number | Time to resolution |
| `resolved_by` | string | Who resolved |

### `incident.postmortem.created`
Emitted when a postmortem is created.

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | string | Related incident |
| `postmortem_id` | string | Postmortem ID |
| `owner_id` | string | Postmortem owner |

---

## Tenant (`tenant.*`)

Events related to tenant lifecycle and operations.

### `tenant.created`
Emitted when a new tenant is provisioned.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `tenant_name` | string | Display name |
| `plan` | string | Initial plan |
| `created_by` | string | Who created |

### `tenant.onboarding.started`
Emitted when tenant onboarding begins.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `onboarding_type` | string | Type of onboarding |

### `tenant.onboarding.completed`
Emitted when tenant onboarding completes.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `duration_minutes` | number | Time to complete |
| `steps_completed` | number | Steps completed |

### `tenant.plan.changed`
Emitted when tenant plan changes.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `old_plan` | string | Previous plan |
| `new_plan` | string | New plan |
| `change_type` | string | upgrade, downgrade, cancel |

### `tenant.usage.threshold`
Emitted when usage crosses a threshold.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `resource` | string | Resource type |
| `threshold` | number | Threshold crossed (percentage) |
| `current_usage` | number | Current usage |
| `limit` | number | Plan limit |

### `tenant.billing.event`
Emitted for billing-related events.

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | string | Tenant ID |
| `event_type` | string | payment_succeeded, payment_failed, etc. |
| `amount` | number? | Amount in cents |
| `currency` | string? | Currency code |

---

## System (`system.*`)

Platform-level events not specific to a tenant.

### `system.health.changed`
Emitted when system health status changes.

| Field | Type | Description |
|-------|------|-------------|
| `component` | string | Affected component |
| `old_status` | string | Previous status |
| `new_status` | string | New status |
| `reason` | string? | Why status changed |

### `system.maintenance.scheduled`
Emitted when maintenance is scheduled.

| Field | Type | Description |
|-------|------|-------------|
| `maintenance_id` | string | Maintenance ID |
| `scheduled_start` | string | Start time |
| `scheduled_end` | string | End time |
| `affected_services` | string[] | Services affected |
| `description` | string | What maintenance entails |

### `system.maintenance.started`
Emitted when maintenance window begins.

| Field | Type | Description |
|-------|------|-------------|
| `maintenance_id` | string | Maintenance ID |
| `actual_start` | string | Actual start time |

### `system.maintenance.completed`
Emitted when maintenance completes.

| Field | Type | Description |
|-------|------|-------------|
| `maintenance_id` | string | Maintenance ID |
| `actual_end` | string | Actual end time |
| `outcome` | string | success, partial, failed |

### `system.deployment.completed`
Emitted when a deployment completes.

| Field | Type | Description |
|-------|------|-------------|
| `deployment_id` | string | Deployment ID |
| `version` | string | Deployed version |
| `environment` | string | Target environment |
| `duration_seconds` | number | Deployment duration |
| `status` | string | success, rollback |
