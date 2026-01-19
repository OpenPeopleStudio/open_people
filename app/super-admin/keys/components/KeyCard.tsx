"use client";

import type { ApiKey } from "@/types/api-keys";
import { getProviderInfo, ENVIRONMENTS } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   Key Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface KeyCardProps {
  apiKey: ApiKey;
  selected: boolean;
  onSelect: () => void;
}

export function KeyCard({ apiKey, selected, onSelect }: KeyCardProps) {
  const provider = getProviderInfo(apiKey.provider);
  const env = ENVIRONMENTS.find(e => e.id === apiKey.environment);
  const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date();
  const isExpiringSoon = apiKey.expires_at && 
    new Date(apiKey.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    !isExpired;
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        selected
          ? "bg-[var(--electric-lime)]/5 border-[var(--electric-lime)]/30"
          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border)]"
      } ${!apiKey.is_active ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Provider Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: `${provider.color}15` }}
        >
          {provider.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
              {apiKey.name}
            </h3>
            {!apiKey.is_active && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                Disabled
              </span>
            )}
            {isExpired && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--error)]/10 text-[var(--error)]">
                Expired
              </span>
            )}
            {isExpiringSoon && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                Expiring soon
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-1.5 py-0.5 text-xs rounded font-medium"
              style={{ backgroundColor: `${provider.color}15`, color: provider.color }}
            >
              {provider.name}
            </span>
            {apiKey.project_name && (
              <span className="text-xs text-[var(--text-muted)]">
                {apiKey.project_name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] font-mono">
              {apiKey.key_hint || "••••••••"}
            </code>
            {apiKey.last_used_at && (
              <span>
                Used {formatTimeAgo(new Date(apiKey.last_used_at))}
              </span>
            )}
            {apiKey.use_count > 0 && (
              <span>
                {apiKey.use_count} uses
              </span>
            )}
          </div>
        </div>
        
        {/* Environment indicator */}
        {env && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
            style={{ backgroundColor: env.color }}
            title={env.name}
          />
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}
