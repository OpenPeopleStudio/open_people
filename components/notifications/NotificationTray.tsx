"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { InAppNotification } from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Notification Tray Component
   Bell icon with dropdown showing recent in-app notifications
   ═══════════════════════════════════════════════════════════════════════════ */

interface NotificationTrayProps {
  /** Link to the full notifications page */
  notificationsHref?: string;
  /** Polling interval in milliseconds (0 to disable) */
  pollInterval?: number;
}

export function NotificationTray({
  notificationsHref = "/admin/notifications",
  pollInterval = 30000,
}: NotificationTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/inbox?limit=10");
      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    if (pollInterval > 0) {
      const interval = setInterval(fetchNotifications, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollInterval]);

  // Re-fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Mark notifications as read
  const markAsRead = async (ids?: string[]) => {
    try {
      const body = ids ? { notificationIds: ids } : { markAllRead: true };
      const res = await fetch("/api/notifications/inbox", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Update local state
        if (ids) {
          setNotifications((prev) =>
            prev.map((n) =>
              ids.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - ids.length));
        } else {
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
          );
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-[var(--error)] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 max-h-[480px] bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-[var(--electric-lime)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[var(--electric-lime)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <svg
                  className="w-10 h-10 text-[var(--text-muted)] mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
                <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkRead={() => markAsRead([notification.id])}
                      onClose={() => setIsOpen(false)}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-subtle)] px-4 py-3">
            <Link
              href={notificationsHref}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-[var(--electric-lime)] hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Notification Item Component
   Individual notification row
   ───────────────────────────────────────────────────────────────────────────── */

interface NotificationItemProps {
  notification: InAppNotification;
  onMarkRead: () => void;
  onClose: () => void;
  formatRelativeTime: (date: string) => string;
}

function NotificationItem({
  notification,
  onMarkRead,
  onClose,
  formatRelativeTime,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead();
    }
    onClose();
  };

  const content = (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors ${
        notification.is_read
          ? "bg-transparent hover:bg-[var(--surface-2)]"
          : "bg-[var(--electric-lime)]/5 hover:bg-[var(--electric-lime)]/10"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          notification.is_read
            ? "bg-[var(--surface-2)] text-[var(--text-muted)]"
            : "bg-[var(--electric-lime)]/20 text-[var(--electric-lime)]"
        }`}
      >
        {notification.icon ? (
          <span className="text-lg">{notification.icon}</span>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm line-clamp-1 ${
            notification.is_read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-medium"
          }`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{notification.body}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)] shrink-0 mt-1.5" />
      )}
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className="w-full text-left">
      {content}
    </button>
  );
}
