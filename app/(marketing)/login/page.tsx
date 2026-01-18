"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════════
   Login Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Fetch user's tenant to redirect appropriately
        const { data: profile } = await supabase
          .from("709_profiles")
          .select("tenant_id, tenants(slug)")
          .eq("id", data.user.id)
          .single();

        if (profile?.tenants) {
          const tenant = profile.tenants as { slug: string };
          const ROOT_DOMAIN =
            process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai";
          const protocol =
            process.env.NODE_ENV === "production" ? "https" : "http";
          const tenantDomain =
            ROOT_DOMAIN === "localhost"
              ? `${tenant.slug}.localhost:3000`
              : `${tenant.slug}.${ROOT_DOMAIN}`;

          window.location.href = `${protocol}://${tenantDomain}/admin`;
        } else {
          // No tenant found - redirect to signup
          router.push("/signup");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--void)] relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="glow-lime top-[-200px] left-[-200px] opacity-20" />
      <div className="glow-cyan bottom-[-200px] right-[-200px] opacity-15" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center transition-transform group-hover:scale-105">
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
            <span className="text-2xl font-semibold text-[var(--text-primary)]">
              OpenPeople<span className="text-[var(--electric-lime)]">.ai</span>
            </span>
          </Link>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          <h1 className="text-2xl font-display text-[var(--text-primary)] text-center mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[var(--electric-lime)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[var(--electric-lime)] hover:underline font-medium"
            >
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
