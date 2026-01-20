/* ═══════════════════════════════════════════════════════════════════════════
   Retention Policy Compiler
   Unified retention configuration that propagates to all data stores
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DataCategory =
  | "audit_logs"
  | "ai_traces"
  | "cache_entries"
  | "chat_messages"
  | "email_messages"
  | "kb_documents"
  | "webhook_payloads"
  | "gateway_requests"
  | "incident_records"
  | "notification_logs"
  | "storage_files"
  | "vault_files";

export type RetentionAction = "delete" | "archive" | "anonymize";

export type RetentionOverride = {
  days: number;
  action?: RetentionAction;
  condition?: RetentionCondition;
};

export type RetentionCondition = {
  // Conditional retention based on data attributes
  contains_pii?: boolean; // Different retention for PII data
  environment?: string; // "production" | "staging" | "development"
  severity_min?: string; // For incidents: only retain high severity longer
  application_id?: string; // Per-application retention
};

export type RetentionPolicy = {
  id?: string;
  tenant_id: string;
  name: string;
  description?: string;
  
  // Default retention for all data
  default_days: number;
  default_action: RetentionAction;
  
  // Category-specific overrides
  overrides: Partial<Record<DataCategory, RetentionOverride>>;
  
  // Compliance requirements
  compliance_frameworks?: string[]; // ["SOC2", "GDPR", "HIPAA"]
  
  // Metadata
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CompiledRetentionRule = {
  category: DataCategory;
  table_name: string;
  retention_days: number;
  action: RetentionAction;
  condition_sql?: string;
  cleanup_query: string;
};

export type RetentionCompilationResult = {
  tenant_id: string;
  policy_id?: string;
  compiled_at: string;
  rules: CompiledRetentionRule[];
  summary: {
    total_rules: number;
    categories_covered: number;
    default_retention_days: number;
  };
};

export type RetentionExecutionResult = {
  tenant_id: string;
  executed_at: string;
  rules_executed: number;
  total_records_affected: number;
  results: {
    category: DataCategory;
    records_affected: number;
    action: RetentionAction;
    error?: string;
  }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Table Mappings
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_TABLE_MAPPING: Record<
  DataCategory,
  { table: string; timestamp_column: string; tenant_column: string }
> = {
  audit_logs: {
    table: "activity_ledger",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  ai_traces: {
    table: "ai_runs",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  cache_entries: {
    table: "cache_entries",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  chat_messages: {
    table: "chat_messages",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  email_messages: {
    table: "email_messages",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  kb_documents: {
    table: "knowledge_chunks",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  webhook_payloads: {
    table: "webhook_deliveries",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  gateway_requests: {
    table: "gateway_requests",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  incident_records: {
    table: "ai_incidents",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  notification_logs: {
    table: "notification_logs",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  storage_files: {
    table: "storage_files",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
  vault_files: {
    table: "vault_files",
    timestamp_column: "created_at",
    tenant_column: "tenant_id",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Compliance Framework Minimum Retentions
// ─────────────────────────────────────────────────────────────────────────────

const COMPLIANCE_MINIMUMS: Record<string, Partial<Record<DataCategory, number>>> = {
  SOC2: {
    audit_logs: 365, // 1 year minimum for audit logs
    ai_traces: 90,
    incident_records: 365,
  },
  GDPR: {
    // GDPR focuses on minimization, but some logs needed for accountability
    audit_logs: 90,
    ai_traces: 30,
  },
  HIPAA: {
    audit_logs: 2190, // 6 years for HIPAA
    ai_traces: 2190,
    chat_messages: 2190,
    incident_records: 2190,
  },
  EU_AI_ACT: {
    audit_logs: 365,
    ai_traces: 365, // AI system logs for transparency
    incident_records: 365,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Compile Retention Policy
// ─────────────────────────────────────────────────────────────────────────────

export function compileRetentionPolicy(
  policy: RetentionPolicy
): RetentionCompilationResult {
  const rules: CompiledRetentionRule[] = [];

  // Calculate effective retention for each category
  for (const [category, mapping] of Object.entries(CATEGORY_TABLE_MAPPING)) {
    const dataCategory = category as DataCategory;
    
    // Start with default
    let retentionDays = policy.default_days;
    let action = policy.default_action;
    let conditionSql: string | undefined;

    // Apply category override if exists
    const override = policy.overrides[dataCategory];
    if (override) {
      retentionDays = override.days;
      if (override.action) {
        action = override.action;
      }
      
      // Build condition SQL if specified
      if (override.condition) {
        const conditions: string[] = [];
        if (override.condition.contains_pii !== undefined) {
          conditions.push(
            override.condition.contains_pii
              ? "(context->>'contains_pii')::boolean = true"
              : "(context->>'contains_pii')::boolean IS NOT true"
          );
        }
        if (override.condition.environment) {
          conditions.push(`environment = '${override.condition.environment}'`);
        }
        if (override.condition.severity_min) {
          const severityOrder = ["low", "medium", "high", "critical"];
          const minIndex = severityOrder.indexOf(override.condition.severity_min);
          if (minIndex >= 0) {
            const validSeverities = severityOrder.slice(minIndex);
            conditions.push(
              `severity IN (${validSeverities.map((s) => `'${s}'`).join(", ")})`
            );
          }
        }
        if (conditions.length > 0) {
          conditionSql = conditions.join(" AND ");
        }
      }
    }

    // Apply compliance framework minimums
    if (policy.compliance_frameworks) {
      for (const framework of policy.compliance_frameworks) {
        const minimums = COMPLIANCE_MINIMUMS[framework];
        if (minimums && minimums[dataCategory]) {
          retentionDays = Math.max(retentionDays, minimums[dataCategory]!);
        }
      }
    }

    // Build cleanup query based on action
    let cleanupQuery: string;
    const baseCondition = `${mapping.tenant_column} = '${policy.tenant_id}' AND ${mapping.timestamp_column} < NOW() - INTERVAL '${retentionDays} days'`;
    const fullCondition = conditionSql
      ? `${baseCondition} AND ${conditionSql}`
      : baseCondition;

    switch (action) {
      case "delete":
        cleanupQuery = `DELETE FROM ${mapping.table} WHERE ${fullCondition};`;
        break;
      case "archive":
        // Archive by moving to archive table (assumes archive table exists)
        cleanupQuery = `
          WITH archived AS (
            INSERT INTO ${mapping.table}_archive 
            SELECT * FROM ${mapping.table} WHERE ${fullCondition}
            RETURNING id
          )
          DELETE FROM ${mapping.table} WHERE id IN (SELECT id FROM archived);
        `;
        break;
      case "anonymize":
        // Anonymize PII fields (generic pattern)
        cleanupQuery = `
          UPDATE ${mapping.table}
          SET context = jsonb_set(
            jsonb_set(context, '{user_email}', '"[REDACTED]"'),
            '{ip_address}', '"[REDACTED]"'
          )
          WHERE ${fullCondition} AND NOT (context ? 'anonymized');
        `;
        break;
    }

    rules.push({
      category: dataCategory,
      table_name: mapping.table,
      retention_days: retentionDays,
      action,
      condition_sql: conditionSql,
      cleanup_query: cleanupQuery,
    });
  }

  return {
    tenant_id: policy.tenant_id,
    policy_id: policy.id,
    compiled_at: new Date().toISOString(),
    rules,
    summary: {
      total_rules: rules.length,
      categories_covered: rules.length,
      default_retention_days: policy.default_days,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute Retention Policy
// ─────────────────────────────────────────────────────────────────────────────

export async function executeRetentionPolicy(
  policy: RetentionPolicy,
  options?: {
    dry_run?: boolean;
    categories?: DataCategory[];
  }
): Promise<RetentionExecutionResult> {
  const supabase = await createSupabaseAdmin();
  const compiled = compileRetentionPolicy(policy);
  
  const results: RetentionExecutionResult["results"] = [];
  let totalAffected = 0;

  // Filter to specific categories if requested
  const rulesToExecute = options?.categories
    ? compiled.rules.filter((r) => options.categories!.includes(r.category))
    : compiled.rules;

  for (const rule of rulesToExecute) {
    try {
      if (options?.dry_run) {
        // Count affected records without deleting
        const mapping = CATEGORY_TABLE_MAPPING[rule.category];
        const { count } = await supabase
          .from(mapping.table)
          .select("*", { count: "exact", head: true })
          .eq(mapping.tenant_column, policy.tenant_id)
          .lt(mapping.timestamp_column, new Date(Date.now() - rule.retention_days * 24 * 60 * 60 * 1000).toISOString());

        results.push({
          category: rule.category,
          records_affected: count || 0,
          action: rule.action,
        });
        totalAffected += count || 0;
      } else {
        // Execute the cleanup query
        // Note: In production, this would use a more robust execution method
        const { count, error } = await supabase.rpc("execute_retention_cleanup", {
          p_table_name: rule.table_name,
          p_tenant_id: policy.tenant_id,
          p_retention_days: rule.retention_days,
          p_action: rule.action,
        });

        if (error) {
          results.push({
            category: rule.category,
            records_affected: 0,
            action: rule.action,
            error: error.message,
          });
        } else {
          results.push({
            category: rule.category,
            records_affected: count || 0,
            action: rule.action,
          });
          totalAffected += count || 0;
        }
      }
    } catch (error) {
      results.push({
        category: rule.category,
        records_affected: 0,
        action: rule.action,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log execution
  if (!options?.dry_run) {
    await supabase.from("retention_executions").insert({
      tenant_id: policy.tenant_id,
      policy_id: policy.id,
      executed_at: new Date().toISOString(),
      rules_executed: rulesToExecute.length,
      total_records_affected: totalAffected,
      results: results,
    });
  }

  return {
    tenant_id: policy.tenant_id,
    executed_at: new Date().toISOString(),
    rules_executed: rulesToExecute.length,
    total_records_affected: totalAffected,
    results,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Load/Save Retention Policy
// ─────────────────────────────────────────────────────────────────────────────

export async function loadRetentionPolicy(
  tenantId: string
): Promise<RetentionPolicy | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("retention_policies")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    // Return default policy
    return {
      tenant_id: tenantId,
      name: "Default Retention Policy",
      default_days: 365,
      default_action: "delete",
      overrides: {
        cache_entries: { days: 7, action: "delete" },
        gateway_requests: { days: 90, action: "delete" },
        webhook_payloads: { days: 30, action: "delete" },
      },
      is_active: true,
    };
  }

  return {
    id: data.id,
    tenant_id: data.tenant_id,
    name: data.name,
    description: data.description,
    default_days: data.default_days,
    default_action: data.default_action,
    overrides: data.overrides || {},
    compliance_frameworks: data.compliance_frameworks,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveRetentionPolicy(
  policy: RetentionPolicy
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createSupabaseAdmin();

  // Deactivate existing policies for this tenant
  await supabase
    .from("retention_policies")
    .update({ is_active: false })
    .eq("tenant_id", policy.tenant_id)
    .neq("id", policy.id || "");

  // Upsert the new policy
  const { data, error } = await supabase
    .from("retention_policies")
    .upsert({
      id: policy.id,
      tenant_id: policy.tenant_id,
      name: policy.name,
      description: policy.description,
      default_days: policy.default_days,
      default_action: policy.default_action,
      overrides: policy.overrides,
      compliance_frameworks: policy.compliance_frameworks,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Retention Summary
// ─────────────────────────────────────────────────────────────────────────────

export async function getRetentionSummary(
  tenantId: string
): Promise<{
  policy: RetentionPolicy | null;
  compilation: RetentionCompilationResult | null;
  last_execution?: {
    executed_at: string;
    total_records_affected: number;
  };
}> {
  const policy = await loadRetentionPolicy(tenantId);
  
  if (!policy) {
    return { policy: null, compilation: null };
  }

  const compilation = compileRetentionPolicy(policy);

  // Get last execution
  const supabase = await createSupabaseAdmin();
  const { data: lastExecution } = await supabase
    .from("retention_executions")
    .select("executed_at, total_records_affected")
    .eq("tenant_id", tenantId)
    .order("executed_at", { ascending: false })
    .limit(1)
    .single();

  return {
    policy,
    compilation,
    last_execution: lastExecution || undefined,
  };
}
