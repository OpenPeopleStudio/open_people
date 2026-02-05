import type { EmailCampaignDraft, EmailCampaignRecipient } from "@/types/email";

export type CampaignWithRecipients = EmailCampaignDraft & { recipients?: EmailCampaignRecipient[] };

type CampaignRow = {
  id: string;
  tenant_id: string;
  name: string;
  subject?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  status?: string | null;
  audience_description?: string | null;
  generated_via_ai?: boolean | null;
  generation_prompt?: string | null;
  sender_account_id?: string | null;
  total_recipients?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  recipients?: EmailCampaignRecipient[] | null;
};

export function mapCampaignRow(row: CampaignRow): CampaignWithRecipients {
  const mapped: CampaignWithRecipients = {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    status: "draft",
    generated_via_ai: row.generated_via_ai ?? false,
    total_recipients: row.total_recipients || 0,
    metadata: row.metadata || {},
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
  };
  if (row.subject !== undefined) {
    mapped.subject = row.subject;
  }
  if (row.body_text !== undefined) {
    mapped.body_text = row.body_text;
  }
  if (row.body_html !== undefined) {
    mapped.body_html = row.body_html;
  }
  if (row.audience_description !== undefined) {
    mapped.audience_description = row.audience_description;
  }
  if (row.generation_prompt !== undefined) {
    mapped.generation_prompt = row.generation_prompt;
  }
  if (row.sender_account_id !== undefined) {
    mapped.sender_account_id = row.sender_account_id;
  }
  return mapped;
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
