/**
 * Security Metrics API
 *
 * Provides aggregated security metrics and recent alerts for the security dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

interface SecurityMetrics {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  recent_alerts: any[];
  failed_logins_24h: number;
  active_sessions: number;
  suspicious_ips: string[];
}

export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = await createSupabaseAdmin();

    // Verify super admin access (simplified for now)
    // In production, you'd check for proper super admin role

    const metrics: SecurityMetrics = {
      total_alerts: 0,
      critical_alerts: 0,
      high_alerts: 0,
      recent_alerts: [],
      failed_logins_24h: 0,
      active_sessions: 0,
      suspicious_ips: [],
    };

    // Get recent alerts (mock data for now - you'd create a security_alerts table)
    try {
      // This assumes you've created a security_alerts table
      // In production, you'd migrate this table
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alerts) {
        metrics.recent_alerts = alerts;
        metrics.total_alerts = alerts.length;

        // Count by severity
        metrics.critical_alerts = alerts.filter(a => a.severity === 'critical').length;
        metrics.high_alerts = alerts.filter(a => a.severity === 'high').length;
      }
    } catch (error) {
      // Table might not exist yet - return empty metrics
      console.log('Security alerts table not found, returning empty metrics');
    }

    // Get failed login attempts in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: failedLogins } = await supabase
      .from('vault_audit_log')
      .select('id', { count: 'exact' })
      .eq('action', 'failed_login')
      .gte('created_at', yesterday.toISOString());

    metrics.failed_logins_24h = failedLogins?.length || 0;

    // Get active vault sessions
    const { data: activeSessions } = await supabase
      .from('vault_sessions')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    metrics.active_sessions = activeSessions?.length || 0;

    // Get suspicious IPs (simplified: IPs with many failed logins)
    const { data: suspiciousActivity } = await supabase
      .from('vault_audit_log')
      .select('ip_address')
      .eq('success', false)
      .gte('created_at', yesterday.toISOString());

    if (suspiciousActivity) {
      const ipCounts: Record<string, number> = {};
      suspiciousActivity.forEach(entry => {
        if (entry.ip_address) {
          ipCounts[entry.ip_address] = (ipCounts[entry.ip_address] || 0) + 1;
        }
      });

      // IPs with 5+ failed attempts
      metrics.suspicious_ips = Object.entries(ipCounts)
        .filter(([_, count]) => count >= 5)
        .map(([ip]) => ip);
    }

    return NextResponse.json({ metrics });

  } catch (error) {
    console.error('Security metrics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
