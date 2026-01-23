import { createSupabaseServer } from "@/lib/supabase/server";
import { verifyDomain, checkDomainStatus, deleteDomain } from "@/lib/email/resend";
import { EMAIL_PLANS } from "@/types/email";
import { NextRequest, NextResponse } from "next/server";
import {
  notifyEmailDomainVerified,
  notifyEmailDomainVerificationFailed,
} from "@/lib/notifications/events";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Domains API
   GET /api/email/domains - List domains
   POST /api/email/domains - Add domain
   DELETE /api/email/domains - Remove domain
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  void request;
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

    const { data: domains, error } = await supabase
      .from("email_domains")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List domains error:", error);
      return NextResponse.json({ error: "Failed to list domains" }, { status: 500 });
    }

    // Check status for pending domains
    const domainsWithStatus = await Promise.all(
      (domains || []).map(async (domain) => {
        if (domain.status === "pending" && domain.resend_domain_id) {
          const status = await checkDomainStatus(domain.resend_domain_id);
          if (status.verified && domain.status !== "verified") {
            // Update to verified
            await supabase
              .from("email_domains")
              .update({
                status: "verified",
                verified_at: new Date().toISOString(),
                dns_records: status.records,
              })
              .eq("id", domain.id);

            // Send notification about domain verification
            notifyEmailDomainVerified(profile.tenant_id, domain.domain).catch((err) => {
              console.error("Failed to send domain verification notification:", err);
            });

            return { ...domain, status: "verified", dns_records: status.records };
          }
          return { ...domain, dns_records: status.records || domain.dns_records };
        }
        return domain;
      })
    );

    return NextResponse.json({ domains: domainsWithStatus });
  } catch (error) {
    console.error("List domains error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

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

    // Check domain limit
    const { data: subscription } = await supabase
      .from("email_subscriptions")
      .select("tier")
      .eq("tenant_id", profile.tenant_id)
      .single();

    const tier = subscription?.tier || "free";
    const plan = EMAIL_PLANS[tier as keyof typeof EMAIL_PLANS];

    if (plan.customDomains === 0) {
      return NextResponse.json(
        { error: "Custom domains are not available on the free plan. Upgrade to add domains." },
        { status: 403 }
      );
    }

    const { count: domainCount } = await supabase
      .from("email_domains")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    if ((domainCount || 0) >= plan.customDomains) {
      return NextResponse.json(
        { error: `Domain limit reached (${plan.customDomains}). Upgrade your plan.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Validate domain format
    const validDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!validDomain.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Add domain to Resend
    const result = await verifyDomain(domain);

    if (!result.success) {
      // Notify about verification failure
      notifyEmailDomainVerificationFailed(
        profile.tenant_id,
        domain,
        result.error || "Unknown error"
      ).catch((err) => {
        console.error("Failed to send domain verification failure notification:", err);
      });

      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Save domain to database
    const { data: domainRecord, error } = await supabase
      .from("email_domains")
      .insert({
        tenant_id: profile.tenant_id,
        domain,
        resend_domain_id: result.domainId,
        status: "pending",
        dns_records: result.dnsRecords,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This domain is already added" },
          { status: 409 }
        );
      }
      console.error("Add domain error:", error);
      return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
    }

    return NextResponse.json({
      domain: domainRecord,
      dnsRecords: result.dnsRecords,
    });
  } catch (error) {
    console.error("Add domain error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    // Get domain record
    const { data: domain } = await supabase
      .from("email_domains")
      .select("resend_domain_id")
      .eq("id", domainId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Delete from Resend
    if (domain.resend_domain_id) {
      await deleteDomain(domain.resend_domain_id);
    }

    // Delete from database
    const { error } = await supabase
      .from("email_domains")
      .delete()
      .eq("id", domainId)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete domain error:", error);
      return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete domain error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
