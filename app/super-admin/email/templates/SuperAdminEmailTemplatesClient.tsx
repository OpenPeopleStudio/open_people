"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailTemplate, EmailPlan } from "@/types/email";
import { TemplatesManager } from "@/components/email/TemplatesManager";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Email Templates Client Component
   Platform-wide template management with tenant filtering
   ═══════════════════════════════════════════════════════════════════════════ */

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  templates: EmailTemplate[];
  tenants: Tenant[];
  plan: EmailPlan;
};

export function SuperAdminEmailTemplatesClient({ 
  templates: initialTemplates, 
  tenants,
  plan 
}: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Filter templates by tenant
  const filteredTemplates = selectedTenantId
    ? templates.filter(t => t.tenant_id === selectedTenantId)
    : templates;

  // Platform templates (no tenant)
  const platformTemplates = templates.filter(t => !t.tenant_id);
  const tenantTemplates = templates.filter(t => t.tenant_id);

  // Category stats
  const templatesByCategory = {
    transactional: filteredTemplates.filter(t => t.category === "transactional"),
    marketing: filteredTemplates.filter(t => t.category === "marketing"),
    notification: filteredTemplates.filter(t => t.category === "notification"),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/email"
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
              Manage email templates across the platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Tenant Filter */}
          <select
            value={selectedTenantId || ""}
            onChange={(e) => setSelectedTenantId(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">All Templates</option>
            <option value="__platform__">Platform Only</option>
            <optgroup label="Tenants">
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="text-sm text-[var(--text-muted)]">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {platformTemplates.length} Platform
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--info)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {tenantTemplates.length} Tenant
            </span>
          </div>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.transactional.length} Transactional
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.marketing.length} Marketing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {templatesByCategory.notification.length} Notification
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <TemplatesManager
          templates={selectedTenantId === "__platform__" ? platformTemplates : filteredTemplates}
          plan={plan}
          onTemplatesChange={(newTemplates) => {
            // Merge changes back into full templates list
            const updatedIds = new Set(newTemplates.map(t => t.id));
            const unchanged = templates.filter(t => !updatedIds.has(t.id));
            setTemplates([...unchanged, ...newTemplates]);
          }}
        />
      </div>
    </div>
  );
}
