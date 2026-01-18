import { createSupabaseServer } from "@/lib/supabase/server";
import { sendEmail, getDefaultSender } from "@/lib/email/resend";
import { EMAIL_PLANS, canSendEmail } from "@/types/email";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Send API
   POST /api/email/send - Send an email
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

    // Get tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get email subscription
    const { data: subscription } = await supabase
      .from("email_subscriptions")
      .select("tier, status")
      .eq("tenant_id", tenantId)
      .single();

    const tier = subscription?.tier || "free";
    const plan = EMAIL_PLANS[tier as keyof typeof EMAIL_PLANS];

    if (!plan) {
      return NextResponse.json({ error: "Invalid email plan" }, { status: 500 });
    }

    // Check subscription status
    if (subscription?.status && !["active", "trialing"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "Email subscription is not active" },
        { status: 403 }
      );
    }

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
      .from("email_usage")
      .select("emails_sent")
      .eq("tenant_id", tenantId)
      .eq("period_start", startOfMonth.toISOString().split("T")[0])
      .single();

    const currentUsage = usageData?.emails_sent || 0;

    // Check if can send
    const sendCheck = canSendEmail(currentUsage, plan);
    if (!sendCheck.allowed) {
      return NextResponse.json({ error: sendCheck.reason }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, templateId, templateVariables, replyTo, cc, bcc } = body;

    if (!to) {
      return NextResponse.json({ error: "Recipient (to) is required" }, { status: 400 });
    }

    if (!subject && !templateId) {
      return NextResponse.json(
        { error: "Subject is required when not using a template" },
        { status: 400 }
      );
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .single();

      if (!templateData) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      template = templateData;
    }

    // Get custom domain if available
    const { data: domainData } = await supabase
      .from("email_domains")
      .select("domain")
      .eq("tenant_id", tenantId)
      .eq("status", "verified")
      .limit(1)
      .single();

    const customDomain = domainData?.domain;

    // Send the email
    const result = await sendEmail(
      tenantId,
      tenant.slug,
      {
        to,
        subject: subject || template?.subject || "",
        html,
        text,
        templateId,
        templateVariables,
        replyTo,
        cc,
        bcc,
      },
      template,
      customDomain
    );

    if (!result.success) {
      // Log failed email
      await supabase.from("email_logs").insert({
        tenant_id: tenantId,
        template_id: templateId || null,
        from_email: getDefaultSender(tenant.slug, customDomain),
        to_email: Array.isArray(to) ? to[0] : to,
        subject: subject || template?.subject || "",
        status: "failed",
        error_message: result.error,
      });

      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log successful email
    await supabase.from("email_logs").insert({
      tenant_id: tenantId,
      template_id: templateId || null,
      resend_id: result.resendId,
      from_email: getDefaultSender(tenant.slug, customDomain),
      to_email: Array.isArray(to) ? to[0] : to,
      cc: cc || null,
      bcc: bcc || null,
      subject: subject || template?.subject || "",
      status: "sent",
    });

    // Update usage
    await supabase.rpc("increment_email_usage", {
      p_tenant_id: tenantId,
      p_period_start: startOfMonth.toISOString().split("T")[0],
      p_field: "emails_sent",
    });

    return NextResponse.json({
      success: true,
      emailId: result.emailId,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
