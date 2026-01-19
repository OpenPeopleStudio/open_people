/**
 * AI Provider Types
 * Support for OpenAI, LLM Studio, and other OpenAI-compatible providers
 */

export type AIProviderType = "openai" | "llmstudio" | "ollama" | "custom";

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  
  // Connection settings
  baseUrl: string;         // e.g., "http://localhost:1234/v1" for LLM Studio
  apiKey?: string;         // Optional for local models
  
  // Default model settings
  defaultModel: string;    // e.g., "local-model" or "gpt-4o"
  availableModels: string[];
  
  // Capabilities
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  
  // Cost tracking (0 for local models)
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  
  // Status
  isEnabled: boolean;
  isDefault: boolean;
  
  // Metadata
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Predefined provider templates
export const PROVIDER_TEMPLATES: Record<AIProviderType, Partial<AIProviderConfig>> = {
  openai: {
    name: "OpenAI",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    availableModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    supportsEmbeddings: true,
    supportsVision: true,
    supportsStreaming: true,
    costPer1kInputTokens: 0.005,  // GPT-4o pricing
    costPer1kOutputTokens: 0.015,
    description: "OpenAI's cloud API - most capable models",
  },
  llmstudio: {
    name: "LM Studio",
    type: "llmstudio",
    baseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
    availableModels: [],  // Will be populated from server
    supportsEmbeddings: false,  // Most local models don't support embeddings
    supportsVision: false,
    supportsStreaming: true,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    description: "Local models via LM Studio - free, private, offline",
  },
  ollama: {
    name: "Ollama",
    type: "ollama",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    availableModels: [],
    supportsEmbeddings: true,  // Ollama supports embeddings
    supportsVision: false,
    supportsStreaming: true,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    description: "Local models via Ollama - free, private, offline",
  },
  custom: {
    name: "Custom Provider",
    type: "custom",
    baseUrl: "",
    defaultModel: "",
    availableModels: [],
    supportsEmbeddings: false,
    supportsVision: false,
    supportsStreaming: true,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    description: "Custom OpenAI-compatible endpoint",
  },
};

// Chat completion request (OpenAI-compatible format)
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Embedding request/response
export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingResponse {
  object: string;
  data: {
    object: string;
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Model listing
export interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

// Provider status check
export interface ProviderStatus {
  available: boolean;
  latency_ms?: number;
  error?: string;
  models?: string[];
}

// Settings stored per user
export interface UserAISettings {
  defaultProvider: string;  // Provider ID
  providers: AIProviderConfig[];
  
  // Fallback behavior
  fallbackToOpenAI: boolean;  // If local provider fails, use OpenAI
  
  // Usage preferences
  preferLocalForSimpleTasks: boolean;
  useOpenAIForEmbeddings: boolean;  // Local models often lack embedding support
}

// Default settings
export const DEFAULT_AI_SETTINGS: UserAISettings = {
  defaultProvider: "openai",
  providers: [
    {
      id: "openai",
      ...PROVIDER_TEMPLATES.openai,
      isEnabled: true,
      isDefault: true,
    } as AIProviderConfig,
  ],
  fallbackToOpenAI: true,
  preferLocalForSimpleTasks: false,
  useOpenAIForEmbeddings: true,
};
