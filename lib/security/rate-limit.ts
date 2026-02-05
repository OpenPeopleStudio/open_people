export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitRule {
  pattern: RegExp;
  limit: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  reset: number;
}

const DEFAULT_RULES: RateLimitRule[] = [
  { pattern: /^\/api\/auth\/login$/, limit: 10, windowMs: 60_000 },
  { pattern: /^\/api\/v1\/chat\/completions$/, limit: 60, windowMs: 60_000 },
  { pattern: /^\/api\/vault\/quick-upload$/, limit: 30, windowMs: 60_000 },
  { pattern: /^\/api\/email\/inbound\/webhook$/, limit: 120, windowMs: 60_000 },
  { pattern: /^\/api\//, limit: 120, windowMs: 60_000 },
];

declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore: Map<string, RateLimitEntry> =
  globalThis.__rateLimitStore ?? (globalThis.__rateLimitStore = new Map());

function getRule(pathname: string, rules: RateLimitRule[]): RateLimitRule {
  return rules.find((rule) => rule.pattern.test(pathname)) || rules[rules.length - 1];
}

function getClientKey(headers: Headers, pathname: string, method: string): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${ip}:${method}:${pathname}`;
}

export function checkRateLimit(
  request: { headers: Headers; method: string },
  pathname: string,
  rules: RateLimitRule[] = DEFAULT_RULES
): RateLimitResult {
  const rule = getRule(pathname, rules);
  const now = Date.now();
  const key = getClientKey(request.headers, pathname, request.method);

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + rule.windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count += 1;

  const remaining = Math.max(0, rule.limit - entry.count);
  const allowed = entry.count <= rule.limit;

  return {
    allowed,
    limit: rule.limit,
    remaining,
    reset: entry.reset,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
