"use client";

import { useEffect, useRef, useState } from "react";
import type { EmailMessage, EmailThread } from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Real-time Hook
   Provides real-time email updates via Server-Sent Events
   ═══════════════════════════════════════════════════════════════════════════ */

export interface EmailRealtimeEvent {
  type: "connected" | "subscribed" | "ping" | "email_update" | "thread_update";
  timestamp: string;
  event?: string;
  table?: string;
  record?: any;
  user_id?: string;
  tenant_id?: string;
}

export interface UseEmailRealtimeOptions {
  onEmailUpdate?: (email: EmailMessage) => void;
  onThreadUpdate?: (thread: EmailThread) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
}

export function useEmailRealtime(options: UseEmailRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    onEmailUpdate,
    onThreadUpdate,
    onConnected,
    onError,
  } = options;

  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource("/api/email/realtime");
    eventSourceRef.current = eventSource;

    // Handle connection opened
    eventSource.onopen = () => {
      console.log("[Email Realtime] Connected to real-time updates");
      setIsConnected(true);
    };

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const data: EmailRealtimeEvent = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            console.log("[Email Realtime] Connection established", data);
            onConnected?.();
            break;

          case "subscribed":
            console.log("[Email Realtime] Successfully subscribed to updates");
            break;

          case "ping":
            setLastPing(new Date(data.timestamp));
            break;

          case "email_update":
            console.log("[Email Realtime] Email update:", data);
            if (data.record && onEmailUpdate) {
              onEmailUpdate(data.record as EmailMessage);
            }
            break;

          case "thread_update":
            console.log("[Email Realtime] Thread update:", data);
            if (data.record && onThreadUpdate) {
              onThreadUpdate(data.record as EmailThread);
            }
            break;

          default:
            console.log("[Email Realtime] Unknown event type:", data.type, data);
        }

      } catch (error) {
        console.error("[Email Realtime] Error parsing event:", error);
        onError?.(error as Error);
      }
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error("[Email Realtime] Connection error:", error);
      setIsConnected(false);
      onError?.(new Error("Real-time connection failed"));
    };

    // Cleanup on unmount
    return () => {
      console.log("[Email Realtime] Cleaning up connection");
      eventSource.close();
      setIsConnected(false);
    };

  }, [onEmailUpdate, onThreadUpdate, onConnected, onError]);

  // Method to manually reconnect
  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Reconnection will happen automatically due to useEffect dependency changes
    // For now, we can trigger a re-render by updating a dummy state
    setIsConnected(prev => prev);
  };

  return {
    isConnected,
    lastPing,
    reconnect,
  };
}

// Helper hook for email inbox with real-time updates
export function useEmailInbox() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates
  const { isConnected } = useEmailRealtime({
    onEmailUpdate: (email) => {
      console.log("[Email Inbox] Real-time email update:", email);
      // Update email in list or add new one
      setEmails(prev => {
        const existing = prev.find(e => e.id === email.id);
        if (existing) {
          return prev.map(e => e.id === email.id ? email : e);
        } else {
          return [email, ...prev];
        }
      });
    },
    onThreadUpdate: (thread) => {
      console.log("[Email Inbox] Real-time thread update:", thread);
      setThreads(prev => {
        const existing = prev.find(t => t.id === thread.id);
        if (existing) {
          return prev.map(t => t.id === thread.id ? thread : t);
        } else {
          return [thread, ...prev];
        }
      });
    },
  });

  // Load initial data
  useEffect(() => {
    const loadInbox = async () => {
      try {
        const [emailsResponse, threadsResponse] = await Promise.all([
          fetch("/api/email/messages?limit=50"),
          fetch("/api/email/threads?limit=20"),
        ]);

        if (emailsResponse.ok) {
          const emailsData = await emailsResponse.json();
          setEmails(emailsData.messages || []);
        }

        if (threadsResponse.ok) {
          const threadsData = await threadsResponse.json();
          setThreads(threadsData.threads || []);
        }
      } catch (error) {
        console.error("Failed to load inbox:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInbox();
  }, []);

  return {
    emails,
    threads,
    loading,
    isRealtimeConnected: isConnected,
    refreshInbox: () => {
      // Trigger reload of inbox data
      setLoading(true);
      window.location.reload(); // Simple refresh for now
    },
  };
}