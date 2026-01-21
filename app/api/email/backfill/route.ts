import { createSupabaseServer } from "@/lib/supabase/server";
import { emailBackfill } from "@/lib/email/backfill";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Backfill API
   POST /api/email/backfill - Trigger email backfill process
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only allow admins and owners to trigger backfill
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider = "resend", // "resend" | "imap"
      tenantId = profile.tenant_id,
      domain,
      daysBack = 30,
      batchSize = 50,
    } = body;

    console.log(`[Email Backfill API] Starting backfill`, {
      provider,
      tenantId,
      domain,
      daysBack,
      batchSize,
      user: user.id,
    });

    let result;

    switch (provider) {
      case "resend":
        result = await emailBackfill.backfillResendEmails({
          tenantId,
          domain,
          daysBack,
          batchSize,
        });
        break;

      case "imap":
        if (!body.accountId) {
          return NextResponse.json(
            { error: "accountId required for IMAP backfill" },
            { status: 400 }
          );
        }
        result = await emailBackfill.backfillImapEmails(body.accountId, {
          daysBack,
          batchSize,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported provider. Use 'resend' or 'imap'" },
          { status: 400 }
        );
    }

    if (result.success) {
      // Log the backfill operation
      await supabase.rpc("log_email_event", {
        p_tenant_id: tenantId,
        p_event_type: "backfill",
        p_event_subtype: provider,
        p_user_id: user.id,
        p_metadata: {
          days_back: daysBack,
          batch_size: batchSize,
          processed: result.processed,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Backfill completed. Processed ${result.processed || 0} emails.`,
        processed: result.processed,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Backfill failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Email backfill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}import { createSupabaseServer } from "@/lib/supabase/server";
import { emailBackfill } from "@/lib/email/backfill";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Backfill API
   POST /api/email/backfill - Trigger email backfill process
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only allow admins and owners to trigger backfill
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider = "resend", // "resend" | "imap"
      tenantId = profile.tenant_id,
      domain,
      daysBack = 30,
      batchSize = 50,
    } = body;

    console.log(`[Email Backfill API] Starting backfill`, {
      provider,
      tenantId,
      domain,
      daysBack,
      batchSize,
      user: user.id,
    });

    let result;

    switch (provider) {
      case "resend":
        result = await emailBackfill.backfillResendEmails({
          tenantId,
          domain,
          daysBack,
          batchSize,
        });
        break;

      case "imap":
        if (!body.accountId) {
          return NextResponse.json(
            { error: "accountId required for IMAP backfill" },
            { status: 400 }
          );
        }
        result = await emailBackfill.backfillImapEmails(body.accountId, {
          daysBack,
          batchSize,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported provider. Use 'resend' or 'imap'" },
          { status: 400 }
        );
    }

    if (result.success) {
      // Log the backfill operation
      await supabase.rpc("log_email_event", {
        p_tenant_id: tenantId,
        p_event_type: "backfill",
        p_event_subtype: provider,
        p_user_id: user.id,
        p_metadata: {
          days_back: daysBack,
          batch_size: batchSize,
          processed: result.processed,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Backfill completed. Processed ${result.processed || 0} emails.`,
        processed: result.processed,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Backfill failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Email backfill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}