"use client";

import { useState } from "react";
import type { LintResponse, LintIssue } from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   Policies Dashboard Client Component
   Lists policies with lint status and actions
   ═══════════════════════════════════════════════════════════════════════════ */

type Policy = {
  id: string;
  name: string;
  description: string | null;
  policy_type: string;
  effect: string;
  priority: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  subject_count: number;
  resource_count: number;
  condition_count: number;
  created_at: string;
};

type Props = {
  policies: Policy[];
  tenantId: string;
};

export function PoliciesDashboard({ policies: initialPolicies, tenantId }: Props) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [lintResult, setLintResult] = useState<LintResponse | null>(null);
  const [linting, setLinting] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const handleLintAll = async () => {
    setLinting(true);
    try {
      const res = await fetch("/api/policies/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setLintResult(data);
      }
    } catch (error) {
      console.error("Lint error:", error);
    } finally {
      setLinting(false);
    }
  };

  const handleToggleActive = async (policyId: string, isActive: boolean) => {
    // Optimistic update
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, is_active: isActive } : p))
    );

    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!res.ok) {
        // Revert on failure
        setPolicies((prev) =>
          prev.map((p) => (p.id === policyId ? { ...p, is_active: !isActive } : p))
        );
      }
    } catch (error) {
      console.error("Toggle error:", error);
      // Revert on error
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, is_active: !isActive } : p))
      );
    }
  };

  const filteredPolicies = policies.filter((p) => {
    if (filter === "active") return p.is_active;
    if (filter === "inactive") return !p.is_active;
    return true;
  });

  // Get lint issues per policy
  const getIssuesForPolicy = (policyId: string): LintIssue[] => {
    if (!lintResult) return [];
    return lintResult.issues.filter((i) => i.policy_ids.includes(policyId));
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? "bg-[var(--electric-lime)] text-[var(--void)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && ` (${policies.length})`}
              {f === "active" && ` (${policies.filter((p) => p.is_active).length})`}
              {f === "inactive" && ` (${policies.filter((p) => !p.is_active).length})`}
            </button>
          ))}
        </div>

        <button
          onClick={handleLintAll}
          disabled={linting}
          className="px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          {linting ? "Linting..." : "Lint All Policies"}
        </button>
      </div>

      {/* Lint Summary */}
      {lintResult && (
        <div
          className={`rounded-xl border p-4 ${
            !lintResult.passed
              ? "bg-[var(--error)]/5 border-[var(--error)]/20"
              : lintResult.summary.warnings > 0
              ? "bg-[var(--warning)]/5 border-[var(--warning)]/20"
              : "bg-[var(--success)]/5 border-[var(--success)]/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`text-sm font-medium ${
                  !lintResult.passed
                    ? "text-[var(--error)]"
                    : lintResult.summary.warnings > 0
                    ? "text-[var(--warning)]"
                    : "text-[var(--success)]"
                }`}
              >
                {!lintResult.passed
                  ? "Lint Failed"
                  : lintResult.summary.warnings > 0
                  ? "Lint Passed with Warnings"
                  : "Lint Passed"}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {lintResult.summary.errors} errors · {lintResult.summary.warnings} warnings · {lintResult.summary.info} info
              </span>
            </div>
            <button
              onClick={() => setLintResult(null)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Dismiss
            </button>
          </div>

          {lintResult.issues.length > 0 && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {lintResult.issues.slice(0, 10).map((issue, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm p-2 rounded ${
                    issue.severity === "error"
                      ? "bg-[var(--error)]/10"
                      : issue.severity === "warning"
                      ? "bg-[var(--warning)]/10"
                      : "bg-[var(--surface-2)]"
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      issue.severity === "error"
                        ? "bg-[var(--error)] text-white"
                        : issue.severity === "warning"
                        ? "bg-[var(--warning)] text-[var(--void)]"
                        : "bg-[var(--text-muted)] text-white"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)]">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Suggestion: {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {lintResult.issues.length > 10 && (
                <p className="text-xs text-[var(--text-muted)] text-center">
                  And {lintResult.issues.length - 10} more issues...
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Policies List */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">No policies found</p>
            <a
              href="/admin/policies/new"
              className="inline-block mt-4 btn-primary text-sm"
            >
              Create your first policy
            </a>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredPolicies.map((policy) => {
              const issues = getIssuesForPolicy(policy.id);
              const hasError = issues.some((i) => i.severity === "error");
              const hasWarning = issues.some((i) => i.severity === "warning");

              return (
                <div
                  key={policy.id}
                  className={`p-4 hover:bg-[var(--surface-2)]/50 transition-colors ${
                    hasError
                      ? "border-l-2 border-l-[var(--error)]"
                      : hasWarning
                      ? "border-l-2 border-l-[var(--warning)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/admin/policies/${policy.id}`}
                            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--electric-lime)]"
                          >
                            {policy.name}
                          </a>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              policy.effect === "allow"
                                ? "bg-[var(--success)]/20 text-[var(--success)]"
                                : "bg-[var(--error)]/20 text-[var(--error)]"
                            }`}
                          >
                            {policy.effect}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-2)] text-[var(--text-muted)]">
                            P{policy.priority}
                          </span>
                          {issues.length > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                hasError
                                  ? "bg-[var(--error)]/20 text-[var(--error)]"
                                  : "bg-[var(--warning)]/20 text-[var(--warning)]"
                              }`}
                            >
                              {issues.length} issue{issues.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {policy.policy_type} · {policy.subject_count} subjects · {policy.resource_count} resources · {policy.condition_count} conditions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.is_active}
                          onChange={(e) =>
                            handleToggleActive(policy.id, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                        />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {policy.is_active ? "Active" : "Inactive"}
                        </span>
                      </label>

                      <a
                        href={`/admin/policies/${policy.id}`}
                        className="px-3 py-1 rounded text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Edit
                      </a>
                    </div>
                  </div>

                  {/* Show lint issues inline */}
                  {issues.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {issues.slice(0, 2).map((issue, i) => (
                        <p
                          key={i}
                          className={`text-xs ${
                            issue.severity === "error"
                              ? "text-[var(--error)]"
                              : issue.severity === "warning"
                              ? "text-[var(--warning)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {issue.rule}: {issue.message}
                        </p>
                      ))}
                      {issues.length > 2 && (
                        <p className="text-xs text-[var(--text-muted)]">
                          +{issues.length - 2} more issues
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
