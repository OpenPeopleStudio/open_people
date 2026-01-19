/**
 * AI Provider Abstraction Layer
 * Supports OpenAI, LM Studio, Ollama, and other OpenAI-compatible APIs
 */

import OpenAI from "openai";
import type {
  AIProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderStatus,
  ModelsResponse,
} from "@/types/ai-providers";

/**
 * Create an OpenAI-compatible client for any provider
 */
export function createProviderClient(config: AIProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey || "not-needed",  // Local models often don't need keys
    baseURL: config.baseUrl,
    // Disable timeout for local models which can be slow
    timeout: config.type === "openai" ? 60000 : 300000,
    // Don't send API key header if not provided
    defaultHeaders: config.apiKey ? undefined : { Authorization: "" },
  });
}

/**
 * Get the default OpenAI client (for embeddings, etc.)
 */
export function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Chat completion with any provider
 */
export async function chatCompletion(
  config: AIProviderConfig,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const client = createProviderClient(config);
  
  try {
    const response = await client.chat.completions.create({
      model: request.model || config.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4000,
      stream: false,
    });
    
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role as "system" | "user" | "assistant",
          content: choice.message.content || "",
        },
        finish_reason: choice.finish_reason || "stop",
      })),
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error(`Chat completion failed for provider ${config.name}:`, error);
    throw error;
  }
}

/**
 * Generate embeddings (falls back to OpenAI if provider doesn't support it)
 */
export async function generateEmbeddings(
  config: AIProviderConfig,
  input: string | string[],
  fallbackToOpenAI: boolean = true
): Promise<number[][]> {
  // If provider doesn't support embeddings and fallback is enabled, use OpenAI
  if (!config.supportsEmbeddings && fallbackToOpenAI) {
    return generateOpenAIEmbeddings(input);
  }
  
  if (!config.supportsEmbeddings) {
    throw new Error(`Provider ${config.name} does not support embeddings`);
  }
  
  const client = createProviderClient(config);
  const inputs = Array.isArray(input) ? input : [input];
  
  try {
    const response = await client.embeddings.create({
      model: config.type === "ollama" ? "nomic-embed-text" : "text-embedding-3-small",
      input: inputs,
    });
    
    return response.data.map((d) => d.embedding);
  } catch (error) {
    console.error(`Embeddings failed for provider ${config.name}:`, error);
    
    // Fallback to OpenAI if enabled
    if (fallbackToOpenAI) {
      console.log("Falling back to OpenAI for embeddings");
      return generateOpenAIEmbeddings(input);
    }
    
    throw error;
  }
}

/**
 * Generate embeddings using OpenAI (used as fallback)
 */
async function generateOpenAIEmbeddings(input: string | string[]): Promise<number[][]> {
  const client = getOpenAIClient();
  const inputs = Array.isArray(input) ? input : [input];
  
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: inputs,
  });
  
  return response.data.map((d) => d.embedding);
}

/**
 * Check if a provider is available and get its status
 */
export async function checkProviderStatus(config: AIProviderConfig): Promise<ProviderStatus> {
  const startTime = Date.now();
  
  try {
    const client = createProviderClient(config);
    
    // Try to list models as a health check
    const models = await client.models.list();
    const modelIds = models.data?.map((m) => m.id) || [];
    
    return {
      available: true,
      latency_ms: Date.now() - startTime,
      models: modelIds,
    };
  } catch (error) {
    return {
      available: false,
      latency_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List available models from a provider
 */
export async function listModels(config: AIProviderConfig): Promise<string[]> {
  try {
    const client = createProviderClient(config);
    const response = await client.models.list();
    return response.data?.map((m) => m.id) || [];
  } catch (error) {
    console.error(`Failed to list models for ${config.name}:`, error);
    return config.availableModels || [];
  }
}

/**
 * Estimate cost for a completion (returns 0 for local models)
 */
export function estimateCost(
  config: AIProviderConfig,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000) * config.costPer1kInputTokens;
  const outputCost = (outputTokens / 1000) * config.costPer1kOutputTokens;
  return inputCost + outputCost;
}

/**
 * Get provider by ID from settings
 */
export function getProviderById(
  providers: AIProviderConfig[],
  id: string
): AIProviderConfig | undefined {
  return providers.find((p) => p.id === id);
}

/**
 * Get the default enabled provider
 */
export function getDefaultProvider(providers: AIProviderConfig[]): AIProviderConfig | undefined {
  return providers.find((p) => p.isDefault && p.isEnabled) ||
         providers.find((p) => p.isEnabled);
}

/**
 * Smart provider selection based on task
 * - Simple tasks: prefer local if available
 * - Complex tasks: prefer OpenAI
 * - Embeddings: always OpenAI (unless provider supports it)
 */
export function selectProvider(
  providers: AIProviderConfig[],
  options: {
    requiresEmbeddings?: boolean;
    requiresVision?: boolean;
    preferLocal?: boolean;
    messageLength?: number;
  } = {}
): AIProviderConfig | undefined {
  const enabledProviders = providers.filter((p) => p.isEnabled);
  
  if (enabledProviders.length === 0) return undefined;
  
  // If embeddings required, filter to providers that support it (or use OpenAI)
  if (options.requiresEmbeddings) {
    const embeddingProviders = enabledProviders.filter((p) => p.supportsEmbeddings);
    if (embeddingProviders.length > 0) {
      return embeddingProviders.find((p) => p.isDefault) || embeddingProviders[0];
    }
    // Fall back to OpenAI for embeddings
    return enabledProviders.find((p) => p.type === "openai");
  }
  
  // If vision required, filter to providers that support it
  if (options.requiresVision) {
    const visionProviders = enabledProviders.filter((p) => p.supportsVision);
    return visionProviders.find((p) => p.isDefault) || visionProviders[0];
  }
  
  // If prefer local, try to find a local provider
  if (options.preferLocal) {
    const localProviders = enabledProviders.filter(
      (p) => p.type === "llmstudio" || p.type === "ollama"
    );
    if (localProviders.length > 0) {
      return localProviders.find((p) => p.isDefault) || localProviders[0];
    }
  }
  
  // Return default or first enabled
  return getDefaultProvider(enabledProviders);
}

/**
 * Format provider info for display
 */
export function formatProviderInfo(config: AIProviderConfig): string {
  const costInfo = config.costPer1kInputTokens > 0
    ? `$${config.costPer1kInputTokens}/1k input, $${config.costPer1kOutputTokens}/1k output`
    : "Free (local)";
  
  return `${config.name} (${config.type}) - ${costInfo}`;
}
