import { createSupabaseServer } from "@/lib/supabase/server";
import { emailWorkspace } from "@/lib/email/workspace";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Test Inbound Email API
   POST /api/email/test-inbound - Simulate receiving an inbound email
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
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      to = "test@example.com",
      from = "sender@example.com",
      subject = "Test Email",
      text = "This is a test email body.",
      html,
    } = body;

    // Create a simulated webhook payload
    const simulatedPayload = {
      type: "email.received",
      data: {
        email_id: `test-${Date.now()}`,
        message_id: `test-msg-${Date.now()}@example.com`,
        from: from,
        to: [to],
        subject: subject,
        text: text,
        html: html || text,
        created_at: new Date().toISOString(),
        attachments: [],
      },
    };

    // Process the simulated webhook
    const result = await emailWorkspace.processInboundWebhook(
      simulatedPayload,
      "dummy-signature",
      "dummy-secret"
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      threadId: result.threadId,
      error: result.error,
    });
  } catch (error) {
    console.error("Test inbound error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}