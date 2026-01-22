"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AIConversation, AIMessage, AIMemory } from "@/types/ai-chat";
import type { Project } from "@/types/workflows";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Chat View - Shared component for Chat UI
   Used by both super-admin and tenant admin pages
   Desktop: three-column layout  |  Mobile: drawer-based overlays
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFactModal, setShowFactModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    notes: { title: string; content: string }[];
    facts: { fact: string; fact_type: string }[];
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editResult, setEditResult] = useState<{
    original_content: string;
    edited_content: string;
    diff: string;
    summary: string;
    file_name: string;
  } | null>(null);
  // Mobile drawer state
  const [mobileConvoDrawer, setMobileConvoDrawer] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    loadConversations();
    loadProjects();
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
  
  async function loadProjects() {
    try {
      const res = await fetch("/api/workflows/projects?status=active");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }
  
  async function setConversationProject(projectId: string | null) {
    if (!currentConversation) return;
    
    try {
      const res = await fetch(`/api/chat/conversations/${currentConversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.conversation);
        // Update in list too
        setConversations(prev => 
          prev.map(c => c.id === currentConversation.id ? data.conversation : c)
        );
      }
    } catch (err) {
      console.error("Failed to set project:", err);
    }
    setShowProjectPicker(false);
  }
  
  function handleSaveNote(content: string) {
    setModalContent(content);
    setShowNoteModal(true);
  }
  
  function handleSaveFact(content: string) {
    setModalContent(content);
    setShowFactModal(true);
  }
  
  // Handle slash commands
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setInput(value);
    
    // Check for slash commands at start of input
    if (value.startsWith("/") && value.length < 10) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  }
  
  function handleSlashCommand(command: string) {
    setShowSlashMenu(false);
    
    if (command === "note") {
      // Extract content after /note
      const content = input.replace(/^\/note\s*/, "").trim();
      if (content) {
        setModalContent(content);
        setShowNoteModal(true);
        setInput("");
      } else {
        setModalContent("");
        setShowNoteModal(true);
        setInput("");
      }
    } else if (command === "fact") {
      const content = input.replace(/^\/fact\s*/, "").trim();
      if (content) {
        setModalContent(content);
        setShowFactModal(true);
        setInput("");
      } else {
        setModalContent("");
        setShowFactModal(true);
        setInput("");
      }
    } else if (command === "edit") {
      // Open edit modal
      setShowEditModal(true);
      setInput("");
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
        
        // Set suggestions if any
        if (data.suggestions && (data.suggestions.notes?.length > 0 || data.suggestions.facts?.length > 0)) {
          setSuggestions(data.suggestions);
        }
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
  
  // Shared conversation sidebar content
  const ConversationSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full ${isMobile ? "" : "w-72 border-r border-[var(--border-subtle)]"}`}>
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <button
          onClick={() => {
            createConversation();
            if (isMobile) setMobileConvoDrawer(false);
          }}
          className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
        {isMobile && (
          <button
            onClick={() => setMobileConvoDrawer(false)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
                onClick={() => {
                  loadConversation(conv.id);
                  if (isMobile) setMobileConvoDrawer(false);
                }}
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
          onClick={() => {
            setShowMemories(true);
            if (isMobile) setMobileConvoDrawer(false);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          View Memories
        </button>
        {isMobile ? (
          <Link
            href={`${basePath}/chat/profile`}
            onClick={() => setMobileConvoDrawer(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Your AI Profile
          </Link>
        ) : (
          <Link
            href={`${basePath}/chat/profile`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Your AI Profile
          </Link>
        )}
        {isMobile ? (
          <Link
            href={`${basePath}/chat/settings`}
            onClick={() => setMobileConvoDrawer(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            AI Providers
          </Link>
        ) : (
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
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <ConversationSidebar />
      </div>

      {/* Mobile Conversation Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          mobileConvoDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileConvoDrawer(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--void)] border-r border-[var(--border-subtle)] transition-transform duration-200 ${
            mobileConvoDrawer ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ConversationSidebar isMobile />
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--border-subtle)] gap-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileConvoDrawer(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors shrink-0"
                aria-label="Open conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {currentConversation.title || "New conversation"}
                </h2>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {currentConversation.model} · {currentConversation.message_count} messages
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Project Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowProjectPicker(!showProjectPicker)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                      currentConversation.project_id
                        ? "bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)]"
                        : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    {currentConversation.project?.name || "Project"}
                  </button>
                  
                  {showProjectPicker && (
                    <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-lg z-50 py-1">
                      <button
                        onClick={() => setConversationProject(null)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors ${
                          !currentConversation.project_id ? "text-[var(--electric-cyan)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        No project
                      </button>
                      {projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setConversationProject(project.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 ${
                            currentConversation.project_id === project.id 
                              ? "text-[var(--electric-cyan)]" 
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: project.color || "#6366f1" }}
                          />
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
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
                    <MessageBubble 
                      key={message.id} 
                      message={message}
                      onSaveNote={handleSaveNote}
                      onSaveFact={handleSaveFact}
                    />
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
            
            {/* Suggestions */}
            {suggestions && (suggestions.notes.length > 0 || suggestions.facts.length > 0) && (
              <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[var(--text-muted)]">
                      Suggested saves
                    </p>
                    <button
                      onClick={() => setSuggestions(null)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.notes.map((note, i) => (
                      <button
                        key={`note-${i}`}
                        onClick={() => {
                          setModalContent(note.content);
                          setShowNoteModal(true);
                          setSuggestions(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs bg-[var(--electric-lime)]/10 text-[var(--electric-lime)] hover:bg-[var(--electric-lime)]/20 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Save as note: {note.title.slice(0, 30)}{note.title.length > 30 ? "..." : ""}
                      </button>
                    ))}
                    {suggestions.facts.map((fact, i) => (
                      <button
                        key={`fact-${i}`}
                        onClick={() => {
                          setModalContent(fact.fact);
                          setShowFactModal(true);
                          setSuggestions(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)] hover:bg-[var(--electric-cyan)]/20 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Save fact: {fact.fact.slice(0, 40)}{fact.fact.length > 40 ? "..." : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t border-[var(--border-subtle)] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  {/* Slash Command Menu */}
                  {showSlashMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-lg z-50 py-1">
                      <button
                        onClick={() => handleSlashCommand("note")}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                      >
                        <svg className="w-4 h-4 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <div>
                          <p className="font-medium">/note</p>
                          <p className="text-xs text-[var(--text-muted)]">Create a note from this text</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleSlashCommand("fact")}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                      >
                        <svg className="w-4 h-4 text-[var(--electric-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        <div>
                          <p className="font-medium">/fact</p>
                          <p className="text-xs text-[var(--text-muted)]">Save a fact to knowledge base</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleSlashCommand("edit")}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                      >
                        <svg className="w-4 h-4 text-[var(--electric-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        <div>
                          <p className="font-medium">/edit</p>
                          <p className="text-xs text-[var(--text-muted)]">Generate a file edit/diff</p>
                        </div>
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (/ for commands)"
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
                  Press Enter to send, Shift+Enter for new line · Type / for commands
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile header for empty state */}
            <div className="md:hidden flex items-center h-14 px-4 border-b border-[var(--border-subtle)]">
              <button
                onClick={() => setMobileConvoDrawer(true)}
                className="p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
                aria-label="Open conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="ml-2 text-sm font-medium text-[var(--text-primary)]">AI Chat</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-2">
                  AI Chat with Memory
                </h2>
                <p className="text-sm text-[var(--text-muted)] max-w-md mb-6 px-2">
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
          </div>
        )}
      </div>
      
      {/* Context Panel - Desktop inline, Mobile overlay */}
      {showContext && currentConversation && (
        <>
          {/* Desktop context panel */}
          <div className="hidden md:block">
            <ContextPanel
              conversation={currentConversation}
              onUpdate={(updates) => {
                setCurrentConversation(prev => prev ? { ...prev, ...updates } : null);
              }}
              onClose={() => setShowContext(false)}
            />
          </div>
          {/* Mobile context drawer */}
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowContext(false)}
            />
            <div className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-[var(--void)] border-l border-[var(--border-subtle)] animate-slide-in-right">
              <ContextPanel
                conversation={currentConversation}
                onUpdate={(updates) => {
                  setCurrentConversation(prev => prev ? { ...prev, ...updates } : null);
                }}
                onClose={() => setShowContext(false)}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Memories Modal */}
      {showMemories && (
        <MemoriesModal onClose={() => setShowMemories(false)} />
      )}
      
      {/* Create Note Modal */}
      {showNoteModal && currentConversation && (
        <CreateNoteModal
          initialContent={modalContent}
          conversationId={currentConversation.id}
          projectId={currentConversation.project_id}
          onClose={() => setShowNoteModal(false)}
        />
      )}
      
      {/* Create Fact Modal */}
      {showFactModal && currentConversation && (
        <CreateFactModal
          initialContent={modalContent}
          conversationId={currentConversation.id}
          projectId={currentConversation.project_id}
          onClose={() => setShowFactModal(false)}
        />
      )}
      
      {/* Edit Modal */}
      {showEditModal && currentConversation && (
        <EditRequestModal
          conversationId={currentConversation.id}
          onClose={() => setShowEditModal(false)}
          onResult={(result) => {
            setEditResult(result);
            setShowEditModal(false);
          }}
        />
      )}
      
      {/* Diff Viewer */}
      {editResult && (
        <DiffViewer
          result={editResult}
          onClose={() => setEditResult(null)}
          onRetry={() => {
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════════════════════════════════════════ */

interface MessageBubbleProps {
  message: AIMessage;
  onSaveNote: (content: string) => void;
  onSaveFact: (content: string) => void;
}

function MessageBubble({ message, onSaveNote, onSaveFact }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === "user";
  
  return (
    <div 
      className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[80%] ${isUser ? "order-2" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl relative ${
            isUser
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "bg-[var(--surface-1)] text-[var(--text-primary)]"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Message Actions */}
          {showActions && (
            <div className={`absolute top-0 ${isUser ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} flex items-center gap-1`}>
              <button
                onClick={() => onSaveNote(message.content)}
                className="p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--electric-lime)] hover:bg-[var(--surface-1)] transition-colors"
                title="Save as note"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </button>
              <button
                onClick={() => onSaveFact(message.content)}
                className="p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--electric-cyan)] hover:bg-[var(--surface-1)] transition-colors"
                title="Save as fact"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </button>
            </div>
          )}
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

/* ═══════════════════════════════════════════════════════════════════════════
   Create Note Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function CreateNoteModal({
  initialContent,
  conversationId,
  projectId,
  onClose,
}: {
  initialContent: string;
  conversationId: string;
  projectId: string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  async function saveNote() {
    if (!title.trim() || saving) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/chat/actions/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          project_id: projectId,
          conversation_id: conversationId,
        }),
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--electric-lime)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Create Note
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Save this as a note in your knowledge base
              </p>
            </div>
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
        
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--electric-lime)]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-medium">Note saved!</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!title.trim() || saving}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create Fact Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function CreateFactModal({
  initialContent,
  conversationId,
  projectId,
  onClose,
}: {
  initialContent: string;
  conversationId: string;
  projectId: string | null;
  onClose: () => void;
}) {
  const [fact, setFact] = useState(initialContent);
  const [factType, setFactType] = useState<string>("project_detail");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const factTypes = [
    { value: "user_preference", label: "User Preference" },
    { value: "project_detail", label: "Project Detail" },
    { value: "business_rule", label: "Business Rule" },
    { value: "technical", label: "Technical" },
    { value: "decision", label: "Decision" },
    { value: "goal", label: "Goal" },
    { value: "constraint", label: "Constraint" },
    { value: "contact", label: "Contact" },
    { value: "process", label: "Process" },
  ];
  
  async function saveFact() {
    if (!fact.trim() || saving) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/chat/actions/fact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fact: fact.trim(),
          fact_type: factType,
          project_id: projectId,
          conversation_id: conversationId,
          source_excerpt: initialContent.slice(0, 500),
        }),
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error("Failed to save fact:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--electric-cyan)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--electric-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Save Fact
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Add to your knowledge base
              </p>
            </div>
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
        
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--electric-cyan)]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--electric-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-medium">Fact saved!</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Fact
              </label>
              <textarea
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                rows={4}
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-cyan)]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Type
              </label>
              <select
                value={factType}
                onChange={(e) => setFactType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-cyan)]"
              >
                {factTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveFact}
                disabled={!fact.trim() || saving}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--electric-cyan)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Fact"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Edit Request Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function EditRequestModal({
  conversationId,
  onClose,
  onResult,
}: {
  conversationId: string;
  onClose: () => void;
  onResult: (result: {
    original_content: string;
    edited_content: string;
    diff: string;
    summary: string;
    file_name: string;
  }) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function generateEdit() {
    if (!fileContent.trim() || !instruction.trim() || generating) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const res = await fetch("/api/chat/actions/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_content: fileContent,
          file_name: fileName || "file.txt",
          instruction,
          conversation_id: conversationId,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onResult({
          ...data,
          file_name: fileName || "file.txt",
        });
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to generate edit");
      }
    } catch (err) {
      setError("Failed to generate edit");
    } finally {
      setGenerating(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--electric-violet)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--electric-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Generate Edit
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Paste content and describe the change
              </p>
            </div>
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
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              File Name (optional)
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., component.tsx"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-violet)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              File Content
            </label>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Paste the file content here..."
              rows={10}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--electric-violet)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Edit Instruction
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe what changes you want to make..."
              rows={3}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-violet)]"
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
              {error}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateEdit}
            disabled={!fileContent.trim() || !instruction.trim() || generating}
            className="px-4 py-2 rounded-lg text-sm bg-[var(--electric-violet)] text-white font-medium hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {generating ? "Generating..." : "Generate Diff"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Diff Viewer
   ═══════════════════════════════════════════════════════════════════════════ */

function DiffViewer({
  result,
  onClose,
  onRetry,
}: {
  result: {
    original_content: string;
    edited_content: string;
    diff: string;
    summary: string;
    file_name: string;
  };
  onClose: () => void;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState<"diff" | "content" | null>(null);
  const [view, setView] = useState<"diff" | "full">("diff");
  
  async function copyToClipboard(text: string, type: "diff" | "content") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--electric-violet)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--electric-violet)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Edit Generated: {result.file_name}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {result.summary}
              </p>
            </div>
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
        
        {/* View Toggle */}
        <div className="px-6 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
          <button
            onClick={() => setView("diff")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === "diff"
                ? "bg-[var(--electric-violet)]/10 text-[var(--electric-violet)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            }`}
          >
            Diff View
          </button>
          <button
            onClick={() => setView("full")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === "full"
                ? "bg-[var(--electric-violet)]/10 text-[var(--electric-violet)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            }`}
          >
            Full Content
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {view === "diff" ? (
            <div className="h-full overflow-auto">
              <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                {result.diff.split("\n").map((line, i) => {
                  let className = "text-[var(--text-secondary)]";
                  if (line.startsWith("+") && !line.startsWith("+++")) {
                    className = "text-green-400 bg-green-400/10";
                  } else if (line.startsWith("-") && !line.startsWith("---")) {
                    className = "text-red-400 bg-red-400/10";
                  } else if (line.startsWith("@@")) {
                    className = "text-[var(--electric-cyan)]";
                  } else if (line.startsWith("---") || line.startsWith("+++")) {
                    className = "text-[var(--text-muted)]";
                  }
                  return (
                    <div key={i} className={`${className} px-2`}>
                      {line || " "}
                    </div>
                  );
                })}
              </pre>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto text-[var(--text-primary)]">
                {result.edited_content}
              </pre>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Again
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(result.diff, "diff")}
              className="px-4 py-2 rounded-lg text-sm bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
            >
              {copied === "diff" ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy Diff
                </>
              )}
            </button>
            <button
              onClick={() => copyToClipboard(result.edited_content, "content")}
              className="px-4 py-2 rounded-lg text-sm bg-[var(--electric-violet)] text-white font-medium hover:brightness-110 transition-all flex items-center gap-2"
            >
              {copied === "content" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                  </svg>
                  Copy Full Content
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
