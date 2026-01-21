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
  const tenantOverride = request.cookies.get(TENANT_OVERRIDE_COOKIE)?.value;
  if (tenantOverride) {
    supabaseResponse.headers.set(TENANT_OVERRIDE_HEADER, tenantOverride);
    // TODO: Look up tenant ID by slug
    // tenantId = await getTenantIdBySlug(tenantOverride);
  }

  // Extract tenant from subdomain (format: tenant-slug.localhost:3000)
  const hostname = request.headers.get('host') || '';
  if (hostname.includes('.')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'super') {
      // TODO: Look up tenant ID by subdomain
      // tenantId = await getTenantIdBySubdomain(subdomain);
    }
  }

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
