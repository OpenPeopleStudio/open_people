"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Onboarding Pending Page
   
   Shows while a new tenant's subdomain is being provisioned.
   Polls /api/tenants/domain-status to check when subdomain is ready.
   
   Query params:
   - slug: tenant slug (required)
   - name: business name (optional, for display)
   ═══════════════════════════════════════════════════════════════════════════ */

type DomainStatus = "ready" | "pending" | "not_found" | "inactive" | "error";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";
const isLocalDev = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname.includes("localhost"));

function OnboardingPendingContent() {
  const searchParams = useSearchParams();

  const slug = searchParams.get("slug") || "";
  const businessName = searchParams.get("name") || slug || "Your workspace";

  const [status, setStatus] = useState<DomainStatus>("pending");
  const [checkCount, setCheckCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Build the target subdomain URL
  const getSubdomainUrl = useCallback(() => {
    if (isLocalDev) {
      return `http://${slug}.localhost:3000/admin/onboarding`;
    }
    return `https://${slug}.${ROOT_DOMAIN}/admin/onboarding`;
  }, [slug]);

  // Check domain status
  const checkDomainStatus = useCallback(async () => {
    if (!slug) {
      setError("Missing workspace slug");
      return;
    }

    try {
      const res = await fetch(`/api/tenants/domain-status?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (data.status === "ready") {
        setStatus("ready");
        // Auto-redirect after a short delay
        setTimeout(() => {
          window.location.href = getSubdomainUrl();
        }, 1500);
      } else if (data.status === "not_found") {
        setStatus("not_found");
        setError("Workspace not found. Please check your signup was successful.");
      } else if (data.status === "inactive") {
        setStatus("inactive");
        setError("This workspace has been deactivated.");
      } else {
        setStatus("pending");
      }

      setCheckCount((prev) => prev + 1);
    } catch (err) {
      console.error("Domain status check failed:", err);
      setStatus("error");
      setCheckCount((prev) => prev + 1);
    }
  }, [slug, getSubdomainUrl]);

  // Poll for domain status
  useEffect(() => {
    if (!slug) return;

    // Initial check
    const initialCheck = setTimeout(() => {
      void checkDomainStatus();
    }, 0);

    // Poll every 3 seconds while pending
    const interval = setInterval(() => {
      if (status === "pending" || status === "error") {
        void checkDomainStatus();
      }
    }, 3000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [slug, status, checkDomainStatus]);

  // Set tenant override cookie and continue to app domain
  const handleContinueOnAppDomain = () => {
    // Set the tenant override cookie (expires in 1 hour)
    document.cookie = `x-tenant-override=${slug}; path=/; max-age=3600; SameSite=Lax`;
    
    // Navigate to onboarding on the current (marketing) domain
    // The middleware will read the cookie and set the header
    if (isLocalDev) {
      window.location.href = "http://localhost:3000/admin/onboarding";
    } else {
      window.location.href = `https://${ROOT_DOMAIN}/admin/onboarding`;
    }
  };

  // Redirect to subdomain manually
  const handleGoToSubdomain = () => {
    window.location.href = getSubdomainUrl();
  };

  if (!slug) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Missing workspace information
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            We couldn&apos;t find your workspace details. Please try signing up again.
          </p>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2"
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] right-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] left-[-200px] opacity-15" />

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center transition-transform group-hover:scale-105">
              <svg
                className="w-5 h-5 text-[var(--void)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-[var(--text-primary)]">
              OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Status indicator */}
          {status === "ready" ? (
            <>
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[var(--electric-lime)]/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[var(--electric-lime)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-display text-[var(--text-primary)] mb-4">
                Your workspace is ready!
              </h1>
              <p className="text-[var(--text-secondary)] mb-8">
                Redirecting you to <span className="font-mono text-[var(--electric-lime)]">{slug}.{isLocalDev ? "localhost:3000" : ROOT_DOMAIN}</span>...
              </p>
              <button
                onClick={handleGoToSubdomain}
                className="btn-primary inline-flex items-center gap-2"
              >
                Go to workspace
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
              </button>
            </>
          ) : status === "not_found" || status === "inactive" ? (
            <>
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-display text-[var(--text-primary)] mb-4">
                Something went wrong
              </h1>
              <p className="text-[var(--text-secondary)] mb-8">
                {error || "We couldn't find your workspace."}
              </p>
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center gap-2"
              >
                Try signing up again
              </Link>
            </>
          ) : (
            <>
              {/* Animated loading indicator */}
              <div className="w-20 h-20 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-[var(--surface-2)]" />
                <div className="absolute inset-0 rounded-full border-4 border-[var(--electric-lime)] border-t-transparent animate-spin" />
              </div>

              <h1 className="text-3xl font-display text-[var(--text-primary)] mb-4">
                Setting up {businessName}
              </h1>
              <p className="text-[var(--text-secondary)] mb-2">
                We&apos;re preparing your workspace at{" "}
                <span className="font-mono text-[var(--electric-lime)]">
                  {slug}.{isLocalDev ? "localhost:3000" : ROOT_DOMAIN}
                </span>
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-8">
                This usually takes just a few seconds...
              </p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[var(--electric-lime)]"
                    style={{
                      animation: "pulse 1.5s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                      opacity: 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Show "Continue anyway" option after a few checks */}
              {checkCount >= 3 && (
                <div className="glass-card p-6 text-left">
                  <h3 className="font-medium text-[var(--text-primary)] mb-2">
                    Taking longer than expected?
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    DNS propagation can sometimes take a few minutes. You can start
                    using your workspace immediately while we finish setting up your
                    custom URL.
                  </p>
                  <button
                    onClick={handleContinueOnAppDomain}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    Continue to onboarding
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
                  </button>
                </div>
              )}

              {/* Check count indicator (subtle) */}
              {checkCount > 0 && checkCount < 3 && (
                <p className="text-xs text-[var(--text-muted)]">
                  Checking... ({checkCount})
                </p>
              )}
            </>
          )}
        </div>
      </main>

      {/* Pulse animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
      <div className="w-12 h-12 relative">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--surface-2)]" />
        <div className="absolute inset-0 rounded-full border-4 border-[var(--electric-lime)] border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

export default function OnboardingPendingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingPendingContent />
    </Suspense>
  );
}
