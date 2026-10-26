import { describe, expect, it } from "vitest";
import { DEFAULT_AI_SETTINGS } from "@/types/ai-providers";

describe("DEFAULT_AI_SETTINGS", () => {
  it("does not default to OpenAI or gpt-* models", () => {
    expect(DEFAULT_AI_SETTINGS.defaultProvider).not.toBe("openai");
    expect(DEFAULT_AI_SETTINGS.fallbackToOpenAI).toBe(false);
    expect(DEFAULT_AI_SETTINGS.useOpenAIForEmbeddings).toBe(false);
    expect(DEFAULT_AI_SETTINGS.providers.map((p) => p.id)).not.toContain("openai");
    expect(DEFAULT_AI_SETTINGS.defaultProvider).toBe("ollama");
    const blob = JSON.stringify(DEFAULT_AI_SETTINGS);
    expect(blob).not.toMatch(/gpt-/i);
    expect(blob).not.toMatch(/"openai"/);
  });
});
