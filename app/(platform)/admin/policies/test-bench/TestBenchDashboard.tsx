"use client";

import { useState } from "react";
import type {
  RequestContext,
  TestBenchResponse,
  EvaluationTrace,
  PolicyEvaluation,
} from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   Policy Test Bench Dashboard
   Interactive policy evaluation with trace visualization
   ═══════════════════════════════════════════════════════════════════════════ */

type Policy = {
  id: string;
  name: string;
  policy_type: string;
  effect: string;
  priority: number;
  is_active: boolean;
};

type RecentDecision = {
  id: string;
  request_id: string;
  decision: string;
  deciding_policy_id: string | null;
  created_at: string;
};

type Simulation = {
  id: string;
  simulation_type: string;
  result_data: Record<string, unknown>;
  created_at: string;
};

type Props = {
  policies: Policy[];
  recentDecisions: RecentDecision[];
  recentSimulations: Simulation[];
};

const DEFAULT_CONTEXT: RequestContext = {
  user_id: "",
  user_email: "",
  user_roles: [],
  user_teams: [],
  model: "",
  application_id: "",
  input_text: "",
  contains_pii: false,
  detected_topics: [],
  risk_score: 0,
};

export function TestBenchDashboard({
  policies,
  recentDecisions,
  recentSimulations,
}: Props) {
  const [context, setContext] = useState<RequestContext>(DEFAULT_CONTEXT);
  const [contextJson, setContextJson] = useState(
    JSON.stringify(DEFAULT_CONTEXT, null, 2)
  );
  const [jsonMode, setJsonMode] = useState(false);
  const [result, setResult] = useState<TestBenchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parse JSON if in JSON mode
      const contextToUse = jsonMode ? JSON.parse(contextJson) : context;

      const res = await fetch("/api/policies/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextToUse,
          policy_ids: selectedPolicies.length > 0 ? selectedPolicies : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Evaluation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: "empty" | "basic" | "pii" | "high_risk") => {
    const presets: Record<string, RequestContext> = {
      empty: DEFAULT_CONTEXT,
      basic: {
        user_id: "user-123",
        user_email: "user@example.com",
        user_roles: ["engineer"],
        user_teams: ["engineering"],
        model: "gpt-4",
        application_id: "code-assistant",
        input_text: "Help me write a function",
        contains_pii: false,
        detected_topics: ["coding"],
        risk_score: 10,
      },
      pii: {
        user_id: "user-456",
        user_email: "analyst@example.com",
        user_roles: ["analyst"],
        user_teams: ["data"],
        model: "gpt-4",
        application_id: "data-query",
        input_text: "My SSN is 123-45-6789",
        contains_pii: true,
        pii_types: ["ssn", "email"],
        detected_topics: ["personal_data"],
        risk_score: 75,
      },
      high_risk: {
        user_id: "user-789",
        user_email: "external@vendor.com",
        user_roles: ["contractor"],
        user_teams: [],
        model: "gpt-4",
        application_id: "general-chat",
        input_text: "Give me legal advice about contracts",
        contains_pii: false,
        detected_topics: ["legal-advice"],
        risk_score: 85,
        risk_level: "high",
      },
    };

    const newContext = presets[preset];
    setContext(newContext);
    setContextJson(JSON.stringify(newContext, null, 2));
    setResult(null);
  };

  const handleContextFieldChange = (
    field: keyof RequestContext,
    value: unknown
  ) => {
    const newContext = { ...context, [field]: value };
    setContext(newContext);
    setContextJson(JSON.stringify(newContext, null, 2));
  };

  const handleJsonChange = (json: string) => {
    setContextJson(json);
    try {
      const parsed = JSON.parse(json);
      setContext(parsed);
      setError(null);
    } catch {
      // Don't update context if JSON is invalid
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input Panel */}
      <div className="space-y-6">
        {/* Mode Toggle & Presets */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setJsonMode(false)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                !jsonMode
                  ? "bg-[var(--electric-lime)] text-[var(--void)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setJsonMode(true)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                jsonMode
                  ? "bg-[var(--electric-lime)] text-[var(--void)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
              }`}
            >
              JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Presets:</span>
            {["empty", "basic", "pii", "high_risk"].map((preset) => (
              <button
                key={preset}
                onClick={() => loadPreset(preset as "empty" | "basic" | "pii" | "high_risk")}
                className="px-2 py-1 rounded text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {preset.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Context Input */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Request Context
          </h3>

          {jsonMode ? (
            <textarea
              value={contextJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full h-96 px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)] resize-none"
              placeholder="Paste JSON context here..."
            />
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {/* User Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">
                  Subject
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="User ID"
                    value={context.user_id || ""}
                    onChange={(v) => handleContextFieldChange("user_id", v)}
                  />
                  <InputField
                    label="Email"
                    value={context.user_email || ""}
                    onChange={(v) => handleContextFieldChange("user_email", v)}
                  />
                </div>
                <InputField
                  label="Roles (comma-separated)"
                  value={(context.user_roles || []).join(", ")}
                  onChange={(v) =>
                    handleContextFieldChange(
                      "user_roles",
                      v.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
                <InputField
                  label="Teams (comma-separated)"
                  value={(context.user_teams || []).join(", ")}
                  onChange={(v) =>
                    handleContextFieldChange(
                      "user_teams",
                      v.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>

              {/* Resource Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">
                  Resource
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Model"
                    value={context.model || ""}
                    onChange={(v) => handleContextFieldChange("model", v)}
                    placeholder="e.g., gpt-4"
                  />
                  <InputField
                    label="Application ID"
                    value={context.application_id || ""}
                    onChange={(v) => handleContextFieldChange("application_id", v)}
                  />
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">
                  Request Details
                </h4>
                <InputField
                  label="Input Text"
                  value={context.input_text || ""}
                  onChange={(v) => handleContextFieldChange("input_text", v)}
                  multiline
                />
                <InputField
                  label="Detected Topics (comma-separated)"
                  value={(context.detected_topics || []).join(", ")}
                  onChange={(v) =>
                    handleContextFieldChange(
                      "detected_topics",
                      v.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>

              {/* Risk & Data */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">
                  Risk & Data
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Risk Score (0-100)"
                    value={(context.risk_score || 0).toString()}
                    onChange={(v) =>
                      handleContextFieldChange("risk_score", parseInt(v) || 0)
                    }
                    type="number"
                  />
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="contains_pii"
                      checked={context.contains_pii || false}
                      onChange={(e) =>
                        handleContextFieldChange("contains_pii", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                    />
                    <label
                      htmlFor="contains_pii"
                      className="text-sm text-[var(--text-secondary)]"
                    >
                      Contains PII
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Policy Filter */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Filter Policies (optional)
          </h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {policies.map((policy) => (
              <label
                key={policy.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  selectedPolicies.includes(policy.id)
                    ? "bg-[var(--electric-lime)]/20 border border-[var(--electric-lime)]"
                    : "bg-[var(--surface-2)] border border-transparent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPolicies.includes(policy.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPolicies((prev) => [...prev, policy.id]);
                    } else {
                      setSelectedPolicies((prev) =>
                        prev.filter((id) => id !== policy.id)
                      );
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-xs text-[var(--text-primary)]">
                  {policy.name}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    policy.effect === "allow"
                      ? "bg-[var(--success)]/20 text-[var(--success)]"
                      : "bg-[var(--error)]/20 text-[var(--error)]"
                  }`}
                >
                  {policy.effect}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Evaluate Button */}
        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Evaluating..." : "Evaluate Policies"}
        </button>

        {error && (
          <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </div>

      {/* Right: Results Panel */}
      <div className="space-y-6">
        {result ? (
          <>
            {/* Decision Summary */}
            <div
              className={`rounded-xl border p-6 ${
                result.summary.decision === "allow"
                  ? "bg-[var(--success)]/5 border-[var(--success)]/20"
                  : result.summary.decision === "deny"
                  ? "bg-[var(--error)]/5 border-[var(--error)]/20"
                  : "bg-[var(--warning)]/5 border-[var(--warning)]/20"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Decision
                </h3>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase ${
                    result.summary.decision === "allow"
                      ? "bg-[var(--success)] text-white"
                      : result.summary.decision === "deny"
                      ? "bg-[var(--error)] text-white"
                      : "bg-[var(--warning)] text-[var(--void)]"
                  }`}
                >
                  {result.summary.decision}
                </span>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {result.summary.primary_reason}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-muted)]">Policies Matched:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {result.summary.policies_matched} / {result.summary.policies_evaluated}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Eval Time:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {result.trace.evaluation_time_ms}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Trace */}
            <DecisionTrace trace={result.trace} />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Would integrate with eval case creation
                  alert("Create eval test case from this result");
                }}
                className="flex-1 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Create Eval Test Case
              </button>
              <button
                onClick={() => {
                  // Would integrate with guardrail rule creation
                  alert("Create guardrail rule from this result");
                }}
                className="flex-1 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Create Guardrail Rule
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-12 text-center">
            <p className="text-[var(--text-muted)]">
              Configure a request context and click Evaluate to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Decision Trace Component
// ─────────────────────────────────────────────────────────────────────────────

function DecisionTrace({ trace }: { trace: EvaluationTrace }) {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Evaluation Trace
      </h3>

      {/* Reasons */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          Reasons
        </h4>
        <ul className="space-y-1">
          {trace.reasons.map((reason, i) => (
            <li
              key={i}
              className="text-sm text-[var(--text-primary)] flex items-start gap-2"
            >
              <span className="text-[var(--text-muted)]">{i + 1}.</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Triggered Actions */}
      {trace.triggered_actions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            Triggered Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            {trace.triggered_actions.map((action) => (
              <span
                key={action}
                className="px-2 py-1 rounded text-xs bg-[var(--surface-2)] text-[var(--text-primary)]"
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Policies Evaluated */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
          Policies Evaluated ({trace.policies_evaluated.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {trace.policies_evaluated.map((policy) => (
            <PolicyEvalCard
              key={policy.policy_id}
              evaluation={policy}
              isDeciding={policy.policy_id === trace.deciding_policy_id}
              expanded={expandedPolicy === policy.policy_id}
              onToggle={() =>
                setExpandedPolicy(
                  expandedPolicy === policy.policy_id ? null : policy.policy_id
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Evaluation Card
// ─────────────────────────────────────────────────────────────────────────────

function PolicyEvalCard({
  evaluation,
  isDeciding,
  expanded,
  onToggle,
}: {
  evaluation: PolicyEvaluation;
  isDeciding: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        isDeciding
          ? "bg-[var(--electric-lime)]/5 border-[var(--electric-lime)]/30"
          : evaluation.matched
          ? "bg-[var(--surface-2)] border-[var(--border-subtle)]"
          : "bg-[var(--surface-2)]/50 border-[var(--border-subtle)]/50"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full ${
              evaluation.matched
                ? "bg-[var(--success)]"
                : "bg-[var(--text-muted)]"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {evaluation.policy_name}
              {isDeciding && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-[var(--electric-lime)] text-[var(--void)]">
                  Deciding
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Priority {evaluation.priority} · {evaluation.policy_type} ·{" "}
              {evaluation.effect}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            evaluation.matched
              ? "bg-[var(--success)]/20 text-[var(--success)]"
              : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
          }`}
        >
          {evaluation.matched ? "Matched" : "Not Matched"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[var(--border-subtle)] mt-2 pt-3">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {evaluation.reason}
          </p>

          {/* Match details */}
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div
              className={`px-2 py-1 rounded ${
                evaluation.subject_matched
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--error)]/10 text-[var(--error)]"
              }`}
            >
              Subject: {evaluation.subject_matched ? "✓" : "✗"}
            </div>
            <div
              className={`px-2 py-1 rounded ${
                evaluation.resource_matched
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--error)]/10 text-[var(--error)]"
              }`}
            >
              Resource: {evaluation.resource_matched ? "✓" : "✗"}
            </div>
            <div
              className={`px-2 py-1 rounded ${
                evaluation.conditions_matched
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--error)]/10 text-[var(--error)]"
              }`}
            >
              Conditions: {evaluation.conditions_matched ? "✓" : "✗"}
            </div>
          </div>

          {/* Condition evaluations */}
          {evaluation.condition_evaluations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
                Conditions:
              </p>
              <div className="space-y-1">
                {evaluation.condition_evaluations.map((cond, i) => (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1 rounded ${
                      cond.matched
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : "bg-[var(--error)]/10 text-[var(--error)]"
                    }`}
                  >
                    <span className="font-medium">{cond.condition_type}:</span>{" "}
                    {cond.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input Field Component
// ─────────────────────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]";

  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} resize-none`}
          rows={2}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
