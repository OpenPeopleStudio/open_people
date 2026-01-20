/* ═══════════════════════════════════════════════════════════════════════════
   Compliance Module
   Evidence packs, evidence collection, and retention management
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Evidence pack types and definitions
  type ComplianceFramework,
  type EvidenceSourceType,
  type DateRange,
  type AuditLogQuery,
  type EvidenceSource,
  type EvidencePackTemplate,
  type EvidencePackCollection,
  // Evidence pack collections
  SOC2_EVIDENCE_PACKS,
  GDPR_EVIDENCE_PACKS,
  EU_AI_ACT_EVIDENCE_PACKS,
  HIPAA_EVIDENCE_PACKS,
  EVIDENCE_PACK_COLLECTIONS,
  // Helper functions
  getEvidencePacksByFramework,
  getEvidencePackByControlId,
  getAllEvidencePacks,
} from "./evidence-packs";

export {
  // Evidence collection types
  type EvidenceItem,
  type CollectedEvidence,
  type EvidencePackageResult,
  // Collection functions
  collectEvidenceForControl,
  generateEvidencePackage,
  generateControlEvidence,
} from "./evidence-collector";

export {
  // Retention policy types
  type DataCategory,
  type RetentionAction,
  type RetentionOverride,
  type RetentionCondition,
  type RetentionPolicy,
  type CompiledRetentionRule,
  type RetentionCompilationResult,
  type RetentionExecutionResult,
  // Retention functions
  compileRetentionPolicy,
  executeRetentionPolicy,
  loadRetentionPolicy,
  saveRetentionPolicy,
  getRetentionSummary,
} from "./retention-compiler";
