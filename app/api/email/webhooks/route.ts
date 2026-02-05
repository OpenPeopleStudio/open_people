import { createSupabaseServer } from "@/lib/supabase/server";
import { createResendClient, parseWebhookEvent, mapWebhookEventToStatus } from "@/lib/email/resend";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Webhooks API
   POST /api/email/webhooks - Handle Resend webhook events
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const signature = request.headers.get("svix-signature");
    const payload = await request.text();

    if (webhookSecret) {
      if (!signature) {
        console.warn("Missing webhook signature");
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }

      try {
        const resend = createResendClient();
        resend.webhooks.verify({
          payload,
          headers: {
            id: request.headers.get("svix-id") || "",
            timestamp: request.headers.get("svix-timestamp") || "",
            signature,
          },
          webhookSecret,
        });
      } catch (error) {
        console.error("Invalid webhook signature:", error);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const parsedPayload = JSON.parse(payload);
    const event = parseWebhookEvent(parsedPayload);

    if (!event) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const status = mapWebhookEventToStatus(event.type);
    if (!status) {
      // Unknown event type, acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    const supabase = await createSupabaseServer();

    // Find the email log by resend_id
    const { data: emailLog, error: findError } = await supabase
      .from("email_logs")
      .select("id, tenant_id, status")
      .eq("resend_id", event.emailId)
      .single();

    if (findError || !emailLog) {
      console.warn(`Email log not found for resend_id: ${event.emailId}`);
      return NextResponse.json({ received: true });
    }

    // Update email log status
    const updateData: Record<string, unknown> = { status };

    switch (status) {
      case "opened":
        updateData.opened_at = event.timestamp;
        break;
      case "clicked":
        updateData.clicked_at = event.timestamp;
        break;
      case "bounced":
        updateData.bounced_at = event.timestamp;
        updateData.error_message = (event.data as Record<string, unknown>).bounce_type as string || "Bounced";
        break;
      case "complained":
        updateData.error_message = "Marked as spam";
        break;
    }

    await supabase
      .from("email_logs")
      .update(updateData)
      .eq("id", emailLog.id);

    // Update usage stats
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const fieldMap: Record<string, string> = {
      delivered: "emails_delivered",
      opened: "emails_opened",
      clicked: "emails_clicked",
      bounced: "emails_bounced",
      complained: "emails_complained",
    };

    const usageField = fieldMap[status];
    if (usageField) {
      await supabase.rpc("increment_email_usage", {
        p_tenant_id: emailLog.tenant_id,
        p_period_start: periodStart.toISOString().split("T")[0],
        p_field: usageField,
      });
    }

    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
