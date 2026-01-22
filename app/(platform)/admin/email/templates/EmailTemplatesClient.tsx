"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailTemplate, EmailPlan } from "@/types/email";
import { TemplatesManager } from "@/components/email/TemplatesManager";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Templates Client Component
   Full-page template management with enhanced UX
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  templates: EmailTemplate[];
  plan: EmailPlan;
};

export function EmailTemplatesClient({ templates: initialTemplates, plan }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);

  const templatesByCategory = {
    transactional: templates.filter(t => t.category === "transactional"),
    marketing: templates.filter(t => t.category === "marketing"),
    notification: templates.filter(t => t.category === "notification"),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/email"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Email
          </Link>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Email Templates</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Create and manage reusable email templates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Plan Badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-muted)]">
              {templates.length} / {plan.templates === -1 ? "∞" : plan.templates} templates
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] capitalize">
              {plan.name}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--info)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.transactional.length} Transactional
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.marketing.length} Marketing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.notification.length} Notification
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <TemplatesManager
          templates={templates}
          plan={plan}
          onTemplatesChange={setTemplates}
        />
      </div>
    </div>
  );
}
