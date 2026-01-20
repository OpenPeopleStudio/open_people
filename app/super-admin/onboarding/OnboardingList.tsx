"use client";

import { useState } from "react";
import Link from "next/link";
import type { TenantOnboarding, OnboardingStatus } from "@/types/onboarding";
import {
  INDUSTRY_OPTIONS,
  BUSINESS_STAGE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  OFFERINGS_TYPE_OPTIONS,
  AI_COMFORT_OPTIONS,
  BUDGET_OPTIONS,
  REFERRAL_OPTIONS,
} from "@/types/onboarding";

/* ═══════════════════════════════════════════════════════════════════════════
   Onboarding List Component
   Client component for filtering and viewing onboarding submissions
   ═══════════════════════════════════════════════════════════════════════════ */

type OnboardingWithTenant = TenantOnboarding & {
  tenants: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
};

type Props = {
  onboardings: OnboardingWithTenant[];
};

export function OnboardingList({ onboardings }: Props) {
  const [filter, setFilter] = useState<OnboardingStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "all"
    ? onboardings
    : onboardings.filter((o) => o.status === filter);

  const getStatusColor = (status: OnboardingStatus) => {
    switch (status) {
      case "completed":
        return "bg-[var(--success)]/10 text-[var(--success)]";
      case "in_progress":
        return "bg-[var(--warning)]/10 text-[var(--warning)]";
      case "skipped":
        return "bg-[var(--text-muted)]/10 text-[var(--text-muted)]";
      default:
        return "bg-[var(--surface-2)] text-[var(--text-secondary)]";
    }
  };

  const getLabel = (value: string | null, options: readonly { value: string; label: string }[]) => {
    if (!value) return "—";
    return options.find((o) => o.value === value)?.label || value;
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "completed", "in_progress", "skipped", "not_started"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          No onboarding submissions found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((onboarding) => (
            <div
              key={onboarding.id}
              className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden"
            >
              {/* Header row (always visible) */}
              <button
                onClick={() => setExpandedId(expandedId === onboarding.id ? null : onboarding.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--surface-2)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-[var(--electric-lime)]">
                      {onboarding.tenants?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {onboarding.tenants?.name || "Unknown Tenant"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(onboarding.status)}`}>
                        {onboarding.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-0.5">
                      {onboarding.tenants?.slug}.openpeople.ai
                      {onboarding.industry && (
                        <span className="ml-2">
                          · {getLabel(onboarding.industry, INDUSTRY_OPTIONS)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-[var(--text-secondary)]">
                      Step {onboarding.current_step}/9
                    </div>
                    <div className="text-[var(--text-muted)] text-xs">
                      {new Date(onboarding.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${
                      expandedId === onboarding.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === onboarding.id && (
                <div className="border-t border-[var(--border-subtle)] p-6 bg-[var(--surface-2)]/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Business Basics */}
                    <Section title="Business Basics">
                      <DataRow label="Industry" value={getLabel(onboarding.industry, INDUSTRY_OPTIONS)} />
                      {onboarding.industry === "other" && (
                        <DataRow label="Industry (other)" value={onboarding.industry_other} />
                      )}
                      <DataRow label="Stage" value={getLabel(onboarding.business_stage, BUSINESS_STAGE_OPTIONS)} />
                      <DataRow label="Company Size" value={getLabel(onboarding.company_size, COMPANY_SIZE_OPTIONS)} />
                    </Section>

                    {/* Offerings */}
                    <Section title="Offerings">
                      <DataRow label="Type" value={getLabel(onboarding.offerings_type, OFFERINGS_TYPE_OPTIONS)} />
                      <DataRow label="Description" value={onboarding.offerings_description} truncate />
                      <DataRow label="Value Prop" value={onboarding.primary_value_prop} truncate />
                    </Section>

                    {/* Audience */}
                    <Section title="Target Audience">
                      <DataRow label="Audience" value={onboarding.target_audience} truncate />
                      <DataRow label="Geographic" value={onboarding.geographic_focus} />
                      <DataRow
                        label="Segments"
                        value={onboarding.customer_segments?.map((s) => s.name).join(", ") || null}
                      />
                    </Section>

                    {/* Goals */}
                    <Section title="Goals">
                      <DataRow label="Timeline" value={onboarding.timeline} />
                      <TagList label="Goals" items={onboarding.primary_goals || []} />
                      <DataRow
                        label="Metrics"
                        value={onboarding.success_metrics?.map((m) => m.metric).join(", ") || null}
                        truncate
                      />
                    </Section>

                    {/* Challenges */}
                    <Section title="Challenges">
                      <TagList label="Pain Points" items={onboarding.pain_points || []} />
                      <DataRow label="Biggest Challenge" value={onboarding.biggest_challenge} truncate />
                    </Section>

                    {/* Tools */}
                    <Section title="Current Tools">
                      <TagList label="Tools" items={onboarding.current_tools || []} />
                      <TagList label="Data Sources" items={onboarding.data_sources || []} />
                      <DataRow label="Integration Needs" value={onboarding.integration_needs} truncate />
                    </Section>

                    {/* AI Interests */}
                    <Section title="AI Interests">
                      <DataRow label="Comfort Level" value={getLabel(onboarding.ai_comfort_level, AI_COMFORT_OPTIONS)} />
                      <TagList label="Use Cases" items={onboarding.ai_use_cases || []} />
                      <TagList label="Automation" items={onboarding.automation_priorities || []} />
                    </Section>

                    {/* Budget */}
                    <Section title="Budget & Resources">
                      <DataRow label="Budget" value={getLabel(onboarding.budget_range, BUDGET_OPTIONS)} />
                      <DataRow label="Team" value={onboarding.team_involvement} />
                      <DataRow label="Decision Timeline" value={onboarding.decision_timeline} />
                    </Section>

                    {/* Additional */}
                    <Section title="Additional">
                      <DataRow label="Referral" value={getLabel(onboarding.how_did_you_hear, REFERRAL_OPTIONS)} />
                      <DataRow label="Notes" value={onboarding.additional_notes} truncate />
                      <DataRow label="Completed" value={onboarding.completed_at ? new Date(onboarding.completed_at).toLocaleString() : null} />
                    </Section>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-4">
                    <Link
                      href={`/super-admin/tenants/${onboarding.tenant_id}`}
                      className="text-sm font-medium text-[var(--electric-lime)] hover:underline"
                    >
                      View Tenant Details
                    </Link>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ID: {onboarding.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string | null | undefined;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-[var(--text-muted)] shrink-0 w-24">{label}:</span>
      <span
        className={`text-[var(--text-secondary)] ${truncate ? "truncate max-w-[200px]" : ""}`}
        title={truncate && value ? value : undefined}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return <DataRow label={label} value={null} />;
  }

  return (
    <div className="text-sm">
      <span className="text-[var(--text-muted)]">{label}:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {items.slice(0, 5).map((item) => (
          <span
            key={item}
            className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]"
          >
            {item}
          </span>
        ))}
        {items.length > 5 && (
          <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
            +{items.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
