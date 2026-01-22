/**
 * Vault Automation Engine
 * 
 * Handles matching incoming emails against automation rules
 * and processing automated file ingestion.
 * 
 * TODO: Implement for Phase 5
 */

import type { VaultAutomationRule } from "@/types/vault";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomingEmail {
  messageId: string;
  from: string;
  subject: string;
  receivedAt: Date;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  content: Buffer; // Encrypted content
}

export interface RuleMatch {
  rule: VaultAutomationRule;
  matchScore: number;
  matchedCriteria: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Rule Matching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Match an incoming email against automation rules
 * Returns matching rules sorted by priority/specificity
 * 
 * TODO: Implement matching logic
 */
export function matchEmailToRules(
  email: IncomingEmail,
  rules: VaultAutomationRule[]
): RuleMatch[] {
  const matches: RuleMatch[] = [];
  
  for (const rule of rules) {
    if (!rule.is_active) continue;
    
    const matchedCriteria: string[] = [];
    let matchScore = 0;
    
    // Check email_from pattern
    if (rule.email_from_pattern) {
      if (matchesPattern(email.from, rule.email_from_pattern)) {
        matchedCriteria.push("email_from_pattern");
        matchScore += 10;
      } else {
        continue; // Required field didn't match
      }
    }
    
    if (rule.email_from_exact && rule.email_from_exact.length > 0) {
      const fromLower = email.from.toLowerCase();
      const exactMatch = rule.email_from_exact.some((addr) => addr.toLowerCase() === fromLower);
      if (exactMatch) {
        matchedCriteria.push("email_from_exact");
        matchScore += 8;
      } else if (!rule.email_from_pattern) {
        continue;
      }
    }
    
    // Check email_subject pattern
    if (rule.email_subject_pattern) {
      if (matchesPattern(email.subject, rule.email_subject_pattern)) {
        matchedCriteria.push("email_subject_pattern");
        matchScore += 5;
      } else if (rule.email_from_pattern || (rule.email_from_exact && rule.email_from_exact.length > 0)) {
        // Subject is optional if from matched
      } else {
        continue;
      }
    }
    
    if (rule.email_subject_contains && rule.email_subject_contains.length > 0) {
      const subjectLower = email.subject.toLowerCase();
      const containsMatch = rule.email_subject_contains.some((s) =>
        subjectLower.includes(s.toLowerCase())
      );
      if (containsMatch) {
        matchedCriteria.push("email_subject_contains");
        matchScore += 4;
      } else if (!rule.email_subject_pattern && !rule.email_from_pattern && !(rule.email_from_exact && rule.email_from_exact.length > 0)) {
        continue;
      }
    }
    
    // Check attachment types
    if (rule.attachment_types && rule.attachment_types.length > 0) {
      const hasMatchingAttachment = email.attachments.some(att =>
        rule.attachment_types!.some(type => 
          att.contentType.includes(type) || att.filename.endsWith(type)
        )
      );
      
      if (hasMatchingAttachment) {
        matchedCriteria.push("attachment_type");
        matchScore += 3;
      }
    }
    
    if (matchedCriteria.length > 0) {
      matches.push({ rule, matchScore, matchedCriteria });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Check if a value matches a pattern (supports wildcards)
 */
function matchesPattern(value: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special chars
    .replace(/\*/g, ".*") // Convert * to .*
    .replace(/\?/g, "."); // Convert ? to .
  
  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// Email Processing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process an incoming email and create inbox items
 * 
 * TODO: Implement full processing logic
 */
export async function processIncomingEmail(
  vaultId: string,
  email: IncomingEmail,
  rules: VaultAutomationRule[]
): Promise<{ processed: number; autoApproved: number }> {
  const matches = matchEmailToRules(email, rules);
  
  let processed = 0;
  let autoApproved = 0;
  
  // TODO: For each attachment:
  // 1. Upload to R2 (already encrypted by worker)
  // 2. Create vault_files entry
  // 3. Create vault_inbox entry
  // 4. If rule.auto_approve, mark as approved and move to target folder
  // 5. Trigger AI analysis
  
  console.log(
    `[Automation] Processing email for vault ${vaultId} from ${email.from} with ${email.attachments.length} attachments`
  );
  console.log(`[Automation] Matched ${matches.length} rules`);
  
  return { processed, autoApproved };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate an automation rule
 */
export function validateRule(rule: Partial<VaultAutomationRule>): string[] {
  const errors: string[] = [];
  
  if (!rule.name || rule.name.trim().length === 0) {
    errors.push("Rule name is required");
  }
  
  if (!rule.email_from_pattern && !rule.email_subject_pattern && !(rule.email_from_exact && rule.email_from_exact.length > 0) && !(rule.email_subject_contains && rule.email_subject_contains.length > 0)) {
    errors.push("At least one email matcher is required");
  }
  
  if (rule.email_from_pattern && !isValidPattern(rule.email_from_pattern)) {
    errors.push("Invalid email_from_pattern");
  }
  
  if (rule.email_subject_pattern && !isValidPattern(rule.email_subject_pattern)) {
    errors.push("Invalid email_subject_pattern");
  }
  
  return errors;
}

/**
 * Check if a pattern is valid
 */
function isValidPattern(pattern: string): boolean {
  try {
    // Try to convert to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    new RegExp(regexPattern);
    return true;
  } catch {
    return false;
  }
}
