import { headers } from "next/headers";
import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { TENANT_OVERRIDE_HEADER } from "@/lib/supabase/middleware";
import type { TenantContextValue, TenantSettings } from "@/types/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Domain Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_TENANT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "709exclusive";

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";

// Marketing domains - these render the public marketing site, not a tenant
export const MARKETING_DOMAINS = [
  "openpeople.ai",
  "www.openpeople.ai",
  "localhost",
  // Add any other marketing domains here
];

// Super admin domain - renders the platform admin dashboard
export const SUPER_ADMIN_DOMAIN =
  process.env.SUPER_ADMIN_DOMAIN || "app.openpeople.ai";

/* ═══════════════════════════════════════════════════════════════════════════
   Route Types
   ═══════════════════════════════════════════════════════════════════════════ */

export type RouteType = "marketing" | "super-admin" | "tenant";

export type RouteResolution = {
  type: RouteType;
  tenant: TenantContextValue | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Host Normalization
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Normalize a host string by removing port and converting to lowercase
 */
export function normalizeHost(host: string | null): string {
  if (!host) return "";
  return host.replace(/:\d+$/, "").trim().toLowerCase();
}

/**
 * Extract subdomain from host (e.g., "tenant.openpeople.ai" -> "tenant")
 */
export function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Check against root domain
  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");
    // Ignore www subdomain
    if (subdomain === "www") return null;
    return subdomain;
  }

  // Local development: tenant.localhost
  if (host.endsWith(".localhost")) {
    const subdomain = host.split(".")[0];
    if (subdomain === "www") return null;
    return subdomain;
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Domain Type Detection
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Check if a host is a marketing domain
 */
export function isMarketingDomain(host: string): boolean {
  const normalized = normalizeHost(host);

  // Exact match against marketing domains
  if (MARKETING_DOMAINS.includes(normalized)) {
    return true;
  }

  // Check for www variant of root domain
  if (normalized === `www.${ROOT_DOMAIN}`) {
    return true;
  }

  return false;
}

/**
 * Check if a host is the super admin domain
 */
export function isSuperAdminDomain(host: string): boolean {
  const normalized = normalizeHost(host);
  return (
    normalized === SUPER_ADMIN_DOMAIN ||
    normalized === "super.localhost" ||
    normalized === "app.localhost"
  );
}

/**
 * Determine the route type from a host
 */
export function getRouteType(host?: string | null): RouteType {
  if (!host || normalizeHost(host) === "") return "marketing";
  if (isMarketingDomain(host)) return "marketing";
  if (isSuperAdminDomain(host)) return "super-admin";
  return "tenant";
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Fetching (Database)
   ═══════════════════════════════════════════════════════════════════════════ */

function toTenantContext(tenant: {
  id: string;
  slug: string;
  name: string;
  primary_domain: string | null;
  settings: TenantSettings | null;
  status: string;
}): TenantContextValue {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    primary_domain: tenant.primary_domain,
    settings: (tenant.settings ?? {}) as TenantSettings,
    status: tenant.status as "active" | "inactive" | "suspended",
  };
}

/**
 * Fetch tenant by ID
 */
async function fetchTenantById(
  tenantId: string
): Promise<TenantContextValue | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, primary_domain, settings, status")
    .eq("id", tenantId)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return toTenantContext(data);
}

/**
 * Fetch tenant by slug (cached)
 */
export const fetchTenantBySlug = cache(
  async (slug: string): Promise<TenantContextValue | null> => {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug, name, primary_domain, settings, status")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !data) return null;
    return toTenantContext(data);
  }
);

/**
 * Fetch tenant by custom domain (cached)
 */
export const fetchTenantByDomain = cache(
  async (
    domain: string,
    requireVerified = true
  ): Promise<TenantContextValue | null> => {
    const supabase = await createSupabaseServer();

    let query = supabase
      .from("tenant_domains")
      .select("tenant_id, verified_at")
      .eq("domain", domain);

    if (requireVerified) {
      query = query.not("verified_at", "is", null);
    }

    const { data, error } = await query.single();
    if (error || !data?.tenant_id) return null;

    if (requireVerified && !data.verified_at) return null;

    return fetchTenantById(data.tenant_id);
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   Main Tenant Resolution
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Resolve tenant from a host string
 * Returns null for marketing domains (no tenant context needed)
 */
export async function resolveTenantByHost(
  rawHost: string
): Promise<TenantContextValue | null> {
  const host = normalizeHost(rawHost);

  // Marketing site - no tenant context
  if (isMarketingDomain(host)) {
    return null;
  }

  // Super admin - no tenant context (uses cross-tenant access)
  if (isSuperAdminDomain(host)) {
    return null;
  }

  // 1. Check verified custom domains first (highest priority)
  const domainMatch = await fetchTenantByDomain(host, true);
  if (domainMatch) return domainMatch;

  // 2. Check primary_domain field (backwards compatibility)
  const supabase = await createSupabaseServer();
  const { data: primaryMatch } = await supabase
    .from("tenants")
    .select("id, slug, name, primary_domain, settings, status")
    .eq("primary_domain", host)
    .eq("status", "active")
    .single();

  if (primaryMatch) return toTenantContext(primaryMatch);

  // 3. Check subdomain routing (e.g., tenant.openpeople.ai)
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const slugMatch = await fetchTenantBySlug(subdomain);
    if (slugMatch) return slugMatch;
  }

  // 4. Fallback to default tenant
  return fetchTenantBySlug(DEFAULT_TENANT_SLUG);
}

/**
 * Full route resolution - determines type AND tenant
 */
export async function resolveRoute(rawHost: string): Promise<RouteResolution> {
  const host = normalizeHost(rawHost);
  const type = getRouteType(host);

  if (type === "marketing" || type === "super-admin") {
    return { type, tenant: null };
  }

  const tenant = await resolveTenantByHost(host);
  return { type: "tenant", tenant };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Request Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

type HeaderSource = Pick<Headers, "get">;

/**
 * Get tenant from headers (for Server Components)
 * 
 * Resolution order:
 * 1. x-tenant-override header (set by middleware from cookie during onboarding)
 * 2. Host-based resolution (subdomain, custom domain, etc.)
 */
export const getTenantFromHeaders = cache(
  async (headerStore: HeaderSource): Promise<TenantContextValue | null> => {
    // Check for tenant override (used during onboarding before subdomain is ready)
    const tenantOverride = headerStore.get(TENANT_OVERRIDE_HEADER);
    if (tenantOverride) {
      const overrideTenant = await fetchTenantBySlug(tenantOverride);
      if (overrideTenant) {
        return overrideTenant;
      }
    }

    // Standard host-based resolution
    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      headerStore.get("x-tenant-host") || // Fallback to middleware-set header if present
      "";
    return resolveTenantByHost(host);
  }
);

/**
 * Get tenant for the current authenticated user
 */
export async function getTenantForUser(userId: string): Promise<TenantContextValue | null> {
  const supabase = await createSupabaseServer();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  
  if (!profile?.tenant_id) return null;
  
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, primary_domain, settings, status")
    .eq("id", profile.tenant_id)
    .eq("status", "active")
    .single();
  
  if (!tenant) return null;
  return toTenantContext(tenant);
}

/**
 * Get route resolution from headers (for Server Components)
 */
export const getRouteFromHeaders = cache(
  async (headerStore: HeaderSource): Promise<RouteResolution> => {
    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      headerStore.get("x-tenant-host") || // Fallback to middleware-set header if present
      "";
    return resolveRoute(host);
  }
);

/**
 * Get tenant from request (for API routes and middleware)
 */
export async function getTenantFromRequest(
  request?: Request
): Promise<TenantContextValue | null> {
  if (request) {
    return getTenantFromHeaders(request.headers);
  }
  const headerStore = await headers();
  return getTenantFromHeaders(headerStore);
}

/**
 * Get route from request (for API routes and middleware)
 */
export async function getRouteFromRequest(
  request?: Request
): Promise<RouteResolution> {
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    return resolveRoute(host);
  }
  const headerStore = await headers();
  return getRouteFromHeaders(headerStore);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utility Exports
   ═══════════════════════════════════════════════════════════════════════════ */

export function getTenantUrl(
  tenant: { slug: string; primary_domain?: string | null },
  protocol = "https"
): string {
  if (tenant.primary_domain) {
    return `${protocol}://${tenant.primary_domain}`;
  }
  if (ROOT_DOMAIN) {
    return `${protocol}://${tenant.slug}.${ROOT_DOMAIN}`;
  }
  return `${protocol}://${tenant.slug}.localhost:3000`;
}
