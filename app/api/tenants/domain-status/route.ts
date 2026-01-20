import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ROOT_DOMAIN } from "@/lib/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Domain Status API
   GET /api/tenants/domain-status?slug=acme
   
   Returns whether a tenant's subdomain is ready for use.
   Used during onboarding to know when to redirect to the tenant subdomain.
   
   Status values:
   - "ready": Subdomain is accessible (DNS propagated, or local dev)
   - "pending": Subdomain not yet reachable
   - "not_found": No tenant with this slug exists
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    // Check if tenant exists
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, slug, status")
      .eq("slug", slug)
      .single();

    if (error || !tenant) {
      return NextResponse.json({
        status: "not_found",
        slug,
        message: "No tenant found with this slug",
      });
    }

    if (tenant.status !== "active") {
      return NextResponse.json({
        status: "inactive",
        slug,
        message: "Tenant is not active",
      });
    }

    // In local development, subdomains are always "ready"
    // (Next.js dev server handles *.localhost automatically)
    const isLocalDev = ROOT_DOMAIN === "localhost" || ROOT_DOMAIN.includes("localhost");
    if (isLocalDev) {
      return NextResponse.json({
        status: "ready",
        slug,
        subdomain: `${slug}.localhost:3000`,
        message: "Local development - subdomain ready",
      });
    }

    // In production, check if the subdomain is reachable
    // We do a simple HEAD request to the subdomain to verify DNS
    const subdomain = `${slug}.${ROOT_DOMAIN}`;
    const protocol = "https";
    const checkUrl = `${protocol}://${subdomain}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(checkUrl, {
        method: "HEAD",
        signal: controller.signal,
        // Skip SSL verification issues for newly provisioned domains
        // @ts-expect-error - Node.js specific option
        rejectUnauthorized: false,
      });

      clearTimeout(timeoutId);

      // Any response (even 404) means DNS is working
      if (response.ok || response.status < 500) {
        return NextResponse.json({
          status: "ready",
          slug,
          subdomain,
          message: "Subdomain is accessible",
        });
      }

      return NextResponse.json({
        status: "pending",
        slug,
        subdomain,
        message: "Subdomain returned an error - may still be provisioning",
      });
    } catch (fetchError) {
      // Network error = DNS not ready or domain not accessible
      return NextResponse.json({
        status: "pending",
        slug,
        subdomain,
        message: "Subdomain not yet reachable - DNS may still be propagating",
      });
    }
  } catch (error) {
    console.error("Domain status check error:", error);
    return NextResponse.json(
      { error: "Failed to check domain status" },
      { status: 500 }
    );
  }
}
