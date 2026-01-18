import { createSupabaseServer } from "@/lib/supabase/server";
import { parseTwilioStatus } from "@/lib/notifications/twilio";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Notification Webhooks API
   POST /api/notifications/webhooks - Handle provider callbacks (Twilio)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (provider === "twilio") {
      return handleTwilioWebhook(request);
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleTwilioWebhook(request: NextRequest) {
  try {
    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await request.formData();
    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // Find the delivery by provider_id
    const { data: delivery, error: findError } = await supabase
      .from("notification_deliveries")
      .select("id, tenant_id, status")
      .eq("provider_id", messageSid)
      .single();

    if (findError || !delivery) {
      console.warn(`Delivery not found for SID: ${messageSid}`);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    // Map Twilio status to our status
    const newStatus = parseTwilioStatus(messageStatus);

    // Update delivery status
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    if (newStatus === "failed" && (errorCode || errorMessage)) {
      updateData.error_message = errorMessage || `Error code: ${errorCode}`;
    }

    await supabase
      .from("notification_deliveries")
      .update(updateData)
      .eq("id", delivery.id);

    // Update usage stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const periodStart = startOfMonth.toISOString().split("T")[0];

    if (newStatus === "delivered") {
      await supabase.rpc("increment_notification_usage", {
        p_tenant_id: delivery.tenant_id,
        p_period_start: periodStart,
        p_field: "sms_delivered",
        p_increment: 1,
      });
    } else if (newStatus === "failed") {
      await supabase.rpc("increment_notification_usage", {
        p_tenant_id: delivery.tenant_id,
        p_period_start: periodStart,
        p_field: "sms_failed",
        p_increment: 1,
      });
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
