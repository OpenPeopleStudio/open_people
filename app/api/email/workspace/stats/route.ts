import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Stats API
   GET /api/email/workspace/stats - Get workspace statistics
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get thread stats using the RPC function
    const { data: threadStats, error: threadError } = await supabase.rpc("get_thread_stats", {
      p_tenant_id: profile.tenant_id,
    });

    if (threadError) {
      console.error("Get thread stats error:", threadError);
      return NextResponse.json({ error: threadError.message }, { status: 500 });
    }

    // Get recent metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("email_metrics")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .gte("period_start", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order("period_start", { ascending: false })
      .limit(30);

    if (metricsError) {
      console.error("Get metrics error:", metricsError);
      // Don't fail the request if metrics fail
    }

    // Get active assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from("email_assignments")
      .select(`
        id,
        status,
        due_at,
        created_at,
        assignee:profiles!email_assignments_assignee_id_fkey (
          full_name,
          email
        ),
        thread:email_threads (
          subject,
          ai_priority_score
        )
      `)
      .eq("tenant_id", profile.tenant_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);

    if (assignmentError) {
      console.error("Get assignments error:", assignmentError);
      // Don't fail the request if assignments fail
    }

    // Get SLA performance
    const { data: slaPerformance, error: slaError } = await supabase
      .from("email_slas")
      .select(`
        priority,
        response_time_hours,
        resolution_time_hours,
        assignments:email_assignments (
          status,
          due_at,
          created_at
        )
      `)
      .eq("tenant_id", profile.tenant_id)
      .eq("is_active", true);

    if (slaError) {
      console.error("Get SLA performance error:", slaError);
      // Don't fail the request if SLA data fails
    }

    // Calculate SLA metrics
    const slaMetrics = slaPerformance?.map(sla => {
      const assignments = sla.assignments || [];
      const completedOnTime = assignments.filter((a: any) =>
        a.status === "completed" &&
        a.due_at &&
        new Date(a.due_at) > new Date(a.created_at)
      ).length;
      const totalCompleted = assignments.filter((a: any) => a.status === "completed").length;
      const overdue = assignments.filter((a: any) =>
        a.status === "active" &&
        a.due_at &&
        new Date(a.due_at) < new Date()
      ).length;

      return {
        priority: sla.priority,
        hit_rate: totalCompleted > 0 ? (completedOnTime / totalCompleted) * 100 : 0,
        overdue_count: overdue,
        total_assignments: assignments.length,
      };
    }) || [];

    return NextResponse.json({
      thread_stats: threadStats || {
        total_threads: 0,
        active_threads: 0,
        resolved_threads: 0,
        urgent_threads: 0,
        assigned_threads: 0,
        unassigned_threads: 0,
        overdue_assignments: 0,
      },
      recent_metrics: metrics || [],
      active_assignments: assignments || [],
      sla_performance: slaMetrics,
    });
  } catch (error) {
    console.error("Get workspace stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}