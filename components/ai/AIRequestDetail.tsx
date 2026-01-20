"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Request Detail Component (Rosetta Stone UI)
   Unified view aggregating audit log, policy decision, moderation, PII,
   guardrail activations, quality, and hallucination checks
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TimelineEvent = {
  timestamp: string;
  event: string;
  details?: string;
  status?: "success" | "warning" | "error" | "info";
};

export type ContextItem = {
  type: "memory" | "kb_chunk" | "file" | "fact";
  name: string;
  relevance_score?: number;
};

export type RiskSignal = {
  type: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
};

export type AIRequestData = {
  request_id: string;
  tenant_id: string;
  created_at: string;
  
  // Request/Response
  input: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  };
  output: {
    content: string;
    finish_reason?: string;
  };
  
  // Metrics
  metrics: {
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    cost_usd: number;
    time_to_first_token_ms?: number;
  };
  
  // Timeline
  timeline: TimelineEvent[];
  
  // Context used
  context_items: ContextItem[];
  
  // Policy decision
  policy: {
    decision: "allow" | "deny" | "require_approval";
    policy_name?: string;
    policy_id?: string;
    reasons: string[];
    trace_available: boolean;
  };
  
  // Risk signals
  risk_signals: RiskSignal[];
  overall_risk_score: number;
  overall_risk_level: "low" | "medium" | "high" | "critical";
  
  // Quality metrics
  quality?: {
    score: number;
    hallucination_score?: number;
    relevance_score?: number;
    coherence_score?: number;
  };
  
  // PII detection
  pii?: {
    detected: boolean;
    types?: string[];
    redacted: boolean;
  };
  
  // Moderation
  moderation?: {
    passed: boolean;
    flags?: string[];
    scores?: Record<string, number>;
  };
  
  // Guardrails
  guardrails?: {
    triggered: string[];
    passed: string[];
  };
  
  // Tracing
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AIRequestDetail({ data }: { data: AIRequestData }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showFullTrace, setShowFullTrace] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Request Detail
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {data.request_id}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {data.trace_id && (
              <div className="text-xs text-gray-500">
                Trace: <span className="font-mono">{data.trace_id.slice(0, 8)}...</span>
              </div>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.policy.decision === "allow"
                  ? "bg-green-100 text-green-800"
                  : data.policy.decision === "deny"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {data.policy.decision.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              {data.timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-xs text-gray-500 font-mono w-24 flex-shrink-0">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 ${
                      event.status === "success"
                        ? "bg-green-500"
                        : event.status === "error"
                        ? "bg-red-500"
                        : event.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${getStatusColor(event.status)}`}>
                      {event.event}
                    </p>
                    {event.details && (
                      <p className="text-xs text-gray-500 mt-0.5">{event.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Decision */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Policy Decision
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Decision</span>
                <span
                  className={`font-medium ${
                    data.policy.decision === "allow"
                      ? "text-green-600"
                      : data.policy.decision === "deny"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {data.policy.decision.toUpperCase()}
                </span>
              </div>
              {data.policy.policy_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Policy</span>
                  <span className="text-sm font-medium">{data.policy.policy_name}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Reasons</span>
                <ul className="mt-1 space-y-1">
                  {data.policy.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
              {data.policy.trace_available && (
                <button
                  onClick={() => setShowFullTrace(!showFullTrace)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showFullTrace ? "Hide full trace" : "View full trace"}
                </button>
              )}
            </div>
          </div>

          {/* Input/Output */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Input / Output
            </h2>
            <div className="space-y-4">
              {data.input.messages.map((msg, i) => (
                <div key={i} className="space-y-1">
                  <span
                    className={`text-xs font-medium uppercase ${
                      msg.role === "user"
                        ? "text-blue-600"
                        : msg.role === "assistant"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {msg.role}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {msg.content}
                  </p>
                </div>
              ))}
              <div className="border-t pt-4">
                <span className="text-xs font-medium uppercase text-green-600">
                  Response
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded mt-1">
                  {data.output.content}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                <span>Tokens: {data.metrics.input_tokens} in / {data.metrics.output_tokens} out</span>
                <span>Cost: ${data.metrics.cost_usd.toFixed(4)}</span>
                <span>Latency: {data.metrics.latency_ms}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Context & Risk */}
        <div className="space-y-6">
          {/* Context Used */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Context Used
            </h2>
            {data.context_items.length > 0 ? (
              <div className="space-y-2">
                {data.context_items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.type === "memory"
                            ? "bg-purple-500"
                            : item.type === "kb_chunk"
                            ? "bg-blue-500"
                            : item.type === "file"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    {item.relevance_score !== undefined && (
                      <span className="text-xs text-gray-500">
                        {(item.relevance_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No context items used</p>
            )}
          </div>

          {/* Risk Signals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Risk Signals
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Risk</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${getRiskColor(
                    data.overall_risk_level
                  )}`}
                >
                  {data.overall_risk_score} ({data.overall_risk_level})
                </span>
              </div>
              <div className="space-y-2">
                {data.risk_signals.map((signal, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {signal.type.replace(/_/g, " ")}
                    </span>
                    <span className={getRiskColor(signal.level)}>
                      {signal.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quality Score */}
          {data.quality && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quality Metrics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Quality Score
                  </span>
                  <span className="font-medium">{(data.quality.score * 100).toFixed(0)}%</span>
                </div>
                {data.quality.hallucination_score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Hallucination
                    </span>
                    <span
                      className={
                        data.quality.hallucination_score > 0.3
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {(data.quality.hallucination_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PII Detection */}
          {data.pii && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                PII Detection
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Detected</span>
                  <span className={data.pii.detected ? "text-yellow-600" : "text-green-600"}>
                    {data.pii.detected ? "Yes" : "No"}
                  </span>
                </div>
                {data.pii.types && data.pii.types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.pii.types.map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderation */}
          {data.moderation && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Content Moderation
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={data.moderation.passed ? "text-green-600" : "text-red-600"}>
                  {data.moderation.passed ? "PASS" : "FLAGGED"}
                </span>
              </div>
              {data.moderation.flags && data.moderation.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.moderation.flags.map((flag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guardrails */}
          {data.guardrails && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Guardrails
              </h2>
              {data.guardrails.triggered.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-red-600 font-medium">TRIGGERED</span>
                  <div className="mt-1 space-y-1">
                    {data.guardrails.triggered.map((g, i) => (
                      <div
                        key={i}
                        className="text-sm text-red-700 bg-red-50 px-2 py-1 rounded"
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.guardrails.passed.length > 0 && (
                <div>
                  <span className="text-xs text-green-600 font-medium">PASSED</span>
                  <div className="mt-1 text-sm text-gray-500">
                    {data.guardrails.passed.length} guardrails passed
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRequestDetail;
