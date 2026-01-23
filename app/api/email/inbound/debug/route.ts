import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type ManagedDomainRow = {
  id: string;
  domain: string;
  status: string;
  tenant_id: string | null;
  account_id: string | null;
  resend_domain_id: string | null;
  verified_at: string | null;
  last_check_at: string | null;
  error_message: string | null;
  dns_records: unknown;
};

type ManagedAccountRow = {
  id: string;
  name: string | null;
  email_address: string | null;
  provider: string | null;
  mode: string | null;
  sync_enabled: boolean | null;
  tenant_id: string | null;
};

type RecentInboundRow = {
  id: string;
  from_address: string | null;
  to_addresses: unknown;
  subject: string | null;
  received_at: string | null;
  account_id: string | null;
  tenant_id: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Inbound Email Debug Endpoint
   GET /api/email/inbound/debug - Check webhook and domain configuration
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const isAdmin = ["admin", "owner", "super_admin"].includes(profile?.role || "");

    if (!isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check environment variables
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_WEBHOOK_SECRET: !!process.env.RESEND_WEBHOOK_SECRET,
      INBOUND_WEBHOOK_SECRET: !!process.env.INBOUND_WEBHOOK_SECRET,
    };

    // Check managed domains
    let managedDomains: ManagedDomainRow[] = [];
    let domainsError: string | null = null;

    try {
      // Try admin client first for full access
      let adminSupabase;
      try {
        adminSupabase = await createSupabaseAdmin();
      } catch {
        adminSupabase = null;
      }

      if (adminSupabase && isSuperAdmin) {
        const { data, error } = await adminSupabase
          .from("managed_email_domains")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          domainsError = error.message;
        } else {
          managedDomains = (data || []) as ManagedDomainRow[];
        }
      } else if (profile?.tenant_id) {
        const { data, error } = await supabase
          .from("managed_email_domains")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: false });

        if (error) {
          domainsError = error.message;
        } else {
          managedDomains = (data || []) as ManagedDomainRow[];
        }
      }
    } catch (e) {
      domainsError = e instanceof Error ? e.message : "Unknown error";
    }

    // Check email accounts with managed mode
    let managedAccounts: ManagedAccountRow[] = [];
    let accountsError: string | null = null;

    try {
      const query = supabase
        .from("email_accounts")
        .select("id, name, email_address, provider, mode, sync_enabled, tenant_id")
        .eq("mode", "managed");

      if (!isSuperAdmin && profile?.tenant_id) {
        query.eq("tenant_id", profile.tenant_id);
      }

      const { data, error } = await query;

      if (error) {
        accountsError = error.message;
      } else {
        managedAccounts = (data || []) as ManagedAccountRow[];
      }
    } catch (e) {
      accountsError = e instanceof Error ? e.message : "Unknown error";
    }

    // Check recent inbound emails (last 24 hours)
    let recentInbound: RecentInboundRow[] = [];
    let inboundError: string | null = null;

    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const query = supabase
        .from("email_messages")
        .select("id, from_address, to_addresses, subject, received_at, account_id, tenant_id")
        .eq("direction", "inbound")
        .gte("received_at", oneDayAgo)
        .order("received_at", { ascending: false })
        .limit(10);

      if (!isSuperAdmin && profile?.tenant_id) {
        query.eq("tenant_id", profile.tenant_id);
      }

      const { data, error } = await query;

      if (error) {
        inboundError = error.message;
      } else {
        recentInbound = (data || []) as RecentInboundRow[];
      }
    } catch (e) {
      inboundError = e instanceof Error ? e.message : "Unknown error";
    }

    // Build diagnostic report
    const diagnostics = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        tenant_id: profile?.tenant_id,
        is_super_admin: isSuperAdmin,
      },
      environment: {
        ...envCheck,
        webhook_url: `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host")}/api/email/inbound/webhook`,
      },
      managed_domains: {
        count: managedDomains.length,
        domains: managedDomains.map((d) => ({
          id: d.id,
          domain: d.domain,
          status: d.status,
          tenant_id: d.tenant_id,
          account_id: d.account_id,
          resend_domain_id: d.resend_domain_id,
          verified_at: d.verified_at,
          last_check_at: d.last_check_at,
          error_message: d.error_message,
          dns_records: d.dns_records,
        })),
        error: domainsError,
      },
      managed_accounts: {
        count: managedAccounts.length,
        accounts: managedAccounts,
        error: accountsError,
      },
      recent_inbound_emails: {
        count: recentInbound.length,
        emails: recentInbound,
        error: inboundError,
      },
      checklist: {
        has_resend_api_key: envCheck.RESEND_API_KEY,
        has_webhook_secret: envCheck.RESEND_WEBHOOK_SECRET || envCheck.INBOUND_WEBHOOK_SECRET,
        has_managed_domains: managedDomains.length > 0,
        has_verified_domain: managedDomains.some((d) => d.status === "verified"),
        has_managed_accounts: managedAccounts.length > 0,
        receiving_emails: recentInbound.length > 0,
      },
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (!envCheck.RESEND_API_KEY) {
      recommendations.push("Set RESEND_API_KEY environment variable");
    }

    if (!envCheck.RESEND_WEBHOOK_SECRET && !envCheck.INBOUND_WEBHOOK_SECRET) {
      recommendations.push(
        "Set RESEND_WEBHOOK_SECRET (from Resend dashboard) for webhook verification"
      );
    }

    if (managedDomains.length === 0) {
      recommendations.push(
        "Add a managed domain via the Email Domains page or API"
      );
    } else if (!managedDomains.some((d) => d.status === "verified")) {
      recommendations.push(
        "Verify your domain by adding the required DNS records (MX, SPF, DKIM)"
      );
    }

    if (managedAccounts.length === 0 && managedDomains.length > 0) {
      recommendations.push(
        "Create a managed email account linked to your domain"
      );
    }

    if (managedDomains.some((d) => d.status === "verified") && recentInbound.length === 0) {
      recommendations.push(
        "Domain is verified but no inbound emails received. Check: " +
        "1) Resend webhook is configured to POST to /api/email/inbound/webhook " +
        "2) email.received event is subscribed in Resend dashboard " +
        "3) MX record points to inbound-smtp.resend.com"
      );
    }

    return NextResponse.json({
      ...diagnostics,
      recommendations,
    });
  } catch (error) {
    console.error("Inbound debug error:", error);
    return NextResponse.json(
      { error: "Debug check failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
