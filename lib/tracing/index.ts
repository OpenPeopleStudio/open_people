/* ═══════════════════════════════════════════════════════════════════════════
   Tracing Module
   Distributed tracing context propagation
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Types
  type TraceContext,
  type SpanKind,
  type SpanStatus,
  type Span,
  type SpanEvent,
  // Constants
  TRACE_HEADER,
  SPAN_HEADER,
  PARENT_SPAN_HEADER,
  BAGGAGE_HEADER,
  // ID Generation
  generateTraceId,
  generateSpanId,
  // Context Management
  extractTraceContext,
  injectTraceHeaders,
  createTraceHeaders,
  createChildContext,
  // Span Management
  startSpan,
  endSpan,
  addSpanEvent,
  setSpanAttribute,
  // Baggage
  setBaggage,
  getBaggage,
  // Utilities
  traced,
  tracedFetch,
} from "./context";
