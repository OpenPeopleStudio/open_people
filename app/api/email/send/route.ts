import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail as sendResendEmail, getDefaultSender } from "@/lib/email/resend";
import { sendEmailWithProvider } from "@/lib/email/providers";
import { EMAIL_PLANS, canSendEmail, isManagedAccount } from "@/types/email";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Send API
   POST /api/email/send - Send an email
   
   Supports sending via:
   - Managed mode (DNS-only setup, uses Resend with verified custom domain)
   - Default Resend integration (legacy/fallback)
   - Specific email account (SMTP, Resend with custom domain)
   
   Super admins can:
   - Send using platform-level accounts (no tenant_id)
   - Send using any account by specifying accountId
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const adminSupabase = await createSupabaseAdmin();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile including role
    const { data: profile } = await adminSupabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    // Parse request body first to check for accountId
    const body = await request.json();
    const { 
      to, 
      subject, 
      html, 
      text, 
      templateId, 
      templateVariables, 
      replyTo, 
      cc, 
      bcc,
      accountId,        // Optional: send via specific account
      saveToSent,       // Optional: save to sent messages
      inReplyTo,        // Optional: for threading
      threadId,         // Optional: for threading
    } = body;

    // Determine tenant context
    let tenantId: string | null = profile?.tenant_id || null;
    let tenantSlug: string | null = null;

    // If an account is specified, get its tenant from the account
    if (accountId) {
      const { data: account, error: accLookupErr } = await adminSupabase
        .from("email_accounts")
        .select("tenant_id")
        .eq("id", accountId)
        .maybeSingle();
      
      if (accLookupErr) {
        console.error("[email/send] Account tenant lookup error:", accLookupErr);
      }
      
      if (account) {
        tenantId = account.tenant_id; // Could be null for platform-level accounts
      }
    }

    // Super admins can send without a tenant (platform-level)
    if (!isSuperAdmin && !tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Get tenant info if we have a tenant
    let tenant: { slug: string } | null = null;
    if (tenantId) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", tenantId)
        .single();
      
      tenant = tenantData;
      tenantSlug = tenantData?.slug || null;

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }
    } else {
      // Platform-level sending uses a default slug
      tenantSlug = "openpeople";
    }

    // Get email subscription and check limits (only if there's a tenant)
    let plan = EMAIL_PLANS["enterprise"]; // Default to unlimited for platform-level
    
    if (tenantId) {
      const { data: subscription } = await supabase
        .from("email_subscriptions")
        .select("tier, status")
        .eq("tenant_id", tenantId)
        .single();

      const tier = subscription?.tier || "free";
      plan = EMAIL_PLANS[tier as keyof typeof EMAIL_PLANS];

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
    }

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
    if (templateId && tenantId) {
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

    let result;
    let fromEmail: string;
    let usedAccountId: string | null = null;

    // If accountId is provided, use that account's provider
    if (accountId) {
      console.log("[email/send] Using accountId:", accountId);
      
      // First, let's see how many rows match this ID (should always be 0 or 1)
      const { data: debugAccounts, error: debugErr } = await adminSupabase
        .from("email_accounts")
        .select("id, tenant_id, email_address, provider")
        .eq("id", accountId);
      
      console.log("[email/send] Debug - accounts matching ID:", {
        count: debugAccounts?.length || 0,
        accounts: debugAccounts,
        error: debugErr?.message,
      });

      // Build query - always filter by ID
      // Super admins can access any account, others need tenant_id match
      const baseQuery = isSuperAdmin
        ? adminSupabase.from("email_accounts").select("*").eq("id", accountId)
        : supabase.from("email_accounts").select("*").eq("id", accountId).eq("tenant_id", tenantId);

      const { data: account, error: accountError } = await baseQuery.maybeSingle();

      console.log("[email/send] Account lookup:", { 
        found: !!account, 
        error: accountError?.message,
        provider: account?.provider,
        resend_domain: account?.resend_domain,
        mode: account?.mode,
        accountId,
        isSuperAdmin,
      });

      if (accountError || !account) {
        return NextResponse.json({ error: "Email account not found" }, { status: 404 });
      }

      if (!account.is_active) {
        return NextResponse.json({ error: "Email account is not active" }, { status: 400 });
      }

      usedAccountId = account.id;
      fromEmail = account.email_address;

      // For managed accounts, fetch the managed domain
      let managedDomain = null;
      if (isManagedAccount(account) && account.managed_domain_id) {
        const { data: domainData } = await adminSupabase
          .from("managed_email_domains")
          .select("*")
          .eq("id", account.managed_domain_id)
          .single();
        managedDomain = domainData;
      }

      // Send via the account's provider
      // Use account's tenant_id if available, otherwise fallback to the determined tenantId
      const effectiveTenantId = account.tenant_id || tenantId;
      const effectiveSlug = tenantSlug || "openpeople";

      console.log("[email/send] Calling sendEmailWithProvider:", {
        provider: account.provider,
        effectiveTenantId,
        effectiveSlug,
        managedDomain: managedDomain?.domain,
      });

      result = await sendEmailWithProvider(account, effectiveTenantId, effectiveSlug, {
        account_id: accountId,
        to,
        subject: subject || template?.subject || "",
        body_html: html,
        body_text: text,
        reply_to: replyTo,
        cc,
        bcc,
        in_reply_to: inReplyTo,
        thread_id: threadId,
      }, managedDomain);

      console.log("[email/send] sendEmailWithProvider result:", result);
    } else {
      // Fall back to default Resend integration
      // Get custom domain if available (only if we have a tenant)
      let customDomain: string | undefined;
      if (tenantId) {
        const { data: domainData } = await supabase
          .from("email_domains")
          .select("domain")
          .eq("tenant_id", tenantId)
          .eq("status", "verified")
          .limit(1)
          .single();

        customDomain = domainData?.domain;
      }

      // For platform-level sending without an account, we need a verified domain
      // The default mail.openpeople.ai must be verified in Resend
      if (!customDomain && !tenantId) {
        return NextResponse.json({ 
          error: "No email account selected. Please select an account with a verified domain to send emails." 
        }, { status: 400 });
      }

      // Use platform domain for super admins without tenant
      const effectiveSlug = tenantSlug || "openpeople";
      fromEmail = getDefaultSender(effectiveSlug, customDomain);

      // Send the email via Resend
      const resendResult = await sendResendEmail(
        tenantId,
        effectiveSlug,
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

      result = {
        success: resendResult.success,
        messageId: resendResult.emailId,
        providerId: resendResult.resendId,
        error: resendResult.error,
      };
    }

    if (!result.success) {
      // Log failed email (only if we have a tenant or use admin client)
      if (tenantId) {
        await supabase.from("email_logs").insert({
          tenant_id: tenantId,
          template_id: templateId || null,
          from_email: fromEmail,
          to_email: Array.isArray(to) ? to[0] : to,
          subject: subject || template?.subject || "",
          status: "failed",
          error_message: result.error,
        });
      } else {
        // Platform-level logging - use admin client
        await adminSupabase.from("email_logs").insert({
          tenant_id: null,
          template_id: templateId || null,
          from_email: fromEmail,
          to_email: Array.isArray(to) ? to[0] : to,
          subject: subject || template?.subject || "",
          status: "failed",
          error_message: result.error,
        });
      }

      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log successful email
    const logData = {
      tenant_id: tenantId,
      template_id: templateId || null,
      resend_id: result.providerId || null,
      from_email: fromEmail,
      to_email: Array.isArray(to) ? to[0] : to,
      cc: cc || null,
      bcc: bcc || null,
      subject: subject || template?.subject || "",
      status: "sent",
    };

    if (tenantId) {
      await supabase.from("email_logs").insert(logData);
    } else {
      await adminSupabase.from("email_logs").insert(logData);
    }

    // Save to sent messages if using an account and requested
    if (usedAccountId && saveToSent !== false) {
      const toAddresses = (Array.isArray(to) ? to : [to]).map((email: string) => ({ email }));
      
      // Get the account's tenant_id if we don't have one
      let messageTenantId = tenantId;
      if (!messageTenantId) {
        const { data: accountData } = await adminSupabase
          .from("email_accounts")
          .select("tenant_id")
          .eq("id", usedAccountId)
          .maybeSingle();
        messageTenantId = accountData?.tenant_id || null;
      }

      // Save sent message (tenant_id can be null for platform-level accounts)
      const messageData = {
        tenant_id: messageTenantId, // Can be null for platform-level
        account_id: usedAccountId,
        message_id: result.messageId,
        provider_id: result.providerId,
        thread_id: threadId || result.messageId,
        in_reply_to: inReplyTo,
        direction: "outbound",
        from_address: fromEmail,
        to_addresses: toAddresses,
        cc_addresses: cc?.map((email: string) => ({ email })) || [],
        bcc_addresses: bcc?.map((email: string) => ({ email })) || [],
        reply_to: replyTo,
        subject: subject || template?.subject || "",
        body_html: html,
        body_text: text,
        body_preview: (text || html || "").slice(0, 200).replace(/<[^>]*>/g, ""),
        status: "sent",
        mailbox: "Sent",
        is_read: true,
        sent_at: new Date().toISOString(),
      };

      console.log("[email/send] Saving sent message:", { 
        tenant_id: messageTenantId, 
        account_id: usedAccountId,
        subject: messageData.subject,
      });

      const { error: insertError } = await adminSupabase
        .from("email_messages")
        .insert(messageData);

      if (insertError) {
        console.error("[email/send] Failed to save sent message:", insertError);
      } else {
        console.log("[email/send] Sent message saved successfully");
      }
    } else {
      console.log("[email/send] Skipping sent message save:", { 
        usedAccountId, 
        saveToSent 
      });
    }

    // Update usage (only for tenant-based sending)
    if (tenantId) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      await supabase.rpc("increment_email_usage", {
        p_tenant_id: tenantId,
        p_period_start: startOfMonth.toISOString().split("T")[0],
        p_field: "emails_sent",
      });
    }

    return NextResponse.json({
      success: true,
      emailId: result.messageId,
      providerId: result.providerId,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
