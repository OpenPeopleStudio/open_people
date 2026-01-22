"use client";

import { useState, useEffect } from "react";
import type { EmailAccount, EmailProvider, EmailAccountMode, ManagedEmailDomain } from "@/types/email";
import { DNSRecordsPanel } from "./DNSRecordsPanel";

type Props = {
  accounts: EmailAccount[];
  onAccountsChange: (accounts: EmailAccount[]) => void;
  tenantId?: string;  // For super-admin to specify tenant
  isSuperAdmin?: boolean;
};

export function AccountsManager({ accounts, onAccountsChange, tenantId, isSuperAdmin = false }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);
  const [managedDomains, setManagedDomains] = useState<ManagedEmailDomain[]>([]);

  // Load managed domains
  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await fetch("/api/email/domains/managed");
        const data = await res.json();
        if (data.domains) {
          setManagedDomains(data.domains);
        }
      } catch (error) {
        console.error("Failed to load managed domains:", error);
      } finally {
        // no-op
      }
    }
    loadDomains();
  }, []);

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domainId, action: "verify" }),
      });
      const data = await res.json();
      if (data.domain) {
        setManagedDomains(domains => 
          domains.map(d => d.id === domainId ? data.domain : d)
        );
      }
    } catch (error) {
      console.error("Failed to verify domain:", error);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain? This will remove all DNS records.")) return;

    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domainId }),
      });

      if (res.ok) {
        setManagedDomains(domains => domains.filter(d => d.id !== domainId));
      }
    } catch (error) {
      console.error("Delete domain error:", error);
    }
  };

  const handleTestConnection = async (accountId: string) => {
    setTesting(accountId);
    setTestResult(null);

    try {
      const res = await fetch("/api/email/accounts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      const nextResult: { id: string; success: boolean; error?: string } = {
        id: accountId,
        success: Boolean(data.success),
      };
      if (data.error) {
        nextResult.error = data.error;
      }
      setTestResult(nextResult);
    } catch (error) {
      setTestResult({
        id: accountId,
        success: false,
        error: "Connection test failed",
      });
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this email account?")) return;

    try {
      const res = await fetch("/api/email/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId }),
      });

      if (res.ok) {
        onAccountsChange(accounts.filter(a => a.id !== accountId));
      }
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  const getProviderLabel = (provider: EmailProvider) => {
    switch (provider) {
      case "managed": return "Managed (DNS-only)";
      case "smtp": return "SMTP";
      case "imap": return "IMAP";
      case "pop3": return "POP3";
      case "resend": return "Resend";
      case "smtp_imap": return "SMTP + IMAP";
      default: return provider;
    }
  };

  // Get the managed domain for an account
  const getAccountDomain = (account: EmailAccount) => {
    if (account.managed_domain_id) {
      return managedDomains.find(d => d.id === account.managed_domain_id);
    }
    // Try to find by email domain
    const emailDomain = account.email_address.split("@")[1];
    return managedDomains.find(d => d.domain === emailDomain);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">Email Accounts</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {accounts.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[var(--text-muted)] mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p className="text-sm md:text-base text-[var(--text-muted)]">No email accounts configured</p>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
              Add an account to start sending and receiving emails
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {accounts.map((account) => {
              const accountDomain = getAccountDomain(account);
              const isManaged = account.mode === "managed" || account.provider === "managed";

              return (
                <div key={account.id} className="space-y-2 md:space-y-3">
                  <div className="p-3 md:p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {account.name}
                          </p>
                          {account.is_default && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] md:text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)] shrink-0">
                              Default
                            </span>
                          )}
                          {isManaged && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] md:text-xs bg-[var(--info)]/10 text-[var(--info)] shrink-0">
                              DNS-only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {account.email_address}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                          <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)]">
                            {getProviderLabel(account.provider)}
                          </span>
                          {!isManaged && account.sync_enabled && (
                            <span className="text-[10px] md:text-xs text-[var(--text-muted)]">
                              Sync every {account.sync_interval_minutes}m
                            </span>
                          )}
                          {isManaged && accountDomain && (
                            <span className={`text-[10px] md:text-xs ${accountDomain.status === "verified" ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                              Domain: {accountDomain.status}
                            </span>
                          )}
                        </div>
                        {account.last_sync_error && (
                          <p className="text-[10px] md:text-xs text-[var(--error)] mt-2 line-clamp-2">
                            Last sync error: {account.last_sync_error}
                          </p>
                        )}
                        {testResult?.id === account.id && (
                          <p className={`text-[10px] md:text-xs mt-2 ${testResult.success ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                            {testResult.success ? "Connection successful!" : testResult.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                        <button
                          onClick={() => handleTestConnection(account.id)}
                          disabled={testing === account.id}
                          className="p-1.5 md:p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
                          title="Test connection"
                        >
                          {testing === account.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingAccount(account)}
                          className="p-1.5 md:p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="p-1.5 md:p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-2)] transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show DNS Records Panel for managed accounts */}
                  {isManaged && accountDomain && (
                    <DNSRecordsPanel
                      domain={accountDomain}
                      onVerify={() => handleVerifyDomain(accountDomain.id)}
                      onDelete={() => handleDeleteDomain(accountDomain.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingAccount) && (
        <AccountModal
          account={editingAccount}
          onClose={() => {
            setShowAddModal(false);
            setEditingAccount(null);
          }}
          onSave={(account) => {
            if (editingAccount) {
              onAccountsChange(accounts.map(a => a.id === account.id ? account : a));
            } else {
              onAccountsChange([account, ...accounts]);
            }
            setShowAddModal(false);
            setEditingAccount(null);
          }}
          {...(tenantId ? { tenantId } : {})}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}

type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

function AccountModal({
  account,
  onClose,
  onSave,
  tenantId,
  isSuperAdmin,
}: {
  account: EmailAccount | null;
  onClose: () => void;
  onSave: (account: EmailAccount) => void;
  tenantId?: string;
  isSuperAdmin?: boolean;
}) {
  const [form, setForm] = useState({
    name: account?.name || "",
    email_address: account?.email_address || "",
    is_default: account?.is_default || false,
    mode: (account?.mode || "custom") as EmailAccountMode,
    provider: (account?.provider || "resend") as EmailProvider,
    domain: "", // For managed mode
    resend_domain: account?.resend_domain || "", // For Resend provider
    smtp_host: account?.smtp_host || "",
    smtp_port: account?.smtp_port || 587,
    smtp_secure: account?.smtp_secure ?? true,
    smtp_user: account?.smtp_user || "",
    smtp_password: "",
    imap_host: account?.imap_host || "",
    imap_port: account?.imap_port || 993,
    imap_secure: account?.imap_secure ?? true,
    imap_user: account?.imap_user || "",
    imap_password: "",
    sync_enabled: account?.sync_enabled ?? true,
    sync_interval_minutes: account?.sync_interval_minutes || 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // For super-admin tenant selection
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenantId || "__platform__");
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Load tenants for super-admin if no tenantId provided
  useEffect(() => {
    if (isSuperAdmin && !tenantId) {
      async function loadTenants() {
        setLoadingTenants(true);
        try {
          const res = await fetch("/api/tenants");
          const data = await res.json();
          if (!res.ok) {
            console.error("Failed to load tenants:", data.error);
            // Don't show error, just leave tenants empty - platform option still works
          } else if (data.tenants) {
            setTenants(data.tenants);
          }
        } catch (err) {
          console.error("Failed to load tenants:", err);
        } finally {
          setLoadingTenants(false);
        }
      }
      loadTenants();
    }
  }, [isSuperAdmin, tenantId]);

  // Auto-extract domain from email address for managed mode
  useEffect(() => {
    if (form.mode === "managed" && form.email_address && !form.domain) {
      const domain = form.email_address.split("@")[1];
      if (domain) {
        setForm(f => ({ ...f, domain }));
      }
    }
  }, [form.email_address, form.mode, form.domain]);

  // Determine the effective tenant ID
  // "__platform__" means platform-level account (no specific tenant)
  const isPlatformAccount = selectedTenantId === "__platform__" || (!tenantId && !selectedTenantId);
  const effectiveTenantId = tenantId || (isPlatformAccount ? null : selectedTenantId);

  const handleSave = async () => {
    if (!form.name || !form.email_address) {
      setError("Name and email address are required");
      return;
    }

    // For managed mode, domain is required
    if (form.mode === "managed" && !form.domain) {
      setError("Domain is required for managed email setup");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // For managed mode (DNS-only), first create the domain if it doesn't exist
      let managedDomainId: string | null = null;
      
      if (form.mode === "managed" && form.provider === "managed" && !account) {
        const domainRes = await fetch("/api/email/domains/managed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            domain: form.domain,
            tenant_id: effectiveTenantId,
          }),
        });

        const domainData = await domainRes.json();

        if (!domainRes.ok) {
          // Domain might already exist, which is fine - use the existing domain ID
          if (domainData.error?.includes("already exists")) {
            // If the response includes the existing domain, use its ID
            if (domainData.domain?.id) {
              managedDomainId = domainData.domain.id;
            } else {
              // Fetch the existing domain to get its ID
              const existingRes = await fetch(`/api/email/domains/managed?domain=${encodeURIComponent(form.domain)}`, {
                credentials: "include",
              });
              const existingData = await existingRes.json();
              if (existingData.domains?.length > 0) {
                managedDomainId = existingData.domains[0].id;
              }
            }
          } else {
            setError(domainData.error || "Failed to create managed domain");
            return;
          }
        } else {
          managedDomainId = domainData.domain?.id;
        }
      }

      const method = account ? "PUT" : "POST";
      // Include tenant_id for new accounts when super admin
      const body = account
        ? { id: account.id, ...form }
        : {
            ...form,
            ...(effectiveTenantId !== undefined ? { tenant_id: effectiveTenantId } : {}),
            ...(managedDomainId !== undefined ? { managed_domain_id: managedDomainId } : {}),
            // For managed mode, set provider to "managed"
            provider: form.mode === "managed" ? "managed" : form.provider,
            ...(form.provider === "resend" && form.resend_domain
              ? { resend_domain: form.resend_domain }
              : {}),
          };

      const res = await fetch("/api/email/accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save account");
        return;
      }

      // Success - call onSave and close modal
      onSave(data.account);
      onClose();
    } catch (err) {
      console.error("Save account error:", err);
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-t-2xl md:rounded-2xl w-full md:max-w-lg md:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          {/* Drag handle for mobile */}
          <div className="md:hidden w-10 h-1 bg-[var(--border-subtle)] rounded-full mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4">
            {account ? "Edit Account" : "Add Email Account"}
          </h3>

          <div className="space-y-4">
            {/* Tenant Selector (for super-admin without a tenant) */}
            {isSuperAdmin && !tenantId && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Select Tenant
                </label>
                {loadingTenants ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)]">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Loading tenants...
                  </div>
                ) : (
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  >
                    <option value="__platform__">Platform (OpenPeople)</option>
                    <optgroup label="Tenants">
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.slug})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {selectedTenantId === "__platform__" || !selectedTenantId
                    ? "Platform account for openpeople.ai domain."
                    : "The email account will be created for this tenant."}
                </p>
              </div>
            )}

            {/* Mode Toggle */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">Setup Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: "custom", provider: "resend" }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.provider === "resend"
                      ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Resend</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Just API key + verified domain
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: "custom", provider: "smtp_imap" }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.mode === "custom" && form.provider !== "resend"
                      ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-primary)]">SMTP/IMAP</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Your own mail server
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: "managed", provider: "managed" }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.mode === "managed"
                      ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-primary)]">DNS Only</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Add DNS records manually
                  </p>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Work Email"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email_address}
                  onChange={(e) => setForm(f => ({ ...f, email_address: e.target.value }))}
                  placeholder="you@yourdomain.com"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            </div>

            {/* Resend Mode: Just domain (already verified in Resend dashboard) */}
            {form.provider === "resend" && (
              <div className="p-4 rounded-lg bg-[var(--success)]/5 border border-[var(--success)]/20">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[var(--success)]">Resend Integration</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Uses your Resend API key from environment variables. Just enter your verified domain.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Verified Domain</label>
                  <input
                    type="text"
                    value={form.resend_domain}
                    onChange={(e) => setForm(f => ({ ...f, resend_domain: e.target.value }))}
                    placeholder="openpeople.ai"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    Enter the domain you&apos;ve already verified in your <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-[var(--electric-lime)] hover:underline">Resend dashboard</a>
                  </p>
                </div>
              </div>
            )}

            {/* Managed Mode: Domain */}
            {form.mode === "managed" && form.provider === "managed" && (
              <div className="p-3 rounded-lg bg-[var(--info)]/5 border border-[var(--info)]/20">
                <p className="text-xs font-medium text-[var(--info)] mb-2">DNS-only Setup</p>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Domain</label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => setForm(f => ({ ...f, domain: e.target.value }))}
                    placeholder="yourdomain.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  After creating the account, you&apos;ll see DNS records to add to your domain registrar.
                </p>
              </div>
            )}

            {/* Custom Mode: Provider Selection (only shown for SMTP/IMAP, not Resend) */}
            {form.mode === "custom" && form.provider !== "resend" && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Protocol</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm(f => ({ ...f, provider: e.target.value as EmailProvider }))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                >
                  <option value="smtp_imap">SMTP + IMAP (Send & Receive)</option>
                  <option value="smtp">SMTP Only (Send)</option>
                  <option value="imap">IMAP Only (Receive)</option>
                  <option value="pop3">POP3 (Receive)</option>
                </select>
              </div>
            )}

            {/* SMTP Settings */}
            {form.mode === "custom" && (form.provider === "smtp" || form.provider === "smtp_imap") && (
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">SMTP Settings (Outgoing)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Host</label>
                    <input
                      type="text"
                      value={form.smtp_host}
                      onChange={(e) => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                      placeholder="smtp.example.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Port</label>
                    <input
                      type="number"
                      value={form.smtp_port}
                      onChange={(e) => setForm(f => ({ ...f, smtp_port: parseInt(e.target.value) || 587 }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Username</label>
                    <input
                      type="text"
                      value={form.smtp_user}
                      onChange={(e) => setForm(f => ({ ...f, smtp_user: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
                    <input
                      type="password"
                      value={form.smtp_password}
                      onChange={(e) => setForm(f => ({ ...f, smtp_password: e.target.value }))}
                      placeholder={account ? "Leave empty to keep current" : ""}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={form.smtp_secure}
                    onChange={(e) => setForm(f => ({ ...f, smtp_secure: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Use TLS/SSL</span>
                </label>
              </div>
            )}

            {/* IMAP Settings */}
            {form.mode === "custom" && (form.provider === "imap" || form.provider === "smtp_imap") && (
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">IMAP Settings (Incoming)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Host</label>
                    <input
                      type="text"
                      value={form.imap_host}
                      onChange={(e) => setForm(f => ({ ...f, imap_host: e.target.value }))}
                      placeholder="imap.example.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Port</label>
                    <input
                      type="number"
                      value={form.imap_port}
                      onChange={(e) => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) || 993 }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Username</label>
                    <input
                      type="text"
                      value={form.imap_user}
                      onChange={(e) => setForm(f => ({ ...f, imap_user: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
                    <input
                      type="password"
                      value={form.imap_password}
                      onChange={(e) => setForm(f => ({ ...f, imap_password: e.target.value }))}
                      placeholder={account ? "Leave empty to keep current" : ""}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={form.imap_secure}
                    onChange={(e) => setForm(f => ({ ...f, imap_secure: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Use TLS/SSL</span>
                </label>
              </div>
            )}

            {/* Sync Settings */}
            {form.mode === "custom" && (form.provider === "imap" || form.provider === "smtp_imap" || form.provider === "pop3") && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.sync_enabled}
                    onChange={(e) => setForm(f => ({ ...f, sync_enabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Enable inbox sync</span>
                </label>
                {form.sync_enabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Every</span>
                    <input
                      type="number"
                      value={form.sync_interval_minutes}
                      onChange={(e) => setForm(f => ({ ...f, sync_interval_minutes: parseInt(e.target.value) || 5 }))}
                      min={1}
                      max={60}
                      className="w-16 px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">minutes</span>
                  </div>
                )}
              </div>
            )}

            {/* Default Account */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm(f => ({ ...f, is_default: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-[var(--text-secondary)]">Set as default account</span>
            </label>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 mt-6 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : account ? "Update" : "Add Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
