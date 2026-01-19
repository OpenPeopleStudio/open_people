/**
 * Minimum Lovable Foundation Types
 * Core types for tenant, activity, knowledge, and AI tracing
 */

// ════════════════════════════════════════════════════════════════════════════
// TENANT & WORKSPACE
// ════════════════════════════════════════════════════════════════════════════

export interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  permissions: Record<string, boolean>;
  status: "active" | "suspended" | "pending";
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invited_by: string;
  accepted_by: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY LEDGER
// ════════════════════════════════════════════════════════════════════════════

export interface ActivityEntry {
  id: string;
  tenant_id: string | null;
  workspace_id: string | null;
  
  actor_id: string | null;
  actor_type: "user" | "system" | "ai" | "api";
  actor_metadata: {
    email?: string;
    name?: string;
    ip?: string;
    user_agent?: string;
    api_key_id?: string;
  };
  
  action: string;
  action_category: "auth" | "data" | "ai" | "admin" | "security" | null;
  
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  
  context: Record<string, unknown>;
  
  success: boolean;
  error_code: string | null;
  error_message: string | null;
  
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  
  created_at: string;
}

export type ActivityAction =
  // Auth
  | "auth.login"
  | "auth.logout"
  | "auth.password_change"
  // Data
  | "file.upload"
  | "file.download"
  | "file.delete"
  | "folder.create"
  | "folder.delete"
  | "note.create"
  | "note.update"
  | "note.delete"
  // AI
  | "chat.send"
  | "chat.receive"
  | "memory.create"
  | "memory.delete"
  | "fact.create"
  | "fact.verify"
  // Admin
  | "tenant.create"
  | "tenant.update"
  | "member.invite"
  | "member.remove"
  | "role.change";

// ════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE STORE
// ════════════════════════════════════════════════════════════════════════════

export interface KnowledgeDocument {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  
  title: string;
  slug: string | null;
  content: string;
  content_type: "markdown" | "text" | "json";
  
  source_type: "manual" | "imported" | "extracted" | "generated" | null;
  source_id: string | null;
  source_url: string | null;
  
  category: string | null;
  tags: string[];
  
  status: "active" | "archived" | "pending_review";
  visibility: "private" | "tenant" | "public";
  
  metadata: Record<string, unknown>;
  word_count: number | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined
  chunks?: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  
  content: string;
  chunk_index: number;
  
  start_char: number | null;
  end_char: number | null;
  
  metadata: Record<string, unknown>;
  token_count: number | null;
  
  created_at: string;
  
  // Computed
  similarity?: number;
}

export interface KnowledgeCitation {
  id: string;
  citing_type: "ai_message" | "note" | "document";
  citing_id: string;
  chunk_id: string;
  document_id: string;
  relevance_score: number | null;
  excerpt: string | null;
  usage_type: "context" | "reference" | "quote" | null;
  created_at: string;
  
  // Joined
  chunk?: KnowledgeChunk;
  document?: KnowledgeDocument;
}

// ════════════════════════════════════════════════════════════════════════════
// AI RUN TRACES
// ════════════════════════════════════════════════════════════════════════════

export interface AIRun {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  
  run_type: "chat" | "completion" | "embedding" | "analysis" | "extraction";
  parent_run_id: string | null;
  
  model: string;
  model_version: string | null;
  provider: "openai" | "anthropic" | "google" | null;
  
  input_type: "messages" | "text" | "image" | null;
  input_preview: string | null;
  input_tokens: number | null;
  
  system_prompt: string | null;
  context_summary: string | null;
  
  output_preview: string | null;
  output_tokens: number | null;
  total_tokens: number | null;
  
  context_used: {
    memories?: { id: string; content: string; similarity: number }[];
    notes?: { id: string; title: string; excerpt: string }[];
    files?: { id: string; filename: string; summary: string }[];
    chunks?: { id: string; document_title: string; content: string; similarity: number }[];
    facts?: { id: string; fact: string; type: string; similarity: number }[];
  };
  
  reasoning: string | null;
  confidence: number | null;
  
  safety_flags: Record<string, unknown>;
  was_filtered: boolean;
  filter_reason: string | null;
  
  latency_ms: number | null;
  time_to_first_token_ms: number | null;
  
  estimated_cost_usd: number | null;
  
  status: "pending" | "streaming" | "completed" | "failed" | "cancelled";
  error_code: string | null;
  error_message: string | null;
  
  started_at: string;
  completed_at: string | null;
  created_at: string;
  
  // Joined
  context_items?: AIRunContextItem[];
}

export interface AIRunContextItem {
  id: string;
  run_id: string;
  
  source_type: "memory" | "note" | "file" | "chunk" | "entity" | "fact";
  source_id: string | null;
  source_name: string | null;
  
  content_preview: string | null;
  token_count: number | null;
  
  relevance_score: number | null;
  selection_reason: string | null;
  
  context_position: number | null;
  
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE FACTS (Separated from raw chat)
// ════════════════════════════════════════════════════════════════════════════

export interface KnowledgeFact {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  
  fact: string;
  fact_type: FactType;
  
  subject_type: "user" | "project" | "person" | "company" | "system" | null;
  subject_id: string | null;
  subject_name: string | null;
  
  confidence: number;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  
  valid_from: string | null;
  valid_until: string | null;
  is_current: boolean;
  
  source_type: "conversation" | "manual" | "import" | "extraction";
  source_id: string | null;
  source_excerpt: string | null;
  
  category: string | null;
  tags: string[];
  
  importance: number;
  access_count: number;
  last_accessed_at: string | null;
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Computed
  similarity?: number;
}

export type FactType =
  | "user_preference"
  | "project_detail"
  | "business_rule"
  | "contact"
  | "date"
  | "location"
  | "relationship"
  | "technical"
  | "process"
  | "decision"
  | "goal"
  | "constraint";

export interface FactContradiction {
  id: string;
  fact_id: string;
  contradicts_fact_id: string;
  contradiction_type: "direct" | "temporal" | "conditional" | null;
  description: string | null;
  resolution_status: "unresolved" | "resolved" | "ignored";
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT ENTITIES
// ════════════════════════════════════════════════════════════════════════════

export interface ContextEntity {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  
  entity_type: "person" | "company" | "project" | "product" | "concept";
  name: string;
  description: string | null;
  
  properties: Record<string, unknown>;
  related_entities: {
    id: string;
    type: string;
    relationship: string;
  }[];
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ContextPreset {
  id: string;
  owner_id: string;
  
  name: string;
  description: string | null;
  
  included_notes: string[];
  included_files: string[];
  included_folders: string[];
  included_entities: string[];
  included_documents: string[];
  
  use_facts: boolean;
  use_memories: boolean;
  fact_types: string[];
  memory_categories: string[];
  
  use_count: number;
  last_used_at: string | null;
  
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// API TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface CreateFactRequest {
  fact: string;
  fact_type: FactType;
  subject_type?: string;
  subject_name?: string;
  confidence?: number;
  source_type?: "manual" | "conversation";
  source_id?: string;
  source_excerpt?: string;
  category?: string;
  tags?: string[];
}

export interface CreateKnowledgeDocumentRequest {
  title: string;
  content: string;
  content_type?: "markdown" | "text" | "json";
  source_type?: string;
  source_url?: string;
  category?: string;
  tags?: string[];
  visibility?: "private" | "tenant" | "public";
}

export interface SearchKnowledgeRequest {
  query: string;
  limit?: number;
  threshold?: number;
  include_facts?: boolean;
  include_documents?: boolean;
  fact_types?: FactType[];
}

export interface SearchKnowledgeResponse {
  facts: (KnowledgeFact & { similarity: number })[];
  chunks: (KnowledgeChunk & { document: KnowledgeDocument; similarity: number })[];
}

export interface ContextConfig {
  notes: string[];
  files: string[];
  folders: string[];
  entities: string[];
  documents: string[];
  use_facts: boolean;
  use_memories: boolean;
  fact_types: FactType[];
  memory_categories: string[];
  preset_id?: string;
}

export interface BuiltContext {
  system_context: string;
  sources: ContextSource[];
  token_estimate: number;
  truncated: boolean;
}

export interface ContextSource {
  type: "note" | "file" | "memory" | "fact" | "chunk" | "entity";
  id: string;
  title?: string;
  content: string;
  relevance?: number;
}
