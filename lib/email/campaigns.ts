import type { EmailCampaignDraft, EmailCampaignRecipient } from "@/types/email";

export type CampaignWithRecipients = EmailCampaignDraft & { recipients?: EmailCampaignRecipient[] };

export function mapCampaignRow(row: any): CampaignWithRecipients {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    subject: row.subject,
    body_text: row.body_text,
    body_html: row.body_html,
    status: row.status,
    audience_description: row.audience_description,
    generated_via_ai: row.generated_via_ai ?? false,
    generation_prompt: row.generation_prompt,
    sender_account_id: row.sender_account_id,
    total_recipients: row.total_recipients || 0,
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
  };
}

export function dedupeRecipients(recipients: EmailCampaignRecipient[]): EmailCampaignRecipient[] {
  const seen = new Map<string, EmailCampaignRecipient>();
  recipients.forEach((r) => {
    const key = r.to_email.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  });
  return Array.from(seen.values());
}

import type { EmailCampaignDraft, EmailCampaignRecipient } from "@/types/email";

export type CampaignWithRecipients = EmailCampaignDraft & { recipients?: EmailCampaignRecipient[] };

export function mapCampaignRow(row: any): CampaignWithRecipients {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    subject: row.subject,
    body_text: row.body_text,
    body_html: row.body_html,
    status: row.status,
    audience_description: row.audience_description,
    generated_via_ai: row.generated_via_ai ?? false,
    generation_prompt: row.generation_prompt,
    sender_account_id: row.sender_account_id,
    total_recipients: row.total_recipients || 0,
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
  };
}

export function dedupeRecipients(recipients: EmailCampaignRecipient[]): EmailCampaignRecipient[] {
  const seen = new Map<string, EmailCampaignRecipient>();
  recipients.forEach((r) => {
    const key = r.to_email.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  });
  return Array.from(seen.values());
}

