import { createClient } from "@/lib/supabase/server";
import { emailWorkspace } from "@/lib/email/workspace";
import { NextRequest, NextResponse } from "next/server";
import type { ComposeEmailRequest } from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Send API
   POST /api/email/workspace/send - Send email via workspace
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ComposeEmailRequest = await request.json();

    if (!body.account_id || !body.to || !body.subject) {
      return NextResponse.json(
        { error: "Missing required fields: account_id, to, subject" },
        { status: 400 }
      );
    }

    // Verify user has access to the account
    const { data: account } = await supabase
      .from("email_accounts")
      .select("id, tenant_id")
      .eq("id", body.account_id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if user belongs to the tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== account.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const result = await emailWorkspace.sendEmail(body.account_id, body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}