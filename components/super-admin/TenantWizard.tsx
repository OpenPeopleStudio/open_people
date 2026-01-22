"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, LoadingSpinner } from "@/lib/ui";
import type { TenantSettings, TenantFeatureFlags, TenantIntegrations, TenantTheme } from "@/types/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Creation Wizard

   Multi-step wizard for comprehensive tenant setup including:
   - Basic details and branding
   - Feature selection and integrations
   - Billing configuration
   - Owner account setup
   - Review and confirmation
   ═══════════════════════════════════════════════════════════════════════════ */

type WizardStep = 'details' | 'branding' | 'features' | 'integrations' | 'billing' | 'owner' | 'review';

type WizardData = {
  // Basic Details
  name: string;
  slug: string;
  description: string;
  website?: string;

  // Branding
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Features
  features: TenantFeatureFlags;

  // Integrations
  integrations: WizardIntegrations;

  // Billing
  plan: 'starter' | 'pro' | 'enterprise' | 'custom';
  billingEmail?: string;

  // Owner
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  sendWelcomeEmail: boolean;
};

type EmailProvider = Exclude<NonNullable<TenantIntegrations["email"]>["provider"], undefined>;
type AiProvider = Exclude<NonNullable<TenantIntegrations["ai"]>["provider"], undefined>;
type PaymentProvider = Exclude<NonNullable<TenantIntegrations["payments"]>["provider"], undefined>;

type WizardIntegrations = {
  email: { provider: EmailProvider };
  payments: { provider: PaymentProvider };
  ai: { provider: AiProvider; model?: string };
};

interface TenantWizardProps {
  onComplete: (tenantId: string) => void;
  onCancel: () => void;
}

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'details', title: 'Basic Details', description: 'Organization information and setup' },
  { id: 'branding', title: 'Branding', description: 'Logo, colors, and visual identity' },
  { id: 'features', title: 'Features', description: 'Enable platform capabilities' },
  { id: 'integrations', title: 'Integrations', description: 'Connect external services' },
  { id: 'billing', title: 'Billing', description: 'Plan selection and payment' },
  { id: 'owner', title: 'Owner Account', description: 'Create administrator account' },
  { id: 'review', title: 'Review', description: 'Confirm and create tenant' },
];

export function TenantWizard({ onComplete, onCancel }: TenantWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    slug: '',
    description: '',
    features: {
      ai_inventory: true,
      ai_chat: false,
      ai_analytics: false,
      admin: true,
      vault: true,
      notes: true,
      workflows: true,
      knowledge: true,
      api_keys: true,
      email: true,
      notifications: true,
      experiments: false,
      storage: true,
    },
    integrations: {
      email: { provider: 'resend' },
      payments: { provider: 'stripe' },
      ai: { provider: 'openai', model: 'gpt-4' },
    },
    plan: 'starter',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    sendWelcomeEmail: true,
  });

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const updateFeatures = (updates: Partial<TenantFeatureFlags>) => {
    setWizardData(prev => ({
      ...prev,
      features: { ...prev.features, ...updates }
    }));
  };

  const updateIntegrations = (updates: Partial<WizardData['integrations']>) => {
    setWizardData(prev => {
      const nextIntegrations = { ...prev.integrations };
      if (updates.email) {
        nextIntegrations.email = { ...prev.integrations.email, ...updates.email };
      }
      if (updates.payments) {
        nextIntegrations.payments = { ...prev.integrations.payments, ...updates.payments };
      }
      if (updates.ai) {
        nextIntegrations.ai = { ...prev.integrations.ai, ...updates.ai };
      }
      return {
        ...prev,
        integrations: nextIntegrations,
      };
    });
  };

  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNext = () => {
    if (isLastStep) {
      handleCreateTenant();
    } else {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const validateCurrentStep = (): string | null => {
    switch (currentStep) {
      case 'details':
        if (!wizardData.name.trim()) return 'Organization name is required';
        if (!wizardData.slug.trim()) return 'URL slug is required';
        if (wizardData.slug.length < 3) return 'Slug must be at least 3 characters';
        break;
      case 'owner':
        if (!wizardData.ownerName.trim()) return 'Owner name is required';
        if (!wizardData.ownerEmail.includes('@')) return 'Valid email is required';
        if (wizardData.ownerPassword.length < 8) return 'Password must be at least 8 characters';
        break;
    }
    return null;
  };

  const handleCreateTenant = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare tenant settings
      const theme: TenantTheme | undefined =
        wizardData.brandName || wizardData.logoUrl
          ? {
              ...(wizardData.brandName ? { brand_name: wizardData.brandName } : {}),
              ...(wizardData.logoUrl ? { logo_url: wizardData.logoUrl } : {}),
            }
          : undefined;

      const settings: TenantSettings = {
        ...(theme ? { theme } : {}),
        features: wizardData.features,
        integrations: wizardData.integrations satisfies TenantIntegrations,
      };

      const payload = {
        name: wizardData.name,
        slug: wizardData.slug,
        description: wizardData.description,
        website: wizardData.website,
        settings,
        plan: wizardData.plan,
        billingEmail: wizardData.billingEmail,
        ownerName: wizardData.ownerName,
        ownerEmail: wizardData.ownerEmail,
        ownerPassword: wizardData.ownerPassword,
        sendWelcomeEmail: wizardData.sendWelcomeEmail,
      };

      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      onComplete(data.tenant.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return <DetailsStep wizardData={wizardData} updateWizardData={updateWizardData} generateSlug={generateSlug} />;
      case 'branding':
        return <BrandingStep wizardData={wizardData} updateWizardData={updateWizardData} />;
      case 'features':
        return <FeaturesStep wizardData={wizardData} updateFeatures={updateFeatures} />;
      case 'integrations':
        return <IntegrationsStep wizardData={wizardData} updateIntegrations={updateIntegrations} />;
      case 'billing':
        return <BillingStep wizardData={wizardData} updateWizardData={updateWizardData} />;
      case 'owner':
        return <OwnerStep wizardData={wizardData} updateWizardData={updateWizardData} />;
      case 'review':
        return <ReviewStep wizardData={wizardData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Create New Tenant
          </h1>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index <= currentStepIndex
                    ? 'bg-[var(--electric-lime)] text-[var(--void)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-[var(--electric-lime)]' : 'bg-[var(--border-subtle)]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            {STEPS[currentStepIndex].title}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {STEPS[currentStepIndex].description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        {renderStepContent()}
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={!!validateCurrentStep() || loading}
        >
          {loading && <LoadingSpinner size="sm" className="mr-2" />}
          {isLastStep ? 'Create Tenant' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Step Components
   ═══════════════════════════════════════════════════════════════ */

function DetailsStep({
  wizardData,
  updateWizardData,
  generateSlug
}: {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
  generateSlug: (name: string) => string;
}) {
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (name: string) => {
    updateWizardData({ name });
    if (!slugTouched) {
      updateWizardData({ slug: generateSlug(name) });
    }
  };

  return (
    <div className="space-y-6">
      <FormField label="Organization Name" required>
        <Input
          value={wizardData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Acme Corporation"
        />
      </FormField>

      <FormField label="URL Slug" required>
        <div className="flex items-center">
          <Input
            value={wizardData.slug}
            onChange={(e) => {
              setSlugTouched(true);
              updateWizardData({ slug: generateSlug(e.target.value) });
            }}
            placeholder="acme-corp"
            className="rounded-r-none"
          />
          <span className="px-3 py-2.5 rounded-r-lg bg-[var(--surface-3)] border border-l-0 border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            .openpeople.ai
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          This will be your organization URL
        </p>
      </FormField>

      <FormField label="Description">
        <Textarea
          value={wizardData.description}
          onChange={(e) => updateWizardData({ description: e.target.value })}
          placeholder="Brief description of your organization..."
          rows={3}
        />
      </FormField>

      <FormField label="Website">
        <Input
          type="url"
          value={wizardData.website || ''}
          onChange={(e) => updateWizardData({ website: e.target.value })}
          placeholder="https://www.example.com"
        />
      </FormField>
    </div>
  );
}

function BrandingStep({
  wizardData,
  updateWizardData
}: {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center p-6 rounded-xl bg-[var(--surface-2)] border border-dashed border-[var(--border-subtle)]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Advanced branding options will be available after tenant creation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Brand Name">
          <Input
            value={wizardData.brandName || ''}
            onChange={(e) => updateWizardData({ brandName: e.target.value })}
            placeholder="Display name"
          />
        </FormField>

        <FormField label="Logo URL">
          <Input
            type="url"
            value={wizardData.logoUrl || ''}
            onChange={(e) => updateWizardData({ logoUrl: e.target.value })}
            placeholder="https://..."
          />
        </FormField>
      </div>

      <div className="text-sm text-[var(--text-muted)]">
        <p>💡 <strong>Tip:</strong> You can customize colors, typography, and more advanced branding after the tenant is created.</p>
      </div>
    </div>
  );
}

function FeaturesStep({
  wizardData,
  updateFeatures
}: {
  wizardData: WizardData;
  updateFeatures: (updates: Partial<TenantFeatureFlags>) => void;
}) {
  const features = [
    {
      key: 'ai_inventory' as const,
      label: 'AI Inventory Intelligence',
      description: 'Predictive stock management and pricing optimization',
      recommended: true,
    },
    {
      key: 'ai_chat' as const,
      label: 'AI Chat Assistant',
      description: '24/7 customer support with product knowledge',
    },
    {
      key: 'ai_analytics' as const,
      label: 'AI Analytics',
      description: 'Demand forecasting and customer insights',
    },
    {
      key: 'vault' as const,
      label: 'Encrypted Vault',
      description: 'Secure file storage with end-to-end encryption',
      recommended: true,
    },
    {
      key: 'notes' as const,
      label: 'Notes & Documentation',
      description: 'Knowledge management and documentation tools',
      recommended: true,
    },
    {
      key: 'workflows' as const,
      label: 'Project Workflows',
      description: 'Task management and project coordination',
    },
    {
      key: 'email' as const,
      label: 'Email Integration',
      description: 'Email accounts and automated processing',
      recommended: true,
    },
    {
      key: 'notifications' as const,
      label: 'Notifications',
      description: 'SMS and push notification delivery',
    },
  ];

  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <label
          key={feature.key}
          className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--surface-3)] transition-colors"
        >
          <input
            type="checkbox"
            checked={wizardData.features[feature.key] || false}
            onChange={(e) => updateFeatures({ [feature.key]: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {feature.label}
              </span>
              {feature.recommended && (
                <span className="px-2 py-0.5 text-xs rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {feature.description}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

function IntegrationsStep({
  wizardData,
  updateIntegrations
}: {
  wizardData: WizardData;
  updateIntegrations: (updates: Partial<WizardData['integrations']>) => void;
}) {
  const emailProviders: { id: EmailProvider; name: string; recommended?: boolean }[] = [
    { id: 'resend', name: 'Resend', recommended: true },
    { id: 'sendgrid', name: 'SendGrid' },
    { id: 'postmark', name: 'Postmark' },
    { id: 'disabled', name: 'Disabled' },
  ];

  const aiProviders: { id: AiProvider; name: string; recommended?: boolean }[] = [
    { id: 'openai', name: 'OpenAI', recommended: true },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'disabled', name: 'Disabled' },
  ];

  const paymentProviders: { id: PaymentProvider; name: string; recommended?: boolean }[] = [
    { id: 'stripe', name: 'Stripe', recommended: true },
    { id: 'manual', name: 'Manual Processing' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm text-[var(--text-muted)] p-4 rounded-lg bg-[var(--info)]/10 border border-[var(--info)]/20">
        <p>🔧 <strong>Note:</strong> Integration credentials will be configured after tenant creation. These selections determine which services will be available.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Email Provider</h3>
          <div className="grid grid-cols-2 gap-3">
            {emailProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => updateIntegrations({
                  email: { provider: provider.id }
                })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  wizardData.integrations.email.provider === provider.id
                    ? 'border-[var(--electric-lime)] bg-[var(--electric-lime)]/10'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{provider.name}</span>
                  {provider.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--electric-lime)]/20 text-[var(--electric-lime)]">
                      Recommended
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">AI Provider</h3>
          <div className="grid grid-cols-2 gap-3">
            {aiProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => updateIntegrations({
                  ai: {
                    provider: provider.id,
                    ...(provider.id === 'openai'
                      ? { model: 'gpt-4' }
                      : provider.id === 'anthropic'
                        ? { model: 'claude-3' }
                        : {}),
                  }
                })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  wizardData.integrations.ai.provider === provider.id
                    ? 'border-[var(--electric-lime)] bg-[var(--electric-lime)]/10'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{provider.name}</span>
                  {provider.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--electric-lime)]/20 text-[var(--electric-lime)]">
                      Recommended
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Payment Provider</h3>
          <div className="grid grid-cols-2 gap-3">
            {paymentProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => updateIntegrations({
                  payments: { provider: provider.id }
                })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  wizardData.integrations.payments.provider === provider.id
                    ? 'border-[var(--electric-lime)] bg-[var(--electric-lime)]/10'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{provider.name}</span>
                  {provider.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--electric-lime)]/20 text-[var(--electric-lime)]">
                      Recommended
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingStep({
  wizardData,
  updateWizardData
}: {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
}) {
  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: '$99/mo',
      description: 'Core AI tools and basic features',
      features: ['AI Inventory', 'Basic Analytics', 'Email Integration', '5GB Storage'],
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$199/mo',
      description: 'Full AI toolkit and advanced features',
      features: ['Everything in Starter', 'AI Chat Assistant', 'Advanced Analytics', '25GB Storage', 'Custom Integrations'],
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large organizations',
      features: ['Everything in Pro', 'Unlimited Storage', 'White-label', 'Priority Support', 'Custom Features'],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Choose a Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => updateWizardData({ plan: plan.id })}
              className={`p-4 rounded-xl border text-left transition-all ${
                wizardData.plan === plan.id
                  ? 'border-[var(--electric-lime)] bg-[var(--electric-lime)]/5'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-[var(--text-primary)]">{plan.name}</h4>
                <span className="text-sm font-semibold text-[var(--electric-lime)]">{plan.price}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">{plan.description}</p>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[var(--electric-lime)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {wizardData.plan !== 'starter' && (
        <FormField label="Billing Email">
          <Input
            type="email"
            value={wizardData.billingEmail || ''}
            onChange={(e) => updateWizardData({ billingEmail: e.target.value })}
            placeholder="billing@company.com"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Email for billing notifications and receipts
          </p>
        </FormField>
      )}

      <div className="text-sm text-[var(--text-muted)] p-4 rounded-lg bg-[var(--info)]/10 border border-[var(--info)]/20">
        <p>💳 <strong>Billing:</strong> Payment setup and billing configuration will be handled after tenant creation. You will receive an email with setup instructions.</p>
      </div>
    </div>
  );
}

function OwnerStep({
  wizardData,
  updateWizardData
}: {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-[var(--text-primary)] p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
        <p>👤 <strong>Important:</strong> This account will have full administrative access to the tenant. The owner can invite additional administrators and manage all settings.</p>
      </div>

      <FormField label="Full Name" required>
        <Input
          value={wizardData.ownerName}
          onChange={(e) => updateWizardData({ ownerName: e.target.value })}
          placeholder="John Doe"
        />
      </FormField>

      <FormField label="Email Address" required>
        <Input
          type="email"
          value={wizardData.ownerEmail}
          onChange={(e) => updateWizardData({ ownerEmail: e.target.value })}
          placeholder="owner@company.com"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          This email will be used for login and account verification
        </p>
      </FormField>

      <FormField label="Password" required>
        <Input
          type="password"
          value={wizardData.ownerPassword}
          onChange={(e) => updateWizardData({ ownerPassword: e.target.value })}
          placeholder="Minimum 8 characters"
          minLength={8}
        />
      </FormField>

      <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
        <input
          type="checkbox"
          checked={wizardData.sendWelcomeEmail}
          onChange={(e) => updateWizardData({ sendWelcomeEmail: e.target.checked })}
          className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
        />
        <div>
          <span className="text-sm text-[var(--text-primary)]">
            Send welcome email
          </span>
          <p className="text-xs text-[var(--text-muted)]">
            Send setup instructions and account verification email
          </p>
        </div>
      </label>
    </div>
  );
}

function ReviewStep({ wizardData }: { wizardData: WizardData }) {
  const getPlanDetails = (plan: string) => {
    const plans = {
      starter: { name: 'Starter', price: '$99/mo' },
      pro: { name: 'Pro', price: '$199/mo' },
      enterprise: { name: 'Enterprise', price: 'Custom' },
    };
    return plans[plan as keyof typeof plans] || { name: plan, price: 'Unknown' };
  };

  const enabledFeatures = Object.entries(wizardData.features)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  const planDetails = getPlanDetails(wizardData.plan);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          Ready to Create Tenant
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Please review the configuration below before creating the tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h4 className="font-medium text-[var(--text-primary)] mb-3">Basic Information</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Name</dt>
              <dd className="text-[var(--text-primary)]">{wizardData.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Slug</dt>
              <dd className="text-[var(--text-primary)]">{wizardData.slug}.openpeople.ai</dd>
            </div>
            {wizardData.description && (
              <div>
                <dt className="text-[var(--text-muted)]">Description</dt>
                <dd className="text-[var(--text-primary)]">{wizardData.description}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h4 className="font-medium text-[var(--text-primary)] mb-3">Plan & Billing</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Plan</dt>
              <dd className="text-[var(--text-primary)]">{planDetails.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Price</dt>
              <dd className="text-[var(--text-primary)]">{planDetails.price}</dd>
            </div>
            {wizardData.billingEmail && (
              <div>
                <dt className="text-[var(--text-muted)]">Billing Email</dt>
                <dd className="text-[var(--text-primary)]">{wizardData.billingEmail}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h4 className="font-medium text-[var(--text-primary)] mb-3">Features ({enabledFeatures.length})</h4>
          <div className="flex flex-wrap gap-1">
            {enabledFeatures.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
              >
                {feature}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="font-medium text-[var(--text-primary)] mb-3">Integrations</h4>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Email</dt>
              <dd className="text-[var(--text-primary)] capitalize">{wizardData.integrations.email.provider}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">AI</dt>
              <dd className="text-[var(--text-primary)] capitalize">{wizardData.integrations.ai.provider}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Payments</dt>
              <dd className="text-[var(--text-primary)] capitalize">{wizardData.integrations.payments.provider}</dd>
            </div>
          </dl>
        </Card>

        <Card className="md:col-span-2">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">Owner Account</h4>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Name</dt>
              <dd className="text-[var(--text-primary)]">{wizardData.ownerName}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Email</dt>
              <dd className="text-[var(--text-primary)]">{wizardData.ownerEmail}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--text-muted)]">Welcome Email</dt>
              <dd className="text-[var(--text-primary)]">
                {wizardData.sendWelcomeEmail ? 'Will be sent' : 'Will not be sent'}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="text-sm text-[var(--text-muted)] p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
        <p>⚠️ <strong>Important:</strong> Creating this tenant will set up all selected features and integrations. The owner will receive login credentials and setup instructions via email.</p>
      </div>
    </div>
  );
}
