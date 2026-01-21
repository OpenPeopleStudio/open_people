import { createClient } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Analytics Service
   Collects and aggregates email workspace metrics
   ═══════════════════════════════════════════════════════════════════════════ */

export class EmailMetricsService {
  private supabase = createClient();

  /**
   * Update tenant metrics for a given period
   */
  async updateTenantMetrics(tenantId: string, periodStart: Date): Promise<void> {
    const periodKey = periodStart.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      // Calculate message counts
      const { data: messageStats, error: messageError } = await this.supabase.rpc(
        "get_email_usage_stats",
        {
          p_tenant_id: tenantId,
          p_period_start: periodKey,
        }
      );

      if (messageError) {
        console.error("Error getting message stats:", messageError);
        return;
      }

      // Calculate response metrics
      const { data: responseStats, error: responseError } = await this.supabase.rpc(
        "calculate_response_metrics",
        {
          p_tenant_id: tenantId,
          p_period_start: periodKey,
        }
      );

      if (responseError) {
        console.error("Error calculating response metrics:", responseError);
      }

      // Calculate AI usage
      const { data: aiStats, error: aiError } = await this.supabase.rpc(
        "calculate_ai_usage_metrics",
        {
          p_tenant_id: tenantId,
          p_period_start: periodKey,
        }
      );

      if (aiError) {
        console.error("Error calculating AI usage metrics:", aiError);
      }

      // Get active users
      const { data: activeUsers, error: userError } = await this.supabase.rpc(
        "get_active_email_users",
        {
          p_tenant_id: tenantId,
          p_period_start: periodKey,
        }
      );

      if (userError) {
        console.error("Error getting active users:", userError);
      }

      // Calculate SLA metrics
      const { data: slaStats, error: slaError } = await this.supabase.rpc(
        "calculate_sla_metrics",
        {
          p_tenant_id: tenantId,
          p_period_start: periodKey,
        }
      );

      if (slaError) {
        console.error("Error calculating SLA metrics:", slaError);
      }

      // Update metrics
      await this.supabase
        .from("email_metrics")
        .upsert({
          tenant_id: tenantId,
          period_start: periodKey,
          messages_received: messageStats?.messages_received || 0,
          messages_sent: messageStats?.messages_sent || 0,
          messages_inbound: messageStats?.messages_inbound || 0,
          messages_outbound: messageStats?.messages_outbound || 0,
          avg_response_time_hours: responseStats?.avg_response_time_hours,
          sla_hit_rate: slaStats?.sla_hit_rate,
          resolution_rate: slaStats?.resolution_rate,
          ai_processed_messages: aiStats?.ai_processed_messages || 0,
          ai_suggestion_usage_rate: aiStats?.ai_suggestion_usage_rate,
          time_saved_hours: aiStats?.time_saved_hours,
          active_users: activeUsers?.active_users || 0,
          assignments_completed: slaStats?.assignments_completed || 0,
        });

      console.log(`Updated metrics for tenant ${tenantId} period ${periodKey}`);
    } catch (error) {
      console.error(`Error updating tenant metrics for ${tenantId}:`, error);
    }
  }

  /**
   * Update user activity metrics for a given period
   */
  async updateUserMetrics(tenantId: string, userId: string, periodStart: Date): Promise<void> {
    const periodKey = periodStart.toISOString().split('T')[0];

    try {
      // Calculate user activity
      const { data: activityStats, error } = await this.supabase.rpc(
        "calculate_user_email_activity",
        {
          p_tenant_id: tenantId,
          p_user_id: userId,
          p_period_start: periodKey,
        }
      );

      if (error) {
        console.error("Error calculating user activity:", error);
        return;
      }

      // Update user activity
      await this.supabase
        .from("email_user_activity")
        .upsert({
          tenant_id: tenantId,
          user_id: userId,
          period_start: periodKey,
          messages_read: activityStats?.messages_read || 0,
          messages_sent: activityStats?.messages_sent || 0,
          assignments_taken: activityStats?.assignments_taken || 0,
          assignments_completed: activityStats?.assignments_completed || 0,
          comments_added: activityStats?.comments_added || 0,
          time_spent_minutes: activityStats?.time_spent_minutes || 0,
          ai_suggestions_used: activityStats?.ai_suggestions_used || 0,
        });

      console.log(`Updated user metrics for ${userId} in tenant ${tenantId} period ${periodKey}`);
    } catch (error) {
      console.error(`Error updating user metrics for ${userId}:`, error);
    }
  }

  /**
   * Record a metric event
   */
  async recordEvent(
    tenantId: string,
    eventType: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { user_id, thread_id, message_id, ...metadata } = eventData;

      await this.supabase
        .from("email_events")
        .insert({
          tenant_id: tenantId,
          event_type: eventType,
          user_id,
          thread_id,
          message_id,
          metadata,
        });
    } catch (error) {
      console.error("Error recording email event:", error);
    }
  }

  /**
   * Get dashboard metrics for a tenant
   */
  async getDashboardMetrics(tenantId: string, days: number = 30): Promise<{
    overview: any;
    trends: any[];
    topUsers: any[];
    slaPerformance: any[];
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get current period metrics
    const { data: currentMetrics } = await this.supabase
      .from("email_metrics")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("period_start", startDate.toISOString().split('T')[0])
      .order("period_start", { ascending: false })
      .limit(1)
      .single();

    // Get trend data
    const { data: trends } = await this.supabase
      .from("email_metrics")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("period_start", startDate.toISOString().split('T')[0])
      .order("period_start", { ascending: true });

    // Get top users by activity
    const { data: topUsers } = await this.supabase
      .from("email_user_activity")
      .select(`
        user_id,
        messages_sent,
        assignments_completed,
        ai_suggestions_used,
        time_spent_minutes,
        profiles!email_user_activity_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("tenant_id", tenantId)
      .gte("period_start", startDate.toISOString().split('T')[0])
      .order("messages_sent", { ascending: false })
      .limit(10);

    // Calculate SLA performance
    const { data: slaPerformance } = await this.supabase.rpc(
      "get_sla_performance_summary",
      {
        p_tenant_id: tenantId,
        p_days: days,
      }
    );

    return {
      overview: currentMetrics || {},
      trends: trends || [],
      topUsers: topUsers || [],
      slaPerformance: slaPerformance || [],
    };
  }

  /**
   * Run daily metrics aggregation
   */
  async runDailyAggregation(): Promise<void> {
    console.log("[Email Metrics] Running daily aggregation");

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get all tenants with email activity
      const { data: activeTenants, error } = await this.supabase.rpc(
        "get_tenants_with_email_activity",
        { p_date: yesterday.toISOString().split('T')[0] }
      );

      if (error) {
        console.error("Error getting active tenants:", error);
        return;
      }

      for (const tenant of activeTenants || []) {
        await this.updateTenantMetrics(tenant.tenant_id, yesterday);

        // Update metrics for active users in this tenant
        const { data: activeUsers } = await this.supabase.rpc(
          "get_tenant_active_email_users",
          {
            p_tenant_id: tenant.tenant_id,
            p_date: yesterday.toISOString().split('T')[0],
          }
        );

        for (const user of activeUsers || []) {
          await this.updateUserMetrics(tenant.tenant_id, user.user_id, yesterday);
        }
      }

      console.log("[Email Metrics] Daily aggregation completed");
    } catch (error) {
      console.error("[Email Metrics] Daily aggregation failed:", error);
    }
  }
}

// Export singleton instance
export const emailMetrics = new EmailMetricsService();