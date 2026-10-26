import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { authorizeAskAdmin } from "@/lib/ask/admin";
import { parseFollowUp } from "@/lib/ask/follow-up";
import { knowledgeIsPlaceholder, loadProposalKnowledge } from "@/lib/ask/knowledge";
import { logAskFollowUp, logAskQuestion } from "@/lib/ask/log";
import {
  ASK_FALLBACK_MODEL_DEFAULT,
  ASK_MODEL_DEFAULT,
  answerLooksCovered,
  askGatewayProviderOptions,
  askModel,
  assistantConfigured,
  buildAskInstructions,
  gatewayConfigured,
  isAllowedAskModel,
  lastUserText,
} from "@/lib/ask/prompt";
import {
  ASK_GOOGLE_MODEL_DEFAULT,
  ASK_OPENROUTER_MODEL_DEFAULT,
  askFallbackProvider,
  askFallbackRuntime,
  askModelFor,
  askProvider,
  askRuntime,
  isDisallowedAskModel,
  parseAskProviderId,
} from "@/lib/ask/provider";
import { ASK_FIRST_TOKEN_MS, runAskWithFallback } from "@/lib/ask/stream";
import { parseFollowupsStatus, parseMarkAnswered } from "@/lib/ask/store";

describe("ask prompt", () => {
  it("binds answers to the knowledge file and the honesty rules", () => {
    const instructions = buildAskInstructions("PLACEHOLDER KNOWLEDGE");
    expect(instructions).toContain("PLACEHOLDER KNOWLEDGE");
    expect(instructions).toMatch(/CONFIRMED/);
    expect(instructions).toMatch(/REPORTED/);
    expect(instructions).toMatch(/ESTIMATE/);
    expect(instructions).toMatch(/UNKNOWN/);
    expect(instructions).toMatch(/Never invent numbers/);
    expect(instructions).toMatch(/Never claim a partner/);
    expect(instructions).toMatch(/SWL/);
    expect(instructions).toMatch(/follow-up form/);
    expect(instructions).toMatch(/Do not introduce yourself/);
    expect(instructions).toMatch(/Do not say you are an AI assistant/);
    expect(instructions).not.toMatch(/You are the public AI assistant/);
    expect(instructions).not.toMatch(/transparent about being an AI/);
  });

  it("treats UNKNOWN answers as not covered", () => {
    expect(answerLooksCovered("CONFIRMED: Open People is the proponent.")).toBe(true);
    expect(answerLooksCovered("UNKNOWN. That is not in the knowledge file. Use the follow-up form.")).toBe(
      false,
    );
  });

  it("reads the last user text part", () => {
    expect(
      lastUserText([
        { role: "user", parts: [{ type: "text", text: "first" }] },
        { role: "assistant", parts: [{ type: "text", text: "hi" }] },
        { role: "user", parts: [{ type: "text", text: "What is still unknown?" }] },
      ]),
    ).toBe("What is still unknown?");
  });

  it("defaults the Gateway model id to Grok, not OpenAI", () => {
    expect(ASK_MODEL_DEFAULT).toBe("spacexai/grok-4.7");
    expect(ASK_FALLBACK_MODEL_DEFAULT).toBe("anthropic/claude-sonnet-5.5");
    expect(isAllowedAskModel(ASK_MODEL_DEFAULT)).toBe(true);
    expect(isAllowedAskModel(ASK_FALLBACK_MODEL_DEFAULT)).toBe(true);
    expect(isAllowedAskModel("openai/gpt-4.1-mini")).toBe(false);
    expect(isAllowedAskModel("azure/gpt-4.1-mini")).toBe(false);
    expect(askModel()).toBe(ASK_MODEL_DEFAULT);
    expect(askModel()).toMatch(/\//);
    expect(askModel()).not.toMatch(/openai/i);
    expect(askModel()).not.toMatch(/(^|\/)gpt-/i);
  });
});

describe("ask gateway config", () => {
  const previous = {
    key: process.env.AI_GATEWAY_API_KEY,
    oidc: process.env.VERCEL_OIDC_TOKEN,
    vercel: process.env.VERCEL,
    askModel: process.env.ASK_MODEL,
    openai: process.env.OPENAI_API_KEY,
    askProvider: process.env.ASK_PROVIDER,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    fallbackProvider: process.env.ASK_FALLBACK_PROVIDER,
    fallbackModel: process.env.ASK_FALLBACK_MODEL,
  };

  afterEach(() => {
    for (const [name, value] of [
      ["AI_GATEWAY_API_KEY", previous.key],
      ["VERCEL_OIDC_TOKEN", previous.oidc],
      ["VERCEL", previous.vercel],
      ["ASK_MODEL", previous.askModel],
      ["OPENAI_API_KEY", previous.openai],
      ["ASK_PROVIDER", previous.askProvider],
      ["GOOGLE_GENERATIVE_AI_API_KEY", previous.google],
      ["OPENROUTER_API_KEY", previous.openrouter],
      ["ASK_FALLBACK_PROVIDER", previous.fallbackProvider],
      ["ASK_FALLBACK_MODEL", previous.fallbackModel],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("is off locally without a key or OIDC token", () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    expect(gatewayConfigured()).toBe(false);
  });

  it("accepts a Vercel deployment via OIDC (no API key)", () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    process.env.VERCEL = "1";
    expect(gatewayConfigured()).toBe(true);
    delete process.env.VERCEL;
    expect(
      gatewayConfigured(
        new Request("https://www.openpeople.ai/api/ask", {
          headers: { "x-vercel-oidc-token": "oidc-from-runtime" },
        }),
      ),
    ).toBe(true);
  });

  it("does not treat an OpenAI key as configured without Gateway", () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
    expect(assistantConfigured()).toBe(false);
  });

  it("reads ASK_MODEL when it is a non-OpenAI Gateway id", () => {
    process.env.ASK_MODEL = "spacexai/grok-4.6";
    expect(askModel()).toBe("spacexai/grok-4.6");
    process.env.ASK_MODEL = "openai/gpt-4.1-mini";
    expect(askModel()).toBe(ASK_MODEL_DEFAULT);
    process.env.ASK_MODEL = "anthropic/claude-sonnet-5.5";
    expect(askModel()).toBe("anthropic/claude-sonnet-5.5");
  });

  it("routes Gateway through xAI then Anthropic, never OpenAI or Azure", () => {
    const options = askGatewayProviderOptions();
    expect(options).toEqual({
      gateway: { only: ["xai", "anthropic"], models: ["anthropic/claude-sonnet-5.5"] },
    });
    const listed = JSON.stringify(options);
    expect(listed).not.toMatch(/openai/i);
    expect(listed).not.toMatch(/azure/i);
    expect(listed).not.toMatch(/gpt-/i);
  });
});

describe("ask provider picker", () => {
  const previous = {
    provider: process.env.ASK_PROVIDER,
    model: process.env.ASK_MODEL,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gateway: process.env.AI_GATEWAY_API_KEY,
    oidc: process.env.VERCEL_OIDC_TOKEN,
    vercel: process.env.VERCEL,
    fallbackProvider: process.env.ASK_FALLBACK_PROVIDER,
    fallbackModel: process.env.ASK_FALLBACK_MODEL,
  };

  afterEach(() => {
    for (const [name, value] of [
      ["ASK_PROVIDER", previous.provider],
      ["ASK_MODEL", previous.model],
      ["GOOGLE_GENERATIVE_AI_API_KEY", previous.google],
      ["OPENROUTER_API_KEY", previous.openrouter],
      ["AI_GATEWAY_API_KEY", previous.gateway],
      ["VERCEL_OIDC_TOKEN", previous.oidc],
      ["VERCEL", previous.vercel],
      ["ASK_FALLBACK_PROVIDER", previous.fallbackProvider],
      ["ASK_FALLBACK_MODEL", previous.fallbackModel],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("defaults to AI Gateway Grok when ASK_PROVIDER is unset", () => {
    delete process.env.ASK_PROVIDER;
    delete process.env.ASK_MODEL;
    expect(askProvider()).toBe("gateway");
    expect(askModelFor()).toBe(ASK_MODEL_DEFAULT);
    expect(askModelFor()).not.toMatch(/openai/i);
  });

  it("selects Gemini flash for ASK_PROVIDER=google", () => {
    process.env.ASK_PROVIDER = "google";
    delete process.env.ASK_MODEL;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    expect(askProvider()).toBe("google");
    expect(askModelFor()).toBe(ASK_GOOGLE_MODEL_DEFAULT);
    expect(ASK_GOOGLE_MODEL_DEFAULT).toMatch(/gemini/i);
    expect(ASK_GOOGLE_MODEL_DEFAULT).toMatch(/flash/i);
    expect(isDisallowedAskModel(ASK_GOOGLE_MODEL_DEFAULT)).toBe(false);
    expect(askRuntime().state).toBe("snag");
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key-not-real";
    expect(askRuntime().state).toBe("ready");
    expect(askRuntime().model).toBe(ASK_GOOGLE_MODEL_DEFAULT);
  });

  it("uses ASK_MODEL for Google when it is a Gemini id", () => {
    process.env.ASK_PROVIDER = "google";
    process.env.ASK_MODEL = "gemini-2.0-flash";
    expect(askModelFor()).toBe("gemini-2.0-flash");
    process.env.ASK_MODEL = "openai/gpt-4.1-mini";
    expect(askModelFor()).toBe(ASK_GOOGLE_MODEL_DEFAULT);
    process.env.ASK_MODEL = ASK_MODEL_DEFAULT;
    expect(askModelFor()).toBe(ASK_GOOGLE_MODEL_DEFAULT);
  });

  it("selects an OpenRouter :free non-OpenAI model", () => {
    process.env.ASK_PROVIDER = "openrouter";
    delete process.env.ASK_MODEL;
    delete process.env.OPENROUTER_API_KEY;
    expect(askProvider()).toBe("openrouter");
    expect(askModelFor()).toBe(ASK_OPENROUTER_MODEL_DEFAULT);
    expect(ASK_OPENROUTER_MODEL_DEFAULT).toMatch(/:free$/);
    expect(ASK_OPENROUTER_MODEL_DEFAULT.toLowerCase().startsWith("openai/")).toBe(false);
    expect(isDisallowedAskModel(ASK_OPENROUTER_MODEL_DEFAULT)).toBe(false);
    expect(askRuntime().state).toBe("snag");
    process.env.OPENROUTER_API_KEY = "test-openrouter-key-not-real";
    expect(askRuntime().state).toBe("ready");
  });

  it("rejects OpenRouter model ids that start with openai/", () => {
    process.env.ASK_PROVIDER = "openrouter";
    process.env.ASK_MODEL = "openai/gpt-4o-mini";
    expect(askModelFor()).toBe(ASK_OPENROUTER_MODEL_DEFAULT);
    process.env.ASK_MODEL = "google/gemma-4-26b-a4b-it:free";
    expect(askModelFor()).toBe("google/gemma-4-26b-a4b-it:free");
  });

  it("does not treat ASK_PROVIDER=openai as a live provider", () => {
    process.env.ASK_PROVIDER = "openai";
    expect(askProvider()).toBe("gateway");
    expect(askModelFor()).toBe(ASK_MODEL_DEFAULT);
  });

  it("keeps Gateway unconfigured as unconfigured, not snag", () => {
    delete process.env.ASK_PROVIDER;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    expect(askRuntime().state).toBe("unconfigured");
  });
});

describe("ask fallback selection", () => {
  const previous = {
    provider: process.env.ASK_PROVIDER,
    model: process.env.ASK_MODEL,
    fallbackProvider: process.env.ASK_FALLBACK_PROVIDER,
    fallbackModel: process.env.ASK_FALLBACK_MODEL,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gateway: process.env.AI_GATEWAY_API_KEY,
    oidc: process.env.VERCEL_OIDC_TOKEN,
    vercel: process.env.VERCEL,
  };

  afterEach(() => {
    for (const [name, value] of [
      ["ASK_PROVIDER", previous.provider],
      ["ASK_MODEL", previous.model],
      ["ASK_FALLBACK_PROVIDER", previous.fallbackProvider],
      ["ASK_FALLBACK_MODEL", previous.fallbackModel],
      ["GOOGLE_GENERATIVE_AI_API_KEY", previous.google],
      ["OPENROUTER_API_KEY", previous.openrouter],
      ["AI_GATEWAY_API_KEY", previous.gateway],
      ["VERCEL_OIDC_TOKEN", previous.oidc],
      ["VERCEL", previous.vercel],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("is off when ASK_FALLBACK_PROVIDER is unset", () => {
    delete process.env.ASK_FALLBACK_PROVIDER;
    delete process.env.ASK_FALLBACK_MODEL;
    expect(askFallbackProvider()).toBeNull();
    expect(askFallbackRuntime()).toBeNull();
    expect(parseAskProviderId("openai")).toBeNull();
    expect(parseAskProviderId("google")).toBe("google");
  });

  it("selects production Gemini primary and OpenRouter Nemotron fallback", () => {
    process.env.ASK_PROVIDER = "google";
    process.env.ASK_MODEL = "gemini-flash-lite-latest";
    process.env.ASK_FALLBACK_PROVIDER = "openrouter";
    process.env.ASK_FALLBACK_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key-not-real";
    process.env.OPENROUTER_API_KEY = "test-openrouter-key-not-real";
    expect(askProvider()).toBe("google");
    expect(askModelFor()).toBe("gemini-flash-lite-latest");
    expect(askRuntime().state).toBe("ready");
    expect(askFallbackProvider()).toBe("openrouter");
    const fallback = askFallbackRuntime();
    expect(fallback).not.toBeNull();
    expect(fallback?.provider).toBe("openrouter");
    expect(fallback?.model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
    expect(fallback?.state).toBe("ready");
    expect(isDisallowedAskModel("gemini-flash-lite-latest")).toBe(false);
    expect(isDisallowedAskModel("nvidia/nemotron-3-ultra-550b-a55b:free")).toBe(false);
  });

  it("rejects openai/ on the fallback slot", () => {
    process.env.ASK_FALLBACK_PROVIDER = "openrouter";
    process.env.ASK_FALLBACK_MODEL = "openai/gpt-4o-mini";
    const fallback = askFallbackRuntime();
    expect(fallback?.provider).toBe("openrouter");
    expect(fallback?.model).toBe(ASK_OPENROUTER_MODEL_DEFAULT);
    expect(fallback?.model.toLowerCase().startsWith("openai/")).toBe(false);
    process.env.ASK_FALLBACK_PROVIDER = "google";
    process.env.ASK_FALLBACK_MODEL = "openai/gpt-4.1-mini";
    expect(askFallbackRuntime()?.model).toBe(ASK_GOOGLE_MODEL_DEFAULT);
  });

  it("uses the provider default when ASK_FALLBACK_MODEL is unset", () => {
    process.env.ASK_FALLBACK_PROVIDER = "openrouter";
    delete process.env.ASK_FALLBACK_MODEL;
    expect(askFallbackRuntime()?.model).toBe(ASK_OPENROUTER_MODEL_DEFAULT);
  });

  it("does not treat ASK_FALLBACK_PROVIDER=openai as a fallback", () => {
    process.env.ASK_FALLBACK_PROVIDER = "openai";
    process.env.ASK_FALLBACK_MODEL = "openai/gpt-4o-mini";
    expect(askFallbackProvider()).toBeNull();
    expect(askFallbackRuntime()).toBeNull();
  });
});

describe("ask fallback stream", () => {
  const google = {
    provider: "google" as const,
    model: "gemini-flash-lite-latest",
    state: "ready" as const,
  };
  const openrouter = {
    provider: "openrouter" as const,
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    state: "ready" as const,
  };

  async function collect(chunks: AsyncIterable<string>): Promise<string> {
    let text = "";
    for await (const part of chunks) text += part;
    return text;
  }

  it("uses the primary when it streams text", async () => {
    const calls: string[] = [];
    const result = await runAskWithFallback({
      primary: google,
      fallback: openrouter,
      start: async (runtime) => {
        calls.push(runtime.provider);
        return (async function* () {
          yield "CONFIRMED: from Gemini.";
        })();
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fallbackFired).toBe(false);
    expect(result.runtime.provider).toBe("google");
    expect(await collect(result.chunks)).toBe("CONFIRMED: from Gemini.");
    expect(calls).toEqual(["google"]);
  });

  it("retries once on the fallback when the primary errors before text", async () => {
    const calls: string[] = [];
    const result = await runAskWithFallback({
      primary: google,
      fallback: openrouter,
      start: async (runtime) => {
        calls.push(runtime.provider);
        if (runtime.provider === "google") {
          const error = new Error("overloaded") as Error & { statusCode: number };
          error.statusCode = 503;
          throw error;
        }
        return (async function* () {
          yield "CONFIRMED: from Nemotron.";
        })();
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fallbackFired).toBe(true);
    expect(result.runtime).toEqual(openrouter);
    expect(await collect(result.chunks)).toBe("CONFIRMED: from Nemotron.");
    expect(calls).toEqual(["google", "openrouter"]);
  });

  it("retries on fallback after a first-token timeout", async () => {
    const result = await runAskWithFallback({
      primary: google,
      fallback: openrouter,
      firstTokenMs: 30,
      start: async (runtime) => {
        if (runtime.provider === "google") {
          return (async function* () {
            await new Promise((resolve) => setTimeout(resolve, 80));
            yield "too late";
          })();
        }
        return (async function* () {
          yield "fallback text";
        })();
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fallbackFired).toBe(true);
    expect(await collect(result.chunks)).toBe("fallback text");
    expect(ASK_FIRST_TOKEN_MS).toBe(12_000);
  });

  it("snags when both fail before text", async () => {
    const result = await runAskWithFallback({
      primary: google,
      fallback: openrouter,
      start: async (runtime) => {
        const error = new Error("rate limited") as Error & { statusCode: number };
        error.statusCode = 429;
        error.message = `${runtime.provider} 429`;
        throw error;
      },
    });
    expect(result).toEqual({ ok: false, fallbackFired: true });
  });

  it("does not call fallback when none is configured", async () => {
    const calls: string[] = [];
    const result = await runAskWithFallback({
      primary: google,
      fallback: null,
      start: async (runtime) => {
        calls.push(runtime.provider);
        throw new Error("missing key");
      },
    });
    expect(result).toEqual({ ok: false, fallbackFired: false });
    expect(calls).toEqual(["google"]);
  });

  it("treats a missing primary key as a pre-text failure and uses fallback", async () => {
    const calls: string[] = [];
    const result = await runAskWithFallback({
      primary: { ...google, state: "snag" },
      fallback: openrouter,
      start: async (runtime) => {
        calls.push(runtime.provider);
        return (async function* () {
          yield "from fallback";
        })();
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fallbackFired).toBe(true);
    expect(await collect(result.chunks)).toBe("from fallback");
    expect(calls).toEqual(["openrouter"]);
  });
});

describe("ask path has no OpenAI", () => {
  const ROOT = process.cwd();
  const SCAN = ["lib/ask", "app/api/ask"];
  const TEXT_EXT = new Set([".ts", ".tsx", ".js"]);

  function walk(dir: string, files: string[] = []): string[] {
    if (!existsSync(dir)) return files;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, files);
        continue;
      }
      if (TEXT_EXT.has(extname(entry.name).toLowerCase())) files.push(full);
    }
    return files;
  }

  it("has no openai-direct import and no OpenAI model on the live /ask path", () => {
    expect(existsSync(resolve(ROOT, "lib/ask/openai-direct.ts"))).toBe(false);
    const hits: string[] = [];
    for (const rel of SCAN) {
      for (const file of walk(resolve(ROOT, rel))) {
        const text = readFileSync(file, "utf8");
        const path = relative(ROOT, file);
        if (/openai-direct/.test(text)) hits.push(`${path}: openai-direct`);
        if (/OPENAI_API_KEY/.test(text)) hits.push(`${path}: OPENAI_API_KEY`);
        if (/from ["']openai["']/.test(text)) hits.push(`${path}: openai package`);
        if (/openai\/gpt/i.test(text)) hits.push(`${path}: openai/gpt model`);
        if (/(^|[^a-z])azure(?:\/|"|'|,|])/i.test(text) && /providerOptions|only:/.test(text)) {
          hits.push(`${path}: azure gateway route`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("ask knowledge file", () => {
  it("ships filled proposal knowledge with honesty labels", () => {
    const text = loadProposalKnowledge();
    expect(knowledgeIsPlaceholder(text)).toBe(false);
    expect(text).toMatch(/\*\*Status:\*\*\s*filled/i);
    expect(text).toMatch(/\bCONFIRMED\b/);
    expect(text).toMatch(/\bREPORTED\b/);
    expect(text).toMatch(/\bESTIMATE\b/);
    expect(text).toMatch(/\bUNKNOWN\b/);
  });
});

describe("ask follow-up parse", () => {
  it("requires a real email and a question", () => {
    expect(parseFollowUp({})).toEqual({
      ok: false,
      error: "A working email is required so Tom can reply.",
    });
    expect(parseFollowUp({ email: "not-an-email", question: "What is the campus?" })).toEqual({
      ok: false,
      error: "A working email is required so Tom can reply.",
    });
    expect(parseFollowUp({ email: "tom@openpeople.ai", question: "Hi" }).ok).toBe(false);
    const parsed = parseFollowUp({
      name: "Ada",
      email: "ada@example.com",
      question: "What is still unknown in the proposal?",
    });
    expect(parsed).toEqual({
      ok: true,
      spam: false,
      value: {
        name: "Ada",
        email: "ada@example.com",
        question: "What is still unknown in the proposal?",
      },
    });
  });

  it("swallows honeypot spam as a fake success", () => {
    expect(
      parseFollowUp({
        email: "bot@example.com",
        question: "Buy this now please",
        company_website: "https://spam.example",
      }),
    ).toEqual({ ok: true, spam: true });
  });
});

describe("ask question log", () => {
  const previous = process.env.ASK_LOG_PATH;

  afterEach(() => {
    if (previous === undefined) delete process.env.ASK_LOG_PATH;
    else process.env.ASK_LOG_PATH = previous;
  });

  it("writes question text and covered, never an email field", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskQuestion({ question: "What is unknown?", covered: false });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.kind).toBe("question");
    expect(row.question).toBe("What is unknown?");
    expect(row.covered).toBe(false);
    expect(line).not.toMatch(/@/);
    expect(row.email).toBeUndefined();
  });

  it("logs provider and model, never a key", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskQuestion({
      question: "What is unknown?",
      covered: false,
      provider: "google",
      model: "gemini-2.5-flash",
    });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.provider).toBe("google");
    expect(row.model).toBe("gemini-2.5-flash");
    expect(line).not.toMatch(/AIza|sk-|or-/i);
    expect(row.apiKey).toBeUndefined();
  });

  it("logs fallbackFired without keys or extra question fields", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskQuestion({
      question: "What is unknown?",
      covered: false,
      provider: "openrouter",
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      fallbackFired: true,
    });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.provider).toBe("openrouter");
    expect(row.model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
    expect(row.fallbackFired).toBe(true);
    expect(row.apiKey).toBeUndefined();
    expect(line).not.toMatch(/AIza|sk-|or-/i);
  });

  it("logs a stored follow-up without name or email", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskFollowUp({
      question: "What is still unknown?",
      id: "11111111-1111-4111-8111-111111111111",
    });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.kind).toBe("followup");
    expect(row.question).toBe("What is still unknown?");
    expect(row.covered).toBe(false);
    expect(row.email).toBeUndefined();
    expect(row.name).toBeUndefined();
    expect(line).not.toMatch(/@/);
  });
});

describe("ask page third-party note", () => {
  it("states the third-party line under the ask box", () => {
    const desk = readFileSync(join(process.cwd(), "components/marketing/ask/AskDesk.tsx"), "utf8");
    expect(desk).toContain("Questions may be processed by a third-party AI provider.");
  });
});

describe("ask follow-up has no Resend", () => {
  it("does not import or mention Resend in the follow-up path", () => {
    const followUp = readFileSync(join(process.cwd(), "lib/ask/follow-up.ts"), "utf8");
    const route = readFileSync(join(process.cwd(), "app/api/ask/follow-up/route.ts"), "utf8");
    expect(followUp).not.toMatch(/resend/i);
    expect(route).not.toMatch(/resend/i);
  });
});

describe("ask admin poll helpers", () => {
  const previous = process.env.ASK_ADMIN_TOKEN;

  afterEach(() => {
    if (previous === undefined) delete process.env.ASK_ADMIN_TOKEN;
    else process.env.ASK_ADMIN_TOKEN = previous;
  });

  it("rejects missing or wrong bearer tokens", () => {
    delete process.env.ASK_ADMIN_TOKEN;
    expect(authorizeAskAdmin(new Request("https://openpeople.ai/api/ask/followups"))).toBe(false);

    process.env.ASK_ADMIN_TOKEN = "secret-token-value";
    expect(authorizeAskAdmin(new Request("https://openpeople.ai/api/ask/followups"))).toBe(false);
    expect(
      authorizeAskAdmin(
        new Request("https://openpeople.ai/api/ask/followups", {
          headers: { authorization: "Bearer wrong-token-value" },
        }),
      ),
    ).toBe(false);
    expect(
      authorizeAskAdmin(
        new Request("https://openpeople.ai/api/ask/followups", {
          headers: { authorization: "Bearer secret-token-value" },
        }),
      ),
    ).toBe(true);
  });

  it("defaults status to open and parses mark-answered ids", () => {
    expect(parseFollowupsStatus(null)).toBe("open");
    expect(parseFollowupsStatus("answered")).toBe("answered");
    expect(parseFollowupsStatus("all")).toBe("all");
    expect(parseFollowupsStatus("nope")).toBe("open");
    expect(parseMarkAnswered({ id: "11111111-1111-4111-8111-111111111111" })).toEqual({
      ok: true,
      ids: ["11111111-1111-4111-8111-111111111111"],
    });
    expect(parseMarkAnswered({})).toMatchObject({ ok: false });
  });
});
