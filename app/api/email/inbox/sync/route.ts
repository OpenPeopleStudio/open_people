import { createSupabaseServer } from "@/lib/supabase/server";
import { syncInboxForAccount } from "@/lib/email/inbox-sync";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Sync API
   POST /api/email/inbox/sync - Sync emails from provider
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, mailbox, limit, fullSync } = body;

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Get the account with credentials
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await syncInboxForAccount(supabase, account, profile.tenant_id, {
      limit,
      mailbox,
      fullSync,
    });

    if (!result.success) {
      const status =
        result.error === "Sync is disabled for this account"
          ? 400
          : result.error === "Account tenant mismatch"
            ? 403
            : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      fetched: result.fetched || 0,
      new: result.new || 0,
      updated: result.updated || 0,
      duplicates: result.duplicates || 0,
    });
  } catch (error) {
    console.error("Sync inbox error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
