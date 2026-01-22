"use client";

import { useState, useEffect } from "react";
import type { EmailAccount, EmailMessage, EmailPlan, EmailTemplate, EmailDomain, EmailLog, EmailInboxStats } from "@/types/email";
import type { ManagedEmailDomain } from "@/types/email";
import { InboxView } from "./InboxView";
import { ComposeModal } from "./ComposeModal";
import { MessageDetailPanel } from "./MessageDetailPanel";
import { AccountsManager } from "./AccountsManager";
import { TemplatesManager } from "./TemplatesManager";
import { LogsView } from "./LogsView";
import { SettingsView } from "./SettingsView";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace
   Unified email interface with compose, inbox, templates, and logs
   Desktop: sidebar + content  |  Mobile: drawer navigation
   ═══════════════════════════════════════════════════════════════════════════ */

type View = "inbox" | "sent" | "drafts" | "starred" | "archive" | "spam" | "trash" | "templates" | "accounts" | "logs" | "settings" | "all";

type Props = {
  accounts: EmailAccount[];
  messages: EmailMessage[];
  templates: EmailTemplate[];
  domains: EmailDomain[];
  managedDomains?: ManagedEmailDomain[];
  recentLogs: (EmailLog & { template?: { name: string } | null })[];
  stats: EmailInboxStats;
  plan: EmailPlan;
  tenantSlug: string;
  tenantId?: string;  // Optional - for super-admin to specify which tenant
  isSuperAdmin?: boolean;  // Whether user is super-admin
  onRefresh?: () => void;
};

export function EmailWorkspace({
  accounts: initialAccounts,
  messages: initialMessages,
  templates: initialTemplates,
  domains: initialDomains,
  managedDomains: initialManagedDomains = [],
  recentLogs,
  stats: initialStats,
  plan,
  tenantSlug,
  tenantId,
  isSuperAdmin = false,
  onRefresh,
}: Props) {
  void initialDomains;
  void tenantSlug;
  void onRefresh;
  const [accounts, setAccounts] = useState(initialAccounts);
  const [messages, setMessages] = useState(initialMessages);
  const [templates, setTemplates] = useState(initialTemplates);
  const [managedDomains, setManagedDomains] = useState<ManagedEmailDomain[]>(initialManagedDomains);
  const [stats, setStats] = useState(initialStats);
  
  const [currentView, setCurrentView] = useState<View>("inbox");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts.find(a => a.is_default)?.id || accounts[0]?.id || null
  );
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
  const [syncing, setSyncing] = useState(false);
  // Mobile drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const refreshManagedDomains = async () => {
    try {
      const res = await fetch("/api/email/domains/managed", { credentials: "include" });
      const data = await res.json();
      if (data.domains) {
        setManagedDomains(data.domains);
      }
    } catch (error) {
      console.error("Failed to refresh managed domains:", error);
    }
  };

  const handleSync = async () => {
    if (!selectedAccountId || syncing) return;
    
    setSyncing(true);
    try {
      const res = await fetch("/api/email/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId }),
      });
      
      if (res.ok) {
        // Refresh messages
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
      
      switch (currentView) {
        case "inbox":
          params.set("mailbox", "INBOX");
          break;
        case "sent":
          params.set("mailbox", "Sent");
          break;
        case "starred":
          params.set("starred", "true");
          params.set("mailbox", "all"); // Show starred from any mailbox
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
        case "all":
          params.set("mailbox", "all");
          break;
        default:
          params.set("mailbox", "INBOX");
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
    
    // Mark as read if not already
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

  const navItems = [
    { id: "inbox" as const, label: "Inbox", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75", count: stats.unread_messages },
    { id: "sent" as const, label: "Sent", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5", count: stats.sent_messages },
    { id: "starred" as const, label: "Starred", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", count: stats.starred_messages },
    { id: "drafts" as const, label: "Drafts", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z", count: stats.draft_messages },
    { id: "archive" as const, label: "Archive", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", count: stats.archived_messages },
    { id: "spam" as const, label: "Spam", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z", count: stats.spam_messages },
    { id: "trash" as const, label: "Trash", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" },
  ];

  const settingsItems = [
    { id: "templates" as const, label: "Templates", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" },
    { id: "accounts" as const, label: "Accounts", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { id: "logs" as const, label: "Activity", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "settings" as const, label: "Settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
  ];

  // Sidebar content shared between desktop and mobile
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header with close button on mobile */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Email</span>
          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close mail navigation"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Compose Button */}
      <div className="p-4">
        <button
          onClick={() => {
            setShowCompose(true);
            if (isMobile) setMobileNavOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Compose
        </button>
      </div>

      {/* Account Selector */}
      {accounts.length > 0 && (
        <div className="px-4 pb-4">
          <select
            value={selectedAccountId || ""}
            onChange={(e) => {
              setSelectedAccountId(e.target.value || null);
              setSelectedMessage(null);
            }}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mail Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              setSelectedMessage(null);
              if (isMobile) setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              currentView === item.id
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </div>
            {item.count !== undefined && item.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                {item.count}
              </span>
            )}
          </button>
        ))}

        <div className="h-px bg-[var(--border-subtle)] my-3" />

        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              setSelectedMessage(null);
              if (isMobile) setMobileNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentView === item.id
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Sync Button */}
      {selectedAccount && (selectedAccount.provider === "imap" || selectedAccount.provider === "smtp_imap" || selectedAccount.provider === "pop3") && (
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
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
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
          {selectedAccount.last_sync_at && (
            <p className="text-xs text-[var(--text-muted)] text-center mt-2">
              Last synced: {new Date(selectedAccount.last_sync_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Get view title for mobile header
  const getViewTitle = () => {
    const navItem = navItems.find(item => item.id === currentView);
    if (navItem) return navItem.label;
    const settingsItem = settingsItems.find(item => item.id === currentView);
    return settingsItem?.label || "Email";
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--void)] shrink-0">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open mail navigation"
          className="p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{getViewTitle()}</span>
        <button
          onClick={() => setShowCompose(true)}
          aria-label="Compose message"
          className="p-2 -mr-2 rounded-lg text-[var(--electric-lime)] hover:bg-[var(--surface-1)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          mobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--void)] border-r border-[var(--border-subtle)] transition-transform duration-200 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent isMobile />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 border-r border-[var(--border-subtle)] shrink-0">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Settings View takes full width */}
        {currentView === "settings" ? (
          <SettingsView
            accounts={accounts}
            managedDomains={managedDomains}
            {...(tenantId ? { tenantId } : {})}
            isSuperAdmin={isSuperAdmin}
            onAccountsChange={async () => {
              // Refresh accounts
              try {
                const res = await fetch("/api/email/accounts", { credentials: "include" });
                const data = await res.json();
                if (data.accounts) setAccounts(data.accounts);
              } catch (e) { console.error(e); }
            }}
            onDomainsChange={refreshManagedDomains}
          />
        ) : (
          <>
            {/* Message List / Settings View */}
            <div className={`${selectedMessage ? "hidden md:flex md:w-2/5" : "flex-1"} border-r border-[var(--border-subtle)] flex flex-col min-h-0`}>
              {currentView === "templates" ? (
                <TemplatesManager
                  templates={templates}
                  plan={plan}
                  onTemplatesChange={setTemplates}
                />
              ) : currentView === "accounts" ? (
                <AccountsManager
                  accounts={accounts}
                  onAccountsChange={setAccounts}
                  {...(tenantId ? { tenantId } : {})}
                  isSuperAdmin={isSuperAdmin}
                />
              ) : currentView === "logs" ? (
                <LogsView logs={recentLogs} />
              ) : (
                <InboxView
                  messages={messages}
                  selectedMessage={selectedMessage}
                  onSelectMessage={handleMessageSelect}
                  onStar={handleStar}
                  viewType={currentView}
                />
              )}
            </div>

            {/* Message Detail - Full screen on mobile when selected */}
            {selectedMessage && (
              <div className="flex-1 flex flex-col min-h-0">
                <MessageDetailPanel
                  message={selectedMessage}
                  onClose={() => setSelectedMessage(null)}
                  onReply={handleReply}
                  onStar={handleStar}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          replyTo={replyTo}
          templates={templates}
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
