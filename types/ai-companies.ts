/* ═══════════════════════════════════════════════════════════════════════════
   AI Companies Types
   Curated AI vendors, groupings, and campaign targets for super-admin drafting
   ═══════════════════════════════════════════════════════════════════════════ */

export type AiCompany = {
  id: string;
  tenant_id: string | null;
  name: string;
  website?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  description?: string | null;
  tags: string[];
  category?: string | null;
  notes?: string | null;
  created_via_ai: boolean;
  source_prompt?: string | null;
  created_at: string;
  updated_at: string;
};

export type AiCompanyGroup = {
  id: string;
  tenant_id: string | null;
  name: string;
  description?: string | null;
  tags: string[];
  strategy?: string | null;
  created_via_ai: boolean;
  source_prompt?: string | null;
  created_at: string;
  updated_at: string;
};

export type AiCompanyGroupMember = {
  group_id: string;
  company_id: string;
  role?: string | null;
  created_at: string;
  company?: AiCompany;
};

export type AiCompanySuggestionRequest = {
  prompt: string;
  companies?: { name: string; description?: string; tags?: string[] }[];
  count?: number;
};

export type AiCompanyGroupSuggestion = {
  name: string;
  description?: string;
  tags?: string[];
  strategy?: string;
  companies: { name: string; why?: string }[];
};

export type AiCompanyGroupSuggestionResponse = {
  groups: AiCompanyGroupSuggestion[];
  model?: string;
};
