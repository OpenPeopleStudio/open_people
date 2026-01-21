"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import type {
  TenantOnboarding,
  OnboardingUpdateRequest,
  BusinessStage,
  CompanySize,
  OfferingsType,
  GeographicFocus,
  AIComfortLevel,
  CustomerSegment,
  SuccessMetric,
} from "@/types/onboarding";
import {
  INDUSTRY_OPTIONS,
  BUSINESS_STAGE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  OFFERINGS_TYPE_OPTIONS,
  GEOGRAPHIC_FOCUS_OPTIONS,
  AI_COMFORT_OPTIONS,
  GOAL_SUGGESTIONS,
  PAIN_POINT_SUGGESTIONS,
  AI_USE_CASE_SUGGESTIONS,
  TOOL_SUGGESTIONS,
  BUDGET_OPTIONS,
  REFERRAL_OPTIONS,
  ONBOARDING_STEPS,
} from "@/types/onboarding";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Onboarding Wizard
   
   Multi-step intake flow to understand the customer's business goals.
   Data is auto-saved after each step. Users can skip at any time.
   ═══════════════════════════════════════════════════════════════════════════ */

type FormData = Partial<TenantOnboarding>;

export default function OnboardingPage() {
  const tenant = useTenant();
  const router = useRouter();
  const brandName = tenant.settings.theme?.brand_name || tenant.name;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    status: "not_started",
    current_step: 1,
    industry: null,
    industry_other: null,
    business_stage: null,
    company_size: null,
    offerings_description: null,
    offerings_type: null,
    primary_value_prop: null,
    target_audience: null,
    customer_segments: [],
    geographic_focus: null,
    primary_goals: [],
    success_metrics: [],
    timeline: null,
    pain_points: [],
    biggest_challenge: null,
    current_tools: [],
    data_sources: [],
    integration_needs: null,
    ai_use_cases: [],
    automation_priorities: [],
    ai_comfort_level: null,
    budget_range: null,
    team_involvement: null,
    decision_timeline: null,
    how_did_you_hear: null,
    additional_notes: null,
  });

  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((currentStep - 1) / totalSteps) * 100;

  // Load existing onboarding data
  useEffect(() => {
    async function loadOnboarding() {
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.onboarding) {
            setFormData(data.onboarding);
            setCurrentStep(data.onboarding.current_step || 1);
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding:", error);
      } finally {
        setLoading(false);
      }
    }
    loadOnboarding();
  }, []);

  // Auto-save function
  const saveProgress = useCallback(async (updates: OnboardingUpdateRequest) => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          status: updates.status || "in_progress",
        }),
      });
      if (!res.ok) {
        console.error("Failed to save onboarding");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  }, []);

  // Update field and optionally save
  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle item in array field
  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    updateField(field, newArray);
  };

  // Navigate to next step
  const handleNext = async () => {
    const nextStep = Math.min(currentStep + 1, totalSteps);
    await saveProgress({ ...formData, current_step: nextStep });
    setCurrentStep(nextStep);
    window.scrollTo(0, 0);
  };

  // Navigate to previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // Complete onboarding
  const handleComplete = async () => {
    await saveProgress({
      ...formData,
      status: "completed",
      completed_at: new Date().toISOString(),
      current_step: totalSteps,
    });
    router.push("/admin");
  };

  // Skip onboarding
  const handleSkip = async () => {
    await saveProgress({
      ...formData,
      status: "skipped",
      current_step: currentStep,
    });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--void)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--void)]/95 backdrop-blur-sm z-10">
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
          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs text-[var(--text-muted)]">Saving...</span>
            )}
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Skip for now
            </button>
            <Link
              href="/admin"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--surface-2)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--electric-lime)] to-[var(--electric-cyan)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {ONBOARDING_STEPS[currentStep - 1]?.title}
            </span>
          </div>
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  saveProgress({ ...formData, current_step: step.id });
                  setCurrentStep(step.id);
                }}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step.id <= currentStep
                    ? "bg-[var(--electric-lime)]"
                    : "bg-[var(--surface-2)]"
                }`}
                title={step.title}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="space-y-8">
          {/* Step 1: Business Basics */}
          {currentStep === 1 && (
            <StepContainer
              title="Tell us about your business"
              description="This helps us personalize your experience and provide relevant suggestions."
            >
              <FormField label="What industry are you in?">
                <select
                  value={formData.industry || ""}
                  onChange={(e) => updateField("industry", e.target.value || null)}
                  className="form-select"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.industry === "other" && (
                  <input
                    type="text"
                    placeholder="Please specify your industry"
                    value={formData.industry_other || ""}
                    onChange={(e) => updateField("industry_other", e.target.value)}
                    className="form-input mt-2"
                  />
                )}
              </FormField>

              <FormField label="What stage is your business at?">
                <div className="grid gap-2">
                  {BUSINESS_STAGE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.business_stage === opt.value
                          ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                          : "border-[var(--border-subtle)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="business_stage"
                        value={opt.value}
                        checked={formData.business_stage === opt.value}
                        onChange={(e) =>
                          updateField("business_stage", e.target.value as BusinessStage)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.business_stage === opt.value
                            ? "border-[var(--electric-lime)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {formData.business_stage === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {opt.label}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField label="How many people work at your company?">
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("company_size", opt.value as CompanySize)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.company_size === opt.value
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>
            </StepContainer>
          )}

          {/* Step 2: Offerings */}
          {currentStep === 2 && (
            <StepContainer
              title="What do you offer?"
              description="Help us understand your products or services."
            >
              <FormField label="What type of offerings do you have?">
                <div className="grid gap-2">
                  {OFFERINGS_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.offerings_type === opt.value
                          ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                          : "border-[var(--border-subtle)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="offerings_type"
                        value={opt.value}
                        checked={formData.offerings_type === opt.value}
                        onChange={(e) =>
                          updateField("offerings_type", e.target.value as OfferingsType)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.offerings_type === opt.value
                            ? "border-[var(--electric-lime)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {formData.offerings_type === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {opt.label}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Describe what you offer"
                description="A brief description of your main products or services"
              >
                <textarea
                  value={formData.offerings_description || ""}
                  onChange={(e) => updateField("offerings_description", e.target.value)}
                  placeholder="We provide..."
                  rows={3}
                  className="form-textarea"
                />
              </FormField>

              <FormField
                label="What makes you different?"
                description="Your unique value proposition"
              >
                <textarea
                  value={formData.primary_value_prop || ""}
                  onChange={(e) => updateField("primary_value_prop", e.target.value)}
                  placeholder="What sets you apart from competitors?"
                  rows={2}
                  className="form-textarea"
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 3: Target Audience */}
          {currentStep === 3 && (
            <StepContainer
              title="Who do you serve?"
              description="Understanding your customers helps us tailor AI recommendations."
            >
              <FormField
                label="Describe your ideal customer"
                description="Who are you trying to reach?"
              >
                <textarea
                  value={formData.target_audience || ""}
                  onChange={(e) => updateField("target_audience", e.target.value)}
                  placeholder="Our ideal customers are..."
                  rows={3}
                  className="form-textarea"
                />
              </FormField>

              <FormField label="Geographic focus">
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIC_FOCUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateField("geographic_focus", opt.value as GeographicFocus)
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.geographic_focus === opt.value
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Customer segments"
                description="Add up to 5 key customer segments (optional)"
              >
                <SegmentEditor
                  segments={formData.customer_segments || []}
                  onChange={(segments) => updateField("customer_segments", segments)}
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 4: Goals */}
          {currentStep === 4 && (
            <StepContainer
              title="What are your goals?"
              description="Let us know what success looks like for you."
            >
              <FormField
                label="What do you want to achieve?"
                description="Select all that apply"
              >
                <div className="flex flex-wrap gap-2">
                  {GOAL_SUGGESTIONS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleArrayItem("primary_goals", goal)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        (formData.primary_goals || []).includes(goal)
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Timeline"
                description="When do you want to see results?"
              >
                <input
                  type="text"
                  value={formData.timeline || ""}
                  onChange={(e) => updateField("timeline", e.target.value)}
                  placeholder="e.g., Within 3 months, This quarter, etc."
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Success metrics"
                description="How will you measure success? (optional)"
              >
                <MetricsEditor
                  metrics={formData.success_metrics || []}
                  onChange={(metrics) => updateField("success_metrics", metrics)}
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 5: Challenges */}
          {currentStep === 5 && (
            <StepContainer
              title="What challenges do you face?"
              description="Understanding your pain points helps us prioritize features for you."
            >
              <FormField
                label="Current pain points"
                description="Select all that apply"
              >
                <div className="flex flex-wrap gap-2">
                  {PAIN_POINT_SUGGESTIONS.map((pain) => (
                    <button
                      key={pain}
                      type="button"
                      onClick={() => toggleArrayItem("pain_points", pain)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        (formData.pain_points || []).includes(pain)
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {pain}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Your biggest challenge right now"
                description="What's the most pressing issue you need help with?"
              >
                <textarea
                  value={formData.biggest_challenge || ""}
                  onChange={(e) => updateField("biggest_challenge", e.target.value)}
                  placeholder="The thing keeping me up at night is..."
                  rows={3}
                  className="form-textarea"
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 6: Tools & Data */}
          {currentStep === 6 && (
            <StepContainer
              title="Your current setup"
              description="This helps us understand what integrations might be useful."
            >
              <FormField
                label="Tools you currently use"
                description="Select all that apply"
              >
                <div className="flex flex-wrap gap-2">
                  {TOOL_SUGGESTIONS.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleArrayItem("current_tools", tool)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        (formData.current_tools || []).includes(tool)
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Where does your data live?"
                description="Select all that apply"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    "Spreadsheets",
                    "CRM",
                    "Database",
                    "Cloud storage",
                    "Email",
                    "Paper records",
                    "Multiple systems",
                    "Not organized yet",
                  ].map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => toggleArrayItem("data_sources", source)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        (formData.data_sources || []).includes(source)
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Integration needs"
                description="Any specific tools you need connected? (optional)"
              >
                <textarea
                  value={formData.integration_needs || ""}
                  onChange={(e) => updateField("integration_needs", e.target.value)}
                  placeholder="I need to connect..."
                  rows={2}
                  className="form-textarea"
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 7: AI Interests */}
          {currentStep === 7 && (
            <StepContainer
              title="How can AI help you?"
              description="Let us know what you're most interested in automating."
            >
              <FormField
                label="AI use cases you're interested in"
                description="Select all that apply"
              >
                <div className="flex flex-wrap gap-2">
                  {AI_USE_CASE_SUGGESTIONS.map((useCase) => (
                    <button
                      key={useCase}
                      type="button"
                      onClick={() => toggleArrayItem("ai_use_cases", useCase)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        (formData.ai_use_cases || []).includes(useCase)
                          ? "bg-[var(--electric-lime)] text-[var(--void)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      {useCase}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Your experience with AI">
                <div className="grid gap-2">
                  {AI_COMFORT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.ai_comfort_level === opt.value
                          ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                          : "border-[var(--border-subtle)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ai_comfort_level"
                        value={opt.value}
                        checked={formData.ai_comfort_level === opt.value}
                        onChange={(e) =>
                          updateField("ai_comfort_level", e.target.value as AIComfortLevel)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.ai_comfort_level === opt.value
                            ? "border-[var(--electric-lime)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {formData.ai_comfort_level === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {opt.label}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>
            </StepContainer>
          )}

          {/* Step 8: Budget */}
          {currentStep === 8 && (
            <StepContainer
              title="Planning your investment"
              description="This helps us recommend the right plan for you."
            >
              <FormField label="Monthly budget for tools & software">
                <div className="grid gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.budget_range === opt.value
                          ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                          : "border-[var(--border-subtle)] hover:bg-[var(--surface-1)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="budget_range"
                        value={opt.value}
                        checked={formData.budget_range === opt.value}
                        onChange={(e) => updateField("budget_range", e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.budget_range === opt.value
                            ? "border-[var(--electric-lime)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {formData.budget_range === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
                        )}
                      </div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField
                label="Who will use this platform?"
                description="e.g., Just me, My team of 5, etc."
              >
                <input
                  type="text"
                  value={formData.team_involvement || ""}
                  onChange={(e) => updateField("team_involvement", e.target.value)}
                  placeholder="Who will be using OpenPeople?"
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Decision timeline"
                description="When do you plan to make a decision?"
              >
                <input
                  type="text"
                  value={formData.decision_timeline || ""}
                  onChange={(e) => updateField("decision_timeline", e.target.value)}
                  placeholder="e.g., This week, This month, Just exploring"
                  className="form-input"
                />
              </FormField>
            </StepContainer>
          )}

          {/* Step 9: Additional */}
          {currentStep === 9 && (
            <StepContainer
              title="Almost done!"
              description="Any final thoughts before we get started."
            >
              <FormField label="How did you hear about us?">
                <select
                  value={formData.how_did_you_hear || ""}
                  onChange={(e) => updateField("how_did_you_hear", e.target.value || null)}
                  className="form-select"
                >
                  <option value="">Select an option</option>
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Anything else we should know?"
                description="Questions, comments, special requirements, etc."
              >
                <textarea
                  value={formData.additional_notes || ""}
                  onChange={(e) => updateField("additional_notes", e.target.value)}
                  placeholder="Share any additional context that might help us serve you better..."
                  rows={4}
                  className="form-textarea"
                />
              </FormField>

              {/* Summary */}
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[var(--electric-lime)]/5 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Thanks for sharing!
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Based on what you have told us, we will personalize your workspace and
                  provide AI-powered recommendations to help you achieve your goals.
                </p>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  {formData.industry && (
                    <li>Industry: {INDUSTRY_OPTIONS.find((o) => o.value === formData.industry)?.label}</li>
                  )}
                  {(formData.primary_goals?.length || 0) > 0 && (
                    <li>Goals: {formData.primary_goals?.slice(0, 3).join(", ")}</li>
                  )}
                  {(formData.ai_use_cases?.length || 0) > 0 && (
                    <li>AI interests: {formData.ai_use_cases?.slice(0, 3).join(", ")}</li>
                  )}
                </ul>
              </div>
            </StepContainer>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed text-[var(--text-muted)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="btn-primary"
            >
              Continue
              <svg
                className="w-4 h-4 ml-1"
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
          ) : (
            <button
              onClick={handleComplete}
              className="btn-primary"
            >
              Complete Setup
              <svg
                className="w-4 h-4 ml-1"
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
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════════════════════════════════ */

function StepContainer({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display text-[var(--text-primary)] mb-2">
          {title}
        </h2>
        <p className="text-[var(--text-secondary)]">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-[var(--text-muted)] mt-0.5">
            {description}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function SegmentEditor({
  segments,
  onChange,
}: {
  segments: CustomerSegment[];
  onChange: (segments: CustomerSegment[]) => void;
}) {
  const [newSegment, setNewSegment] = useState("");

  const addSegment = () => {
    if (newSegment.trim() && segments.length < 5) {
      onChange([...segments, { name: newSegment.trim() }]);
      setNewSegment("");
    }
  };

  const removeSegment = (index: number) => {
    onChange(segments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newSegment}
          onChange={(e) => setNewSegment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSegment())}
          placeholder="e.g., Small business owners, Enterprise teams"
          className="form-input flex-1"
          disabled={segments.length >= 5}
        />
        <button
          type="button"
          onClick={addSegment}
          disabled={!newSegment.trim() || segments.length >= 5}
          className="px-3 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {segments.map((seg, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface-2)] text-sm"
            >
              {seg.name}
              <button
                type="button"
                onClick={() => removeSegment(index)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricsEditor({
  metrics,
  onChange,
}: {
  metrics: SuccessMetric[];
  onChange: (metrics: SuccessMetric[]) => void;
}) {
  const [newMetric, setNewMetric] = useState("");

  const addMetric = () => {
    if (newMetric.trim() && metrics.length < 5) {
      onChange([...metrics, { metric: newMetric.trim() }]);
      setNewMetric("");
    }
  };

  const removeMetric = (index: number) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newMetric}
          onChange={(e) => setNewMetric(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMetric())}
          placeholder="e.g., Increase revenue by 20%, Reduce churn to 5%"
          className="form-input flex-1"
          disabled={metrics.length >= 5}
        />
        <button
          type="button"
          onClick={addMetric}
          disabled={!newMetric.trim() || metrics.length >= 5}
          className="px-3 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metrics.map((m, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface-2)] text-sm"
            >
              {m.metric}
              <button
                type="button"
                onClick={() => removeMetric(index)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
