import { createGoogle } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import {
  ASK_MODEL_DEFAULT,
  askGatewayProviderOptions,
  gatewayConfigured,
  isAllowedAskModel,
} from "@/lib/ask/prompt";

export type AskProviderId = "gateway" | "google" | "openrouter";

export const ASK_GOOGLE_MODEL_DEFAULT = "gemini-2.5-flash";
export const ASK_OPENROUTER_MODEL_DEFAULT = "google/gemma-4-31b-it:free";

export type AskRuntimeState = "ready" | "snag" | "unconfigured";

export type AskRuntime = {
  provider: AskProviderId;
  model: string;
  state: AskRuntimeState;
  providerOptions?: ReturnType<typeof askGatewayProviderOptions>;
};

const STARTS_WITH_OPENAI = /^openai\//i;
const GATEWAY_PREFIX = /^(spacexai|xai|anthropic)\//i;
const DISALLOWED =
  /(?:^|\/)(openai|azure)(?:\/|$)|openai|(?:^|\/)gpt-/i;

export function parseAskProviderId(raw: string | undefined | null): AskProviderId | null {
  const value = raw?.trim().toLowerCase();
  if (value === "google" || value === "openrouter" || value === "gateway") return value;
  return null;
}

export function askProvider(): AskProviderId {
  return parseAskProviderId(process.env.ASK_PROVIDER) ?? "gateway";
}

export function askFallbackProvider(): AskProviderId | null {
  return parseAskProviderId(process.env.ASK_FALLBACK_PROVIDER);
}

export function isDisallowedAskModel(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed) return true;
  if (STARTS_WITH_OPENAI.test(trimmed)) return true;
  return DISALLOWED.test(trimmed);
}

function envAskModel(): string {
  return process.env.ASK_MODEL?.trim() ?? "";
}

function envAskFallbackModel(): string {
  return process.env.ASK_FALLBACK_MODEL?.trim() ?? "";
}

function googleKey(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ?? "";
}

function openrouterKey(): string {
  return process.env.OPENROUTER_API_KEY?.trim() ?? "";
}

export function askModelFor(
  provider: AskProviderId = askProvider(),
  fromEnv: string = envAskModel(),
): string {
  if (provider === "google") {
    if (
      fromEnv &&
      !isDisallowedAskModel(fromEnv) &&
      !GATEWAY_PREFIX.test(fromEnv) &&
      (/gemini/i.test(fromEnv) || !fromEnv.includes("/"))
    ) {
      return fromEnv;
    }
    return ASK_GOOGLE_MODEL_DEFAULT;
  }
  if (provider === "openrouter") {
    if (
      fromEnv &&
      !isDisallowedAskModel(fromEnv) &&
      !STARTS_WITH_OPENAI.test(fromEnv) &&
      !GATEWAY_PREFIX.test(fromEnv)
    ) {
      return fromEnv;
    }
    return ASK_OPENROUTER_MODEL_DEFAULT;
  }
  if (fromEnv && isAllowedAskModel(fromEnv)) return fromEnv;
  return ASK_MODEL_DEFAULT;
}

export function runtimeFor(
  provider: AskProviderId,
  fromEnv: string,
  req?: Request,
): AskRuntime {
  const model = askModelFor(provider, fromEnv);
  if (provider === "google") {
    return { provider, model, state: googleKey() ? "ready" : "snag" };
  }
  if (provider === "openrouter") {
    return { provider, model, state: openrouterKey() ? "ready" : "snag" };
  }
  if (gatewayConfigured(req)) {
    return {
      provider,
      model,
      state: "ready",
      providerOptions: askGatewayProviderOptions(),
    };
  }
  return { provider, model, state: "unconfigured" };
}

export function askRuntime(req?: Request): AskRuntime {
  return runtimeFor(askProvider(), envAskModel(), req);
}

export function askFallbackRuntime(req?: Request): AskRuntime | null {
  const provider = askFallbackProvider();
  if (!provider) return null;
  return runtimeFor(provider, envAskFallbackModel(), req);
}

export function askLanguageModel(runtime: AskRuntime): string | LanguageModel {
  if (runtime.provider === "google") {
    return createGoogle({ apiKey: googleKey() })(runtime.model) as LanguageModel;
  }
  if (runtime.provider === "openrouter") {
    return createOpenRouter({ apiKey: openrouterKey() })(runtime.model) as LanguageModel;
  }
  return runtime.model;
}
