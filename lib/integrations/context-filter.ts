/* ═══════════════════════════════════════════════════════════════════════════
   Context Minimization Filter
   Policy-driven filtering of context sent to AI providers
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ContextMinimizationConfig = {
  // Content type controls
  allow_page_content: boolean;
  allow_code_context: boolean;
  allow_file_attachments: boolean;
  allow_clipboard_content: boolean;
  allow_screenshot_content: boolean;
  
  // Size limits
  max_context_tokens: number;
  max_file_size_bytes: number;
  max_files_count: number;
  
  // Sensitive data handling
  strip_urls: boolean;
  strip_emails: boolean;
  strip_file_paths: boolean;
  strip_credentials_patterns: boolean;
  
  // Domain restrictions
  allowed_domains?: string[];
  blocked_domains?: string[];
};

export type ContextItem = {
  type: "page_content" | "code" | "file" | "clipboard" | "screenshot" | "text";
  content: string;
  metadata?: {
    source_url?: string;
    file_name?: string;
    file_type?: string;
    language?: string;
    tokens?: number;
  };
};

export type FilteredContext = {
  items: ContextItem[];
  removed_items: {
    type: string;
    reason: string;
  }[];
  total_tokens_before: number;
  total_tokens_after: number;
  was_truncated: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CONTEXT_CONFIG: ContextMinimizationConfig = {
  allow_page_content: true,
  allow_code_context: true,
  allow_file_attachments: true,
  allow_clipboard_content: true,
  allow_screenshot_content: false, // Disabled by default for privacy
  max_context_tokens: 8000,
  max_file_size_bytes: 100000, // 100KB
  max_files_count: 5,
  strip_urls: false,
  strip_emails: false,
  strip_file_paths: false,
  strip_credentials_patterns: true, // Always strip potential credentials
};

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Definitions
// ─────────────────────────────────────────────────────────────────────────────

const PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
  file_path: /(?:\/[\w.-]+)+|(?:[A-Z]:\\(?:[\w.-]+\\)*[\w.-]+)/g,
  credentials: [
    // API keys
    /(?:api[_-]?key|apikey|api_secret)[=:\s]+['"]?[\w-]{20,}['"]?/gi,
    // AWS
    /AKIA[0-9A-Z]{16}/g,
    /(?:aws[_-]?secret[_-]?access[_-]?key)[=:\s]+['"]?[\w/+=]{40}['"]?/gi,
    // Generic secrets
    /(?:password|passwd|pwd|secret|token)[=:\s]+['"]?[^\s'"]{8,}['"]?/gi,
    // JWT
    /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
    // Private keys
    /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function stripPattern(
  content: string,
  pattern: RegExp,
  replacement: string
): string {
  return content.replace(pattern, replacement);
}

function isDomainAllowed(
  url: string,
  config: ContextMinimizationConfig
): boolean {
  try {
    const domain = new URL(url).hostname;
    
    if (config.blocked_domains?.some((d) => domain.includes(d))) {
      return false;
    }
    
    if (config.allowed_domains && config.allowed_domains.length > 0) {
      return config.allowed_domains.some((d) => domain.includes(d));
    }
    
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Sanitization
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeContent(
  content: string,
  config: ContextMinimizationConfig
): string {
  let sanitized = content;
  
  // Always strip credentials patterns (highest priority)
  if (config.strip_credentials_patterns) {
    for (const pattern of PATTERNS.credentials) {
      sanitized = stripPattern(sanitized, pattern, "[REDACTED_CREDENTIAL]");
    }
  }
  
  // Strip URLs if configured
  if (config.strip_urls) {
    sanitized = stripPattern(sanitized, PATTERNS.url, "[REDACTED_URL]");
  }
  
  // Strip emails if configured
  if (config.strip_emails) {
    sanitized = stripPattern(sanitized, PATTERNS.email, "[REDACTED_EMAIL]");
  }
  
  // Strip file paths if configured
  if (config.strip_file_paths) {
    sanitized = stripPattern(sanitized, PATTERNS.file_path, "[REDACTED_PATH]");
  }
  
  return sanitized;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Filtering
// ─────────────────────────────────────────────────────────────────────────────

export function filterContext(
  items: ContextItem[],
  config: ContextMinimizationConfig = DEFAULT_CONTEXT_CONFIG
): FilteredContext {
  const filteredItems: ContextItem[] = [];
  const removedItems: FilteredContext["removed_items"] = [];
  let totalTokensBefore = 0;
  let totalTokensAfter = 0;
  let fileCount = 0;
  
  for (const item of items) {
    const itemTokens = estimateTokens(item.content);
    totalTokensBefore += itemTokens;
    
    // Check content type allowance
    if (item.type === "page_content" && !config.allow_page_content) {
      removedItems.push({
        type: item.type,
        reason: "Page content not allowed by policy",
      });
      continue;
    }
    
    if (item.type === "code" && !config.allow_code_context) {
      removedItems.push({
        type: item.type,
        reason: "Code context not allowed by policy",
      });
      continue;
    }
    
    if (item.type === "file" && !config.allow_file_attachments) {
      removedItems.push({
        type: item.type,
        reason: "File attachments not allowed by policy",
      });
      continue;
    }
    
    if (item.type === "clipboard" && !config.allow_clipboard_content) {
      removedItems.push({
        type: item.type,
        reason: "Clipboard content not allowed by policy",
      });
      continue;
    }
    
    if (item.type === "screenshot" && !config.allow_screenshot_content) {
      removedItems.push({
        type: item.type,
        reason: "Screenshot content not allowed by policy",
      });
      continue;
    }
    
    // Check file limits
    if (item.type === "file") {
      if (fileCount >= config.max_files_count) {
        removedItems.push({
          type: item.type,
          reason: `File count limit exceeded (max: ${config.max_files_count})`,
        });
        continue;
      }
      
      if (item.content.length > config.max_file_size_bytes) {
        removedItems.push({
          type: item.type,
          reason: `File size exceeds limit (max: ${config.max_file_size_bytes} bytes)`,
        });
        continue;
      }
      
      fileCount++;
    }
    
    // Check domain restrictions for page content
    if (item.type === "page_content" && item.metadata?.source_url) {
      if (!isDomainAllowed(item.metadata.source_url, config)) {
        removedItems.push({
          type: item.type,
          reason: "Domain not in allowed list or is blocked",
        });
        continue;
      }
    }
    
    // Check token limit
    if (totalTokensAfter + itemTokens > config.max_context_tokens) {
      // Truncate content to fit
      const availableTokens = config.max_context_tokens - totalTokensAfter;
      if (availableTokens > 100) {
        // Only include if we can fit at least 100 tokens
        const truncatedContent = item.content.slice(0, availableTokens * 4);
        const sanitizedContent = sanitizeContent(truncatedContent, config);
        
        filteredItems.push({
          ...item,
          content: sanitizedContent + "\n[TRUNCATED]",
          metadata: {
            ...item.metadata,
            tokens: availableTokens,
          },
        });
        totalTokensAfter += availableTokens;
      } else {
        removedItems.push({
          type: item.type,
          reason: "Token limit reached",
        });
      }
      continue;
    }
    
    // Sanitize and add
    const sanitizedContent = sanitizeContent(item.content, config);
    const sanitizedTokens = estimateTokens(sanitizedContent);
    
    filteredItems.push({
      ...item,
      content: sanitizedContent,
      metadata: {
        ...item.metadata,
        tokens: sanitizedTokens,
      },
    });
    totalTokensAfter += sanitizedTokens;
  }
  
  return {
    items: filteredItems,
    removed_items: removedItems,
    total_tokens_before: totalTokensBefore,
    total_tokens_after: totalTokensAfter,
    was_truncated: totalTokensBefore > totalTokensAfter,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Tenant Context Config
// ─────────────────────────────────────────────────────────────────────────────

export async function loadContextConfig(
  tenantId: string,
  applicationId?: string
): Promise<ContextMinimizationConfig> {
  const supabase = await createSupabaseAdmin();
  
  // Try application-specific config first
  if (applicationId) {
    const { data: appConfig } = await supabase
      .from("integration_configs")
      .select("context_minimization")
      .eq("tenant_id", tenantId)
      .eq("application_id", applicationId)
      .single();
    
    if (appConfig?.context_minimization) {
      return {
        ...DEFAULT_CONTEXT_CONFIG,
        ...appConfig.context_minimization,
      };
    }
  }
  
  // Fall back to tenant-level config
  const { data: tenantConfig } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("tenant_id", tenantId)
    .eq("key", "context_minimization")
    .single();
  
  if (tenantConfig?.value) {
    return {
      ...DEFAULT_CONTEXT_CONFIG,
      ...(tenantConfig.value as Partial<ContextMinimizationConfig>),
    };
  }
  
  return DEFAULT_CONTEXT_CONFIG;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Context Check (for pre-flight validation)
// ─────────────────────────────────────────────────────────────────────────────

export function checkContextAllowed(
  itemType: ContextItem["type"],
  config: ContextMinimizationConfig
): { allowed: boolean; reason?: string } {
  switch (itemType) {
    case "page_content":
      return config.allow_page_content
        ? { allowed: true }
        : { allowed: false, reason: "Page content not allowed" };
    case "code":
      return config.allow_code_context
        ? { allowed: true }
        : { allowed: false, reason: "Code context not allowed" };
    case "file":
      return config.allow_file_attachments
        ? { allowed: true }
        : { allowed: false, reason: "File attachments not allowed" };
    case "clipboard":
      return config.allow_clipboard_content
        ? { allowed: true }
        : { allowed: false, reason: "Clipboard content not allowed" };
    case "screenshot":
      return config.allow_screenshot_content
        ? { allowed: true }
        : { allowed: false, reason: "Screenshot content not allowed" };
    default:
      return { allowed: true };
  }
}
