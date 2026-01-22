"use client";

import { useState } from "react";
import type { DNSRecord, ManagedEmailDomain } from "@/types/email";

type Props = {
  domain: ManagedEmailDomain;
  onVerify: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onDelete?: () => void;
};

export function DNSRecordsPanel({ domain, onVerify, onRefresh, onDelete }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerify();
    } finally {
      setVerifying(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = async (text: string, recordId: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(recordId);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "var(--success)";
      case "failed":
        return "var(--error)";
      default:
        return "var(--warning)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      case "failed":
        return "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      default:
        return "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case "dkim":
        return "Email Signing";
      case "spf":
        return "Sending Authorization";
      case "mx":
        return "Receive Emails";
      case "return-path":
        return "Bounce Handling";
      case "verification":
        return "Ownership Proof";
      default:
        return purpose;
    }
  };

  const getPurposeDescription = (purpose: string) => {
    switch (purpose) {
      case "dkim":
        return "Cryptographically signs your outgoing emails so recipients know they're really from you. This points to our email service which signs emails on your behalf.";
      case "spf":
        return "Tells email providers (Gmail, Outlook, etc.) that our service is authorized to send emails for your domain. Without this, your emails may go to spam.";
      case "mx":
        return "Routes incoming emails to your domain through our servers, so they appear in your inbox here. This is how you receive emails.";
      case "return-path":
        return "Handles bounce notifications (when emails can't be delivered) so we can let you know if a message failed.";
      case "verification":
        return "Proves you own this domain before we can send/receive emails on your behalf.";
      default:
        return "";
    }
  };

  const allVerified = domain.status === "verified";
  const records = (domain.dns_records || []) as DNSRecord[];

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 md:px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {domain.domain}
          </h3>
          <span
            className="flex items-center gap-1 md:gap-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-xs shrink-0"
            style={{
              backgroundColor: `${getStatusColor(domain.status)}15`,
              color: getStatusColor(domain.status),
            }}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={getStatusIcon(domain.status)}
              />
            </svg>
            {domain.status === "verified" ? "Verified" : domain.status === "verifying" ? "Verifying..." : "Pending"}
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onRefresh && !allVerified && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-[10px] md:text-xs font-medium hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
              title="Refresh DNS records from provider"
            >
              <svg className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          )}
          <button
            onClick={handleVerify}
            disabled={verifying || allVerified}
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-[10px] md:text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {verifying ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span className="hidden sm:inline">Verifying...</span>
              </>
            ) : allVerified ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Verified</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verify</span>
              </>
            )}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* What is this section */}
      {!allVerified && (
        <div className="px-4 py-4 bg-[var(--surface-2)] border-b border-[var(--border-subtle)]">
          {/* Explainer box */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--electric-lime)]/5 border border-[var(--electric-lime)]/20">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[var(--electric-lime)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">What is this?</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  You chose <strong>Managed Email</strong> which means we handle sending and receiving emails for your domain. 
                  To make this work, you need to add these DNS records to prove you own the domain and route emails through our service.
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  <strong>No server credentials needed</strong> — once verified, you can send and receive emails directly from this app.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--electric-lime)]">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Add DNS Records</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Log in to where you bought your domain (GoDaddy, Namecheap, Cloudflare, etc.) and add each record from the table below.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--electric-lime)]">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Wait for Propagation</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                DNS changes can take 5 minutes to 48 hours to spread across the internet.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--electric-lime)]">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Verify Your Domain</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Click &quot;Verify DNS&quot; above to check if your records are set up correctly. Once all green, you&apos;re ready to send and receive!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DNS Records - Desktop Table / Mobile Cards */}
      <div>
        {/* Table header explanation */}
        <div className="px-3 md:px-4 py-2 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
          <p className="text-[10px] md:text-xs text-[var(--text-muted)]">
            Copy these values exactly into your DNS settings. <span className="hidden sm:inline">Hover over the <span className="border-b border-dotted border-[var(--border-subtle)]">Purpose</span> to see what each record does.</span>
          </p>
        </div>

        {/* Mobile: Card Layout */}
        <div className="md:hidden space-y-3 p-3">
          {records.map((record, index) => (
            <div key={index} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-3)] text-xs font-mono text-[var(--text-secondary)]">
                    {record.type}
                  </span>
                  {record.priority !== undefined && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Priority: {record.priority}
                    </span>
                  )}
                </div>
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ backgroundColor: `${getStatusColor(record.status)}15` }}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    style={{ color: getStatusColor(record.status) }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={getStatusIcon(record.status)} />
                  </svg>
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Name/Host</span>
                    <button
                      onClick={() => copyToClipboard(record.name, `name-${index}`)}
                      className="p-1 rounded hover:bg-[var(--surface-3)] transition-colors"
                    >
                      {copied === `name-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <code className="text-xs text-[var(--text-secondary)] font-mono break-all">
                    {record.name}
                  </code>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Value</span>
                    <button
                      onClick={() => copyToClipboard(record.value, `value-${index}`)}
                      className="p-1 rounded hover:bg-[var(--surface-3)] transition-colors"
                    >
                      {copied === `value-${index}` ? (
                        <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <code className="text-xs text-[var(--text-secondary)] font-mono break-all">
                    {record.value}
                  </code>
                </div>

                <div className="pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {getPurposeLabel(record.purpose)}: {getPurposeDescription(record.purpose)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Name/Host</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)]">Why needed?</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {records.map((record, index) => (
                <tr key={index} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-3)] text-xs font-mono text-[var(--text-secondary)]">
                      {record.type}
                    </span>
                    {record.priority !== undefined && (
                      <span className="ml-1 text-xs text-[var(--text-muted)]">
                        (Priority: {record.priority})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-[200px]">
                        {record.name}
                      </code>
                      <button
                        onClick={() => copyToClipboard(record.name, `name-${index}`)}
                        className="p-1 rounded hover:bg-[var(--surface-3)] transition-colors"
                        title="Copy"
                      >
                        {copied === `name-${index}` ? (
                          <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-[300px]">
                        {record.value}
                      </code>
                      <button
                        onClick={() => copyToClipboard(record.value, `value-${index}`)}
                        className="p-1 rounded hover:bg-[var(--surface-3)] transition-colors"
                        title="Copy"
                      >
                        {copied === `value-${index}` ? (
                          <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="group relative">
                      <span className="text-xs text-[var(--text-muted)] cursor-help border-b border-dotted border-[var(--border-subtle)]">
                        {getPurposeLabel(record.purpose)}
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] shadow-lg">
                        <p className="text-xs text-[var(--text-secondary)]">
                          {getPurposeDescription(record.purpose)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                      style={{
                        backgroundColor: `${getStatusColor(record.status)}15`,
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        style={{ color: getStatusColor(record.status) }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={getStatusIcon(record.status)}
                        />
                      </svg>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      {!allVerified && (
        <div className="border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-3 md:px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Need help adding DNS records?
            </span>
            <svg 
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showHelp ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showHelp && (
            <div className="px-3 md:px-4 pb-4 space-y-4">
              {/* Common Registrars */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Popular DNS Providers:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a 
                    href="https://www.cloudflare.com/learning/dns/dns-records/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">Cloudflare</span>
                    <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.godaddy.com/help/add-a-txt-record-19232" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">GoDaddy</span>
                    <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdaborother-records-for-my-domain/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">Namecheap</span>
                    <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a 
                    href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/rrsets-working-with.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <span className="text-xs text-[var(--text-secondary)]">AWS Route 53</span>
                    <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/20">
                <p className="text-xs font-medium text-[var(--warning)] mb-1">Tips:</p>
                <ul className="text-xs text-[var(--text-muted)] space-y-1">
                  <li>• Some registrars add your domain automatically - if asked for &quot;Host&quot; or &quot;Name&quot;, you may only need the subdomain part (e.g., just &quot;_dmarc&quot; instead of &quot;_dmarc.yourdomain.com&quot;)</li>
                  <li>• For MX records, make sure to set the priority/preference value</li>
                  <li>• TXT record values should be copied exactly - include any quotes if present</li>
                  <li>• CNAME records cannot coexist with other records at the same name</li>
                </ul>
              </div>

              {/* Troubleshooting */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Still not verifying?</p>
                <ul className="text-xs text-[var(--text-muted)] space-y-1">
                  <li>• Wait longer - DNS can take up to 48 hours</li>
                  <li>• Check for typos in the record values</li>
                  <li>• Make sure you&apos;re editing DNS for the correct domain</li>
                  <li>• Try a DNS lookup tool like <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-[var(--electric-lime)] hover:underline">dnschecker.org</a> to verify propagation</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {allVerified && (
        <div className="px-4 py-4 border-t border-[var(--border-subtle)] bg-[var(--success)]/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--success)]">Domain verified!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your domain is fully configured. You can now send and receive emails using <strong>@{domain.domain}</strong> directly from this app.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Checked */}
      {domain.last_check_at && (
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-2)]">
          <p className="text-xs text-[var(--text-muted)]">
            Last checked: {new Date(domain.last_check_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
