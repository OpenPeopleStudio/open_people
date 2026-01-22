"use client";

import { useState, useEffect } from "react";
import type { EmailAccount, ManagedEmailDomain } from "@/types/email";
import { DNSRecordsPanel } from "./DNSRecordsPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Settings View
   Desktop: sidebar + content  |  Mobile: stacked with collapsible nav
   ═══════════════════════════════════════════════════════════════════════════ */

type SettingsSection = "domains" | "defaults" | "signatures" | "notifications" | "security" | "sync";

type Props = {
  accounts: EmailAccount[];
  managedDomains: ManagedEmailDomain[];
  tenantId?: string;
  isSuperAdmin?: boolean;
  onAccountsChange?: () => void;
  onDomainsChange?: () => void;
};

type EmailDefaults = {
  default_account_id: string | null;
  default_signature_id: string | null;
  reply_to_same_account: boolean;
  include_signature_in_replies: boolean;
  auto_save_drafts: boolean;
  draft_save_interval_seconds: number;
};

type EmailSignature = {
  id: string;
  name: string;
  content_html: string;
  content_text: string;
  is_default: boolean;
};

type NotificationSettings = {
  email_notifications: boolean;
  push_notifications: boolean;
  notify_on_new_email: boolean;
  notify_on_reply: boolean;
  notify_on_mention: boolean;
  digest_frequency: "none" | "daily" | "weekly";
};

type SyncSettings = {
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  sync_on_open: boolean;
  max_emails_per_sync: number;
  sync_sent_folder: boolean;
  sync_deleted_folder: boolean;
};

type SecuritySettings = {
  block_external_images: boolean;
  block_tracking_pixels: boolean;
  warn_external_links: boolean;
  require_tls: boolean;
};

export function SettingsView({ 
  accounts, 
  managedDomains: initialDomains, 
  onDomainsChange,
}: Props) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("domains");
  const [managedDomains, setManagedDomains] = useState<ManagedEmailDomain[]>(initialDomains);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings states
  const [defaults, setDefaults] = useState<EmailDefaults>({
    default_account_id: accounts.find(a => a.is_default)?.id || null,
    default_signature_id: null,
    reply_to_same_account: true,
    include_signature_in_replies: true,
    auto_save_drafts: true,
    draft_save_interval_seconds: 30,
  });

  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);
  void setSignatures;

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    notify_on_new_email: true,
    notify_on_reply: true,
    notify_on_mention: true,
    digest_frequency: "none",
  });

  const [sync, setSync] = useState<SyncSettings>({
    auto_sync_enabled: true,
    sync_interval_minutes: 5,
    sync_on_open: true,
    max_emails_per_sync: 100,
    sync_sent_folder: true,
    sync_deleted_folder: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    block_external_images: false,
    block_tracking_pixels: true,
    warn_external_links: true,
    require_tls: true,
  });

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/email/settings", { credentials: "include" });
        const data = await res.json();
        if (data.settings) {
          if (data.settings.defaults) setDefaults(data.settings.defaults);
          if (data.settings.notifications) setNotifications(data.settings.notifications);
          if (data.settings.sync) setSync(data.settings.sync);
          if (data.settings.security) setSecurity(data.settings.security);
        }
      } catch (error) {
        console.error("Failed to load email settings:", error);
      }
    }
    loadSettings();
  }, []);

  // Verify domain
  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: domainId, action: "verify" }),
      });
      const data = await res.json();
      if (data.domain) {
        setManagedDomains(prev => prev.map(d => d.id === domainId ? data.domain : d));
        setMessage({ type: "success", text: data.message || "Domain verification checked" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to verify domain" });
    }
  };

  // Refresh domain DNS records from Resend
  const handleRefreshDomain = async (domainId: string) => {
    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: domainId, action: "refresh" }),
      });
      const data = await res.json();
      if (data.domain) {
        setManagedDomains(prev => prev.map(d => d.id === domainId ? data.domain : d));
        setMessage({ type: "success", text: "DNS records refreshed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to refresh DNS records" });
    }
  };

  // Delete domain
  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain? This cannot be undone.")) return;
    
    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: domainId }),
      });
      if (res.ok) {
        setManagedDomains(prev => prev.filter(d => d.id !== domainId));
        setMessage({ type: "success", text: "Domain deleted" });
        onDomainsChange?.();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete domain" });
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  const sections: { id: SettingsSection; label: string; icon: string; description: string }[] = [
    { 
      id: "domains", 
      label: "Domains & DNS", 
      icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418",
      description: "Manage domains and verify DNS records for sending emails"
    },
    { 
      id: "defaults", 
      label: "Defaults", 
      icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
      description: "Default sending account, signatures, and compose behavior"
    },
    { 
      id: "signatures", 
      label: "Signatures", 
      icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      description: "Create and manage email signatures"
    },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
      description: "Email and push notification preferences"
    },
    { 
      id: "sync", 
      label: "Sync & Fetch", 
      icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
      description: "IMAP/POP3 sync intervals and behavior"
    },
    { 
      id: "security", 
      label: "Security & Privacy", 
      icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
      description: "Privacy settings and security features"
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "domains":
        return (
          <div className="space-y-6">
            {/* Managed Domains */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Managed Domains</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Domains configured for DNS-only email (no SMTP/IMAP credentials needed)
                  </p>
                </div>
              </div>

              {managedDomains.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]">
                  <svg className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  <p className="text-sm text-[var(--text-muted)]">No managed domains configured</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Add an email account with &quot;Managed&quot; mode to set up a domain
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {managedDomains.map((domain) => (
                    <DNSRecordsPanel
                      key={domain.id}
                      domain={domain}
                      onVerify={() => handleVerifyDomain(domain.id)}
                      onRefresh={() => handleRefreshDomain(domain.id)}
                      onDelete={() => handleDeleteDomain(domain.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Account Domains Overview */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">All Email Accounts</h3>
              <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-2)]">
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Domain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {accounts.map((account) => {
                      const domain = account.email_address.split("@")[1];
                      const managedDomain = managedDomains.find(d => d.domain === domain);
                      return (
                        <tr key={account.id} className="hover:bg-[var(--surface-2)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-primary)]">{account.email_address}</span>
                              {account.is_default && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs rounded bg-[var(--surface-3)] text-[var(--text-secondary)]">
                              {account.mode === "managed" ? "Managed" : account.provider?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {account.is_active ? (
                              <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                            {managedDomain ? (
                              <span className={`flex items-center gap-1 ${managedDomain.status === "verified" ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                                {managedDomain.status === "verified" ? "✓ Verified" : "⏳ Pending"}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">External</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "defaults":
        return (
          <div className="space-y-6">
            {/* Default Account */}
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Default Sending Account
              </label>
              <select
                value={defaults.default_account_id || ""}
                onChange={(e) => setDefaults(d => ({ ...d, default_account_id: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
              >
                <option value="">Select default account...</option>
                {accounts.filter(a => a.is_active).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email_address} ({account.name})
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                This account will be selected by default when composing new emails
              </p>
            </div>

            {/* Reply Behavior */}
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Reply Behavior</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaults.reply_to_same_account}
                  onChange={(e) => setDefaults(d => ({ ...d, reply_to_same_account: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Reply from same account</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    When replying, use the account the email was sent to
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaults.include_signature_in_replies}
                  onChange={(e) => setDefaults(d => ({ ...d, include_signature_in_replies: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Include signature in replies</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Automatically add your signature when replying to emails
                  </p>
                </div>
              </label>
            </div>

            {/* Draft Settings */}
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Drafts</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaults.auto_save_drafts}
                  onChange={(e) => setDefaults(d => ({ ...d, auto_save_drafts: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Auto-save drafts</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Automatically save emails as drafts while composing
                  </p>
                </div>
              </label>

              {defaults.auto_save_drafts && (
                <div className="ml-7">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Save interval</label>
                  <select
                    value={defaults.draft_save_interval_seconds}
                    onChange={(e) => setDefaults(d => ({ ...d, draft_save_interval_seconds: parseInt(e.target.value) }))}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                  >
                    <option value={10}>Every 10 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every minute</option>
                    <option value={120}>Every 2 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        );

      case "signatures":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                Create signatures to automatically add to your emails
              </p>
              <button
                onClick={() => setEditingSignature({
                  id: "",
                  name: "New Signature",
                  content_html: "",
                  content_text: "",
                  is_default: signatures.length === 0,
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-medium hover:opacity-90"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Signature
              </button>
            </div>

            {signatures.length === 0 && !editingSignature ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]">
                <svg className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <p className="text-sm text-[var(--text-muted)]">No signatures yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Create a signature to add to your outgoing emails
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {signatures.map((sig) => (
                  <div key={sig.id} className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{sig.name}</span>
                        {sig.is_default && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingSignature(sig)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] line-clamp-2" dangerouslySetInnerHTML={{ __html: sig.content_html || sig.content_text }} />
                  </div>
                ))}
              </div>
            )}

            {/* Signature Editor Modal */}
            {editingSignature && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-lg bg-[var(--surface-1)] rounded-2xl border border-[var(--border-subtle)] shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {editingSignature.id ? "Edit Signature" : "New Signature"}
                    </h3>
                    <button onClick={() => setEditingSignature(null)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
                      <input
                        type="text"
                        value={editingSignature.name}
                        onChange={(e) => setEditingSignature(s => s ? { ...s, name: e.target.value } : null)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                        placeholder="e.g., Work, Personal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Signature Content</label>
                      <textarea
                        value={editingSignature.content_text}
                        onChange={(e) => setEditingSignature(s => s ? { ...s, content_text: e.target.value, content_html: e.target.value.replace(/\n/g, "<br>") } : null)}
                        rows={6}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-mono"
                        placeholder="Best regards,&#10;John Doe&#10;Company Inc."
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSignature.is_default}
                        onChange={(e) => setEditingSignature(s => s ? { ...s, is_default: e.target.checked } : null)}
                        className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                      />
                      <span className="text-sm text-[var(--text-primary)]">Set as default signature</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => setEditingSignature(null)}
                      className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Save signature logic here
                        setEditingSignature(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90"
                    >
                      Save Signature
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Notification Channels</h3>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Email notifications</span>
                  <p className="text-xs text-[var(--text-muted)]">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_notifications}
                  onChange={(e) => setNotifications(n => ({ ...n, email_notifications: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Push notifications</span>
                  <p className="text-xs text-[var(--text-muted)]">Receive browser push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.push_notifications}
                  onChange={(e) => setNotifications(n => ({ ...n, push_notifications: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Notify me when...</h3>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[var(--text-primary)]">I receive a new email</span>
                <input
                  type="checkbox"
                  checked={notifications.notify_on_new_email}
                  onChange={(e) => setNotifications(n => ({ ...n, notify_on_new_email: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[var(--text-primary)]">Someone replies to my email</span>
                <input
                  type="checkbox"
                  checked={notifications.notify_on_reply}
                  onChange={(e) => setNotifications(n => ({ ...n, notify_on_reply: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[var(--text-primary)]">I&apos;m mentioned in an email</span>
                <input
                  type="checkbox"
                  checked={notifications.notify_on_mention}
                  onChange={(e) => setNotifications(n => ({ ...n, notify_on_mention: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email Digest
              </label>
              <select
                value={notifications.digest_frequency}
                onChange={(e) => setNotifications(n => ({ ...n, digest_frequency: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
              >
                <option value="none">Don&apos;t send digests</option>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly summary</option>
              </select>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Receive a summary of your email activity
              </p>
            </div>
          </div>
        );

      case "sync":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Auto Sync</h3>
              <p className="text-xs text-[var(--text-muted)]">
                These settings apply to IMAP and POP3 accounts only. Managed domains receive emails instantly via webhooks.
              </p>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Enable auto-sync</span>
                  <p className="text-xs text-[var(--text-muted)]">Automatically check for new emails</p>
                </div>
                <input
                  type="checkbox"
                  checked={sync.auto_sync_enabled}
                  onChange={(e) => setSync(s => ({ ...s, auto_sync_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              {sync.auto_sync_enabled && (
                <div className="ml-4 pl-4 border-l-2 border-[var(--border-subtle)]">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Sync interval</label>
                  <select
                    value={sync.sync_interval_minutes}
                    onChange={(e) => setSync(s => ({ ...s, sync_interval_minutes: parseInt(e.target.value) }))}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                  >
                    <option value={1}>Every minute</option>
                    <option value={5}>Every 5 minutes</option>
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                  </select>
                </div>
              )}

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Sync when opening email</span>
                  <p className="text-xs text-[var(--text-muted)]">Check for new emails when you open the inbox</p>
                </div>
                <input
                  type="checkbox"
                  checked={sync.sync_on_open}
                  onChange={(e) => setSync(s => ({ ...s, sync_on_open: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Sync Options</h3>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Maximum emails per sync</label>
                <select
                  value={sync.max_emails_per_sync}
                  onChange={(e) => setSync(s => ({ ...s, max_emails_per_sync: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                >
                  <option value={25}>25 emails</option>
                  <option value={50}>50 emails</option>
                  <option value={100}>100 emails</option>
                  <option value={250}>250 emails</option>
                  <option value={500}>500 emails</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[var(--text-primary)]">Sync sent folder</span>
                <input
                  type="checkbox"
                  checked={sync.sync_sent_folder}
                  onChange={(e) => setSync(s => ({ ...s, sync_sent_folder: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[var(--text-primary)]">Sync deleted/trash folder</span>
                <input
                  type="checkbox"
                  checked={sync.sync_deleted_folder}
                  onChange={(e) => setSync(s => ({ ...s, sync_deleted_folder: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Privacy Protection</h3>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Block external images</span>
                  <p className="text-xs text-[var(--text-muted)]">Don&apos;t load images from external servers (prevents tracking)</p>
                </div>
                <input
                  type="checkbox"
                  checked={security.block_external_images}
                  onChange={(e) => setSecurity(s => ({ ...s, block_external_images: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Block tracking pixels</span>
                  <p className="text-xs text-[var(--text-muted)]">Detect and block email tracking pixels</p>
                </div>
                <input
                  type="checkbox"
                  checked={security.block_tracking_pixels}
                  onChange={(e) => setSecurity(s => ({ ...s, block_tracking_pixels: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Warn about external links</span>
                  <p className="text-xs text-[var(--text-muted)]">Show a warning before opening links to external websites</p>
                </div>
                <input
                  type="checkbox"
                  checked={security.warn_external_links}
                  onChange={(e) => setSecurity(s => ({ ...s, warn_external_links: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Connection Security</h3>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Require TLS encryption</span>
                  <p className="text-xs text-[var(--text-muted)]">Only send emails over encrypted connections</p>
                </div>
                <input
                  type="checkbox"
                  checked={security.require_tls}
                  onChange={(e) => setSecurity(s => ({ ...s, require_tls: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)]"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[var(--warning)]/5 border border-[var(--warning)]/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[var(--warning)]">Security Tip</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Enable &quot;Block tracking pixels&quot; to prevent senders from knowing when you open their emails. 
                    This is especially recommended for business communications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Mobile Section Selector */}
      <div className="md:hidden p-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value as SettingsSection)}
          className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Settings Sidebar */}
      <div className="hidden md:block w-56 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Email Settings</h2>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                </svg>
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Section Header */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)]">
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>

          {/* Toast Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success" 
                ? "bg-[var(--success)]/10 text-[var(--success)]" 
                : "bg-[var(--error)]/10 text-[var(--error)]"
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={
                  message.type === "success" 
                    ? "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                } />
              </svg>
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Section Content */}
          {renderSection()}

          {/* Save Button (for non-domains sections) */}
          {activeSection !== "domains" && activeSection !== "signatures" && (
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                onClick={async () => {
                  setSaving(true);
                  setMessage(null);
                  
                  try {
                    // Save settings to API
                    const res = await fetch("/api/email/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        section: activeSection,
                        ...(activeSection === "defaults" ? { defaults } : {}),
                        ...(activeSection === "notifications" ? { notifications } : {}),
                        ...(activeSection === "sync" ? { sync } : {}),
                        ...(activeSection === "security" ? { security } : {}),
                      }),
                    });
                    
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || "Failed to save settings");
                    }
                    
                    setMessage({ type: "success", text: "Settings saved" });
                  } catch (error) {
                    console.error("Save settings error:", error);
                    setMessage({ 
                      type: "error", 
                      text: error instanceof Error ? error.message : "Failed to save settings" 
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
