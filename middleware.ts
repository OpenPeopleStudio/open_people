import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/* ═══════════════════════════════════════════════════════════════════════════
   OpenPeople.ai Middleware
   
   Handles domain-based routing:
   - Marketing domains → (marketing) route group
   - Super admin domain → super-admin routes
   - Tenant domains → (platform) route group with tenant context
   ═══════════════════════════════════════════════════════════════════════════ */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";
const SUPER_ADMIN_DOMAIN = process.env.SUPER_ADMIN_DOMAIN || "app.openpeople.ai";

// Check if Supabase is configured
const SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Marketing domains that should NOT resolve to a tenant
const MARKETING_DOMAINS = new Set([
  "openpeople.ai",
  "www.openpeople.ai",
  "localhost",
]);

function normalizeHost(host: string | null): string {
  if (!host) return "";
  return host.replace(/:\d+$/, "").trim().toLowerCase();
}

function isMarketingDomain(host: string): boolean {
  const normalized = normalizeHost(host);
  return MARKETING_DOMAINS.has(normalized) || normalized === `www.${ROOT_DOMAIN}`;
}

function isSuperAdminDomain(host: string): boolean {
  const normalized = normalizeHost(host);
  return (
    normalized === SUPER_ADMIN_DOMAIN ||
    normalized === "super.localhost" ||
    normalized === "app.localhost"
  );
}

function extractSubdomain(host: string): string | null {
  const normalized = normalizeHost(host);
  
  // Check root domain
  if (ROOT_DOMAIN && normalized.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = normalized.replace(`.${ROOT_DOMAIN}`, "");
    if (subdomain === "www" || subdomain === "app" || subdomain === "super") {
      return null;
    }
    return subdomain;
  }
  
  // Local development
  if (normalized.endsWith(".localhost")) {
    const subdomain = normalized.split(".")[0];
    if (subdomain === "www" || subdomain === "app" || subdomain === "super") {
      return null;
    }
    return subdomain;
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Skip static files and API routes for domain detection
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files
  ) {
    // Only update session if Supabase is configured
    if (SUPABASE_CONFIGURED) {
      return updateSession(request);
    }
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Route Type Detection
  // ─────────────────────────────────────────────────────────────────────────

  // Get base response (with session update if Supabase configured)
  let response: NextResponse;
  if (SUPABASE_CONFIGURED) {
    response = await updateSession(request);
  } else {
    response = NextResponse.next({ request });
  }

  // Marketing domain - allow through to (marketing) routes
  if (isMarketingDomain(host)) {
    // Set header to indicate marketing mode
    response.headers.set("x-route-type", "marketing");
    return response;
  }

  // Super admin domain - allow through to super-admin routes
  if (isSuperAdminDomain(host)) {
    response.headers.set("x-route-type", "super-admin");
    
    // Redirect root to /super-admin
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tenant Domain Resolution
  // ─────────────────────────────────────────────────────────────────────────

  response.headers.set("x-route-type", "tenant");

  // Extract tenant slug from subdomain
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    response.headers.set("x-tenant-slug", subdomain);
  }

  // For custom domains, we'll resolve in the layout/page
  // The host is already available via headers
  response.headers.set("x-tenant-host", normalizeHost(host));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
