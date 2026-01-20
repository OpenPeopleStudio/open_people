import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { testAccountConnection } from "@/lib/email/providers";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Account Test Connection API
   POST /api/email/accounts/test - Test account connection
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createSupabaseAdmin();

    const { data: profile } = await adminSupabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    // Non-super-admins must have a tenant
    if (!isSuperAdmin && !profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Get the full account with encrypted credentials
    // Super admin can test any account, others only their tenant's accounts
    let query = adminSupabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId);

    if (!isSuperAdmin) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    const { data: account, error } = await query.single();

    if (error || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Test the connection
    const result = await testAccountConnection(account);

    // Update last sync error if failed
    if (!result.success && result.error) {
      await adminSupabase
        .from("email_accounts")
        .update({ last_sync_error: result.error })
        .eq("id", accountId);
    } else {
      await adminSupabase
        .from("email_accounts")
        .update({ last_sync_error: null })
        .eq("id", accountId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
