/* ═══════════════════════════════════════════════════════════════════════════
   Distributed Tracing Context
   Trace ID and Span ID propagation through gateway → workers → webhooks
   ═══════════════════════════════════════════════════════════════════════════ */

import { headers } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TraceContext = {
  trace_id: string; // UUID, created at gateway entry
  span_id: string; // UUID, created per operation
  parent_span_id?: string;
  baggage?: Record<string, string>;
};

export type SpanKind = "server" | "client" | "internal" | "producer" | "consumer";

export type SpanStatus = "ok" | "error" | "unset";

export type Span = {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  kind: SpanKind;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  status: SpanStatus;
  attributes?: Record<string, string | number | boolean>;
  events?: SpanEvent[];
};

export type SpanEvent = {
  name: string;
  timestamp: string;
  attributes?: Record<string, string | number | boolean>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const TRACE_HEADER = "X-Trace-ID";
export const SPAN_HEADER = "X-Span-ID";
export const PARENT_SPAN_HEADER = "X-Parent-Span-ID";
export const BAGGAGE_HEADER = "X-Trace-Baggage";

// ─────────────────────────────────────────────────────────────────────────────
// Generate IDs
// ─────────────────────────────────────────────────────────────────────────────

export function generateTraceId(): string {
  return crypto.randomUUID();
}

export function generateSpanId(): string {
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Extraction (from incoming request)
// ─────────────────────────────────────────────────────────────────────────────

export async function extractTraceContext(): Promise<TraceContext> {
  const headersList = await headers();
  
  const traceId = headersList.get(TRACE_HEADER) || generateTraceId();
  const parentSpanId = headersList.get(SPAN_HEADER);
  const spanId = generateSpanId();
  
  // Parse baggage
  const baggageHeader = headersList.get(BAGGAGE_HEADER);
  let baggage: Record<string, string> | undefined;
  if (baggageHeader) {
    try {
      baggage = JSON.parse(baggageHeader);
    } catch {
      // Ignore invalid baggage
    }
  }
  
  return {
    trace_id: traceId,
    span_id: spanId,
    ...(parentSpanId ? { parent_span_id: parentSpanId } : {}),
    ...(baggage ? { baggage } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Injection (for outgoing requests)
// ─────────────────────────────────────────────────────────────────────────────

export function injectTraceHeaders(
  ctx: TraceContext,
  headers: Headers | Record<string, string>
): void {
  if (headers instanceof Headers) {
    headers.set(TRACE_HEADER, ctx.trace_id);
    headers.set(SPAN_HEADER, ctx.span_id);
    if (ctx.parent_span_id) {
      headers.set(PARENT_SPAN_HEADER, ctx.parent_span_id);
    }
    if (ctx.baggage) {
      headers.set(BAGGAGE_HEADER, JSON.stringify(ctx.baggage));
    }
  } else {
    headers[TRACE_HEADER] = ctx.trace_id;
    headers[SPAN_HEADER] = ctx.span_id;
    if (ctx.parent_span_id) {
      headers[PARENT_SPAN_HEADER] = ctx.parent_span_id;
    }
    if (ctx.baggage) {
      headers[BAGGAGE_HEADER] = JSON.stringify(ctx.baggage);
    }
  }
}

export function createTraceHeaders(ctx: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {
    [TRACE_HEADER]: ctx.trace_id,
    [SPAN_HEADER]: ctx.span_id,
  };
  
  if (ctx.parent_span_id) {
    headers[PARENT_SPAN_HEADER] = ctx.parent_span_id;
  }
  if (ctx.baggage) {
    headers[BAGGAGE_HEADER] = JSON.stringify(ctx.baggage);
  }
  
  return headers;
}

// ─────────────────────────────────────────────────────────────────────────────
// Child Span Creation
// ─────────────────────────────────────────────────────────────────────────────

export function createChildContext(parent: TraceContext): TraceContext {
  return {
    trace_id: parent.trace_id,
    span_id: generateSpanId(),
    parent_span_id: parent.span_id,
    ...(parent.baggage ? { baggage: parent.baggage } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Span Management
// ─────────────────────────────────────────────────────────────────────────────

export function startSpan(
  ctx: TraceContext,
  name: string,
  kind: SpanKind = "internal",
  attributes?: Record<string, string | number | boolean>
): Span {
  const span: Span = {
    trace_id: ctx.trace_id,
    span_id: ctx.span_id,
    name,
    kind,
    start_time: new Date().toISOString(),
    status: "unset",
    events: [],
  };

  if (ctx.parent_span_id) {
    span.parent_span_id = ctx.parent_span_id;
  }

  if (attributes) {
    span.attributes = attributes;
  }

  return span;
}

export function endSpan(span: Span, status: SpanStatus = "ok"): Span {
  const endTime = new Date();
  const startTime = new Date(span.start_time);
  
  return {
    ...span,
    end_time: endTime.toISOString(),
    duration_ms: endTime.getTime() - startTime.getTime(),
    status,
  };
}

export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const event: SpanEvent = {
    name,
    timestamp: new Date().toISOString(),
    ...(attributes ? { attributes } : {}),
  };

  return {
    ...span,
    events: [
      ...(span.events || []),
      event,
    ],
  };
}

export function setSpanAttribute(
  span: Span,
  key: string,
  value: string | number | boolean
): Span {
  return {
    ...span,
    attributes: {
      ...span.attributes,
      [key]: value,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Baggage Management
// ─────────────────────────────────────────────────────────────────────────────

export function setBaggage(
  ctx: TraceContext,
  key: string,
  value: string
): TraceContext {
  return {
    ...ctx,
    baggage: {
      ...ctx.baggage,
      [key]: value,
    },
  };
}

export function getBaggage(ctx: TraceContext, key: string): string | undefined {
  return ctx.baggage?.[key];
}

// ─────────────────────────────────────────────────────────────────────────────
// Trace Decorator (for function instrumentation)
// ─────────────────────────────────────────────────────────────────────────────

export function traced<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T,
  kind: SpanKind = "internal"
): T {
  return (async (...args: Parameters<T>) => {
    const ctx = await extractTraceContext();
    const childCtx = createChildContext(ctx);
    const span = startSpan(childCtx, name, kind);
    
    try {
      const result = await fn(...args);
      endSpan(span, "ok");
      return result;
    } catch (error) {
      endSpan(span, "error");
      throw error;
    }
  }) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Create Request with Trace Context
// ─────────────────────────────────────────────────────────────────────────────

export async function tracedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const ctx = await extractTraceContext();
  const childCtx = createChildContext(ctx);
  
  const headers = new Headers(options.headers);
  injectTraceHeaders(childCtx, headers);
  
  return fetch(url, {
    ...options,
    headers,
  });
}
