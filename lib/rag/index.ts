/**
 * RAG (Retrieval-Augmented Generation) Library
 *
 * Provides document lineage, explainable retrieval, evaluation suite,
 * and PII scanning for knowledge management.
 */

// Document Lineage & Provenance
export {
  createDocumentLineage,
  getDocumentLineage,
  updateDocumentLineageFromSync,
  createChunkLineage,
  createChunkLineageBatch,
  getChunkWithLineage,
  getChunksWithLineage,
  createSourceConnector,
  updateConnectorSyncStatus,
  getConnectorsDueForSync,
  generateContentHash,
  hasDocumentChanged,
  type CreateDocumentLineageOptions,
  type CreateChunkLineageOptions,
  type CreateSourceConnectorOptions,
} from "./lineage";

// Explainable Retrieval
export {
  createRetrievalSession,
  endRetrievalSession,
  explainableSearch,
  submitRetrievalFeedback,
} from "./retrieval";

// RAG Evaluation
export {
  createEvalTestSet,
  addEvalTestCase,
  getTestCases,
  runEval,
  getEvalRun,
} from "./eval";

// PII Scanner
export {
  scanDocument,
  createPIIPolicy,
  type ScanDocumentOptions,
  type ScanResult,
} from "./pii-scanner";

// Re-export types
export type {
  // Lineage
  SourceConnector,
  SourceConnectorType,
  DocumentLineage,
  ChunkLineage,
  ChunkWithLineage,
  // Retrieval
  RetrievalSession,
  RetrievalResult,
  RetrievalResultChunk,
  SelectionReason,
  ConfidenceFactors,
  RetrievalFeedback,
  ExplainableSearchRequest,
  ExplainableSearchResponse,
  // Eval
  EvalTestSet,
  EvalTestCase,
  EvalRun,
  EvalCaseResult,
  EvalMetrics,
  RunEvalRequest,
  RunEvalResponse,
  // PII
  PIIType,
  PIIClassification,
  PIIAction,
  PIIScanResult,
  PIIChunkDetection,
  PIIPolicy,
  PIIActionRule,
} from "@/types/rag";
