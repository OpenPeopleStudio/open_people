import type { NextConfig } from "next";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";
const SUPER_ADMIN_DOMAIN = process.env.SUPER_ADMIN_DOMAIN || "app.openpeople.ai";

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

const nextConfig: NextConfig = {
  // Handle redirects at the config level
  async redirects() {
    return [
      // Redirect super admin root to /super-admin
      {
        source: '/',
        destination: '/super-admin',
        permanent: false,
        has: [
          {
            type: 'host',
            value: SUPER_ADMIN_DOMAIN,
          },
        ],
      },
      {
        source: '/',
        destination: '/super-admin',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'app.localhost',
          },
        ],
      },
      {
        source: '/',
        destination: '/super-admin',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'super.localhost',
          },
        ],
      },
    ];
  },

  // Handle domain-based routing through headers
  async headers() {
    return [
      // Marketing domain headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'marketing',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'openpeople.ai',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'marketing',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'www.openpeople.ai',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'marketing',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'localhost',
          },
        ],
      },
      // Super admin domain headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'super-admin',
          },
        ],
        has: [
          {
            type: 'host',
            value: SUPER_ADMIN_DOMAIN,
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'super-admin',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'app.localhost',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'super-admin',
          },
        ],
        has: [
          {
            type: 'host',
            value: 'super.localhost',
          },
        ],
      },
      // Tenant domain headers (default)
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-route-type',
            value: 'tenant',
          },
        ],
        missing: [
          {
            type: 'host',
            value: 'openpeople.ai',
          },
          {
            type: 'host',
            value: 'www.openpeople.ai',
          },
          {
            type: 'host',
            value: 'localhost',
          },
          {
            type: 'host',
            value: SUPER_ADMIN_DOMAIN,
          },
          {
            type: 'host',
            value: 'app.localhost',
          },
          {
            type: 'host',
            value: 'super.localhost',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
