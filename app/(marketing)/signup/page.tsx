"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Self-Service Signup Page
   
   Multi-step flow:
   1. Select plan
   2. Enter business details
   3. Create account
   ═══════════════════════════════════════════════════════════════════════════ */

type Plan = "starter" | "pro" | "enterprise";

type FormData = {
  // Step 1: Plan
  plan: Plan;
  // Step 2: Business
  businessName: string;
  slug: string;
  // Step 3: Account
  email: string;
  password: string;
  fullName: string;
};

const plans: {
  id: Plan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    period: "/month",
    description: "Perfect for solo operators",
    features: [
      "1 storefront",
      "Up to 500 products",
      "AI inventory alerts",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    period: "/month",
    description: "For growing businesses",
    features: [
      "5 storefronts",
      "Unlimited products",
      "Full AI suite",
      "AI chat assistant",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large operations",
    features: [
      "Unlimited storefronts",
      "Custom AI training",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    plan: "pro",
    businessName: "",
    slug: "",
    email: "",
    password: "",
    fullName: "",
  });

  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from business name
  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug if not manually edited
      if (field === "businessName" && !slugTouched) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: formData.plan,
          businessName: formData.businessName,
          slug: formData.slug,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Redirect to the new tenant's onboarding
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        // Fallback: redirect to tenant subdomain
        const tenantUrl =
          process.env.NEXT_PUBLIC_ROOT_DOMAIN === "localhost"
            ? `http://${formData.slug}.localhost:3000/admin/onboarding`
            : `https://${formData.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "openpeople.ai"}/admin/onboarding`;
        window.location.href = tenantUrl;
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.plan !== "enterprise";
  const canProceedStep2 =
    formData.businessName.trim().length >= 2 &&
    formData.slug.trim().length >= 2;
  const canProceedStep3 =
    formData.email.includes("@") &&
    formData.password.length >= 8 &&
    formData.fullName.trim().length >= 2;

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
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[
              { num: 1, label: "Choose plan" },
              { num: 2, label: "Business details" },
              { num: 3, label: "Create account" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-4">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`flex items-center gap-3 ${
                    s.num > step ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step === s.num
                        ? "bg-[var(--electric-lime)] text-[var(--void)]"
                        : step > s.num
                        ? "bg-[var(--surface-2)] text-[var(--electric-lime)] border border-[var(--electric-lime)]"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {step > s.num ? (
                      <svg
                        className="w-5 h-5"
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
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      step === s.num
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < 2 && (
                  <div
                    className={`w-12 h-px ${
                      step > s.num
                        ? "bg-[var(--electric-lime)]"
                        : "bg-[var(--border-subtle)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="glass-card p-8 md:p-12">
            {/* Step 1: Choose Plan */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-display text-[var(--text-primary)] mb-3">
                    Choose your plan
                  </h1>
                  <p className="text-[var(--text-secondary)]">
                    Start with a 14-day free trial. No credit card required.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        if (plan.id !== "enterprise") {
                          updateField("plan", plan.id);
                        }
                      }}
                      disabled={plan.id === "enterprise"}
                      className={`relative p-6 rounded-xl text-left transition-all ${
                        formData.plan === plan.id
                          ? "bg-[var(--electric-lime)]/10 border-2 border-[var(--electric-lime)]"
                          : plan.id === "enterprise"
                          ? "bg-[var(--surface-1)] border border-[var(--border-subtle)] opacity-60 cursor-not-allowed"
                          : "bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)]/50"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--electric-lime)] text-[var(--void)] text-xs font-bold">
                          Most popular
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          {plan.price}
                        </span>
                        <span className="text-sm text-[var(--text-muted)]">
                          {plan.period}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        {plan.description}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                          >
                            <svg
                              className="w-4 h-4 text-[var(--electric-lime)]"
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
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.id === "enterprise" && (
                        <p className="mt-4 text-xs text-[var(--text-muted)]">
                          Contact sales for custom pricing
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
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
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-display text-[var(--text-primary)] mb-3">
                    Tell us about your business
                  </h1>
                  <p className="text-[var(--text-secondary)]">
                    This will be used to set up your storefront.
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) =>
                        updateField("businessName", e.target.value)
                      }
                      placeholder="e.g. StreetHeat Sneakers"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Store URL
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          updateField("slug", slugify(e.target.value));
                        }}
                        placeholder="your-store"
                        className="flex-1 px-4 py-3 rounded-l-xl bg-[var(--surface-1)] border border-r-0 border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                      />
                      <span className="px-4 py-3 rounded-r-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                        .openpeople.ai
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      You can add a custom domain later
                    </p>
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
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
                        d="M11 17l-5-5m0 0l5-5m-5 5h12"
                      />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
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
              </div>
            )}

            {/* Step 3: Create Account */}
            {step === 3 && (
              <div className="animate-fade-in">
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-display text-[var(--text-primary)] mb-3">
                    Create your account
                  </h1>
                  <p className="text-[var(--text-secondary)]">
                    You&apos;ll be the owner of{" "}
                    <span className="text-[var(--electric-lime)]">
                      {formData.businessName || "your store"}
                    </span>
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] transition-colors"
                    />
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Must be at least 8 characters
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
                      {error}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      Summary
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Plan
                        </span>
                        <span className="text-[var(--text-primary)] font-medium capitalize">
                          {formData.plan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Store
                        </span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {formData.slug}.openpeople.ai
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Trial
                        </span>
                        <span className="text-[var(--success)] font-medium">
                          14 days free
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <button onClick={() => setStep(2)} className="btn-secondary">
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
                        d="M11 17l-5-5m0 0l5-5m-5 5h12"
                      />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceedStep3 || loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Creating...
                      </>
                    ) : (
                      <>
                        Create account
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
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-[var(--text-muted)] mt-6">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-[var(--electric-lime)] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[var(--electric-lime)] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
