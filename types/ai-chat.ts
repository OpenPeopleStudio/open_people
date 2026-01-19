/**
 * AI Chat & Memory Types
 */

export interface AIConversation {
  id: string;
  owner_id: string;
  
  title: string | null;
  slug: string | null;
  
  system_prompt: string | null;
  model: string;
  temperature: number;
  
  attached_notes: string[];
  attached_files: string[];
  attached_folders: string[];
  
  use_memory: boolean;
  memory_threshold: number;
  
  message_count: number;
  token_count: number;
  
  is_archived: boolean;
  is_pinned: boolean;
  
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  
  role: "user" | "assistant" | "system";
  content: string;
  
  reasoning: string | null;
  confidence: number | null;
  sources: AIMessageSource[];
  
  edited: boolean;
  original_content: string | null;
  
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  
  created_at: string;
  
  // Joined
  attachments?: AIMessageAttachment[];
}

export interface AIMessageSource {
  type: "note" | "file" | "memory" | "folder";
  id: string;
  title?: string;
  excerpt?: string;
  similarity?: number;
}

export interface AIMemory {
  id: string;
  owner_id: string;
  
  content: string;
  summary: string | null;
  
  source_conversation_id: string | null;
  source_message_id: string | null;
  source_type: "conversation" | "manual" | "note" | "file" | null;
  
  category: "preference" | "fact" | "instruction" | "context" | null;
  tags: string[];
  
  importance: number;
  access_count: number;
  last_accessed_at: string | null;
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface AIContextSnapshot {
  id: string;
  message_id: string;
  
  included_notes: { id: string; title: string; excerpt: string }[];
  included_files: { id: string; filename: string; summary: string }[];
  included_memories: { id: string; content: string; similarity: number }[];
  
  full_context: string | null;
  context_tokens: number | null;
  
  created_at: string;
}

export interface AIMessageAttachment {
  id: string;
  message_id: string;
  
  attachment_type: "image" | "file" | "code" | "link";
  filename: string | null;
  content_type: string | null;
  
  content: string | null;
  vault_file_id: string | null;
  storage_url: string | null;
  
  ai_description: string | null;
  
  created_at: string;
}

export interface AISavedPrompt {
  id: string;
  owner_id: string;
  
  name: string;
  description: string | null;
  prompt: string;
  
  category: string | null;
  tags: string[];
  
  use_count: number;
  
  created_at: string;
  updated_at: string;
}

// API Request/Response types

export interface CreateConversationRequest {
  title?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  attached_notes?: string[];
  attached_files?: string[];
  attached_folders?: string[];
  use_memory?: boolean;
}

export interface SendMessageRequest {
  content: string;
  attachments?: {
    type: "image" | "code" | "link";
    content: string;
    filename?: string;
  }[];
}

export interface ChatResponse {
  message: AIMessage;
  context_used: {
    notes: number;
    files: number;
    memories: number;
  };
}

export interface CreateMemoryRequest {
  content: string;
  summary?: string;
  category?: "preference" | "fact" | "instruction" | "context";
  tags?: string[];
  importance?: number;
}

export interface UpdateContextRequest {
  attached_notes?: string[];
  attached_files?: string[];
  attached_folders?: string[];
  use_memory?: boolean;
}

// For context panel
export interface ContextItem {
  id: string;
  type: "note" | "file" | "folder";
  title: string;
  subtitle?: string;
  selected: boolean;
}
