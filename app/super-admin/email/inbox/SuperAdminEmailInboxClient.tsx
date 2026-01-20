"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailAccount, EmailMessage, EmailInboxStats } from "@/types/email";
import { InboxView } from "@/components/email/InboxView";
import { MessageDetailPanel } from "@/components/email/MessageDetailPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Email Inbox Client Component
   Platform-wide inbox monitoring with tenant filtering
   ═══════════════════════════════════════════════════════════════════════════ */

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  accounts: EmailAccount[];
  messages: EmailMessage[];
  stats: EmailInboxStats;
  tenants: Tenant[];
};

type ViewType = "inbox" | "sent" | "starred" | "drafts" | "archive" | "spam" | "trash";

export function SuperAdminEmailInboxClient({ 
  accounts, 
  messages: initialMessages, 
  stats: initialStats,
  tenants 
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [stats, setStats] = useState(initialStats);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter accounts by tenant
  const filteredAccounts = selectedTenantId
    ? accounts.filter(a => a.tenant_id === selectedTenantId)
    : accounts;

  // Filter messages by tenant and account
  const filteredMessages = messages.filter(msg => {
    if (selectedTenantId && msg.tenant_id !== selectedTenantId) return false;
    if (selectedAccountId && msg.account_id !== selectedAccountId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        msg.subject?.toLowerCase().includes(query) ||
        msg.from_address?.toLowerCase().includes(query) ||
        msg.body_preview?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleMessageSelect = async (message: EmailMessage) => {
    setSelectedMessage(message);
    
    if (!message.is_read) {
      try {
        await fetch(`/api/email/messages/${message.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        });
        
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        ));
        setStats(prev => ({ ...prev, unread_messages: Math.max(0, prev.unread_messages - 1) }));
      } catch (error) {
        console.error("Mark read error:", error);
      }
    }
  };

  const handleStar = async (message: EmailMessage) => {
    try {
      await fetch(`/api/email/messages/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: !message.is_starred }),
      });
      
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_starred: !m.is_starred } : m
      ));
      
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...message, is_starred: !message.is_starred });
      }
    } catch (error) {
      console.error("Star error:", error);
    }
  };

  const handleDelete = async (message: EmailMessage) => {
    try {
      await fetch(`/api/email/messages/${message.id}`, {
        method: "DELETE",
      });
      
      setMessages(prev => prev.filter(m => m.id !== message.id));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const viewTabs = [
    { id: "inbox" as const, label: "All Messages", count: stats.total_messages },
    { id: "sent" as const, label: "Sent", count: stats.sent_messages },
    { id: "starred" as const, label: "Starred", count: stats.starred_messages },
    { id: "spam" as const, label: "Spam", count: stats.spam_messages },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/email"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Email
          </Link>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Platform Inbox</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Monitor all emails across the platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tenant Filter */}
          <select
            value={selectedTenantId || ""}
            onChange={(e) => {
              setSelectedTenantId(e.target.value || null);
              setSelectedAccountId(null);
              setSelectedMessage(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          {filteredAccounts.length > 0 && (
            <select
              value={selectedAccountId || ""}
              onChange={(e) => {
                setSelectedAccountId(e.target.value || null);
                setSelectedMessage(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Accounts</option>
              {filteredAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* View Tabs & Search */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentView(tab.id);
                setSelectedMessage(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentView === tab.id
                  ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-4 py-1.5 w-64 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message List */}
        <div className={`${selectedMessage ? "w-2/5" : "flex-1"} border-r border-[var(--border-subtle)] overflow-hidden`}>
          <InboxView
            messages={filteredMessages}
            selectedMessage={selectedMessage}
            onSelectMessage={handleMessageSelect}
            onStar={handleStar}
            onDelete={handleDelete}
            viewType={currentView}
          />
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div className="flex-1 overflow-hidden">
            <MessageDetailPanel
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
              onReply={() => {}} // Super admin can't reply from here
              onStar={handleStar}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
