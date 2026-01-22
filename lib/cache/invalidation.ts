/* ═══════════════════════════════════════════════════════════════════════════
   Cache Invalidation
   Event-driven cache invalidation for prompt updates, KB changes, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InvalidationTrigger =
  | "prompt_change"
  | "kb_update"
  | "model_change"
  | "manual"
  | "expiration"
  | "policy_change";

export type InvalidationScope = {
  tenant_id: string;
  // Specific scopes to invalidate
  prompt_id?: string;
  kb_id?: string;
  model?: string;
  application_id?: string;
  // Invalidate all for tenant
  all?: boolean;
};

export type InvalidationResult = {
  invalidated_count: number;
  trigger: InvalidationTrigger;
  scope: InvalidationScope;
  timestamp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Invalidate Cache Entries
// ─────────────────────────────────────────────────────────────────────────────

export async function invalidateCache(
  scope: InvalidationScope,
  trigger: InvalidationTrigger,
  options?: {
    hard_delete?: boolean; // Actually delete vs mark invalid
  }
): Promise<InvalidationResult> {
  const supabase = await createSupabaseAdmin();
  const timestamp = new Date().toISOString();
  
  // Build query based on scope
  let query = supabase
    .from("cache_entries")
    .select("id", { count: "exact" })
    .eq("tenant_id", scope.tenant_id)
    .eq("is_valid", true);
  
  // Apply specific scopes
  if (scope.model) {
    query = query.eq("model", scope.model);
  }
  
  // Get count first
  const { count } = await query;
  
  // Build update/delete query
  if (scope.all) {
    // Invalidate all cache for tenant
    if (options?.hard_delete) {
      await supabase
        .from("cache_entries")
        .delete()
        .eq("tenant_id", scope.tenant_id);
    } else {
      await supabase
        .from("cache_entries")
        .update({ is_valid: false })
        .eq("tenant_id", scope.tenant_id);
    }
  } else {
    // Selective invalidation using scope_hash matching
    // We need to regenerate scope_hash for matching
    let updateQuery = supabase
      .from("cache_entries")
      .update({ is_valid: false })
      .eq("tenant_id", scope.tenant_id)
      .eq("is_valid", true);
    
    if (scope.model) {
      updateQuery = updateQuery.eq("model", scope.model);
    }
    
    // For prompt/KB changes, we need to invalidate entries that used that version
    // This requires the scope_hash to encode these, which it does
    
    if (options?.hard_delete) {
      let deleteQuery = supabase
        .from("cache_entries")
        .delete()
        .eq("tenant_id", scope.tenant_id);
      
      if (scope.model) {
        deleteQuery = deleteQuery.eq("model", scope.model);
      }
      
      await deleteQuery;
    } else {
      await updateQuery;
    }
  }
  
  // Log invalidation event
  await supabase.from("cache_invalidation_events").insert({
    tenant_id: scope.tenant_id,
    trigger,
    scope: scope,
    entries_invalidated: count || 0,
    hard_delete: options?.hard_delete ?? false,
    created_at: timestamp,
  });
  
  return {
    invalidated_count: count || 0,
    trigger,
    scope,
    timestamp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Handlers (to be called from webhooks/events)
// ─────────────────────────────────────────────────────────────────────────────

export async function onPromptUpdated(
  tenantId: string,
  promptId: string
): Promise<InvalidationResult> {
  return invalidateCache(
    {
      tenant_id: tenantId,
      prompt_id: promptId,
    },
    "prompt_change"
  );
}

export async function onKnowledgeBaseUpdated(
  tenantId: string,
  kbId?: string
): Promise<InvalidationResult> {
  const scope = {
    tenant_id: tenantId,
    all: !kbId,
    ...(kbId ? { kb_id: kbId } : {}),
  };
  return invalidateCache(
    scope,
    "kb_update"
  );
}

export async function onModelDeprecated(
  tenantId: string,
  model: string
): Promise<InvalidationResult> {
  return invalidateCache(
    {
      tenant_id: tenantId,
      model,
    },
    "model_change",
    { hard_delete: true } // Remove deprecated model entries entirely
  );
}

export async function onPolicyChanged(
  tenantId: string
): Promise<InvalidationResult> {
  // When policies change, we may need to invalidate cache
  // because routing decisions may change
  return invalidateCache(
    {
      tenant_id: tenantId,
      all: true,
    },
    "policy_change"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduled Cleanup
// ─────────────────────────────────────────────────────────────────────────────

export async function cleanupExpiredEntries(): Promise<{
  deleted_count: number;
}> {
  const supabase = await createSupabaseAdmin();
  
  // Delete expired entries
  const expiredResult = await supabase
    .from("cache_entries")
    .delete()
    .lt("expires_at", new Date().toISOString());
  const count = expiredResult.count || 0;
  
  // Also delete invalid entries older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const invalidResult = await supabase
    .from("cache_entries")
    .delete()
    .eq("is_valid", false)
    .lt("created_at", sevenDaysAgo);
  const invalidCount = invalidResult.count || 0;
  
  return {
    deleted_count: (count || 0) + (invalidCount || 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual Invalidation API
// ─────────────────────────────────────────────────────────────────────────────

export async function invalidateByCacheKey(
  tenantId: string,
  cacheKey: string
): Promise<boolean> {
  const supabase = await createSupabaseAdmin();
  
  const { error } = await supabase
    .from("cache_entries")
    .update({ is_valid: false })
    .eq("tenant_id", tenantId)
    .eq("cache_key", cacheKey);
  
  return !error;
}

export async function invalidateByPrefix(
  tenantId: string,
  userMessagePrefix: string
): Promise<InvalidationResult> {
  const supabase = await createSupabaseAdmin();
  
  const result = await supabase
    .from("cache_entries")
    .update({ is_valid: false })
    .eq("tenant_id", tenantId)
    .eq("is_valid", true)
    .ilike("user_message_preview", `${userMessagePrefix}%`);
  
  return {
    invalidated_count: result.count || 0,
    trigger: "manual",
    scope: { tenant_id: tenantId },
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation Rules Management
// ─────────────────────────────────────────────────────────────────────────────

export type InvalidationRule = {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: InvalidationTrigger;
  
  // For prompt_change trigger
  prompt_ids?: string[];
  
  // For scheduled invalidation
  schedule_cron?: string;
  
  // Action
  invalidation_scope: "all" | "matching";
  matching_criteria?: {
    models?: string[];
    applications?: string[];
  };
  
  is_active: boolean;
  created_at: string;
};

export async function loadInvalidationRules(
  tenantId: string
): Promise<InvalidationRule[]> {
  const supabase = await createSupabaseAdmin();
  
  const { data, error } = await supabase
    .from("cache_invalidation_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);
  
  if (error) {
    console.error("Failed to load invalidation rules:", error);
    return [];
  }
  
  return (data || []) as InvalidationRule[];
}

export async function executeInvalidationRule(
  rule: InvalidationRule
): Promise<InvalidationResult> {
  const scope: InvalidationScope = {
    tenant_id: rule.tenant_id,
  };
  
  if (rule.invalidation_scope === "all") {
    scope.all = true;
  } else if (rule.matching_criteria) {
    if (rule.matching_criteria.models?.length === 1) {
      scope.model = rule.matching_criteria.models[0];
    }
    if (rule.matching_criteria.applications?.length === 1) {
      scope.application_id = rule.matching_criteria.applications[0];
    }
  }
  
  return invalidateCache(scope, rule.trigger_type);
}
