"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Create New Tenant Page
   Admin-side tenant creation form
   ═══════════════════════════════════════════════════════════════════════════ */

type FormData = {
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "suspended";
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  features: {
    ai_inventory: boolean;
    ai_chat: boolean;
    ai_analytics: boolean;
  };
};

const plans = [
  { id: "free", name: "Free", price: "$0", description: "Basic features" },
  {
    id: "starter",
    name: "Starter",
    price: "$99/mo",
    description: "Core AI tools",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199/mo",
    description: "Full AI toolkit",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Custom solutions",
  },
];

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    plan: "starter",
    status: "active",
    ownerEmail: "",
    ownerName: "",
    ownerPassword: "",
    features: {
      ai_inventory: true,
      ai_chat: false,
      ai_analytics: false,
    },
  });

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !slugTouched) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  };

  const updateFeature = (feature: keyof FormData["features"], value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create tenant");
        return;
      }

      router.push(`/super-admin/tenants/${data.tenant.id}`);
    } catch (err) {
      console.error("Error creating tenant:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    formData.name.trim().length >= 2 &&
    formData.slug.trim().length >= 2 &&
    formData.ownerEmail.includes("@") &&
    formData.ownerPassword.length >= 8 &&
    formData.ownerName.trim().length >= 2;

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link
          href="/super-admin/tenants"
          className="hover:text-[var(--text-primary)]"
        >
          Tenants
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="text-[var(--text-primary)]">Create New Tenant</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Create New Tenant
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Set up a new organization on the platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tenant Details */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Tenant Details
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                URL Slug *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateField("slug", slugify(e.target.value));
                  }}
                  placeholder="acme-corp"
                  className="flex-1 px-4 py-2.5 rounded-l-lg bg-[var(--surface-2)] border border-r-0 border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  required
                />
                <span className="px-3 py-2.5 rounded-r-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  .openpeople.ai
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Plan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() =>
                      updateField("plan", plan.id as FormData["plan"])
                    }
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.plan === plan.id
                        ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/10"
                        : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]"
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {plan.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {plan.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  updateField("status", e.target.value as FormData["status"])
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner Account */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Owner Account
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => updateField("ownerName", e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => updateField("ownerEmail", e.target.value)}
                placeholder="owner@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => updateField("ownerPassword", e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                required
                minLength={8}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                The owner will receive an email to verify their account
              </p>
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            AI Features
          </h2>

          <div className="space-y-4">
            {[
              {
                key: "ai_inventory" as const,
                label: "AI Inventory Intelligence",
                description:
                  "Predictive stock management, restock alerts, and pricing optimization",
              },
              {
                key: "ai_chat" as const,
                label: "AI Chat Assistant",
                description:
                  "24/7 customer support chatbot with product knowledge",
              },
              {
                key: "ai_analytics" as const,
                label: "AI Analytics",
                description:
                  "Demand forecasting, trend detection, and customer insights",
              },
            ].map((feature) => (
              <label
                key={feature.key}
                className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--surface-3)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.features[feature.key]}
                  onChange={(e) => updateFeature(feature.key, e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)] focus:ring-offset-0 bg-[var(--surface-3)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {feature.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/super-admin/tenants"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← Back to tenants
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/super-admin/tenants" className="btn-secondary text-sm">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Tenant
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
