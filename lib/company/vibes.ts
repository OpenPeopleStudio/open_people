import type { SupabaseClient } from "@supabase/supabase-js";

const TOKENS_PER_VIBE = 1_000_000;
const BASE_DELTA_CAP = 5;
const EXPONENTIAL_THRESHOLD = 10_000;
const EXPONENTIAL_K = 0.005;

export type TokenDirection = "in" | "out";

export type VibeBalanceResult = {
  balance: number;
  delta: number;
  crashed: boolean;
};

/**
 * Token estimate for vibe accounting.
 * Uses a word-count heuristic (not tiktoken) so Next/Turbopack page
 * collection does not require tiktoken_bg.wasm at build time.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const wordCount = trimmed.split(/\s+/).length;
  return Math.max(1, Math.round(wordCount * 1.3));
}

export async function ensureVibeBalance(
  supabase: SupabaseClient,
  tenantId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("company_vibe_balances")
    .select("balance")
    .eq("tenant_id", tenantId)
    .single();

  if (data?.balance !== undefined) {
    return Number(data.balance);
  }

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("company_vibe_balances")
    .insert({ tenant_id: tenantId, balance: 100 })
    .select("balance")
    .single();

  if (insertError) {
    throw insertError;
  }

  return Number(inserted?.balance ?? 100);
}

export function computeVibeDelta(baseDelta: number, balance: number): number {
  if (balance < EXPONENTIAL_THRESHOLD) {
    return Math.max(-BASE_DELTA_CAP, Math.min(BASE_DELTA_CAP, baseDelta));
  }
  const multiplier = 1 + (balance / 10_000) * EXPONENTIAL_K;
  return baseDelta * multiplier;
}

export async function applyVibeDelta(
  supabase: SupabaseClient,
  tenantId: string,
  baseDelta: number
): Promise<VibeBalanceResult> {
  const currentBalance = await ensureVibeBalance(supabase, tenantId);
  const delta = computeVibeDelta(baseDelta, currentBalance);
  let nextBalance = currentBalance + delta;
  let crashed = false;

  if (nextBalance <= 0) {
    nextBalance = 0;
    crashed = true;
  }

  const { error } = await supabase
    .from("company_vibe_balances")
    .upsert({ tenant_id: tenantId, balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);

  if (error) {
    throw error;
  }

  return { balance: nextBalance, delta, crashed };
}

export async function recordTokenEvent(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  direction: TokenDirection,
  tokenCount: number,
  rawVibeDelta: number,
  source: string
) {
  return supabase.from("token_events").insert({
    tenant_id: tenantId,
    user_id: userId,
    direction,
    token_count: tokenCount,
    raw_vibe_delta: rawVibeDelta,
    source,
  });
}

export function tokensToBaseDelta(tokenIn: number, tokenOut: number): number {
  const netTokens = tokenIn - tokenOut;
  if (!netTokens) return 0;
  return netTokens / TOKENS_PER_VIBE;
}
