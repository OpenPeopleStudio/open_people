/**
 * Scanner probe paths that must hard-404.
 *
 * The public site is not WordPress and does not serve env or git files.
 * Matching stays narrow so /ask, /api/ask, /admin, analytics, and
 * /.github are untouched.
 */

import { NextResponse } from "next/server";

const PROBE_PHP_FILES = new Set(["wp-login.php", "xmlrpc.php"]);

export const PROBE_NOT_FOUND_BODY = "Not found";

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function stripTrailingSlashes(pathname: string): string {
  if (pathname.length <= 1) {
    return pathname;
  }
  return pathname.replace(/\/+$/, "");
}

export function normalizeProbePathname(pathname: string): string {
  return stripTrailingSlashes(decodePathname(pathname));
}

export function isProbePath(pathname: string): boolean {
  const path = normalizeProbePathname(pathname);
  const lower = path.toLowerCase();
  const segments = lower.split("/").filter(Boolean);

  if (lower === "/wp-admin" || lower.startsWith("/wp-admin/")) {
    return true;
  }

  const leaf = segments[segments.length - 1];
  if (leaf && PROBE_PHP_FILES.has(leaf)) {
    return true;
  }

  if (segments.some((segment) => segment === ".git")) {
    return true;
  }

  if (segments.some((segment) => segment.startsWith(".env"))) {
    return true;
  }

  return false;
}

export function probePathNotFoundResponse(): NextResponse {
  return new NextResponse(PROBE_NOT_FOUND_BODY, {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
