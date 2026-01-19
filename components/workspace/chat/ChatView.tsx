"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AIConversation, AIMessage, AIMemory } from "@/types/ai-chat";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Chat View - Shared component for Chat UI
   Used by both super-admin and tenant admin pages
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatViewProps {
  basePath: string; // e.g., "/super-admin" or "/admin"
}

export function ChatView({ basePath }: ChatViewProps) {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  async function loadConversations() {
    try {
      setLoading(true);
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadConversation(id: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function createConversation() {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_memory: true }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => [data.conversation, ...prev]);
        setCurrentConversation(data.conversation);
        setMessages([]);
        inputRef.current?.focus();
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create conversation:", res.status, errorData);
        alert(`Failed to create conversation: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
      alert("Failed to create conversation. Please check your connection and try again.");
    }
  }
  
  async function sendMessage() {
    if (!input.trim() || !currentConversation || sending) return;
    
    const content = input.trim();
    setInput("");
    setSending(true);
    
    // Optimistic update
    const tempMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: "user",
      content,
      reasoning: null,
      confidence: null,
      sources: [],
      edited: false,
      original_content: null,
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const res = await fetch(`/api/chat/conversations/${currentConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Replace temp message and add assistant response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempMessage.id),
          { ...tempMessage, id: `user-${Date.now()}` },
          data.message,
        ]);
        
        // Update conversation in list
        setCurrentConversation(prev => prev ? {
          ...prev,
          message_count: prev.message_count + 2,
          last_message_at: new Date().toISOString(),
        } : null);
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setInput(content);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  }
  
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Conversations */}
      <div className="w-72 border-r border-[var(--border-subtle)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <button
            onClick={createConversation}
            className="w-full py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading && conversations.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversation?.id === conv.id
                      ? "bg-[var(--electric-lime)]/10 border border-[var(--electric-lime)]/30"
                      : "hover:bg-[var(--surface-1)]"
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {conv.title || "New conversation"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {conv.message_count} messages
                    {conv.use_memory && " · Memory on"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom links */}
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-1">
          <button
            onClick={() => setShowMemories(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            View Memories
          </button>
          <Link
            href={`${basePath}/chat/profile`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Your AI Profile
          </Link>
          <Link
            href={`${basePath}/chat/settings`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            AI Providers
          </Link>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  {currentConversation.title || "New conversation"}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {currentConversation.model} · {currentConversation.message_count} messages
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowContext(!showContext)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    showContext
                      ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                      : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Context
                  {(currentConversation.attached_notes?.length || 0) + 
                   (currentConversation.attached_files?.length || 0) + 
                   (currentConversation.attached_folders?.length || 0) > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-[var(--electric-lime)] text-[var(--void)] text-xs">
                      {(currentConversation.attached_notes?.length || 0) + 
                       (currentConversation.attached_files?.length || 0) + 
                       (currentConversation.attached_folders?.length || 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-md">
                    I remember everything we discuss. Attach notes and files for context, and I&apos;ll use them to provide better answers.
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {sending && (
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
                    style={{ minHeight: "48px", maxHeight: "200px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                AI Chat with Memory
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">
                Start a new conversation or select an existing one. I&apos;ll remember our discussions and learn from them.
              </p>
              <button
                onClick={createConversation}
                className="px-6 py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Context Panel */}
      {showContext && currentConversation && (
        <ContextPanel
          conversation={currentConversation}
          onUpdate={(updates) => {
            setCurrentConversation(prev => prev ? { ...prev, ...updates } : null);
          }}
          onClose={() => setShowContext(false)}
        />
      )}
      
      {/* Memories Modal */}
      {showMemories && (
        <MemoriesModal onClose={() => setShowMemories(false)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════════════════════════════════════════ */

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "order-2" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "bg-[var(--surface-1)] text-[var(--text-primary)]"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Sources used */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.sources.slice(0, 3).map((source, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]"
              >
                {source.type}: {source.title || source.excerpt?.slice(0, 20)}
              </span>
            ))}
            {message.sources.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                +{message.sources.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <p className="text-xs text-[var(--text-muted)] mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString()}
          {message.total_tokens && ` · ${message.total_tokens} tokens`}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Context Panel
   ═══════════════════════════════════════════════════════════════════════════ */

function ContextPanel({
  conversation,
  onUpdate,
  onClose,
}: {
  conversation: AIConversation;
  onUpdate: (updates: Partial<AIConversation>) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; filename: string }[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadContext();
  }, []);
  
  async function loadContext() {
    try {
      const res = await fetch("/api/chat/context");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setFiles(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to load context:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function toggleItem(type: "notes" | "files" | "folders", id: string) {
    const field = `attached_${type}` as keyof AIConversation;
    const current = (conversation[field] as string[]) || [];
    const updated = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    
    try {
      const res = await fetch(`/api/chat/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: updated }),
      });
      
      if (res.ok) {
        onUpdate({ [field]: updated } as Partial<AIConversation>);
      }
    } catch (err) {
      console.error("Failed to update context:", err);
    }
  }
  
  return (
    <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] flex flex-col">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Context</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Memory toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Use Memory</p>
            <p className="text-xs text-[var(--text-muted)]">Include relevant memories</p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/chat/conversations/${conversation.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ use_memory: !conversation.use_memory }),
                });
                if (res.ok) {
                  onUpdate({ use_memory: !conversation.use_memory });
                }
              } catch (err) {
                console.error("Failed to toggle memory:", err);
              }
            }}
            className={`w-10 h-6 rounded-full transition-colors ${
              conversation.use_memory ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              conversation.use_memory ? "translate-x-5" : "translate-x-1"
            }`} />
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4 text-[var(--text-muted)] text-sm">
            Loading...
          </div>
        ) : (
          <>
            {/* Notes */}
            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Notes ({notes.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => toggleItem("notes", note.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      conversation.attached_notes?.includes(note.id)
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {note.title}
                  </button>
                ))}
                {notes.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">No published notes</p>
                )}
              </div>
            </div>
            
            {/* Files */}
            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Vault Files ({files.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {files.map(file => (
                  <button
                    key={file.id}
                    onClick={() => toggleItem("files", file.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors truncate ${
                      conversation.attached_files?.includes(file.id)
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {file.filename}
                  </button>
                ))}
                {files.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">No vault files</p>
                )}
              </div>
            </div>
            
            {/* Folders */}
            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Folders ({folders.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => toggleItem("folders", folder.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      conversation.attached_folders?.includes(folder.id)
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">No folders</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Memories Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function MemoriesModal({ onClose }: { onClose: () => void }) {
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemory, setNewMemory] = useState("");
  const [adding, setAdding] = useState(false);
  
  useEffect(() => {
    loadMemories();
  }, []);
  
  async function loadMemories() {
    try {
      const res = await fetch("/api/chat/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function addMemory() {
    if (!newMemory.trim() || adding) return;
    
    setAdding(true);
    try {
      const res = await fetch("/api/chat/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMemory.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMemories(prev => [data.memory, ...prev]);
        setNewMemory("");
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setAdding(false);
    }
  }
  
  async function deleteMemory(id: string) {
    try {
      const res = await fetch(`/api/chat/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  }
  
  const categoryColors: Record<string, string> = {
    preference: "var(--electric-lime)",
    fact: "var(--electric-cyan)",
    instruction: "var(--warning)",
    context: "var(--electric-violet)",
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Memories
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Things I remember from our conversations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMemory()}
              placeholder="Add a memory manually..."
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <button
              onClick={addMemory}
              disabled={!newMemory.trim() || adding}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              Loading memories...
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)]">No memories yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                I&apos;ll learn things as we chat
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map(memory => (
                <div
                  key={memory.id}
                  className="p-4 rounded-xl bg-[var(--surface-2)] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-primary)]">
                        {memory.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {memory.category && (
                          <span
                            className="px-2 py-0.5 text-xs rounded"
                            style={{
                              backgroundColor: `${categoryColors[memory.category] || "var(--text-muted)"}20`,
                              color: categoryColors[memory.category] || "var(--text-muted)",
                            }}
                          >
                            {memory.category}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">
                          {memory.access_count} uses
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMemory(memory.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--error)]/10 text-[var(--text-muted)] hover:text-[var(--error)] transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
