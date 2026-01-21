"use client";

import { useState, useEffect } from "react";
import { Button, Card, StatusBadge, LoadingSpinner } from "@/lib/ui";
import type { TenantBilling } from "@/types/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Billing Management Component

   Allows super admins to manage tenant subscriptions, billing, and payments
   ═══════════════════════════════════════════════════════════════════════════ */

interface TenantWithBilling {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  billing?: TenantBilling;
  owner_email?: string;
}

interface BillingManagementProps {
  tenantId?: string; // Optional: manage specific tenant
  onUpdate?: () => void;
}

const PLANS = [
  { id: 'starter', name: 'Starter', price: 99, features: ['AI Inventory', 'Basic Analytics', 'Email Integration', '5GB Storage'] },
  { id: 'pro', name: 'Pro', price: 199, features: ['Everything in Starter', 'AI Chat Assistant', 'Advanced Analytics', '25GB Storage', 'Custom Integrations'] },
  { id: 'enterprise', name: 'Enterprise', price: 0, features: ['Everything in Pro', 'Unlimited Storage', 'White-label', 'Priority Support', 'Custom Features'] },
];

export function BillingManagement({ tenantId, onUpdate }: BillingManagementProps) {
  const [tenants, setTenants] = useState<TenantWithBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithBilling | null>(null);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (tenantId) {
      const tenant = tenants.find(t => t.id === tenantId);
      if (tenant) {
        setSelectedTenant(tenant);
      }
    }
  }, [tenantId, tenants]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/billing/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTenantPlan = async (tenantId: string, plan: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/billing/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        await loadTenants();
        setShowPlanChange(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/super-admin/billing/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadTenants();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trialing': return 'warning';
      case 'past_due': return 'error';
      case 'canceled': return 'secondary';
      default: return 'muted';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Single tenant view
  if (selectedTenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {selectedTenant.name}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {selectedTenant.slug}.openpeople.ai
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTenant(null)}>
            Back to All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <Card>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
              Current Plan
            </h3>

            {selectedTenant.billing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Plan</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                    {selectedTenant.billing.plan}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Status</span>
                  <StatusBadge status={getStatusColor(selectedTenant.billing.status)}>
                    {selectedTenant.billing.status.replace('_', ' ')}
                  </StatusBadge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Monthly</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {PLANS.find(p => p.id === selectedTenant.billing?.plan)?.price === 0
                      ? 'Custom'
                      : formatCurrency(PLANS.find(p => p.id === selectedTenant.billing?.plan)?.price || 0)
                    }
                  </span>
                </div>

                {selectedTenant.billing.stripe_subscription_id && (
                  <div className="pt-4 border-t border-[var(--border-subtle)]">
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${selectedTenant.billing.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--electric-lime)] hover:underline"
                    >
                      View in Stripe →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No billing information available
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <Button
                onClick={() => setShowPlanChange(true)}
                className="w-full"
                disabled={updating}
              >
                {updating && <LoadingSpinner size="sm" className="mr-2" />}
                Change Plan
              </Button>
            </div>
          </Card>

          {/* Plan Change Modal */}
          {showPlanChange && (
            <Card>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
                Change Plan
              </h3>

              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => updateTenantPlan(selectedTenant.id, plan.id)}
                    disabled={updating || selectedTenant.billing?.plan === plan.id}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selectedTenant.billing?.plan === plan.id
                        ? 'border-[var(--electric-lime)] bg-[var(--electric-lime)]/5'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--text-primary)]">{plan.name}</span>
                      <span className="text-sm font-semibold text-[var(--electric-lime)]">
                        {plan.price === 0 ? 'Custom' : `$${plan.price}/mo`}
                      </span>
                    </div>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPlanChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Multi-tenant view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Subscription Management
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Manage tenant plans and billing
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Tenant
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Monthly
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {tenant.slug}.openpeople.ai
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm capitalize">
                      {tenant.billing?.plan || 'Free'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {tenant.billing ? (
                      <StatusBadge status={getStatusColor(tenant.billing.status)}>
                        {tenant.billing.status.replace('_', ' ')}
                      </StatusBadge>
                    ) : (
                      <StatusBadge status="muted">No Billing</StatusBadge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {tenant.billing?.plan === 'enterprise'
                        ? 'Custom'
                        : formatCurrency(PLANS.find(p => p.id === tenant.billing?.plan)?.price || 0)
                      }
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTenant(tenant)}
                      >
                        Manage
                      </Button>

                      {tenant.billing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTenantStatus(
                            tenant.id,
                            tenant.billing!.status === 'active' ? 'canceled' : 'active'
                          )}
                          disabled={updating}
                        >
                          {tenant.billing.status === 'active' ? 'Cancel' : 'Reactivate'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">
                No tenants with billing information
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}