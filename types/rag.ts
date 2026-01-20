/**
 * RAG (Retrieval-Augmented Generation) Types
 *
 * Types for document lineage, retrieval explainability, evaluation, and PII scanning.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Document Lineage & Provenance
// ═══════════════════════════════════════════════════════════════════════════

/** Source connector types */
export type SourceConnectorType =
  | "confluence"
  | "notion"
  | "gdrive"
  | "sharepoint"
  | "s3"
  | "github"
  | "web"
  | "api"
  | "manual";

/** Source connector configuration */
export interface SourceConnector {
  id: string;
  tenant_id: string;
  name: string;
  connector_type: SourceConnectorType;
  config: Record<string, unknown>;
  credentials_secret_id?: string;
  sync_mode: "full" | "incremental";
  sync_frequency: "hourly" | "daily" | "weekly" | "manual";
  last_sync_at?: string;
  last_sync_status?: "success" | "partial" | "failed";
  status: "active" | "paused" | "error" | "deleted";
  documents_synced: number;
  created_at: string;
}

/** Document lineage - tracks origin and transformation */
export interface DocumentLineage {
  id: string;
  document_id: string;

  // Source information
  source_connector_id?: string;
  source_type: "connector" | "upload" | "api" | "generated" | "extracted";

  // External identifiers
  external_id?: string;
  external_url?: string;
  external_path?: string;

  // Version tracking
  source_version?: string;
  source_modified_at?: string;
  source_hash?: string;

  // Extraction metadata
  extraction_method?: "full_text" | "ocr" | "html_parse" | "api_fetch";
  extraction_config?: Record<string, unknown>;

  // Parent document (for derived)
  parent_document_id?: string;
  derivation_type?: "split" | "summarized" | "translated" | "extracted";

  // Permission context
  source_permissions?: Record<string, unknown>;
  access_groups?: string[];

  // Audit
  imported_at: string;
  imported_by?: string;
}

/** Chunk lineage - extends chunk with provenance */
export interface ChunkLineage {
  id: string;
  chunk_id: string;
  document_lineage_id: string;

  // Position in original
  source_page?: number;
  source_section?: string;
  source_paragraph?: number;

  // Chunking info
  chunking_strategy: "fixed_size" | "semantic" | "sentence" | "paragraph";
  chunk_config?: Record<string, unknown>;

  // Permissions
  inherits_document_permissions: boolean;
  chunk_level_permissions?: Record<string, unknown>;
}

/** Chunk with full lineage context */
export interface ChunkWithLineage {
  chunk_id: string;
  content: string;
  document_id: string;
  document_title: string;
  source_type: string;
  source_connector_type?: string;
  external_url?: string;
  source_version?: string;
  source_modified_at?: string;
  source_section?: string;
  pii_classification?: PIIClassification;
}

// ═══════════════════════════════════════════════════════════════════════════
// Retrieval Explainability
// ═══════════════════════════════════════════════════════════════════════════

/** Retrieval session */
export interface RetrievalSession {
  id: string;
  tenant_id?: string;
  user_id?: string;
  conversation_id?: string;
  application_id?: string;
  session_type: "interactive" | "batch" | "eval";
  created_at: string;
  ended_at?: string;
}

/** Selection reason for why a chunk was retrieved */
export interface SelectionReason {
  type: "semantic_match" | "keyword_match" | "entity_match" | "recency" | "popularity" | "explicit";
  detail: string;
  score?: number;
  keywords?: string[];
  entities?: string[];
}

/** Confidence factors breakdown */
export interface ConfidenceFactors {
  semantic: number;
  keyword?: number;
  entity?: number;
  recency?: number;
  source_quality?: number;
  popularity?: number;
}

/** Individual chunk result with explainability */
export interface RetrievalResultChunk {
  id: string;
  retrieval_id: string;
  chunk_id: string;
  rank: number;

  // Scores
  semantic_score: number;
  rerank_score?: number;
  final_score: number;

  // Explainability
  selection_reasons: SelectionReason[];
  matched_terms?: string[];
  matched_entities?: string[];

  // Confidence
  confidence: number;
  confidence_factors?: ConfidenceFactors;

  // Usage
  was_included_in_context: boolean;
  exclusion_reason?: string;

  // Preview
  content_preview?: string;
  highlighted_content?: string;
}

/** Retrieval result with all chunks */
export interface RetrievalResult {
  id: string;
  session_id?: string;
  tenant_id?: string;

  // Query
  query_text: string;
  query_intent?: string;
  query_entities?: string[];

  // Config
  knowledge_bases?: string[];
  search_config: Record<string, unknown>;

  // Summary
  total_chunks_searched?: number;
  chunks_above_threshold?: number;
  result_count: number;

  // Timing
  embedding_latency_ms?: number;
  search_latency_ms?: number;
  rerank_latency_ms?: number;
  total_latency_ms?: number;

  // Chunks
  chunks: RetrievalResultChunk[];

  created_at: string;
}

/** Retrieval feedback */
export interface RetrievalFeedback {
  id: string;
  retrieval_id: string;
  result_chunk_id?: string;
  feedback_source: "user" | "implicit" | "eval" | "admin";
  user_id?: string;
  feedback_type: "helpful" | "not_helpful" | "incorrect" | "outdated" | "irrelevant" | "missing";
  rating?: number;
  comment?: string;
  expected_content?: string;
  expected_document_id?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RAG Evaluation
// ═══════════════════════════════════════════════════════════════════════════

/** Eval test set */
export interface EvalTestSet {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  knowledge_bases?: string[];
  status: "active" | "archived" | "draft";
  test_case_count: number;
  last_run_at?: string;
  last_run_score?: number;
  created_at: string;
  created_by?: string;
}

/** Individual test case */
export interface EvalTestCase {
  id: string;
  test_set_id: string;
  query: string;
  query_intent?: string;

  // Ground truth
  expected_chunks?: string[];
  expected_documents?: string[];
  expected_answer?: string;

  // Acceptance criteria
  min_recall: number;
  min_mrr: number;
  min_grounding_score: number;

  // Metadata
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  is_active: boolean;
}

/** Eval run */
export interface EvalRun {
  id: string;
  test_set_id: string;
  run_type: "full" | "sample" | "single";
  search_config: Record<string, unknown>;
  model_config?: Record<string, unknown>;

  // Counts
  total_cases: number;
  passed_cases: number;
  failed_cases: number;

  // Retrieval metrics
  avg_recall?: number;
  avg_precision?: number;
  avg_mrr?: number;
  avg_ndcg?: number;

  // Answer metrics
  avg_grounding_score?: number;
  avg_faithfulness_score?: number;
  hallucination_count?: number;

  // Timing
  total_latency_ms?: number;
  avg_latency_ms?: number;

  // Status
  status: "running" | "completed" | "failed" | "cancelled";
  error_message?: string;
  started_at: string;
  completed_at?: string;
  created_by?: string;
}

/** Eval case result */
export interface EvalCaseResult {
  id: string;
  eval_run_id: string;
  test_case_id: string;
  passed: boolean;

  // Retrieval metrics
  recall?: number;
  precision_at_k?: number;
  mrr?: number;
  ndcg?: number;

  // Retrieved
  retrieved_chunks?: string[];
  retrieved_ranks?: Record<string, number>;

  // Answer grounding
  generated_answer?: string;
  grounding_score?: number;
  faithfulness_score?: number;
  has_hallucination?: boolean;
  hallucination_details?: string;

  latency_ms?: number;
  debug_info?: Record<string, unknown>;
}

/** Eval metrics summary */
export interface EvalMetrics {
  recall: number;
  precision: number;
  mrr: number;
  ndcg: number;
  grounding_score?: number;
  faithfulness_score?: number;
  hallucination_rate?: number;
  pass_rate: number;
  avg_latency_ms: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PII Scanning
// ═══════════════════════════════════════════════════════════════════════════

/** PII types that can be detected */
export type PIIType =
  | "email"
  | "phone"
  | "ssn"
  | "name"
  | "address"
  | "dob"
  | "credit_card"
  | "bank_account"
  | "passport"
  | "driver_license"
  | "ip_address"
  | "medical_record"
  | "biometric"
  | "password"
  | "api_key"
  | "other";

/** PII classification levels */
export type PIIClassification = "none" | "low" | "medium" | "high" | "critical";

/** PII action to take */
export type PIIAction = "allowed" | "blocked" | "redacted" | "quarantined" | "manual_review";

/** PII scan result for a document */
export interface PIIScanResult {
  id: string;
  document_id: string;
  scan_version: string;
  scan_config?: Record<string, unknown>;

  // Classification
  pii_classification: PIIClassification;
  contains_pii: boolean;
  pii_types_found: PIIType[];
  pii_counts: Record<PIIType, number>;

  // Risk
  risk_score?: number;
  risk_factors?: Record<string, unknown>;

  // Action
  action_taken: PIIAction;
  action_reason?: string;

  // Review
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_decision?: "approve" | "reject" | "redact";
  review_notes?: string;

  scanned_at: string;
}

/** PII detection at chunk level */
export interface PIIChunkDetection {
  id: string;
  scan_result_id: string;
  chunk_id: string;
  pii_type: PIIType;
  start_offset: number;
  end_offset: number;
  confidence: number;
  detection_method: "regex" | "ner" | "ml_classifier";
  value_hash?: string;
  value_preview?: string;
  was_redacted: boolean;
  redaction_token?: string;
}

/** PII action rule */
export interface PIIActionRule {
  pii_type: PIIType | "*";
  action: PIIAction;
  min_confidence?: number;
  classification?: PIIClassification;
}

/** PII policy configuration */
export interface PIIPolicy {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_default: boolean;
  enabled_pii_types: PIIType[];
  detection_sensitivity: "low" | "medium" | "high";
  action_rules: PIIActionRule[];
  default_action: PIIAction;
  require_review_above?: PIIClassification;
  is_active: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Types
// ═══════════════════════════════════════════════════════════════════════════

/** Search request with explainability */
export interface ExplainableSearchRequest {
  query: string;
  knowledge_base_ids?: string[];
  top_k?: number;
  min_score?: number;
  include_lineage?: boolean;
  include_pii_info?: boolean;
  explain?: boolean;
  rerank?: boolean;
}

/** Search response with explainability */
export interface ExplainableSearchResponse {
  retrieval_id: string;
  query: string;
  results: Array<{
    chunk: ChunkWithLineage;
    score: number;
    rank: number;
    explanation?: {
      reasons: SelectionReason[];
      confidence: number;
      confidence_factors?: ConfidenceFactors;
    };
    pii_info?: {
      classification: PIIClassification;
      contains_pii: boolean;
      detections?: PIIChunkDetection[];
    };
  }>;
  metadata: {
    total_searched: number;
    above_threshold: number;
    latency_ms: number;
  };
}

/** Eval run request */
export interface RunEvalRequest {
  test_set_id: string;
  run_type?: "full" | "sample" | "single";
  sample_size?: number;
  test_case_ids?: string[];
  search_config?: Record<string, unknown>;
}

/** Eval run response */
export interface RunEvalResponse {
  eval_run_id: string;
  status: "running" | "completed" | "failed";
  metrics?: EvalMetrics;
  failed_cases?: Array<{
    test_case_id: string;
    query: string;
    reason: string;
  }>;
}
