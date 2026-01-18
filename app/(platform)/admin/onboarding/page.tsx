"use client";

import { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Onboarding Page
   
   Guides new tenant owners through initial setup:
   1. Welcome & overview
   2. Add first products
   3. Configure payments
   4. Customize branding
   ═══════════════════════════════════════════════════════════════════════════ */

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  icon: string;
  completed: boolean;
};

export default function OnboardingPage() {
  const tenant = useTenant();
  const brandName = tenant.settings.theme?.brand_name || tenant.name;

  const [steps] = useState<OnboardingStep[]>([
    {
      id: "products",
      title: "Add your first products",
      description:
        "Import existing inventory or add products manually. Our AI will help categorize and optimize listings.",
      action: "Add products",
      href: "/admin/products/new",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      completed: false,
    },
    {
      id: "payments",
      title: "Set up payments",
      description:
        "Connect Stripe to accept card payments. You can also enable crypto payments later.",
      action: "Connect Stripe",
      href: "/admin/settings/payments",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      completed: false,
    },
    {
      id: "branding",
      title: "Customize your brand",
      description:
        "Upload your logo, set colors, and customize your storefront to match your brand identity.",
      action: "Customize",
      href: "/admin/settings/branding",
      icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
      completed: false,
    },
    {
      id: "domain",
      title: "Add custom domain (optional)",
      description:
        "Connect your own domain for a fully branded experience. We handle SSL automatically.",
      action: "Add domain",
      href: "/admin/settings/domain",
      icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
      completed: false,
    },
  ]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--void)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--electric-lime)] flex items-center justify-center">
              <span className="text-[var(--void)] font-bold text-sm">
                {brandName.charAt(0)}
              </span>
            </div>
            <span className="font-semibold text-[var(--text-primary)]">
              {brandName}
            </span>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Skip to dashboard →
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Welcome */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--electric-lime)]/10 border border-[var(--electric-lime)]/20 mb-6">
            <svg
              className="w-5 h-5 text-[var(--electric-lime)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span className="text-sm font-medium text-[var(--electric-lime)]">
              Welcome to OpenPeople.ai
            </span>
          </div>

          <h1 className="text-4xl font-display text-[var(--text-primary)] mb-4">
            Let&apos;s set up{" "}
            <span className="text-gradient-lime">{brandName}</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Complete these steps to get your store ready. You can always come
            back and finish later.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">
              Setup progress
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {completedCount} of {steps.length} completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--electric-lime)] to-[var(--electric-cyan)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative p-6 rounded-xl border transition-all ${
                step.completed
                  ? "bg-[var(--surface-1)] border-[var(--success)]/30"
                  : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--electric-lime)]/50"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step number / check */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    step.completed
                      ? "bg-[var(--success)] text-[var(--void)]"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                  }`}
                >
                  {step.completed ? (
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
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                    <Link
                      href={step.href}
                      className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        step.completed
                          ? "bg-[var(--surface-2)] text-[var(--text-muted)]"
                          : "bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-90"
                      }`}
                    >
                      {step.completed ? "Edit" : step.action}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Icon decoration */}
              <div className="absolute top-6 right-6 opacity-5">
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={0.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={step.icon}
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* AI Assistant hint */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[var(--electric-lime)]/5 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-[var(--void)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                Need help? Ask the AI assistant
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Your AI assistant can help you import products, set up payments,
                and answer any questions about your store.
              </p>
              <button className="mt-3 text-sm font-medium text-[var(--electric-lime)] hover:underline">
                Open AI assistant →
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/admin"
            className="btn-primary inline-flex"
          >
            Go to dashboard
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
        </div>
      </main>
    </div>
  );
}
