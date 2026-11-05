import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const updateSession = vi.fn();
const logRequest = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => updateSession(...args),
}));

vi.mock("@/lib/observability/edge-logger", () => ({
  withRequestContext: (handler: (request: NextRequest) => Promise<NextResponse>) => handler,
  logRequest: (...args: unknown[]) => logRequest(...args),
}));

vi.mock("@/lib/observability/edge-correlation", () => ({
  withCorrelationId: (handler: (request: NextRequest) => Promise<NextResponse>) => handler,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    limit: 120,
    remaining: 119,
    reset: Date.now() + 60_000,
  })),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

import { config, middleware } from "../../middleware";
import { PROBE_NOT_FOUND_BODY } from "@/lib/security/probe-paths";

function requestFor(path: string, method = "GET") {
  return new NextRequest(new URL(path, "https://openpeople.ai"), { method });
}

describe("middleware probe-path handler", () => {
  beforeEach(() => {
    updateSession.mockReset();
    logRequest.mockReset();
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
  });

  it("hard-404s scanner probes without touching the session middleware", async () => {
    const probes = [
      "/wp-admin",
      "/wp-admin/",
      "/wp-admin/install.php",
      "/wp-login.php",
      "/xmlrpc.php",
      "/.env",
      "/_next/.env",
      "/.git/config",
    ];

    for (const path of probes) {
      updateSession.mockClear();
      const response = await middleware(requestFor(path));
      expect(response.status, path).toBe(404);
      expect(await response.text(), path).toBe(PROBE_NOT_FOUND_BODY);
      expect(response.headers.get("cache-control"), path).toMatch(/no-store/);
      expect(updateSession, path).not.toHaveBeenCalled();
    }
  });

  it("hard-404s HEAD probes the same way", async () => {
    const response = await middleware(requestFor("/wp-admin/install.php", "HEAD"));
    expect(response.status).toBe(404);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("lets /ask, /api/ask, and /about continue into session handling", async () => {
    for (const path of ["/", "/ask", "/api/ask", "/about"]) {
      updateSession.mockClear();
      const response = await middleware(requestFor(path));
      expect(response.status, path).not.toBe(404);
      expect(updateSession, path).toHaveBeenCalledTimes(1);
    }
  });

  it("keeps the default 308 for non-probe trailing slashes", async () => {
    const response = await middleware(requestFor("/about/"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toMatch(/\/about$/);
    expect(updateSession).not.toHaveBeenCalled();
  });
});

describe("middleware matcher", () => {
  it("still matches probe paths (php/env/git are not in the static exclusion list)", () => {
    const patterns = config.matcher;
    expect(patterns.some((pattern) => pattern.includes("_next/static"))).toBe(true);
    expect(patterns.join("\n")).not.toMatch(/php/);
    expect(patterns.join("\n")).not.toMatch(/\\.env/);
    expect(patterns.join("\n")).not.toMatch(/\\.git/);
  });
});
