import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Override Cookie
   Used during onboarding when subdomain DNS is not yet ready.
   Cookie name: x-tenant-override
   Value: tenant slug (e.g., "acme")
   ═══════════════════════════════════════════════════════════════════════════ */

export const TENANT_OVERRIDE_COOKIE = "x-tenant-override";
export const TENANT_OVERRIDE_HEADER = "x-tenant-override";

export async function updateSession(request: NextRequest) {
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

  // Refresh session if expired
  await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────────────────────────
  // Tenant Override: propagate cookie value as header for server components
  // ─────────────────────────────────────────────────────────────────────────
  const tenantOverride = request.cookies.get(TENANT_OVERRIDE_COOKIE)?.value;
  if (tenantOverride) {
    supabaseResponse.headers.set(TENANT_OVERRIDE_HEADER, tenantOverride);
  }

  return supabaseResponse;
}
