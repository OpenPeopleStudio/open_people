import { describe, expect, it } from "vitest";
import {
  isProbePath,
  probePathNotFoundResponse,
  PROBE_NOT_FOUND_BODY,
} from "@/lib/security/probe-paths";

const PROBE_PATHS = [
  "/wp-admin",
  "/wp-admin/",
  "/wp-admin/install.php",
  "/wp-admin/css/install.css",
  "/WP-ADMIN/INSTALL.PHP",
  "/wp-login.php",
  "/wp-login.php/",
  "/xmlrpc.php",
  "/blog/xmlrpc.php",
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.env.bak",
  "/_next/.env",
  "/_next/.env.local",
  "/foo/bar/.env.production",
  "/%2eenv",
  "/.git",
  "/.git/",
  "/.git/config",
  "/.git/HEAD",
  "/foo/.git/config",
];

const LIVE_PATHS = [
  "/",
  "/ask",
  "/api/ask",
  "/api/ask/follow-up",
  "/about",
  "/contact",
  "/admin",
  "/super-admin",
  "/_next/static/chunks/main.js",
  "/_next/image",
  "/_vercel/insights/script.js",
  "/favicon.ico",
  "/.github",
  "/.github/workflows/ci.yml",
  "/.gitignore",
  "/environment",
  "/wp-administrator",
];

describe("isProbePath", () => {
  it("matches WordPress, env, and git probe paths", () => {
    for (const path of PROBE_PATHS) {
      expect(isProbePath(path), path).toBe(true);
    }
  });

  it("does not match live app, analytics, or nearby-looking paths", () => {
    for (const path of LIVE_PATHS) {
      expect(isProbePath(path), path).toBe(false);
    }
  });
});

describe("probePathNotFoundResponse", () => {
  it("returns a plaintext 404 that is not cached", async () => {
    const response = probePathNotFoundResponse();
    expect(response.status).toBe(404);
    expect(await response.text()).toBe(PROBE_NOT_FOUND_BODY);
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    expect(response.headers.get("cache-control")).toMatch(/no-store/);
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/);
  });
});
