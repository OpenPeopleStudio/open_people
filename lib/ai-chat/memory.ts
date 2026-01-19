/**
 * AI Memory Utilities
 * 
 * Functions for storing, retrieving, and managing AI memories
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  
  return response.data[0].embedding;
}

/**
 * Extract memories from a conversation exchange
 */
export async function extractMemories(
  userMessage: string,
  assistantResponse: string
): Promise<{
  content: string;
  category: "preference" | "fact" | "instruction" | "context";
  importance: number;
}[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a memory extraction system. Analyze the conversation and extract any important information that should be remembered for future conversations.

Extract memories in these categories:
- preference: User preferences, likes, dislikes, styles
- fact: Facts about the user, their projects, or context
- instruction: How the user wants things done, formats they prefer
- context: Background information, project details, relationships

Only extract truly useful memories. Return JSON array:
[{"content": "memory text", "category": "preference|fact|instruction|context", "importance": 0.1-1.0}]

Return empty array [] if nothing worth remembering.`,
      },
      {
        role: "user",
        content: `User: ${userMessage}\n\nAssistant: ${assistantResponse}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.memories || [];
  } catch {
    return [];
  }
}

/**
 * Summarize a memory for display
 */
export async function summarizeMemory(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Summarize this memory in 10 words or less. Be concise.",
      },
      {
        role: "user",
        content,
      },
    ],
    max_tokens: 50,
    temperature: 0.3,
  });
  
  return response.choices[0].message.content || content.slice(0, 50);
}

/**
 * Format memories for context injection
 */
export function formatMemoriesForContext(
  memories: { content: string; category: string; similarity: number }[]
): string {
  if (memories.length === 0) return "";
  
  const grouped: Record<string, string[]> = {};
  
  for (const memory of memories) {
    const cat = memory.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(memory.content);
  }
  
  let context = "## Relevant Memories\n\n";
  
  for (const [category, items] of Object.entries(grouped)) {
    context += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
    for (const item of items) {
      context += `- ${item}\n`;
    }
    context += "\n";
  }
  
  return context;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have same length");
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
