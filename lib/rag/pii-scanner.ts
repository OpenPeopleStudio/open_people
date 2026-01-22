/**
 * PII Scanner for Document Ingest
 *
 * Classify documents, detect PII at chunk level, optionally block or tokenize
 * sensitive content at rest.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  PIIType,
  PIIClassification,
  PIIAction,
  PIIScanResult,
  PIIChunkDetection,
  PIIPolicy,
  PIIActionRule,
} from "@/types/rag";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const SCANNER_VERSION = "1.0";

// PII detection patterns
const PII_PATTERNS: Record<PIIType, RegExp[]> = {
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ],
  phone: [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // US format
    /\b\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    /\b\+\d{1,3}[-.\s]?\d{6,14}\b/g, // International
  ],
  ssn: [
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, // SSN
  ],
  name: [], // Requires NER - placeholder
  address: [
    /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl)\b/gi,
  ],
  dob: [
    /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, // MM/DD/YYYY
    /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g, // YYYY-MM-DD
  ],
  credit_card: [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9][0-9])[0-9]{12})\b/g,
  ],
  bank_account: [
    /\b\d{8,17}\b/g, // Very loose - needs context
  ],
  passport: [
    /\b[A-Z]{1,2}\d{6,9}\b/g, // US passport format
  ],
  driver_license: [
    /\b[A-Z]\d{7,14}\b/g, // Generic format
  ],
  ip_address: [
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  ],
  medical_record: [
    /\b[A-Z]{2,3}\d{6,10}\b/g, // Medical record numbers vary widely
  ],
  biometric: [], // Requires special detection
  password: [
    /(?:password|pwd|pass)\s*[:=]\s*[^\s]+/gi,
    /(?:secret|key)\s*[:=]\s*[^\s]+/gi,
  ],
  api_key: [
    /\b(?:sk|pk|api)[-_][A-Za-z0-9]{20,}\b/g, // Common API key formats
    /\bghp_[A-Za-z0-9]{36}\b/g, // GitHub PAT
    /\bxox[baprs]-[A-Za-z0-9-]+/g, // Slack tokens
  ],
  other: [],
};

// PII type risk scores
const PII_RISK_SCORES: Record<PIIType, number> = {
  ssn: 1.0,
  credit_card: 1.0,
  bank_account: 0.9,
  passport: 0.9,
  driver_license: 0.8,
  medical_record: 0.9,
  biometric: 1.0,
  password: 0.95,
  api_key: 0.95,
  dob: 0.6,
  address: 0.5,
  phone: 0.4,
  email: 0.3,
  name: 0.3,
  ip_address: 0.2,
  other: 0.1,
};

// ═══════════════════════════════════════════════════════════════════════════
// PII Scanning
// ═══════════════════════════════════════════════════════════════════════════

export interface ScanDocumentOptions {
  documentId: string;
  content: string;
  chunks: Array<{ id: string; content: string; start_char: number; end_char: number }>;
  tenantId?: string;
  policyId?: string;
}

export interface ScanResult {
  scanResult: PIIScanResult;
  chunkDetections: PIIChunkDetection[];
  action: PIIAction;
  shouldBlock: boolean;
  redactedChunks?: Array<{ id: string; content: string }>;
}

/**
 * Scan a document and its chunks for PII.
 */
export async function scanDocument(options: ScanDocumentOptions): Promise<ScanResult> {
  const supabase = await createSupabaseAdmin();

  // Get applicable policy
  const policy = await getApplicablePolicy(options.tenantId, options.policyId);

  // Scan all chunks
  const allDetections: Omit<PIIChunkDetection, "id" | "scan_result_id">[] = [];
  const piiCounts: Record<string, number> = {};
  const piiTypesFound: PIIType[] = [];

  for (const chunk of options.chunks) {
    const chunkDetections = await scanChunkForPII(chunk.content, chunk.id, policy);

    for (const detection of chunkDetections) {
      // Track counts
      piiCounts[detection.pii_type] = (piiCounts[detection.pii_type] || 0) + 1;
      if (!piiTypesFound.includes(detection.pii_type as PIIType)) {
        piiTypesFound.push(detection.pii_type as PIIType);
      }
    }

    allDetections.push(...chunkDetections);
  }

  // Calculate classification and risk
  const classification = calculateClassification(piiTypesFound, piiCounts);
  const riskScore = calculateRiskScore(piiTypesFound, piiCounts);

  // Determine action based on policy
  const action = determineAction(policy, classification, allDetections);
  const shouldBlock = action === "blocked" || action === "quarantined";
  const requiresReview = shouldRequireReview(policy, classification);

  // Create scan result
  const scanResult: Omit<PIIScanResult, "id"> = {
    document_id: options.documentId,
    scan_version: SCANNER_VERSION,
    scan_config: {
      policy_id: policy.id,
      enabled_types: policy.enabled_pii_types,
      sensitivity: policy.detection_sensitivity,
    },
    pii_classification: classification,
    contains_pii: piiTypesFound.length > 0,
    pii_types_found: piiTypesFound,
    pii_counts: piiCounts as Record<PIIType, number>,
    risk_score: riskScore,
    risk_factors: {
      high_risk_types: piiTypesFound.filter((t) => PII_RISK_SCORES[t] >= 0.8),
      total_detections: allDetections.length,
    },
    action_taken: action,
    action_reason: getActionReason(action, classification, piiTypesFound),
    requires_review: requiresReview,
    scanned_at: new Date().toISOString(),
  };

  // Save scan result
  const { data: savedScan, error: scanError } = await supabase
    .from("kb_pii_scan_results")
    .insert(scanResult)
    .select()
    .single();

  if (scanError) {
    throw new Error(`Failed to save scan result: ${scanError.message}`);
  }

  // Save chunk detections
  if (allDetections.length > 0) {
    const detectionRecords = allDetections.map((d) => ({
      ...d,
      scan_result_id: savedScan.id,
    }));

    const { error: detectionError } = await supabase
      .from("kb_pii_chunk_detections")
      .insert(detectionRecords);

    if (detectionError) {
      console.error("Failed to save chunk detections:", detectionError);
    }
  }

  // Redact chunks if needed
  let redactedChunks: Array<{ id: string; content: string }> | undefined;
  if (action === "redacted") {
    redactedChunks = await redactChunks(options.chunks, allDetections);
  }

  return {
    scanResult: { ...scanResult, id: savedScan.id } as PIIScanResult,
    chunkDetections: allDetections.map((d) => ({ ...d, scan_result_id: savedScan.id })) as PIIChunkDetection[],
    action,
    shouldBlock,
    ...(redactedChunks ? { redactedChunks } : {}),
  };
}

/**
 * Scan a single chunk for PII.
 */
async function scanChunkForPII(
  content: string,
  chunkId: string,
  policy: PIIPolicy
): Promise<Omit<PIIChunkDetection, "id" | "scan_result_id">[]> {
  const detections: Omit<PIIChunkDetection, "id" | "scan_result_id">[] = [];
  const sensitivity = policy.detection_sensitivity;

  // Adjust confidence threshold based on sensitivity
  const confidenceThreshold = sensitivity === "low" ? 0.9 : sensitivity === "medium" ? 0.7 : 0.5;

  for (const piiType of policy.enabled_pii_types) {
    const patterns = PII_PATTERNS[piiType];
    if (!patterns || patterns.length === 0) continue;

    for (const pattern of patterns) {
      // Reset regex state
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const value = match[0];
        const confidence = calculateDetectionConfidence(piiType, value, content);

        if (confidence >= confidenceThreshold) {
          detections.push({
            chunk_id: chunkId,
            pii_type: piiType,
            start_offset: match.index,
            end_offset: match.index + value.length,
            confidence,
            detection_method: "regex",
            value_hash: hashValue(value),
            value_preview: maskValue(value, piiType),
            was_redacted: false,
          });
        }
      }
    }
  }

  return detections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Classification & Risk
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate overall PII classification.
 */
function calculateClassification(
  piiTypes: PIIType[],
  counts: Record<string, number>
): PIIClassification {
  if (piiTypes.length === 0) return "none";

  const maxRisk = Math.max(...piiTypes.map((t) => PII_RISK_SCORES[t]));
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  if (maxRisk >= 0.95 || piiTypes.includes("ssn") || piiTypes.includes("credit_card")) {
    return "critical";
  }

  if (maxRisk >= 0.8 || totalCount > 10) {
    return "high";
  }

  if (maxRisk >= 0.5 || totalCount > 5) {
    return "medium";
  }

  return "low";
}

/**
 * Calculate risk score.
 */
function calculateRiskScore(
  piiTypes: PIIType[],
  counts: Record<string, number>
): number {
  if (piiTypes.length === 0) return 0;

  let weightedSum = 0;
  let totalCount = 0;

  for (const [type, count] of Object.entries(counts)) {
    const risk = PII_RISK_SCORES[type as PIIType] || 0.1;
    weightedSum += risk * count;
    totalCount += count;
  }

  // Base score from weighted average
  let score = totalCount > 0 ? weightedSum / totalCount : 0;

  // Boost for multiple types
  if (piiTypes.length > 3) {
    score = Math.min(score * 1.2, 1.0);
  }

  // Boost for high counts
  if (totalCount > 10) {
    score = Math.min(score * 1.1, 1.0);
  }

  return Math.round(score * 100) / 100;
}

/**
 * Calculate detection confidence for a specific match.
 */
function calculateDetectionConfidence(
  piiType: PIIType,
  value: string,
  context: string
): number {
  // Base confidence from pattern match
  let confidence = 0.8;

  // Adjust based on PII type specifics
  switch (piiType) {
    case "email":
      // Higher confidence for common domains
      if (/@(gmail|yahoo|outlook|hotmail|icloud)\./i.test(value)) {
        confidence = 0.95;
      }
      break;

    case "ssn":
      // Check for valid SSN structure
      const ssnDigits = value.replace(/\D/g, "");
      if (ssnDigits.length === 9 && !/^0{3}|^666|^9\d{2}/.test(ssnDigits)) {
        confidence = 0.9;
      } else {
        confidence = 0.6;
      }
      break;

    case "credit_card":
      // Luhn check
      if (luhnCheck(value.replace(/\D/g, ""))) {
        confidence = 0.95;
      } else {
        confidence = 0.5;
      }
      break;

    case "phone":
      // Check context for phone-related words
      const phoneContext = context.toLowerCase();
      if (/(?:phone|tel|call|mobile|cell|fax)/i.test(phoneContext)) {
        confidence = 0.9;
      }
      break;

    case "ip_address":
      // Exclude private ranges for lower concern
      if (/^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)/.test(value)) {
        confidence = 0.6;
      }
      break;
  }

  return confidence;
}

/**
 * Luhn algorithm for credit card validation.
 */
function luhnCheck(num: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// Policy Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get applicable PII policy for a tenant.
 */
async function getApplicablePolicy(
  tenantId?: string,
  policyId?: string
): Promise<PIIPolicy> {
  const supabase = await createSupabaseAdmin();

  if (policyId) {
    const { data } = await supabase
      .from("kb_pii_policies")
      .select("*")
      .eq("id", policyId)
      .eq("is_active", true)
      .single();

    if (data) return data as PIIPolicy;
  }

  if (tenantId) {
    // Get tenant's default policy
    const { data } = await supabase
      .from("kb_pii_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    if (data) return data as PIIPolicy;
  }

  // Return system default policy
  return getDefaultPolicy();
}

/**
 * Get default PII policy.
 */
function getDefaultPolicy(): PIIPolicy {
  return {
    id: "default",
    name: "Default PII Policy",
    is_default: true,
    enabled_pii_types: [
      "email",
      "phone",
      "ssn",
      "credit_card",
      "address",
      "dob",
      "api_key",
      "password",
    ],
    detection_sensitivity: "medium",
    action_rules: [
      { pii_type: "ssn", action: "blocked", min_confidence: 0.9 },
      { pii_type: "credit_card", action: "blocked", min_confidence: 0.9 },
      { pii_type: "api_key", action: "redacted", min_confidence: 0.8 },
      { pii_type: "password", action: "redacted", min_confidence: 0.8 },
    ],
    default_action: "allowed",
    require_review_above: "high",
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

/**
 * Determine action based on policy and detections.
 */
function determineAction(
  policy: PIIPolicy,
  classification: PIIClassification,
  detections: Array<{ pii_type: string; confidence: number }>
): PIIAction {
  // Check rules in order
  for (const rule of policy.action_rules) {
    const matchingDetections = detections.filter((d) => {
      const typeMatch = rule.pii_type === "*" || d.pii_type === rule.pii_type;
      const confidenceMatch = !rule.min_confidence || d.confidence >= rule.min_confidence;
      return typeMatch && confidenceMatch;
    });

    if (matchingDetections.length > 0) {
      if (rule.classification && classification === rule.classification) {
        return rule.action;
      }
      if (!rule.classification) {
        return rule.action;
      }
    }
  }

  return policy.default_action;
}

/**
 * Check if review is required based on policy.
 */
function shouldRequireReview(policy: PIIPolicy, classification: PIIClassification): boolean {
  if (!policy.require_review_above) return false;

  const levels: PIIClassification[] = ["none", "low", "medium", "high", "critical"];
  const thresholdIndex = levels.indexOf(policy.require_review_above);
  const classificationIndex = levels.indexOf(classification);

  return classificationIndex >= thresholdIndex;
}

/**
 * Get human-readable action reason.
 */
function getActionReason(
  action: PIIAction,
  classification: PIIClassification,
  piiTypes: PIIType[]
): string {
  switch (action) {
    case "blocked":
      return `Document blocked due to ${classification} risk PII: ${piiTypes.join(", ")}`;
    case "quarantined":
      return `Document quarantined for review due to ${classification} risk`;
    case "redacted":
      return `PII redacted from document: ${piiTypes.join(", ")}`;
    case "manual_review":
      return `Document requires manual review due to ${classification} risk`;
    case "allowed":
      return piiTypes.length > 0
        ? `Document allowed with ${piiTypes.length} PII type(s) detected`
        : "No PII detected";
    default:
      return "Unknown action";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Redaction
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Redact PII from chunks.
 */
async function redactChunks(
  chunks: Array<{ id: string; content: string }>,
  detections: Array<Omit<PIIChunkDetection, "id" | "scan_result_id">>
): Promise<Array<{ id: string; content: string }>> {
  const supabase = await createSupabaseAdmin();
  const redactedChunks: Array<{ id: string; content: string }> = [];

  for (const chunk of chunks) {
    const chunkDetections = detections
      .filter((d) => d.chunk_id === chunk.id)
      .sort((a, b) => b.start_offset - a.start_offset); // Sort in reverse for safe replacement

    let content = chunk.content;

    for (const detection of chunkDetections) {
      const token = generateRedactionToken(detection.pii_type as PIIType);
      content =
        content.slice(0, detection.start_offset) +
        token +
        content.slice(detection.end_offset);

      // Mark as redacted
      detection.was_redacted = true;
      detection.redaction_token = token;
    }

    redactedChunks.push({ id: chunk.id, content });

    // Update chunk content in database
    await supabase
      .from("knowledge_chunks")
      .update({ content })
      .eq("id", chunk.id);
  }

  return redactedChunks;
}

/**
 * Generate a redaction token.
 */
function generateRedactionToken(piiType: PIIType): string {
  const tokens: Record<PIIType, string> = {
    email: "[EMAIL_REDACTED]",
    phone: "[PHONE_REDACTED]",
    ssn: "[SSN_REDACTED]",
    name: "[NAME_REDACTED]",
    address: "[ADDRESS_REDACTED]",
    dob: "[DOB_REDACTED]",
    credit_card: "[CARD_REDACTED]",
    bank_account: "[BANK_REDACTED]",
    passport: "[PASSPORT_REDACTED]",
    driver_license: "[LICENSE_REDACTED]",
    ip_address: "[IP_REDACTED]",
    medical_record: "[MRN_REDACTED]",
    biometric: "[BIOMETRIC_REDACTED]",
    password: "[PASSWORD_REDACTED]",
    api_key: "[APIKEY_REDACTED]",
    other: "[PII_REDACTED]",
  };

  return tokens[piiType] || "[PII_REDACTED]";
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hash a value for audit trail.
 */
function hashValue(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mask a value for preview.
 */
function maskValue(value: string, piiType: PIIType): string {
  switch (piiType) {
    case "email":
      const [local, domain] = value.split("@");
      return `${local[0]}***@${domain}`;
    case "phone":
      return `***-***-${value.slice(-4)}`;
    case "ssn":
      return `***-**-${value.slice(-4)}`;
    case "credit_card":
      return `****-****-****-${value.slice(-4)}`;
    default:
      if (value.length <= 4) return "****";
      return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
  }
}

/**
 * Create a PII policy for a tenant.
 */
export async function createPIIPolicy(options: {
  tenantId?: string;
  name: string;
  description?: string;
  enabledPiiTypes: PIIType[];
  detectionSensitivity: "low" | "medium" | "high";
  actionRules: PIIActionRule[];
  defaultAction: PIIAction;
  requireReviewAbove?: PIIClassification;
  isDefault?: boolean;
}): Promise<PIIPolicy> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_pii_policies")
    .insert({
      tenant_id: options.tenantId,
      name: options.name,
      description: options.description,
      enabled_pii_types: options.enabledPiiTypes,
      detection_sensitivity: options.detectionSensitivity,
      action_rules: options.actionRules,
      default_action: options.defaultAction,
      require_review_above: options.requireReviewAbove,
      is_default: options.isDefault ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create PII policy: ${error.message}`);
  }

  return data as PIIPolicy;
}
