"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailAccount, EmailMessage, EmailInboxStats } from "@/types/email";
import { InboxView } from "@/components/email/InboxView";
import { MessageDetailPanel } from "@/components/email/MessageDetailPanel";
import { ComposeModal } from "@/components/email/ComposeModal";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Client Component
   Full-page unified inbox with message preview and compose
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  accounts: EmailAccount[];
  messages: EmailMessage[];
  stats: EmailInboxStats;
  tenantId: string;
};

type ViewType = "inbox" | "sent" | "starred" | "drafts" | "archive" | "spam" | "trash";

export function EmailInboxClient({ 
  accounts, 
  messages: initialMessages, 
  stats: initialStats,
  tenantId 
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [stats, setStats] = useState(initialStats);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleSync = async (fullSync: boolean = false) => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      const res = await fetch("/api/email/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accountId: selectedAccountId,
          fullSync,
          limit: fullSync ? 200 : 50, // Fetch more emails during full sync
        }),
      });
      
      if (res.ok) {
        await refreshMessages();
        await refreshStats();
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const refreshMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAccountId) params.set("accountId", selectedAccountId);
      if (searchQuery) params.set("search", searchQuery);
      
      switch (currentView) {
        case "sent":
          params.set("direction", "outbound");
          break;
        case "starred":
          params.set("starred", "true");
          break;
        case "trash":
          params.set("mailbox", "Trash");
          break;
        case "spam":
          params.set("mailbox", "Spam");
          break;
        case "archive":
          params.set("mailbox", "Archive");
          break;
      }
      
      const res = await fetch(`/api/email/inbox?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Refresh messages error:", error);
    }
  };

  const refreshStats = async () => {
    try {
      const params = selectedAccountId ? `?accountId=${selectedAccountId}` : "";
      const res = await fetch(`/api/email/inbox/stats${params}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Refresh stats error:", error);
    }
  };

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
      refreshStats();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleReply = (message: EmailMessage) => {
    setReplyTo(message);
    setShowCompose(true);
  };

  const handleComposeSent = () => {
    setShowCompose(false);
    setReplyTo(null);
    refreshMessages();
    refreshStats();
  };

  const viewTabs = [
    { id: "inbox" as const, label: "Inbox", count: stats.unread_messages },
    { id: "sent" as const, label: "Sent", count: stats.sent_messages },
    { id: "starred" as const, label: "Starred", count: stats.starred_messages },
    { id: "drafts" as const, label: "Drafts", count: stats.draft_messages },
    { id: "archive" as const, label: "Archive", count: stats.archived_messages },
    { id: "spam" as const, label: "Spam", count: stats.spam_messages },
    { id: "trash" as const, label: "Trash", count: 0 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/email"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Email
          </Link>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Inbox</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Account Filter */}
          {accounts.length > 0 && (
            <select
              value={selectedAccountId || ""}
              onChange={(e) => {
                setSelectedAccountId(e.target.value || null);
                setSelectedMessage(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}

          {/* Sync Button with Dropdown */}
          {selectedAccount && (selectedAccount.provider === "imap" || selectedAccount.provider === "smtp_imap" || selectedAccount.provider === "pop3") && (
            <div className="relative group">
              <div className="flex">
                <button
                  onClick={() => handleSync(false)}
                  disabled={syncing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-l-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 border-r border-[var(--border-subtle)]"
                >
                  <svg 
                    className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  {syncing ? "Syncing..." : "Sync"}
                </button>
                <button
                  disabled={syncing}
                  className="px-2 py-1.5 rounded-r-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface-2)] rounded-lg shadow-lg border border-[var(--border-subtle)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => handleSync(false)}
                  disabled={syncing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] rounded-t-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Sync New Emails
                </button>
                <button
                  onClick={() => handleSync(true)}
                  disabled={syncing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] rounded-b-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                  Full Sync (All Emails)
                </button>
              </div>
            </div>
          )}

          {/* Compose Button */}
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Compose
          </button>
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
                refreshMessages();
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
            onKeyDown={(e) => e.key === "Enter" && refreshMessages()}
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
            messages={messages}
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
              onReply={handleReply}
              onStar={handleStar}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          replyTo={replyTo}
          templates={[]}
          onClose={() => {
            setShowCompose(false);
            setReplyTo(null);
          }}
          onSent={handleComposeSent}
        />
      )}
    </div>
  );
}
