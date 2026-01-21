/**
 * High-value API surface classification used for applying stricter controls
 * (auth, tenant scoping, rate limits, audit logging).
 */

const PATTERNS: { category: string; regex: RegExp }[] = [
  { category: "profiles", regex: /^\/api\/(v1\/)?(profile|users|accounts)/ },
  { category: "auth-tokens", regex: /^\/api\/(auth|session|tokens|magic|login|refresh)/ },
  { category: "billing", regex: /^\/api\/(billing|payments|subscriptions|invoices|credits)/ },
  { category: "pii-phi", regex: /^\/api\/(pii|phi|personal-data|hr|health)/ },
  { category: "financial", regex: /^\/api\/(payouts|bank|ledger|payroll|finance)/ },
  { category: "inventory", regex: /^\/api\/(inventory|fulfillment|orders|shipments|labels)/ },
  { category: "analytics-exports", regex: /^\/api\/(analytics|bi|exports|reports)/ },
  { category: "admin-ops", regex: /^\/api\/(admin|ops|feature-flags|impersonation|audit|super-admin)/ },
  { category: "webhooks-mutating", regex: /^\/api\/.*\/webhooks?/ },
  { category: "storage-private", regex: /^\/api\/(storage|files|download|vault)/ },
  { category: "support", regex: /^\/api\/(support|tickets|notes|escalations)/ },
  { category: "partner", regex: /^\/api\/(partner|supplier|vendor|pricing|forecast)/ },
];

export function classifyHighValuePath(pathname: string): string | null {
  for (const { category, regex } of PATTERNS) {
    if (regex.test(pathname)) return category;
  }
  return null;
}

export function isHighValuePath(pathname: string): boolean {
  return classifyHighValuePath(pathname) !== null;
}
