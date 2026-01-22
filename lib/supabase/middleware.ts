import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { setTenantContext, setUserContext, setSessionContext } from "@/lib/observability/correlation";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Override Cookie
   Used during onboarding when subdomain DNS is not yet ready.
   Cookie name: x-tenant-override
   Value: tenant slug (e.g., "acme")
   ═══════════════════════════════════════════════════════════════════════════ */

export const TENANT_OVERRIDE_COOKIE = "x-tenant-override";
export const TENANT_OVERRIDE_HEADER = "x-tenant-override";

export interface SessionUpdateResult {
  response: NextResponse;
  user: User | null;
}

function normalizeHost(host: string | null): string {
  if (!host) return "";
  return host.replace(/:\d+$/, "").trim().toLowerCase();
}

async function resolveTenantId(
  supabase: ReturnType<typeof createServerClient>,
  host: string | null,
  tenantOverride: string | null
): Promise<string | null> {
  if (tenantOverride) {
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantOverride)
      .eq("status", "active")
      .single();
    if (data?.id) {
      return data.id;
    }
  }

  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return null;
  }

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai").toLowerCase();
  const superAdminDomain = (
    process.env.NEXT_PUBLIC_SUPER_ADMIN_DOMAIN ||
    process.env.SUPER_ADMIN_DOMAIN ||
    "app.openpeople.ai"
  ).toLowerCase();

  const marketingDomains = new Set([
    rootDomain,
    `www.${rootDomain}`,
    "localhost",
  ]);

  if (
    marketingDomains.has(normalizedHost) ||
    normalizedHost === superAdminDomain ||
    normalizedHost === "super.localhost" ||
    normalizedHost === "app.localhost"
  ) {
    return null;
  }

  let subdomain: string | null = null;
  if (normalizedHost.endsWith(".localhost")) {
    subdomain = normalizedHost.split(".")[0];
  } else if (rootDomain && normalizedHost.endsWith(`.${rootDomain}`)) {
    subdomain = normalizedHost.replace(`.${rootDomain}`, "");
  }

  if (subdomain && ["www", "localhost", "super", "app"].includes(subdomain)) {
    subdomain = null;
  }

  if (subdomain) {
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", subdomain)
      .eq("status", "active")
      .single();
    if (data?.id) {
      return data.id;
    }
  }

  const { data: domainData } = await supabase
    .from("tenant_domains")
    .select("tenant_id, verified_at")
    .eq("domain", normalizedHost)
    .single();

  if (domainData?.tenant_id && domainData.verified_at) {
    return domainData.tenant_id;
  }

  return null;
}

export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired and get user
  const { data: { user }, error } = await supabase.auth.getUser();

  // Set user context for logging
  if (user) {
    setUserContext(user.id);
  }

  // Extract tenant from subdomain or override cookie
  let tenantId: string | null = null;

  // Check for tenant override cookie (used during onboarding)
  const tenantOverride = request.cookies.get(TENANT_OVERRIDE_COOKIE)?.value ?? null;
  if (tenantOverride) {
    supabaseResponse.headers.set(TENANT_OVERRIDE_HEADER, tenantOverride);
  }

  const host = request.headers.get("host");
  tenantId = await resolveTenantId(supabase, host, tenantOverride);

  // Set tenant context for logging
  if (tenantId) {
    setTenantContext(tenantId);
  }

  // Extract session ID if available (for vault sessions)
  const vaultSessionId = request.headers.get('x-vault-session');
  if (vaultSessionId) {
    setSessionContext(vaultSessionId);
  }

  return {
    response: supabaseResponse,
    user: error ? null : user,
  };
}
