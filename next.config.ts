import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/cron/get-started/#vercel-cron-monitors
  automaticVercelMonitors: true,
});
