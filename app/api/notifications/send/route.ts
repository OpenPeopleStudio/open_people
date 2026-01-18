import { createSupabaseServer } from "@/lib/supabase/server";
import { sendSMS, isValidPhoneNumber, type TwilioCredentials } from "@/lib/notifications/twilio";
import {
  NOTIFICATION_PLANS,
  canSendNotification,
  interpolateTemplate,
} from "@/types/notifications";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Send Notification API
   POST /api/notifications/send - Send SMS, in-app, or push notification
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const tenantId = profile.tenant_id;

    // Parse request body
    const body = await request.json();
    const {
      channel,
      recipient,
      recipientUserId,
      subject,
      body: messageBody,
      templateId,
      templateVariables,
      metadata,
    } = body;

    if (!channel || !recipient) {
      return NextResponse.json(
        { error: "Channel and recipient are required" },
        { status: 400 }
      );
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    const tier = subscription?.tier || "free";
    const plan = NOTIFICATION_PLANS[tier as keyof typeof NOTIFICATION_PLANS];

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const periodStart = startOfMonth.toISOString().split("T")[0];

    const { data: usageData } = await supabase
      .from("notification_usage")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("period_start", periodStart)
      .single();

    const currentUsage = usageData || {
      sms_sent: 0,
      sms_delivered: 0,
      sms_failed: 0,
      in_app_sent: 0,
      in_app_read: 0,
      push_sent: 0,
      push_delivered: 0,
    };

    // Check limits
    const limitCheck = canSendNotification(channel, currentUsage as any, plan);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
    }

    // Get template if specified
    let finalSubject = subject;
    let finalBody = messageBody;

    if (templateId) {
      const { data: template } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("id", templateId)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .single();

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      if (template.channel !== channel) {
        return NextResponse.json(
          { error: "Template channel mismatch" },
          { status: 400 }
        );
      }

      finalSubject = template.subject
        ? interpolateTemplate(template.subject, templateVariables || {})
        : null;
      finalBody = interpolateTemplate(template.body, templateVariables || {});
    }

    if (!finalBody) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    // Check user preferences (if recipient user ID provided)
    if (recipientUserId) {
      const { data: prefs } = await supabase
        .from("user_notification_preferences")
        .select("enabled, quiet_hours_start, quiet_hours_end")
        .eq("user_id", recipientUserId)
        .eq("tenant_id", tenantId)
        .eq("channel", channel)
        .single();

      if (prefs?.enabled === false) {
        return NextResponse.json(
          { error: "User has disabled this notification channel" },
          { status: 403 }
        );
      }

      // Check quiet hours (skip for now, could be enhanced)
    }

    let result: { success: boolean; providerId?: string; error?: string };
    let deliveryId: string | undefined;

    // Send based on channel
    switch (channel) {
      case "sms": {
        if (!isValidPhoneNumber(recipient)) {
          return NextResponse.json(
            { error: "Invalid phone number format" },
            { status: 400 }
          );
        }

        // Get Twilio credentials (tenant or platform)
        const twilioCredentials: TwilioCredentials | null = subscription?.twilio_account_sid
          ? {
              accountSid: subscription.twilio_account_sid,
              authToken: subscription.twilio_auth_token,
              fromNumber: subscription.twilio_from_number,
            }
          : null;

        result = await sendSMS(recipient, finalBody, twilioCredentials);

        // Log delivery
        const { data: delivery } = await supabase
          .from("notification_deliveries")
          .insert({
            tenant_id: tenantId,
            template_id: templateId || null,
            channel: "sms",
            recipient,
            recipient_user_id: recipientUserId || null,
            subject: finalSubject,
            body: finalBody,
            status: result.success ? "sent" : "failed",
            provider_id: result.providerId || null,
            error_message: result.error || null,
            metadata: metadata || {},
            sent_at: result.success ? new Date().toISOString() : null,
          })
          .select("id")
          .single();

        deliveryId = delivery?.id;

        // Update usage
        await supabase.rpc("increment_notification_usage", {
          p_tenant_id: tenantId,
          p_period_start: periodStart,
          p_field: "sms_sent",
          p_increment: 1,
        });

        break;
      }

      case "in_app": {
        // Create in-app notification
        const { data: notification, error: notifError } = await supabase
          .from("in_app_notifications")
          .insert({
            tenant_id: tenantId,
            user_id: recipientUserId || recipient,
            title: finalSubject || "Notification",
            body: finalBody,
            action_url: (metadata as Record<string, unknown>)?.action_url as string || null,
            icon: (metadata as Record<string, unknown>)?.icon as string || null,
          })
          .select("id")
          .single();

        if (notifError) {
          result = { success: false, error: notifError.message };
        } else {
          result = { success: true, providerId: notification?.id };
          deliveryId = notification?.id;
        }

        // Log delivery
        await supabase.from("notification_deliveries").insert({
          tenant_id: tenantId,
          template_id: templateId || null,
          channel: "in_app",
          recipient: recipientUserId || recipient,
          recipient_user_id: recipientUserId || null,
          subject: finalSubject,
          body: finalBody,
          status: result.success ? "delivered" : "failed",
          provider_id: result.providerId || null,
          error_message: result.error || null,
          metadata: metadata || {},
          sent_at: new Date().toISOString(),
          delivered_at: result.success ? new Date().toISOString() : null,
        });

        // Update usage
        await supabase.rpc("increment_notification_usage", {
          p_tenant_id: tenantId,
          p_period_start: periodStart,
          p_field: "in_app_sent",
          p_increment: 1,
        });

        break;
      }

      case "push": {
        // Push notifications would integrate with FCM here
        // For MVP, return not implemented
        return NextResponse.json(
          { error: "Push notifications coming soon" },
          { status: 501 }
        );
      }

      default:
        return NextResponse.json(
          { error: "Invalid notification channel" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deliveryId,
      providerId: result.providerId,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
