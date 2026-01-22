"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { VaultAuditEntry } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Audit Log Viewer Page

   Displays security and compliance audit logs for monitoring and investigation.
   ═══════════════════════════════════════════════════════════════════════════ */

interface AuditLogEntry extends VaultAuditEntry {
  user_email?: string;
  vault_name?: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_id: '',
    vault_id: '',
    date_from: '',
    date_to: '',
    success: '',
  });

  useEffect(() => {
    loadAuditLogs();
  }, [page, filters]);

  async function loadAuditLogs() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await fetch(`/api/super-admin/audit?${params}`);
      if (!response.ok) throw new Error('Failed to load audit logs');

      const data = await response.json();
      setEntries(data.entries || []);
      setHasMore(data.has_more || false);

    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/super-admin"
            className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Audit Logs
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Security and compliance audit trail
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Actions</option>
              <option value="unlock">Unlock</option>
              <option value="lock">Lock</option>
              <option value="upload">Upload</option>
              <option value="download">Download</option>
              <option value="delete">Delete</option>
              <option value="move">Move</option>
              <option value="share">Share</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="email_ingested">Email Ingested</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Resource Type
            </label>
            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Types</option>
              <option value="file">File</option>
              <option value="folder">Folder</option>
              <option value="rule">Rule</option>
              <option value="settings">Settings</option>
              <option value="vault">Vault</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Status
            </label>
            <select
              value={filters.success}
              onChange={(e) => handleFilterChange('success', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setFilters({
                action: '',
                resource_type: '',
                user_id: '',
                vault_id: '',
                date_from: '',
                date_to: '',
                success: '',
              });
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Log Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading audit logs...</span>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No audit entries found
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <AuditLogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-2)] transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-[var(--text-muted)]">
            Page {page}
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-2)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Audit Log Entry Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface AuditLogEntryProps {
  entry: AuditLogEntry;
}

function AuditLogEntry({ entry }: AuditLogEntryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-primary)] transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 text-lg">
          {getActionIcon(entry.action)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${getSeverityColor(entry)}`}>
                  {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {entry.resource_type && (
                  <span className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                    {entry.resource_type}
                  </span>
                )}
                {!entry.success && (
                  <span className="px-2 py-0.5 text-xs rounded bg-[var(--error)]/10 text-[var(--error)]">
                    Failed
                  </span>
                )}
              </div>

              <div className="text-sm text-[var(--text-muted)] space-y-1">
                <div>
                  <span className="font-medium">User:</span> {entry.user_email || entry.performed_by || 'System'}
                </div>
                <div>
                  <span className="font-medium">Vault:</span> {entry.vault_name || entry.vault_id}
                </div>
                {entry.ip_address && (
                  <div>
                    <span className="font-medium">IP:</span> {entry.ip_address}
                  </div>
                )}
                <div>
                  <span className="font-medium">Time:</span> {formatTimestamp(entry.created_at)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Metadata</h4>
                  <pre className="text-xs bg-[var(--surface-2)] p-3 rounded overflow-x-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {entry.error_message && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--error)] mb-2">Error</h4>
                  <p className="text-sm text-[var(--error)] bg-[var(--error)]/5 p-3 rounded">
                    {entry.error_message}
                  </p>
                </div>
              )}

              {entry.user_agent && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">User Agent</h4>
                  <p className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] p-3 rounded break-all">
                    {entry.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getActionIcon(action: string) {
  const icons: Record<string, string> = {
    unlock: '🔓',
    lock: '🔒',
    upload: '📤',
    download: '📥',
    delete: '🗑️',
    move: '📁',
    share: '🔗',
    create: '➕',
    update: '✏️',
    rule_created: '📋',
    rule_deleted: '🗑️',
    email_ingested: '📧',
  };
  return icons[action] || '📝';
}

function getSeverityColor(entry: AuditLogEntry) {
  if (!entry.success) return 'text-[var(--error)]';
  if (entry.action.includes('delete') || entry.action.includes('lock')) {
    return 'text-[var(--warning)]';
  }
  return 'text-[var(--text-primary)]';
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}
