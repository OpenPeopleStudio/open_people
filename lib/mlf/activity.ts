/**
 * Activity Ledger Utilities
 * 
 * Centralized logging for all platform activities
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityAction, ActivityEntry } from "@/types/mlf";

interface LogActivityParams {
  supabase: SupabaseClient;
  tenantId?: string | null;
  actorId?: string | null;
  actorType?: "user" | "system" | "ai" | "api";
  action: ActivityAction | string;
  actionCategory?: "auth" | "data" | "ai" | "admin" | "security";
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  context?: Record<string, unknown>;
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  request?: Request;
}

/**
 * Log an activity to the ledger
 */
export async function logActivity({
  supabase,
  tenantId,
  actorId,
  actorType = "user",
  action,
  actionCategory,
  resourceType,
  resourceId,
  resourceName,
  changes,
  context,
  success = true,
  errorCode,
  errorMessage,
  request,
}: LogActivityParams): Promise<string | null> {
  try {
    // Extract request metadata
    const ipAddress = request?.headers.get("x-forwarded-for")?.split(",")[0] || null;
    const userAgent = request?.headers.get("user-agent") || null;
    const requestId = request?.headers.get("x-request-id") || null;
    
    // Determine action category if not provided
    const category = actionCategory || inferActionCategory(action);
    
    const { data, error } = await supabase
      .from("activity_ledger")
      .insert({
        tenant_id: tenantId,
        actor_id: actorId,
        actor_type: actorType,
        actor_metadata: {
          ip: ipAddress,
          user_agent: userAgent,
        },
        action,
        action_category: category,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name: resourceName,
        changes,
        context: context || {},
        success,
        error_code: errorCode,
        error_message: errorMessage,
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Failed to log activity:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Activity logging error:", error);
    return null;
  }
}

/**
 * Infer action category from action name
 */
function inferActionCategory(action: string): "auth" | "data" | "ai" | "admin" | "security" | null {
  if (action.startsWith("auth.")) return "auth";
  if (action.startsWith("chat.") || action.startsWith("memory.") || action.startsWith("fact.")) return "ai";
  if (action.startsWith("tenant.") || action.startsWith("member.") || action.startsWith("role.")) return "admin";
  if (action.includes("security") || action.includes("permission")) return "security";
  return "data";
}

/**
 * Get recent activities for a tenant
 */
export async function getRecentActivities(
  supabase: SupabaseClient,
  options: {
    tenantId?: string;
    actorId?: string;
    resourceType?: string;
    resourceId?: string;
    actionCategory?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ActivityEntry[]> {
  let query = supabase
    .from("activity_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit || 50);
  
  if (options.tenantId) {
    query = query.eq("tenant_id", options.tenantId);
  }
  
  if (options.actorId) {
    query = query.eq("actor_id", options.actorId);
  }
  
  if (options.resourceType) {
    query = query.eq("resource_type", options.resourceType);
  }
  
  if (options.resourceId) {
    query = query.eq("resource_id", options.resourceId);
  }
  
  if (options.actionCategory) {
    query = query.eq("action_category", options.actionCategory);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get activity summary for dashboard
 */
export async function getActivitySummary(
  supabase: SupabaseClient,
  tenantId?: string,
  days: number = 7
): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byDay: { date: string; count: number }[];
  recentFailures: ActivityEntry[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  let query = supabase
    .from("activity_ledger")
    .select("*")
    .gte("created_at", since.toISOString());
  
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  
  const { data: activities } = await query;
  
  if (!activities) {
    return {
      total: 0,
      byCategory: {},
      byDay: [],
      recentFailures: [],
    };
  }
  
  // Count by category
  const byCategory: Record<string, number> = {};
  for (const activity of activities) {
    const cat = activity.action_category || "other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  
  // Count by day
  const byDayMap: Record<string, number> = {};
  for (const activity of activities) {
    const date = activity.created_at.split("T")[0];
    byDayMap[date] = (byDayMap[date] || 0) + 1;
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Recent failures
  const recentFailures = activities
    .filter(a => !a.success)
    .slice(0, 10);
  
  return {
    total: activities.length,
    byCategory,
    byDay,
    recentFailures,
  };
}
