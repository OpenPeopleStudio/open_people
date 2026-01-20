import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  checkIntegrationHealth,
  getEnvironmentVariableStatus,
} from "@/lib/platform-settings";
import { HealthCheckResponse } from "@/types/platform-settings";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Integration Health Check API
   GET /api/super-admin/settings/health - Check all integration health status
   ═══════════════════════════════════════════════════════════════════════════ */

// Verify user is super admin
async function verifySuperAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Check if user is super admin
  const adminSupabase = await createSupabaseAdmin();
  const { data: profile } = await adminSupabase
    .from("709_profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  return profile?.tenant_id === null || profile?.role === "super_admin";
}

// GET - Check all integration health status
export async function GET() {
  try {
    const isAdmin = await verifySuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    const integrations = await checkIntegrationHealth();
    const envStatus = getEnvironmentVariableStatus();

    const response: HealthCheckResponse & {
      environment: Record<string, { configured: boolean; masked: string }>;
    } = {
      integrations,
      checkedAt: new Date().toISOString(),
      environment: envStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking integration health:", error);
    return NextResponse.json(
      { error: "Failed to check integration health" },
      { status: 500 }
    );
  }
}
