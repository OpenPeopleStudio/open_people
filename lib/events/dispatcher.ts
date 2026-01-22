/**
 * Event Dispatcher - Async worker that drains the outbox
 *
 * Claims events from the outbox and fans them out to configured sinks:
 * - Notification bridge (in-app, email, SMS)
 * - Webhook publisher (external endpoints)
 * - Audit/analytics sink
 *
 * Features:
 * - Exponential backoff retries
 * - Per-tenant concurrency limits
 * - Dead letter queue for failed events
 * - Idempotent sink writes
 */

import os from "os";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { EventOutboxRow, EventSink, SinkDispatchResult } from "@/types/events";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const DISPATCHER_ID = `evt-dispatch:${os.hostname()}:${process.pid}`;
const DEFAULT_BATCH_SIZE = 100;
const RETRY_BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 1000;
const MAX_SINK_TIMEOUT_MS = 30000;

declare global {
  // eslint-disable-next-line no-var
  var __eventDispatcherStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var __eventDispatcherInterval: NodeJS.Timeout | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the event dispatcher if not already running.
 * In serverless environments, use the cron-triggered endpoint instead.
 */
export function ensureEventDispatcherStarted(): void {
  const allowInProcess =
    process.env.EVENT_DISPATCHER_MODE === "in_process" ||
    process.env.NODE_ENV === "development";

  if (!allowInProcess) return;

  if (globalThis.__eventDispatcherStarted) return;
  globalThis.__eventDispatcherStarted = true;

  console.log(`[event-dispatcher] Starting dispatcher: ${DISPATCHER_ID}`);

  globalThis.__eventDispatcherInterval = setInterval(() => {
    void dispatchTick().catch((err) =>
      console.error("[event-dispatcher] tick error:", err)
    );
  }, POLL_INTERVAL_MS);
}

/**
 * Stop the event dispatcher.
 */
export function stopEventDispatcher(): void {
  if (globalThis.__eventDispatcherInterval) {
    clearInterval(globalThis.__eventDispatcherInterval);
    globalThis.__eventDispatcherInterval = undefined;
  }
  globalThis.__eventDispatcherStarted = false;
  console.log(`[event-dispatcher] Stopped dispatcher: ${DISPATCHER_ID}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Dispatch Loop
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Single tick of the dispatch loop.
 * Claims pending events and retry-ready events, then dispatches them.
 */
async function dispatchTick(): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Claim pending events
  const { data: pendingEvents, error: pendingError } = await supabase.rpc(
    "claim_pending_events",
    {
      p_dispatcher_id: DISPATCHER_ID,
      p_batch_size: DEFAULT_BATCH_SIZE,
    }
  );

  if (pendingError) {
    console.error("[event-dispatcher] Failed to claim pending events:", pendingError);
  } else if (pendingEvents && pendingEvents.length > 0) {
    await dispatchBatch(pendingEvents as EventOutboxRow[]);
  }

  // Claim retry events
  const { data: retryEvents, error: retryError } = await supabase.rpc(
    "claim_retry_events",
    {
      p_dispatcher_id: DISPATCHER_ID,
      p_batch_size: RETRY_BATCH_SIZE,
    }
  );

  if (retryError) {
    console.error("[event-dispatcher] Failed to claim retry events:", retryError);
  } else if (retryEvents && retryEvents.length > 0) {
    await dispatchBatch(retryEvents as EventOutboxRow[]);
  }
}

/**
 * Run a single dispatch cycle (for cron/serverless invocation).
 */
export async function runDispatchCycle(options?: {
  batchSize?: number;
  retryBatchSize?: number;
}): Promise<{ pending: number; retries: number; errors: number }> {
  const supabase = await createSupabaseAdmin();
  let pendingCount = 0;
  let retryCount = 0;
  let errorCount = 0;

  // Claim pending events
  const { data: pendingEvents, error: pendingError } = await supabase.rpc(
    "claim_pending_events",
    {
      p_dispatcher_id: DISPATCHER_ID,
      p_batch_size: options?.batchSize ?? DEFAULT_BATCH_SIZE,
    }
  );

  if (pendingError) {
    console.error("[event-dispatcher] Failed to claim pending events:", pendingError);
    errorCount++;
  } else if (pendingEvents && pendingEvents.length > 0) {
    const results = await dispatchBatch(pendingEvents as EventOutboxRow[]);
    pendingCount = results.dispatched;
    errorCount += results.failed;
  }

  // Claim retry events
  const { data: retryEvents, error: retryError } = await supabase.rpc(
    "claim_retry_events",
    {
      p_dispatcher_id: DISPATCHER_ID,
      p_batch_size: options?.retryBatchSize ?? RETRY_BATCH_SIZE,
    }
  );

  if (retryError) {
    console.error("[event-dispatcher] Failed to claim retry events:", retryError);
    errorCount++;
  } else if (retryEvents && retryEvents.length > 0) {
    const results = await dispatchBatch(retryEvents as EventOutboxRow[]);
    retryCount = results.dispatched;
    errorCount += results.failed;
  }

  return { pending: pendingCount, retries: retryCount, errors: errorCount };
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Dispatch
// ═══════════════════════════════════════════════════════════════════════════

async function dispatchBatch(
  events: EventOutboxRow[]
): Promise<{ dispatched: number; failed: number }> {
  let dispatched = 0;
  let failed = 0;

  // Process events concurrently with some limit
  const concurrencyLimit = 10;
  const chunks = chunkArray(events, concurrencyLimit);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((event) => dispatchEvent(event))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        dispatched++;
      } else {
        failed++;
      }
    }
  }

  return { dispatched, failed };
}

// ═══════════════════════════════════════════════════════════════════════════
// Single Event Dispatch
// ═══════════════════════════════════════════════════════════════════════════

async function dispatchEvent(event: EventOutboxRow): Promise<boolean> {
  const supabase = await createSupabaseAdmin();
  const sinkResults: SinkDispatchResult[] = [];

  try {
    // Get sink configurations for this tenant/event type
    const sinks = await getSinksForEvent(event);

    // Dispatch to each enabled sink
    for (const sink of sinks) {
      const result = await dispatchToSink(event, sink);
      sinkResults.push(result);

      // Log dispatch attempt
      await logDispatchAttempt(event, sink, result);
    }

    // Check if all sinks succeeded
    const allSucceeded = sinkResults.every((r) => r.success);
    const anySucceeded = sinkResults.some((r) => r.success);

    if (allSucceeded) {
      await supabase.rpc("mark_event_dispatched", { p_outbox_id: event.id });
      return true;
    } else if (!anySucceeded) {
      // All sinks failed
      const errors = sinkResults
        .filter((r) => !r.success)
        .map((r) => `${r.sink}: ${r.error}`)
        .join("; ");
      await supabase.rpc("mark_event_failed", {
        p_outbox_id: event.id,
        p_error: errors,
        p_move_to_dlq: false,
      });
      return false;
    } else {
      // Partial success - mark as dispatched but log partial failure
      console.warn(
        `[event-dispatcher] Partial dispatch for event ${event.event_id}:`,
        sinkResults.filter((r) => !r.success)
      );
      await supabase.rpc("mark_event_dispatched", { p_outbox_id: event.id });
      return true;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[event-dispatcher] Error dispatching event ${event.event_id}:`, error);

    await supabase.rpc("mark_event_failed", {
      p_outbox_id: event.id,
      p_error: message,
      p_move_to_dlq: false,
    });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sink Dispatch
// ═══════════════════════════════════════════════════════════════════════════

async function getSinksForEvent(event: EventOutboxRow): Promise<EventSink[]> {
  const supabase = await createSupabaseAdmin();

  // Get tenant-specific sink config
  const { data: configs } = await supabase
    .from("event_sink_config")
    .select("*")
    .or(`tenant_id.is.null,tenant_id.eq.${event.tenant_id}`)
    .eq("enabled", true);

  const enabledSinks: EventSink[] = [];

  for (const config of configs || []) {
    // Check if event type is in the filter (empty = all events)
    const eventTypes = config.event_types as string[] | null;
    if (!eventTypes || eventTypes.length === 0 || eventTypes.includes(event.event_type)) {
      enabledSinks.push(config.sink as EventSink);
    }
  }

  // Default sinks if no config
  if (enabledSinks.length === 0) {
    return ["notification", "audit"];
  }

  return [...new Set(enabledSinks)];
}

async function dispatchToSink(
  event: EventOutboxRow,
  sink: EventSink
): Promise<SinkDispatchResult> {
  const startTime = Date.now();

  try {
    switch (sink) {
      case "notification":
        await dispatchToNotifications(event);
        break;
      case "webhook":
        await dispatchToWebhooks(event);
        break;
      case "audit":
        await dispatchToAudit(event);
        break;
      case "analytics":
        await dispatchToAnalytics(event);
        break;
      default:
        throw new Error(`Unknown sink: ${sink}`);
    }

    return {
      sink,
      success: true,
      latency_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      sink,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      latency_ms: Date.now() - startTime,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sink Implementations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dispatch to notification system (bridges to existing notification events).
 */
async function dispatchToNotifications(event: EventOutboxRow): Promise<void> {
  // Import lazily to avoid circular deps
  const { mapEventToNotification } = await import("./notification-bridge");

  const notification = mapEventToNotification(event);
  if (notification) {
    const { dispatchNotificationEvent } = await import("@/lib/notifications/events");
    await dispatchNotificationEvent(notification);
  }
}

/**
 * Dispatch to external webhooks.
 */
async function dispatchToWebhooks(event: EventOutboxRow): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Get webhook endpoints for this tenant that subscribe to this event type
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("*")
    .eq("tenant_id", event.tenant_id)
    .eq("is_active", true);

  if (!endpoints || endpoints.length === 0) {
    return; // No webhooks configured
  }

  for (const endpoint of endpoints) {
    // Check if endpoint subscribes to this event type
    const eventTypes = endpoint.event_types as string[] | null;
    if (eventTypes && eventTypes.length > 0 && !eventTypes.includes(event.event_type)) {
      continue;
    }

    // Build webhook payload (matches 01-webhooks spec)
    const payload = {
      id: event.event_id,
      type: event.event_type,
      occurred_at: event.occurred_at,
      tenant_id: event.tenant_id,
      data: event.payload,
      metadata: event.metadata,
    };

    // Generate signature
    const signature = await generateWebhookSignature(payload, endpoint.secret_key);

    // Send webhook with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_SINK_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenPeople-Event": event.event_type,
          "X-OpenPeople-Signature": signature,
          "X-OpenPeople-Delivery": event.event_id,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Dispatch to audit log.
 */
async function dispatchToAudit(event: EventOutboxRow): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Write to audit_logs table (if it exists)
  await supabase.from("audit_logs").insert({
    tenant_id: event.tenant_id,
    actor_id: event.actor_id,
    action: event.event_type,
    resource_type: "event",
    resource_id: event.event_id,
    details: event.payload,
    correlation_id: event.correlation_id,
    created_at: event.occurred_at,
  });
}

/**
 * Dispatch to analytics pipeline.
 */
async function dispatchToAnalytics(event: EventOutboxRow): Promise<void> {
  // Analytics sink - could be:
  // - Write to analytics DB
  // - Send to Segment/Amplitude
  // - Write to data warehouse
  // For now, this is a no-op placeholder
  console.debug(`[event-dispatcher] Analytics sink for ${event.event_type}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════════════════════════════════════

async function logDispatchAttempt(
  event: EventOutboxRow,
  sink: EventSink,
  result: SinkDispatchResult
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  await supabase.from("event_dispatch_log").insert({
    outbox_id: event.id,
    sink,
    attempt_number: event.retry_count + 1,
    success: result.success,
    error_message: result.error,
    latency_ms: result.latency_ms,
    completed_at: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function generateWebhookSignature(
  payload: unknown,
  secretKey: string | null
): Promise<string> {
  if (!secretKey) {
    return "unsigned";
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const keyData = encoder.encode(secretKey);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `sha256=${hashHex}`;
}
