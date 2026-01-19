"use client";

import { useState } from "react";
import type { VaultSession } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Sessions Section
   View and manage active vault sessions
   ═══════════════════════════════════════════════════════════════════════════ */

interface SessionsSectionProps {
  sessionId: string;
  currentSessionId: string;
  sessions: VaultSession[];
  onSessionRevoked: (sessionId: string) => void;
}

export function SessionsSection({ 
  sessionId, 
  currentSessionId,
  sessions, 
  onSessionRevoked 
}: SessionsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  
  async function handleRevokeSession(targetSessionId: string) {
    if (targetSessionId === currentSessionId) {
      alert("You cannot revoke your current session. Use the lock button instead.");
      return;
    }
    
    setRevoking(targetSessionId);
    
    try {
      const res = await fetch(`/api/vault/sessions/${targetSessionId}`, {
        method: "DELETE",
        headers: { "x-vault-session": sessionId },
      });
      
      if (res.ok) {
        onSessionRevoked(targetSessionId);
      }
    } catch (err) {
      console.error("Failed to revoke session:", err);
    } finally {
      setRevoking(null);
    }
  }
  
  async function handleRevokeAllOther() {
    if (!confirm("Revoke all other sessions? This will log out all other devices.")) {
      return;
    }
    
    setRevoking("all");
    
    try {
      const res = await fetch("/api/vault/sessions", {
        method: "DELETE",
        headers: { "x-vault-session": sessionId },
      });
      
      if (res.ok) {
        // Remove all sessions except current
        sessions.forEach(s => {
          if (s.id !== currentSessionId) {
            onSessionRevoked(s.id);
          }
        });
      }
    } catch (err) {
      console.error("Failed to revoke sessions:", err);
    } finally {
      setRevoking(null);
    }
  }
  
  const activeSessions = sessions.filter(s => s.is_active);
  
  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Active Sessions
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {activeSessions.length} device{activeSessions.length !== 1 ? "s" : ""} currently logged in
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
          <div className="mt-4 space-y-2">
            {activeSessions.map(session => {
              const isCurrent = session.id === currentSessionId;
              const isRevoking = revoking === session.id;
              
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrent ? "bg-[var(--electric-lime)]/5 border border-[var(--electric-lime)]/20" : "bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-1)] flex items-center justify-center">
                      <DeviceIcon deviceName={session.device_name || "Unknown"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {session.device_name || "Unknown Device"}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {session.ip_address && `${session.ip_address} · `}
                        Last active {formatTimeAgo(new Date(session.last_activity_at))}
                      </p>
                    </div>
                  </div>
                  
                  {!isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={!!revoking}
                      className="px-3 py-1.5 text-xs rounded-lg bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 disabled:opacity-50 transition-colors"
                    >
                      {isRevoking ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {activeSessions.length > 1 && (
            <button
              onClick={handleRevokeAllOther}
              disabled={!!revoking}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 disabled:opacity-50 transition-colors"
            >
              {revoking === "all" ? "Revoking..." : "Revoke All Other Sessions"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DeviceIcon({ deviceName }: { deviceName: string }) {
  const name = deviceName.toLowerCase();
  
  if (name.includes("iphone") || name.includes("android")) {
    return (
      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    );
  }
  
  if (name.includes("ipad") || name.includes("tablet")) {
    return (
      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
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
