export const ROLES = [
  "site",
  "parked",
  "spec",
  "shared",
  "record",
  "tooling",
] as const;

export type RepoRole = (typeof ROLES)[number];

export type RepoEntry = {
  path: string;
  role: RepoRole;
  note: string;
};

export const SITEMAP_ROUTES = [
  "/",
  "/brief",
  "/tracker",
  "/industries",
  "/costs",
  "/engage",
  "/letter",
  "/build",
  "/capital",
  "/consent",
  "/power",
  "/ask",
  "/compute",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

/** Live page, noindex, not in app/sitemap.ts. */
export const UNLISTED_LIVE_ROUTES = ["/coalition"] as const;

/** next.config.ts retiredMarketing: permanent redirect to /. */
export const RETIRED_TO_HOME = [
  "/pricing",
  "/signup",
  "/documentation",
  "/api-reference",
  "/integrations",
  "/blog",
  "/changelog",
  "/careers",
  "/support",
  "/security",
  "/onboarding/pending",
] as const;

/** Temporary redirect to the parked app host. Page module is not the public site. */
export const RETIRED_EXTERNAL = ["/login"] as const;

export const PARKED_ROOTS = [
  "templates",
  "app/(platform)",
  "app/super-admin",
  "app/(marketing)/_retired",
  "context",
  "infra",
  ".codex",
  "types",
] as const;

export const SPEC_ROOTS = ["packages", "sdk"] as const;

export const SITE_PREFIXES = [
  "app/(marketing)",
  "components/marketing",
  "lib/desk",
  "lib/marketing",
  "lib/og",
  "lib/board",
  "lib/voice-mode",
  "lib/ask",
  "lib/site.ts",
  "content/ask",
  "public",
] as const;

export const REPO_MAP: readonly RepoEntry[] = [
  { path: ".codex", role: "parked", note: "Old org-run skills for the multi-tenant shell." },
  { path: ".cspell.json", role: "tooling", note: "Spellcheck config." },
  { path: ".github", role: "tooling", note: "GitHub workflows and templates." },
  { path: ".gitignore", role: "tooling", note: "Ignore rules. Build output stays untracked." },
  { path: ".markdownlint.json", role: "tooling", note: "Markdown lint config." },
  { path: ".markdownlintignore", role: "tooling", note: "Markdown lint ignore list." },
  { path: "ACTIONS", role: "record", note: "Tool-call log per VERSION. Stays at the repo root with CHANGELOG.md." },
  { path: "AGENTS.md", role: "record", note: "Agent instructions. Stays at the repo root." },
  { path: "CHANGELOG.md", role: "record", note: "Version notes. Stays at the repo root with VERSION and ACTIONS." },
  { path: "CLAUDE.md", role: "record", note: "Project orientation. Stays at the repo root." },
  { path: "PLAN.md", role: "record", note: "Current public-copy slice. Not a map of the repo." },
  { path: "README.md", role: "record", note: "Repo front door." },
  { path: "VERSION", role: "record", note: "Public site version stamp. Currently 0.5.22." },
  { path: "__tests__", role: "tooling", note: "Vitest and Playwright tests." },
  { path: "app", role: "shared", note: "Public routes in app/(marketing), except retired SaaS pages. app/(platform), app/super-admin, app/notes, and most of app/api are the parked shell. Live API routes are app/api/ask and app/api/og." },
  { path: "components", role: "shared", note: "components/marketing is the public site. Other component folders are the parked shell. /privacy and /terms use DeskPage and SiteNav." },
  { path: "content", role: "site", note: "content/ask is the /ask knowledge file." },
  { path: "context", role: "parked", note: "Tenant and vault React context for the parked shell." },
  { path: "decisions", role: "spec", note: "ADRs for the .opkg standard." },
  { path: "docs", role: "shared", note: "docs/plans, docs/superpowers, and docs/assets are the site. docs/spec and docs/reference are the standard. The rest describes the parked platform." },
  { path: "eslint.config.mjs", role: "tooling", note: "ESLint config." },
  { path: "examples", role: "spec", note: "Example .opkg files." },
  { path: "infra", role: "parked", note: "Personal-data docker compose for the parked shell." },
  { path: "instrumentation.ts", role: "shared", note: "Next.js instrumentation for the whole app, including the public site." },
  { path: "lib", role: "shared", note: "Site code is lib/desk, lib/marketing, lib/og, lib/board, lib/voice-mode, lib/ask, and lib/site.ts. Other lib folders serve the parked shell or shared middleware." },
  { path: "middleware.ts", role: "shared", note: "Session, logging, and rate limit for the whole app. /api/ask is on the public allowlist." },
  { path: "next.config.ts", role: "shared", note: "Redirects for retired SaaS marketing routes, /vision, /approach, and /login." },
  { path: "notes", role: "record", note: "Filed plans and archive. Date-first names. Not the Next.js app." },
  { path: "package-lock.json", role: "tooling", note: "npm lockfile." },
  { path: "package.json", role: "tooling", note: "npm scripts. Name stays open_people." },
  { path: "packages", role: "spec", note: "Unstarted reference implementation of the identity standard." },
  { path: "playwright.config.ts", role: "tooling", note: "Playwright config." },
  { path: "postcss.config.mjs", role: "tooling", note: "PostCSS config." },
  { path: "public", role: "site", note: "Favicons, brand files, and OG pngs served by the public site." },
  { path: "scripts", role: "tooling", note: "Doctor, seeds, OG generation, workers." },
  { path: "sdk", role: "spec", note: "Generated TypeScript types from the parked OpenAPI spec." },
  { path: "sentry.client.config.js", role: "shared", note: "Sentry browser config for the whole app." },
  { path: "sentry.edge.config.js", role: "shared", note: "Sentry edge config for the whole app." },
  { path: "sentry.server.config.js", role: "shared", note: "Sentry server config for the whole app." },
  { path: "supabase", role: "shared", note: "Ask follow-ups migration plus the parked shell schema." },
  { path: "templates", role: "parked", note: "Storefront templates. Not rendered by www.openpeople.ai." },
  { path: "tsconfig.json", role: "tooling", note: "TypeScript config. templates/ is excluded." },
  { path: "types", role: "parked", note: "SaaS domain types for the parked shell." },
  { path: "vitest.config.ts", role: "tooling", note: "Vitest config." },
];
