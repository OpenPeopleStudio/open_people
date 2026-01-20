import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "API Reference — OpenPeople.ai",
  description:
    "Complete API documentation for OpenPeople.ai. REST endpoints, authentication, and integration guides.",
};

const API_SECTIONS = [
  {
    title: "Core APIs",
    description: "Essential endpoints for authentication, tenants, and user management",
    endpoints: [
      {
        method: "GET",
        path: "/api/profile",
        description: "Get current user profile and tenant info",
      },
      {
        method: "GET",
        path: "/api/tenants/domain-status",
        description: "Check if a tenant subdomain is ready",
      },
      {
        method: "GET",
        path: "/api/onboarding",
        description: "Get tenant onboarding status",
      },
      {
        method: "PATCH",
        path: "/api/onboarding",
        description: "Update onboarding progress",
      },
    ],
  },
  {
    title: "AI Workers",
    description: "Endpoints for AI Team members: Chief of Staff, Ops Worker, and more",
    endpoints: [
      {
        method: "POST",
        path: "/api/ai/plan/week",
        description: "Generate a weekly plan proposal",
      },
      {
        method: "POST",
        path: "/api/ops/ingest",
        description: "Parse decisions from text (meeting notes, emails)",
      },
      {
        method: "POST",
        path: "/api/ops/propose",
        description: "Generate task proposals from decisions",
      },
      {
        method: "POST",
        path: "/api/ops/commit",
        description: "Commit approved tasks to workflows",
      },
    ],
  },
  {
    title: "Email",
    description: "Manage email accounts, inbox, templates, and sending",
    endpoints: [
      {
        method: "GET",
        path: "/api/email/accounts",
        description: "List email accounts for tenant",
      },
      {
        method: "GET",
        path: "/api/email/inbox",
        description: "Fetch inbox messages",
      },
      {
        method: "POST",
        path: "/api/email/send",
        description: "Send an email",
      },
      {
        method: "GET",
        path: "/api/email/templates",
        description: "List email templates",
      },
    ],
  },
  {
    title: "Storage",
    description: "File storage with buckets, uploads, and downloads",
    endpoints: [
      {
        method: "GET",
        path: "/api/storage/buckets",
        description: "List storage buckets",
      },
      {
        method: "GET",
        path: "/api/storage/files",
        description: "List files in a bucket",
      },
      {
        method: "POST",
        path: "/api/storage/upload",
        description: "Get presigned upload URL",
      },
      {
        method: "GET",
        path: "/api/storage/download/[fileId]",
        description: "Download a file",
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-[#10B981]/10 text-[#10B981]",
  POST: "bg-[#3B82F6]/10 text-[#3B82F6]",
  PATCH: "bg-[#F59E0B]/10 text-[#F59E0B]",
  PUT: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
  DELETE: "bg-[#EF4444]/10 text-[#EF4444]",
};

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      {/* Navigation */}
      <NavBar />

      <main className="relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32">
        <div className="container">
          {/* Header */}
          <div className="max-w-3xl">
            <div className="inline-flex animate-fade-in">
              <span className="badge text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--electric-lime)] animate-pulse" />
                API Reference
              </span>
            </div>

            <h1 className="mt-6 sm:mt-8 text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-tight animate-slide-up">
              Build with our{" "}
              <span className="text-gradient-lime italic block sm:inline">REST API</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed animate-slide-up delay-100">
              Integrate OpenPeople.ai into your applications with our comprehensive REST API.
              Authentication via Supabase tokens, JSON responses, and straightforward patterns.
            </p>
          </div>

          {/* Quick info cards */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 animate-slide-up delay-200">
            <div className="glass-card p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Base URL
              </h3>
              <code className="mt-2 block text-sm text-[var(--electric-lime)] font-mono bg-[var(--surface-2)] px-3 py-2 rounded-lg overflow-x-auto">
                https://&#123;tenant&#125;.openpeople.ai/api
              </code>
            </div>
            <div className="glass-card p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Authentication
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Bearer token via Supabase Auth or session cookies for browser calls
              </p>
            </div>
            <div className="glass-card p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Response Format
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                JSON responses with <code className="text-[var(--electric-lime)]">error</code> field on failures
              </p>
            </div>
          </div>

          {/* Auth example */}
          <div className="mt-8 sm:mt-10 glass-card p-5 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">
              Authentication Example
            </h2>
            <div className="bg-[var(--surface-2)] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs sm:text-sm font-mono text-[var(--text-secondary)]">
                <code>{`# Using Bearer token (external clients)
curl -X GET "https://your-tenant.openpeople.ai/api/profile" \\
  -H "Authorization: Bearer <supabase_access_token>"

# Response
{
  "id": "user-uuid",
  "email": "user@example.com",
  "tenant_id": "tenant-uuid",
  "role": "owner"
}`}</code>
              </pre>
            </div>
          </div>

          {/* API sections */}
          <div className="mt-12 sm:mt-16 space-y-8 sm:space-y-10">
            {API_SECTIONS.map((section) => (
              <div key={section.title} className="glass-card p-5 sm:p-6 md:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                  {section.title}
                </h2>
                <p className="mt-1 sm:mt-2 text-sm text-[var(--text-secondary)]">
                  {section.description}
                </p>
                
                <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
                  {section.endpoints.map((endpoint) => (
                    <div
                      key={endpoint.path}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-[var(--surface-2)] rounded-lg"
                    >
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase w-fit ${
                          METHOD_COLORS[endpoint.method] || "bg-[var(--surface-3)] text-[var(--text-muted)]"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-xs sm:text-sm font-mono text-[var(--electric-lime)] flex-1">
                        {endpoint.path}
                      </code>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)] sm:text-right">
                        {endpoint.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rate limits & errors */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">
                Rate Limits
              </h2>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex justify-between">
                  <span>Starter plan</span>
                  <span className="text-[var(--text-muted)]">100 req/min</span>
                </li>
                <li className="flex justify-between">
                  <span>Pro plan</span>
                  <span className="text-[var(--text-muted)]">1,000 req/min</span>
                </li>
                <li className="flex justify-between">
                  <span>Enterprise</span>
                  <span className="text-[var(--text-muted)]">Custom</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Rate limit headers: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">
                Common Status Codes
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-[#10B981]">200</span>
                  <span className="text-[var(--text-muted)]">Success</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#F59E0B]">400</span>
                  <span className="text-[var(--text-muted)]">Bad Request</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#EF4444]">401</span>
                  <span className="text-[var(--text-muted)]">Unauthorized</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#EF4444]">403</span>
                  <span className="text-[var(--text-muted)]">Forbidden</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#EF4444]">429</span>
                  <span className="text-[var(--text-muted)]">Rate Limited</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Help CTA */}
          <div className="mt-12 sm:mt-16 glass-card p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-display text-[var(--text-primary)]">
              Need help integrating?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
              Our team can help you get set up. Check out the full documentation or reach out for support.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link href="/documentation" className="btn-primary w-full sm:w-auto justify-center">
                Full Documentation
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link href="/support" className="btn-secondary w-full sm:w-auto justify-center">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-8 sm:py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} OpenPeople.ai
          </p>
          <div className="flex items-center gap-5 sm:gap-4 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
