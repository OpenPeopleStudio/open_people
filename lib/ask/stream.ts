import { createLogger } from "@/lib/observability/logger";
import type { AskRuntime } from "@/lib/ask/provider";

const log = createLogger({ event: "ask" });

export const ASK_FIRST_TOKEN_MS = 12_000;

export type AskAttemptStart = (
  runtime: AskRuntime,
  abortSignal: AbortSignal,
) => Promise<AsyncIterable<string>> | AsyncIterable<string>;

export type AskWithFallbackOk = {
  ok: true;
  runtime: AskRuntime;
  fallbackFired: boolean;
  chunks: AsyncIterable<string>;
};

export type AskWithFallbackFail = {
  ok: false;
  fallbackFired: boolean;
};

export type AskWithFallbackResult = AskWithFallbackOk | AskWithFallbackFail;

function failReason(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "ask-first-token-timeout") return "first-token-timeout";
    if (error.message === "ask-empty-stream") return "empty-stream";
    if (error.message === "ask-snag") return "missing-key";
    if (error.message === "ask-unconfigured") return "unconfigured";
    const status = (error as { statusCode?: unknown }).statusCode;
    if (typeof status === "number") return `http-${status}`;
    return error.name || "error";
  }
  return "error";
}

async function* prependChunk(
  first: string,
  rest: AsyncIterator<string>,
): AsyncIterable<string> {
  yield first;
  while (true) {
    const next = await rest.next();
    if (next.done) return;
    if (next.value) yield next.value;
  }
}

function sleep(ms: number): Promise<"timeout"> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("timeout"), ms);
  });
}

async function waitFirstToken(
  stream: AsyncIterable<string>,
  abort: AbortController,
  timeoutMs: number,
): Promise<{ first: string; rest: AsyncIterator<string> } | { error: unknown }> {
  const iterator = stream[Symbol.asyncIterator]();
  const deadline = Date.now() + timeoutMs;
  try {
    while (true) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        abort.abort();
        return { error: new Error("ask-first-token-timeout") };
      }
      const next = await Promise.race([iterator.next(), sleep(remaining)]);
      if (next === "timeout") {
        abort.abort();
        return { error: new Error("ask-first-token-timeout") };
      }
      if (next.done) {
        return { error: new Error("ask-empty-stream") };
      }
      if (next.value.length > 0) {
        return { first: next.value, rest: iterator };
      }
    }
  } catch (error) {
    abort.abort();
    return { error };
  }
}

async function tryRuntime(
  runtime: AskRuntime,
  start: AskAttemptStart,
  timeoutMs: number,
): Promise<{ first: string; rest: AsyncIterator<string> } | { error: unknown }> {
  if (runtime.state === "snag") {
    return { error: new Error("ask-snag") };
  }
  if (runtime.state === "unconfigured") {
    return { error: new Error("ask-unconfigured") };
  }
  const abort = new AbortController();
  try {
    const stream = await start(runtime, abort.signal);
    return await waitFirstToken(stream, abort, timeoutMs);
  } catch (error) {
    abort.abort();
    return { error };
  }
}

function logAttemptFailed(
  runtime: AskRuntime,
  error: unknown,
  event: "ask.primary_failed" | "ask.fallback_failed",
) {
  log.warn(
    {
      provider: runtime.provider,
      model: runtime.model,
      reason: failReason(error),
    },
    event,
  );
}

/**
 * Try the primary until first text, then once on the fallback if the
 * primary errors or times out before any token. No fallback means current
 * single-provider behavior.
 */
export async function runAskWithFallback(input: {
  primary: AskRuntime;
  fallback: AskRuntime | null;
  start: AskAttemptStart;
  firstTokenMs?: number;
}): Promise<AskWithFallbackResult> {
  const timeoutMs = input.firstTokenMs ?? ASK_FIRST_TOKEN_MS;
  const primaryAttempt = await tryRuntime(input.primary, input.start, timeoutMs);
  if ("first" in primaryAttempt) {
    log.info(
      {
        provider: input.primary.provider,
        model: input.primary.model,
        fallbackFired: false,
      },
      "ask.answered",
    );
    return {
      ok: true,
      runtime: input.primary,
      fallbackFired: false,
      chunks: prependChunk(primaryAttempt.first, primaryAttempt.rest),
    };
  }

  logAttemptFailed(input.primary, primaryAttempt.error, "ask.primary_failed");

  if (!input.fallback) {
    return { ok: false, fallbackFired: false };
  }

  const fallbackAttempt = await tryRuntime(input.fallback, input.start, timeoutMs);
  if ("first" in fallbackAttempt) {
    log.info(
      {
        provider: input.fallback.provider,
        model: input.fallback.model,
        fallbackFired: true,
      },
      "ask.answered",
    );
    return {
      ok: true,
      runtime: input.fallback,
      fallbackFired: true,
      chunks: prependChunk(fallbackAttempt.first, fallbackAttempt.rest),
    };
  }

  logAttemptFailed(input.fallback, fallbackAttempt.error, "ask.fallback_failed");
  return { ok: false, fallbackFired: true };
}
