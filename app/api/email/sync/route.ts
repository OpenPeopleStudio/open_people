import { createSupabaseServer } from "@/lib/supabase/server";
import { syncInboxForAccount } from "@/lib/email/inbox-sync";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Sync API
   POST /api/email/sync - Trigger email synchronization
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

    const body = await request.json();
    const { accountId, fullSync = false, maxEmails = 50 } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the account
    const { data: account } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== account.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("[Email Sync API] Starting sync", {
      provider: account.provider,
      fullSync,
      maxEmails,
    });

    const result = await syncInboxForAccount(supabase, account, profile.tenant_id, {
      limit: maxEmails,
      fullSync,
    });

    if (!result.success) {
      const status =
        result.error === "Sync is disabled for this account"
          ? 400
          : result.error === "Account tenant mismatch"
            ? 403
            : 500;
      return NextResponse.json(
        { error: result.error || "Sync failed" },
        { status }
      );
    }

    await supabase.rpc("log_email_event", {
      p_tenant_id: profile.tenant_id,
      p_event_type: "sync",
      p_event_subtype: account.provider,
      p_user_id: user.id,
      p_metadata: {
        account_id: accountId,
        synced: result.new ?? 0,
        full_sync: fullSync,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sync completed. Synced ${result.new || 0} emails.`,
      synced: result.new || 0,
    });
  } catch (error) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
