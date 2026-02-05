import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getPlatformSettings,
  updateSettings,
  getSettingsLastUpdated,
} from "@/lib/platform-settings";
import {
  SettingsCategory,
  SETTINGS_CATEGORIES,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@/types/platform-settings";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Platform Settings API
   GET /api/super-admin/settings - Fetch all platform settings
   PUT /api/super-admin/settings - Update settings by category
   ═══════════════════════════════════════════════════════════════════════════ */

// Verify user is super admin
async function verifySuperAdmin(): Promise<{ userId: string } | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if user is super admin (no tenant_id or special flag)
  const adminSupabase = await createSupabaseAdmin();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  // Super admin has no tenant_id or is explicitly marked
  if (profile?.tenant_id === null || profile?.role === "super_admin") {
    return { userId: user.id };
  }

  return null;
}

// GET - Fetch all platform settings
export async function GET() {
  try {
    const auth = await verifySuperAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    const [settings, lastUpdated] = await Promise.all([
      getPlatformSettings(),
      getSettingsLastUpdated(),
    ]);

    const response: GetSettingsResponse = {
      settings,
      lastUpdated,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update settings by category
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifySuperAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings } = body;

    // Validate category
    if (!category || !SETTINGS_CATEGORIES.includes(category as SettingsCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${SETTINGS_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate settings object
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings must be an object" },
        { status: 400 }
      );
    }

    // Get request metadata for audit log
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Update settings
    const result = await updateSettings(
      category as SettingsCategory,
      settings,
      auth.userId,
      ipAddress || undefined,
      userAgent || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update settings" },
        { status: 500 }
      );
    }

    const response: UpdateSettingsResponse = {
      success: true,
      category: category as SettingsCategory,
      updatedKeys: result.updatedKeys,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
