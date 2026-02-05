import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { generateManagedDNSRecords, type DNSRecord } from "@/types/email";
import { verifyDomain, checkDomainStatus } from "@/lib/email/resend";
import { NextRequest, NextResponse } from "next/server";

type ResendDomainRecord = {
  name: string;
  type: string;
  value?: string;
  status?: string;
  priority?: number;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Managed Email Domains API
   GET    /api/email/domains/managed         - List managed domains
   POST   /api/email/domains/managed         - Create managed domain (DNS-only setup)
   PUT    /api/email/domains/managed         - Update/verify managed domain
   DELETE /api/email/domains/managed         - Delete managed domain
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createSupabaseAdmin();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    const domainFilter = searchParams.get("domain");

    let query = adminSupabase.from("managed_email_domains").select("*");

    if (!isSuperAdmin && profile?.tenant_id) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (domainFilter) {
      query = query.eq("domain", domainFilter);
    }

    const { data: domains, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("List managed domains error:", error);
      return NextResponse.json({ error: "Failed to list domains" }, { status: 500 });
    }

    return NextResponse.json({ domains: domains || [] });
  } catch (error) {
    console.error("List managed domains error:", error);
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

    // Use admin client to bypass RLS for profile lookup
    const adminSupabase = await createSupabaseAdmin();

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 });
    }

    const isSuperAdmin = profile?.role === "super_admin";
    const body = await request.json();
    const { domain, account_id, tenant_id: requestedTenantId } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Determine tenant_id
    // Super admins can create platform-level domains with tenant_id = null
    let tenantId: string | null = profile?.tenant_id || null;
    if (isSuperAdmin) {
      tenantId = requestedTenantId !== undefined ? requestedTenantId : tenantId;
    }

    // Non-super-admins must have a tenant
    if (!isSuperAdmin && !tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Check if domain already exists (use admin client to see all domains including platform-level)
    const { data: existing } = await adminSupabase
      .from("managed_email_domains")
      .select("id")
      .eq("domain", domain)
      .single();

    if (existing) {
      // Return the existing domain so the caller can use it
      return NextResponse.json({ 
        error: "Domain already exists",
        domain: existing,
      }, { status: 409 });
    }

    // Try to add domain to Resend first - they provide the actual DNS records we need
    let resendDomainId: string | null = null;
    let dnsRecords: DNSRecord[] = [];
    
    try {
      const resendResult = await verifyDomain(domain);
      if (resendResult.success && resendResult.domainId) {
        resendDomainId = resendResult.domainId;
        
        // Use Resend's DNS records - they have the correct DKIM values
        if (resendResult.dnsRecords && resendResult.dnsRecords.length > 0) {
          dnsRecords = resendResult.dnsRecords.map((r) => {
            const priority = (r as { priority?: number }).priority;
            return {
              type: r.type as "TXT" | "MX" | "CNAME",
              name: r.name,
              value: r.value ?? "",
              ...(priority !== undefined ? { priority } : {}),
              status: "pending" as const,
              purpose: ((r as { purpose?: string }).purpose || "verification") as
                | "dkim"
                | "spf"
                | "mx"
                | "return-path"
                | "verification",
            };
          });
        }
      }
    } catch (resendError) {
      console.error("Failed to add domain to Resend:", resendError);
      // Continue with fallback records - user can retry later
    }

    // If Resend didn't provide records (error or no records), use our template as fallback
    if (dnsRecords.length === 0) {
      const dnsRecordsTemplate = generateManagedDNSRecords(domain);
      dnsRecords = dnsRecordsTemplate.map((r) => ({
        ...r,
        status: "pending" as const,
      }));
      console.log("[POST /api/email/domains/managed] Using fallback DNS template (Resend didn't return records)");
    }

    // Create the managed domain record (use admin client to bypass RLS)
    const { data: managedDomain, error } = await adminSupabase
      .from("managed_email_domains")
      .insert({
        tenant_id: tenantId,
        account_id: account_id || null,
        domain,
        status: "pending",
        dns_records: dnsRecords,
        resend_domain_id: resendDomainId,
      })
      .select()
      .single();

    if (error) {
      console.error("Create managed domain error:", error);
      return NextResponse.json({ error: "Failed to create domain" }, { status: 500 });
    }

    return NextResponse.json({
      domain: managedDomain,
      message: "Domain created. Please add the DNS records shown below to verify your domain.",
    });
  } catch (error) {
    console.error("Create managed domain error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    // Get the domain
    let query = supabase.from("managed_email_domains").select("*").eq("id", id);
    if (!isSuperAdmin && profile?.tenant_id) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    const { data: domain, error: fetchError } = await query.single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Handle refresh action - re-fetch DNS records from Resend
    if (action === "refresh") {
      if (!domain.resend_domain_id) {
        return NextResponse.json({ error: "Domain not registered with Resend" }, { status: 400 });
      }

      try {
        const resendStatus = await checkDomainStatus(domain.resend_domain_id);
        
        if (resendStatus.records && resendStatus.records.length > 0) {
          // Map Resend records to our format with purposes
          const refreshedRecords: DNSRecord[] = (resendStatus.records as ResendDomainRecord[]).map((r) => {
            let purpose = "verification";
            const name = r.name.toLowerCase();
            if (name.includes("_domainkey")) {
              purpose = "dkim";
            } else if (name.includes("_dmarc")) {
              purpose = "verification";
            } else if (r.type === "MX") {
              purpose = "mx";
            } else if (r.type === "TXT" && r.value?.includes("spf")) {
              purpose = "spf";
            } else if (name.includes("bounce") || name.includes("mail")) {
              purpose = "return-path";
            }

            const priority = r.priority as number | undefined;
            return {
              type: r.type as "TXT" | "MX" | "CNAME",
              name: r.name,
              value: r.value ?? "",
              ...(priority !== undefined ? { priority } : {}),
              status: r.status === "verified" ? "verified" as const : "pending" as const,
              purpose: purpose as "dkim" | "spf" | "mx" | "return-path" | "verification",
            };
          });

          const { data: updatedDomain, error: updateError } = await supabase
            .from("managed_email_domains")
            .update({
              dns_records: refreshedRecords,
              last_check_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

          if (updateError) {
            console.error("Update domain error:", updateError);
            return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
          }

          return NextResponse.json({
            domain: updatedDomain,
            message: "DNS records refreshed from Resend",
          });
        }
      } catch (resendError) {
        console.error("Failed to refresh DNS records:", resendError);
        return NextResponse.json({ error: "Failed to refresh DNS records" }, { status: 500 });
      }
    }

    // Handle verify action
    if (action === "verify") {
      // Check domain verification status with Resend
      let verificationResult: { verified: boolean; records: ResendDomainRecord[] } = { verified: false, records: [] };
      
      if (domain.resend_domain_id) {
        try {
          const status = await checkDomainStatus(domain.resend_domain_id);
          verificationResult = {
            verified: status.verified,
            records: status.records || [],
          };
        } catch (resendError) {
          console.error("Failed to check domain status:", resendError);
        }
      }

      // Update DNS record statuses based on verification
      const updatedRecords = (domain.dns_records as DNSRecord[]).map((record) => {
        const resendRecord = verificationResult.records.find(
          (r) => r.type === record.type && r.name === record.name
        );
        return {
          ...record,
          status: resendRecord?.status === "verified" ? "verified" : record.status,
        };
      });

      const allVerified = updatedRecords.every((r) => r.status === "verified");
      const newStatus = allVerified ? "verified" : verificationResult.verified ? "verified" : "verifying";

      const { data: updatedDomain, error: updateError } = await supabase
        .from("managed_email_domains")
        .update({
          status: newStatus,
          dns_records: updatedRecords,
          verified_at: newStatus === "verified" ? new Date().toISOString() : null,
          last_check_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Update domain error:", updateError);
        return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
      }

      return NextResponse.json({
        domain: updatedDomain,
        verified: newStatus === "verified",
        message: newStatus === "verified" 
          ? "Domain verified successfully! You can now send and receive emails." 
          : "Verification in progress. Some DNS records are still pending.",
      });
    }

    // Handle account_id update
    if (body.account_id !== undefined) {
      const { data: updatedDomain, error: updateError } = await supabase
        .from("managed_email_domains")
        .update({ account_id: body.account_id })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Update domain error:", updateError);
        return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
      }

      return NextResponse.json({ domain: updatedDomain });
    }

    return NextResponse.json({ error: "No valid action specified" }, { status: 400 });
  } catch (error) {
    console.error("Update managed domain error:", error);
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    // Build delete query
    let query = supabase.from("managed_email_domains").delete().eq("id", id);
    if (!isSuperAdmin && profile?.tenant_id) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    const { error } = await query;

    if (error) {
      console.error("Delete managed domain error:", error);
      return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete managed domain error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
