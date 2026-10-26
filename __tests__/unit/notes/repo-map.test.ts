import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PARKED_ROOTS,
  REPO_MAP,
  RETIRED_EXTERNAL,
  RETIRED_TO_HOME,
  ROLES,
  SITEMAP_ROUTES,
  SITE_PREFIXES,
  SPEC_ROOTS,
  UNLISTED_LIVE_ROUTES,
  type RepoRole,
} from "../../../notes/repo-map";

const ROOT = process.cwd();

function trackedTopLevel(): string[] {
  const out = execSync("git ls-files -z", { cwd: ROOT, encoding: "utf8" });
  const names = new Set<string>();
  for (const line of out.split("\0")) {
    if (line.length === 0) continue;
    const slash = line.indexOf("/");
    names.add(slash === -1 ? line : line.slice(0, slash));
  }
  return [...names].sort();
}

function pageFile(route: string): string {
  if (route === "/") return "app/(marketing)/page.tsx";
  return `app/(marketing)${route}/page.tsx`;
}

describe("repo map", () => {
  it("classifies every tracked top-level path once", () => {
    const mapped = REPO_MAP.map((entry) => entry.path).sort();
    expect(new Set(mapped).size).toBe(mapped.length);
    expect(mapped).toEqual(trackedTopLevel());
  });

  it("uses only the six roles", () => {
    for (const entry of REPO_MAP) {
      expect(ROLES).toContain(entry.role);
    }
  });

  it("matches the sitemap and keeps /coalition off it", () => {
    const sitemap = readFileSync(resolve(ROOT, "app/sitemap.ts"), "utf8");
    for (const route of SITEMAP_ROUTES) {
      expect(sitemap).toContain(`path: "${route}"`);
      expect(existsSync(resolve(ROOT, pageFile(route)))).toBe(true);
    }
    expect(sitemap).not.toContain('path: "/coalition"');
    for (const route of UNLISTED_LIVE_ROUTES) {
      expect(existsSync(resolve(ROOT, pageFile(route)))).toBe(true);
    }
  });

  it("matches the retired redirects in next.config.ts", () => {
    const config = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
    for (const route of RETIRED_TO_HOME) {
      expect(config).toContain(`"${route}"`);
    }
    expect(config).toContain('source: "/login"');
    expect(config).toContain('destination: "https://app.openpeople.ai"');
    expect(RETIRED_EXTERNAL).toEqual(["/login"]);
  });

  it("points site prefixes at files that exist", () => {
    for (const prefix of SITE_PREFIXES) {
      expect(existsSync(resolve(ROOT, prefix)), prefix).toBe(true);
    }
  });

  it("keeps parked and spec roots inside the map", () => {
    const paths = new Set(REPO_MAP.map((entry) => entry.path));
    for (const root of [...PARKED_ROOTS, ...SPEC_ROOTS]) {
      const top = root.split("/")[0] ?? root;
      expect(paths.has(top), root).toBe(true);
    }
    const roleByPath = new Map(REPO_MAP.map((entry) => [entry.path, entry.role]));
    expect(roleByPath.get("templates")).toBe("parked" satisfies RepoRole);
    expect(roleByPath.get("packages")).toBe("spec" satisfies RepoRole);
    expect(roleByPath.get("PLAN.md")).toBe("record" satisfies RepoRole);
  });

  it("describes the public site in the README", () => {
    const readme = readFileSync(resolve(ROOT, "README.md"), "utf8");
    expect(readme).toContain("www.openpeople.ai");
    expect(readme).toContain("notes/repo-map.ts");
    expect(readme).toContain("PLAN.md");
    expect(readme).not.toMatch(/commerce infrastructure/i);
    expect(readme).not.toMatch(/retail brands/i);
  });

  it("marks parked roots and spec roots", () => {
    for (const root of PARKED_ROOTS) {
      const body = readFileSync(resolve(ROOT, root, "PARKED.md"), "utf8");
      expect(body, root).toContain("Parked. Not the public site.");
      expect(body, root).toContain("notes/repo-map.ts");
    }
    for (const root of SPEC_ROOTS) {
      const body = readFileSync(resolve(ROOT, root, "SPEC.md"), "utf8");
      expect(body, root).toContain("Spec. Not the public site.");
      expect(body, root).toContain("docs/spec/");
    }
  });

  it("files root notes under notes/", () => {
    expect(existsSync(resolve(ROOT, "PLAN-ask-2026-10-22.md"))).toBe(false);
    expect(existsSync(resolve(ROOT, "VISION.md"))).toBe(false);
    expect(existsSync(resolve(ROOT, "DEBATES.md"))).toBe(false);
    expect(existsSync(resolve(ROOT, "notes/2026-10-22-plan-ask.md"))).toBe(true);
    expect(existsSync(resolve(ROOT, "notes/archive/vision.md"))).toBe(true);
    expect(existsSync(resolve(ROOT, "notes/archive/debates.md"))).toBe(true);
    expect(existsSync(resolve(ROOT, "notes/archive/personal-data-capture.plan.md"))).toBe(true);
    const locks = readFileSync(resolve(ROOT, "docs/company/locks.md"), "utf8");
    expect(locks).not.toContain("PLAN-ask-2026-10-22.md");
    expect(locks).toContain("notes/2026-10-22-plan-ask.md");
    const decision = readFileSync(resolve(ROOT, "decisions/001-json-envelope.md"), "utf8");
    expect(decision).toContain("notes/archive/debates.md");
    expect(decision).not.toContain("DEBATES.md");
  });
});
