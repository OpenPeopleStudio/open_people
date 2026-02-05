-- ════════════════════════════════════════════════════════════════════════════
-- RAG Enhancements Schema
-- Document lineage, retrieval explainability, eval suite, PII scanning
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: DOCUMENT LINEAGE & PROVENANCE
-- Every chunk knows its doc/version/source connector + permission context
-- ════════════════════════════════════════════════════════════════════════════

-- Source connectors (external systems)
create table if not exists kb_source_connectors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  
  -- Connector identity
  name text not null,
  connector_type text not null, -- 'confluence', 'notion', 'gdrive', 'sharepoint', 's3', 'github', 'web', 'api', 'manual'
  
  -- Connection config (encrypted sensitive fields)
  config jsonb not null default '{}',
  credentials_secret_id uuid, -- Reference to encrypted_secrets
  
  -- Sync settings
  sync_mode text not null default 'incremental', -- 'full', 'incremental'
  sync_frequency text default 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  last_sync_at timestamptz,
  last_sync_status text, -- 'success', 'partial', 'failed'
  last_sync_error text,
  next_sync_at timestamptz,
  
  -- Stats
  documents_synced integer not null default 0,
  last_document_count integer not null default 0,
  
  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'error', 'deleted')),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_kb_source_connectors_tenant 
  on kb_source_connectors(tenant_id, status);

-- Document lineage (tracks origin and transformation history)
create table if not exists kb_document_lineage (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  
  -- Source information
  source_connector_id uuid references kb_source_connectors(id) on delete set null,
  source_type text not null, -- 'connector', 'upload', 'api', 'generated', 'extracted'
  
  -- External source identifiers
  external_id text, -- ID in source system
  external_url text, -- URL in source system
  external_path text, -- Path/location in source system
  
  -- Version tracking
  source_version text, -- Version/revision in source system
  source_modified_at timestamptz, -- Last modified in source
  source_hash text, -- Content hash for change detection
  
  -- Extraction metadata
  extraction_method text, -- 'full_text', 'ocr', 'html_parse', 'api_fetch'
  extraction_config jsonb, -- Parser settings used
  
  -- Parent document (for derived/split documents)
  parent_document_id uuid references knowledge_documents(id) on delete set null,
  derivation_type text, -- 'split', 'summarized', 'translated', 'extracted'
  
  -- Permission context from source
  source_permissions jsonb, -- Original permissions in source system
  access_groups text[], -- Groups that had access in source
  
  -- Audit
  imported_at timestamptz not null default now(),
  imported_by uuid references auth.users(id) on delete set null,
  
  -- Sync tracking
  sync_run_id uuid,
  is_deleted_in_source boolean not null default false,
  deleted_in_source_at timestamptz
);

create index if not exists idx_kb_document_lineage_document 
  on kb_document_lineage(document_id);

create index if not exists idx_kb_document_lineage_connector 
  on kb_document_lineage(source_connector_id, imported_at desc);

create index if not exists idx_kb_document_lineage_external 
  on kb_document_lineage(external_id) 
  where external_id is not null;

-- Chunk lineage (extends chunk with provenance)
create table if not exists kb_chunk_lineage (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references knowledge_chunks(id) on delete cascade,
  document_lineage_id uuid not null references kb_document_lineage(id) on delete cascade,
  
  -- Position in original source
  source_page integer, -- Page number if applicable
  source_section text, -- Section/heading hierarchy
  source_paragraph integer,
  
  -- Chunk generation info
  chunking_strategy text not null, -- 'fixed_size', 'semantic', 'sentence', 'paragraph'
  chunk_config jsonb, -- Chunking parameters used
  
  -- Permission inheritance
  inherits_document_permissions boolean not null default true,
  chunk_level_permissions jsonb, -- Override permissions
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_chunk_lineage_chunk 
  on kb_chunk_lineage(chunk_id);

create index if not exists idx_kb_chunk_lineage_lineage 
  on kb_chunk_lineage(document_lineage_id);


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: RETRIEVAL EXPLAINABILITY
-- Store "why these chunks" + confidence; expose to users/admins
-- ════════════════════════════════════════════════════════════════════════════

-- Retrieval sessions (groups related queries)
create table if not exists kb_retrieval_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Context
  user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid, -- If part of chat
  application_id text,
  
  -- Session metadata
  session_type text not null default 'interactive', -- 'interactive', 'batch', 'eval'
  
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Enhanced retrieval logs with explainability
create table if not exists kb_retrieval_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references kb_retrieval_sessions(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Query
  query_text text not null,
  query_embedding vector(1536),
  query_intent text, -- Detected intent category
  query_entities text[], -- Extracted entities from query
  
  -- Search configuration
  knowledge_bases uuid[], -- Which KBs were searched
  search_config jsonb not null default '{}', -- Filters, thresholds, etc.
  
  -- Results summary
  total_chunks_searched integer,
  chunks_above_threshold integer,
  result_count integer,
  
  -- Timing
  embedding_latency_ms integer,
  search_latency_ms integer,
  rerank_latency_ms integer,
  total_latency_ms integer,
  
  -- Context about the retrieval
  retrieval_reason text, -- Why retrieval was triggered
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_retrieval_results_session 
  on kb_retrieval_results(session_id, created_at desc);

create index if not exists idx_kb_retrieval_results_tenant 
  on kb_retrieval_results(tenant_id, created_at desc);

-- Individual chunk results with explainability
create table if not exists kb_retrieval_result_chunks (
  id uuid primary key default gen_random_uuid(),
  retrieval_id uuid not null references kb_retrieval_results(id) on delete cascade,
  chunk_id uuid not null references knowledge_chunks(id) on delete cascade,
  
  -- Ranking
  rank integer not null,
  
  -- Scores
  semantic_score decimal(5,4) not null, -- Cosine similarity
  rerank_score decimal(5,4), -- Score after reranking
  final_score decimal(5,4) not null, -- Combined/final score
  
  -- Explainability: why this chunk was selected
  selection_reasons jsonb not null default '[]', -- Array of reasons
  -- Example: [{"type": "semantic_match", "detail": "High similarity to query terms"},
  --           {"type": "keyword_match", "keywords": ["project", "timeline"]},
  --           {"type": "entity_match", "entities": ["Acme Corp"]}]
  
  -- Match details
  matched_terms text[], -- Query terms found in chunk
  matched_entities text[], -- Entities found in both query and chunk
  
  -- Confidence
  confidence decimal(3,2) not null, -- 0-1 overall confidence
  confidence_factors jsonb, -- Breakdown of confidence
  -- Example: {"semantic": 0.85, "keyword": 0.7, "recency": 0.9, "source_quality": 0.8}
  
  -- Was it used?
  was_included_in_context boolean not null default true,
  exclusion_reason text, -- Why it wasn't included if excluded
  
  -- Content preview
  content_preview text, -- First N chars for quick reference
  highlighted_content text, -- Content with matches highlighted
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_retrieval_result_chunks_retrieval 
  on kb_retrieval_result_chunks(retrieval_id, rank);

create index if not exists idx_kb_retrieval_result_chunks_chunk 
  on kb_retrieval_result_chunks(chunk_id, created_at desc);

-- Retrieval feedback (for quality improvement)
create table if not exists kb_retrieval_feedback (
  id uuid primary key default gen_random_uuid(),
  retrieval_id uuid not null references kb_retrieval_results(id) on delete cascade,
  result_chunk_id uuid references kb_retrieval_result_chunks(id) on delete cascade,
  
  -- Feedback source
  feedback_source text not null, -- 'user', 'implicit', 'eval', 'admin'
  user_id uuid references auth.users(id) on delete set null,
  
  -- Feedback type
  feedback_type text not null, -- 'helpful', 'not_helpful', 'incorrect', 'outdated', 'irrelevant', 'missing'
  
  -- Details
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  
  -- For "missing" feedback - what should have been retrieved
  expected_content text,
  expected_document_id uuid references knowledge_documents(id) on delete set null,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_retrieval_feedback_retrieval 
  on kb_retrieval_feedback(retrieval_id);


-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: RAG EVAL SUITE
-- Retrieval tests (MRR/recall), answer-grounding checks
-- ════════════════════════════════════════════════════════════════════════════

-- Eval test sets (curated Q&A pairs for evaluation)
create table if not exists kb_eval_test_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Test set info
  name text not null,
  description text,
  
  -- Scope
  knowledge_bases uuid[], -- Which KBs this tests
  
  -- Status
  status text not null default 'active' check (status in ('active', 'archived', 'draft')),
  
  -- Stats
  test_case_count integer not null default 0,
  last_run_at timestamptz,
  last_run_score decimal(5,4),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Individual test cases
create table if not exists kb_eval_test_cases (
  id uuid primary key default gen_random_uuid(),
  test_set_id uuid not null references kb_eval_test_sets(id) on delete cascade,
  
  -- Test case definition
  query text not null,
  query_intent text, -- Expected intent
  
  -- Expected results
  expected_chunks uuid[], -- Chunk IDs that should be retrieved (ground truth)
  expected_documents uuid[], -- Document IDs that should appear
  expected_answer text, -- Expected/ideal answer (for answer grounding)
  
  -- Acceptance criteria
  min_recall decimal(3,2) default 0.8, -- Minimum recall required
  min_mrr decimal(3,2) default 0.7, -- Minimum MRR required
  min_grounding_score decimal(3,2) default 0.8, -- Minimum answer grounding
  
  -- Metadata
  category text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  tags text[],
  
  -- Status
  is_active boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kb_eval_test_cases_set 
  on kb_eval_test_cases(test_set_id, is_active);

-- Eval runs
create table if not exists kb_eval_runs (
  id uuid primary key default gen_random_uuid(),
  test_set_id uuid not null references kb_eval_test_sets(id) on delete cascade,
  
  -- Run info
  run_type text not null default 'full', -- 'full', 'sample', 'single'
  
  -- Configuration
  search_config jsonb not null default '{}', -- Search parameters used
  model_config jsonb, -- Model/embedding config if changed
  
  -- Aggregate metrics
  total_cases integer not null,
  passed_cases integer not null default 0,
  failed_cases integer not null default 0,
  
  -- Retrieval metrics
  avg_recall decimal(5,4),
  avg_precision decimal(5,4),
  avg_mrr decimal(5,4), -- Mean Reciprocal Rank
  avg_ndcg decimal(5,4), -- Normalized Discounted Cumulative Gain
  
  -- Answer metrics (if applicable)
  avg_grounding_score decimal(5,4),
  avg_faithfulness_score decimal(5,4),
  hallucination_count integer,
  
  -- Timing
  total_latency_ms integer,
  avg_latency_ms integer,
  
  -- Status
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'cancelled')),
  error_message text,
  
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_kb_eval_runs_set 
  on kb_eval_runs(test_set_id, started_at desc);

-- Individual test case results
create table if not exists kb_eval_case_results (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid not null references kb_eval_runs(id) on delete cascade,
  test_case_id uuid not null references kb_eval_test_cases(id) on delete cascade,
  
  -- Result
  passed boolean not null,
  
  -- Retrieval metrics for this case
  recall decimal(5,4), -- Retrieved relevant / Total relevant
  precision_at_k decimal(5,4), -- Relevant in top K / K
  mrr decimal(5,4), -- 1 / rank of first relevant
  ndcg decimal(5,4),
  
  -- Retrieved chunks
  retrieved_chunks uuid[],
  retrieved_ranks jsonb, -- {chunk_id: rank}
  
  -- Answer grounding (if answer was generated)
  generated_answer text,
  grounding_score decimal(5,4), -- How well answer is grounded in chunks
  faithfulness_score decimal(5,4), -- Does answer match expected?
  has_hallucination boolean,
  hallucination_details text,
  
  -- Timing
  latency_ms integer,
  
  -- Debug info
  debug_info jsonb, -- Detailed scores, etc.
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_eval_case_results_run 
  on kb_eval_case_results(eval_run_id);

create index if not exists idx_kb_eval_case_results_failed 
  on kb_eval_case_results(eval_run_id) 
  where passed = false;


-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: PII SCAN AT INGEST
-- Classify docs, optionally block or tokenize sensitive chunks
-- ════════════════════════════════════════════════════════════════════════════

-- PII scan results for documents
create table if not exists kb_pii_scan_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  
  -- Scan info
  scan_version text not null default '1.0', -- Scanner version
  scan_config jsonb, -- Scanner configuration used
  
  -- Overall classification
  pii_classification text not null, -- 'none', 'low', 'medium', 'high', 'critical'
  contains_pii boolean not null,
  
  -- PII type breakdown
  pii_types_found text[] not null default '{}', -- ['email', 'phone', 'ssn', 'name', 'address', etc.]
  pii_counts jsonb not null default '{}', -- {'email': 5, 'phone': 2}
  
  -- Risk assessment
  risk_score decimal(3,2), -- 0-1 risk score
  risk_factors jsonb, -- What contributed to risk
  
  -- Action taken
  action_taken text not null, -- 'allowed', 'blocked', 'redacted', 'quarantined', 'manual_review'
  action_reason text,
  
  -- Review
  requires_review boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_decision text, -- 'approve', 'reject', 'redact'
  review_notes text,
  
  scanned_at timestamptz not null default now()
);

create index if not exists idx_kb_pii_scan_results_document 
  on kb_pii_scan_results(document_id);

create index if not exists idx_kb_pii_scan_results_review 
  on kb_pii_scan_results(requires_review, scanned_at desc) 
  where requires_review = true and reviewed_at is null;

-- PII detections at chunk level
create table if not exists kb_pii_chunk_detections (
  id uuid primary key default gen_random_uuid(),
  scan_result_id uuid not null references kb_pii_scan_results(id) on delete cascade,
  chunk_id uuid not null references knowledge_chunks(id) on delete cascade,
  
  -- Detection details
  pii_type text not null, -- 'email', 'phone', 'ssn', 'name', 'address', 'dob', 'credit_card', etc.
  
  -- Location in chunk
  start_offset integer not null,
  end_offset integer not null,
  
  -- Confidence
  confidence decimal(3,2) not null, -- 0-1 confidence
  detection_method text, -- 'regex', 'ner', 'ml_classifier'
  
  -- Original value (encrypted or hashed for audit)
  value_hash text, -- SHA256 of detected value
  value_preview text, -- Masked preview: "j***@example.com"
  
  -- Handling
  was_redacted boolean not null default false,
  redaction_token text, -- Replacement token if redacted
  
  created_at timestamptz not null default now()
);

create index if not exists idx_kb_pii_chunk_detections_scan 
  on kb_pii_chunk_detections(scan_result_id);

create index if not exists idx_kb_pii_chunk_detections_chunk 
  on kb_pii_chunk_detections(chunk_id);

create index if not exists idx_kb_pii_chunk_detections_type 
  on kb_pii_chunk_detections(pii_type);

-- PII handling policies
create table if not exists kb_pii_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Policy info
  name text not null,
  description text,
  is_default boolean not null default false,
  
  -- Detection settings
  enabled_pii_types text[] not null default '{}', -- Which types to detect
  detection_sensitivity text not null default 'medium', -- 'low', 'medium', 'high'
  
  -- Action rules
  action_rules jsonb not null default '[]',
  -- Example: [
  --   {"pii_type": "ssn", "action": "block", "min_confidence": 0.9},
  --   {"pii_type": "email", "action": "redact", "min_confidence": 0.8},
  --   {"pii_type": "*", "classification": "critical", "action": "quarantine"}
  -- ]
  
  -- Defaults
  default_action text not null default 'allow', -- If no rule matches
  require_review_above text, -- 'low', 'medium', 'high', 'critical'
  
  -- Status
  is_active boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kb_pii_policies_tenant 
  on kb_pii_policies(tenant_id, is_active);

-- Ensure only one default policy per tenant
create unique index if not exists idx_kb_pii_policies_default 
  on kb_pii_policies(tenant_id) 
  where is_default = true;


-- ════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Get chunk with full lineage
create or replace function get_chunk_with_lineage(p_chunk_id uuid)
returns table (
  chunk_id uuid,
  content text,
  document_id uuid,
  document_title text,
  source_type text,
  source_connector_type text,
  external_url text,
  source_version text,
  source_modified_at timestamptz,
  source_section text,
  pii_classification text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    kc.id as chunk_id,
    kc.content,
    kd.id as document_id,
    kd.title as document_title,
    dl.source_type,
    sc.connector_type as source_connector_type,
    dl.external_url,
    dl.source_version,
    dl.source_modified_at,
    cl.source_section,
    psr.pii_classification
  from knowledge_chunks kc
  join knowledge_documents kd on kc.document_id = kd.id
  left join kb_document_lineage dl on dl.document_id = kd.id
  left join kb_source_connectors sc on dl.source_connector_id = sc.id
  left join kb_chunk_lineage cl on cl.chunk_id = kc.id
  left join kb_pii_scan_results psr on psr.document_id = kd.id
  where kc.id = p_chunk_id;
end;
$$;

-- Log a retrieval with explainability
create or replace function log_retrieval_result(
  p_tenant_id uuid,
  p_session_id uuid,
  p_query_text text,
  p_query_embedding vector(1536),
  p_chunks jsonb, -- Array of {chunk_id, semantic_score, final_score, selection_reasons, confidence}
  p_search_config jsonb default '{}',
  p_latency_ms integer default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_retrieval_id uuid;
  v_chunk jsonb;
begin
  -- Insert retrieval result
  insert into kb_retrieval_results (
    tenant_id,
    session_id,
    query_text,
    query_embedding,
    search_config,
    result_count,
    total_latency_ms
  ) values (
    p_tenant_id,
    p_session_id,
    p_query_text,
    p_query_embedding,
    p_search_config,
    jsonb_array_length(p_chunks),
    p_latency_ms
  )
  returning id into v_retrieval_id;

  -- Insert individual chunk results
  for v_chunk in select * from jsonb_array_elements(p_chunks)
  loop
    insert into kb_retrieval_result_chunks (
      retrieval_id,
      chunk_id,
      rank,
      semantic_score,
      final_score,
      selection_reasons,
      confidence,
      was_included_in_context
    ) values (
      v_retrieval_id,
      (v_chunk->>'chunk_id')::uuid,
      (v_chunk->>'rank')::integer,
      (v_chunk->>'semantic_score')::decimal,
      (v_chunk->>'final_score')::decimal,
      coalesce(v_chunk->'selection_reasons', '[]'::jsonb),
      (v_chunk->>'confidence')::decimal,
      coalesce((v_chunk->>'included')::boolean, true)
    );
  end loop;

  return v_retrieval_id;
end;
$$;

-- Calculate MRR for eval
create or replace function calculate_mrr(
  p_retrieved uuid[],
  p_expected uuid[]
)
returns decimal
language plpgsql
immutable
as $$
declare
  v_rank integer := 1;
  v_retrieved_id uuid;
begin
  foreach v_retrieved_id in array p_retrieved
  loop
    if v_retrieved_id = any(p_expected) then
      return 1.0 / v_rank;
    end if;
    v_rank := v_rank + 1;
  end loop;
  
  return 0;
end;
$$;

-- Calculate recall for eval
create or replace function calculate_recall(
  p_retrieved uuid[],
  p_expected uuid[]
)
returns decimal
language plpgsql
immutable
as $$
declare
  v_relevant_retrieved integer := 0;
  v_retrieved_id uuid;
begin
  if array_length(p_expected, 1) is null or array_length(p_expected, 1) = 0 then
    return 1.0;
  end if;

  foreach v_retrieved_id in array p_retrieved
  loop
    if v_retrieved_id = any(p_expected) then
      v_relevant_retrieved := v_relevant_retrieved + 1;
    end if;
  end loop;
  
  return v_relevant_retrieved::decimal / array_length(p_expected, 1);
end;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════

alter table kb_source_connectors enable row level security;
alter table kb_document_lineage enable row level security;
alter table kb_chunk_lineage enable row level security;
alter table kb_retrieval_sessions enable row level security;
alter table kb_retrieval_results enable row level security;
alter table kb_retrieval_result_chunks enable row level security;
alter table kb_retrieval_feedback enable row level security;
alter table kb_eval_test_sets enable row level security;
alter table kb_eval_test_cases enable row level security;
alter table kb_eval_runs enable row level security;
alter table kb_eval_case_results enable row level security;
alter table kb_pii_scan_results enable row level security;
alter table kb_pii_chunk_detections enable row level security;
alter table kb_pii_policies enable row level security;

-- Service role full access
drop policy if exists "Service role full access to kb_source_connectors" on kb_source_connectors;
create policy "Service role full access to kb_source_connectors"
  on kb_source_connectors for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_document_lineage" on kb_document_lineage;
create policy "Service role full access to kb_document_lineage"
  on kb_document_lineage for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_chunk_lineage" on kb_chunk_lineage;
create policy "Service role full access to kb_chunk_lineage"
  on kb_chunk_lineage for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_retrieval_sessions" on kb_retrieval_sessions;
create policy "Service role full access to kb_retrieval_sessions"
  on kb_retrieval_sessions for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_retrieval_results" on kb_retrieval_results;
create policy "Service role full access to kb_retrieval_results"
  on kb_retrieval_results for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_retrieval_result_chunks" on kb_retrieval_result_chunks;
create policy "Service role full access to kb_retrieval_result_chunks"
  on kb_retrieval_result_chunks for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_retrieval_feedback" on kb_retrieval_feedback;
create policy "Service role full access to kb_retrieval_feedback"
  on kb_retrieval_feedback for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_eval_test_sets" on kb_eval_test_sets;
create policy "Service role full access to kb_eval_test_sets"
  on kb_eval_test_sets for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_eval_test_cases" on kb_eval_test_cases;
create policy "Service role full access to kb_eval_test_cases"
  on kb_eval_test_cases for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_eval_runs" on kb_eval_runs;
create policy "Service role full access to kb_eval_runs"
  on kb_eval_runs for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_eval_case_results" on kb_eval_case_results;
create policy "Service role full access to kb_eval_case_results"
  on kb_eval_case_results for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_pii_scan_results" on kb_pii_scan_results;
create policy "Service role full access to kb_pii_scan_results"
  on kb_pii_scan_results for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_pii_chunk_detections" on kb_pii_chunk_detections;
create policy "Service role full access to kb_pii_chunk_detections"
  on kb_pii_chunk_detections for all
  using (auth.jwt() ->> 'role' = 'service_role');

drop policy if exists "Service role full access to kb_pii_policies" on kb_pii_policies;
create policy "Service role full access to kb_pii_policies"
  on kb_pii_policies for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Tenant access policies
drop policy if exists "Tenant access to source connectors" on kb_source_connectors;
create policy "Tenant access to source connectors"
  on kb_source_connectors for all
  using (
    tenant_id = (
      select p.tenant_id from "profiles" p 
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

drop policy if exists "Tenant access to retrieval sessions" on kb_retrieval_sessions;
create policy "Tenant access to retrieval sessions"
  on kb_retrieval_sessions for select
  using (
    tenant_id = (
      select p.tenant_id from "profiles" p where p.id = auth.uid()
    )
    or user_id = auth.uid()
  );

drop policy if exists "Tenant access to retrieval results" on kb_retrieval_results;
create policy "Tenant access to retrieval results"
  on kb_retrieval_results for select
  using (
    tenant_id = (
      select p.tenant_id from "profiles" p where p.id = auth.uid()
    )
  );

drop policy if exists "Tenant access to eval test sets" on kb_eval_test_sets;
create policy "Tenant access to eval test sets"
  on kb_eval_test_sets for all
  using (
    tenant_id = (
      select p.tenant_id from "profiles" p 
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

drop policy if exists "Tenant access to PII policies" on kb_pii_policies;
create policy "Tenant access to PII policies"
  on kb_pii_policies for all
  using (
    tenant_id = (
      select p.tenant_id from "profiles" p 
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );
