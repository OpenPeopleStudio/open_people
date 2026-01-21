import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { withRequestContext, logRequest } from "@/lib/observability/logger";
import { withCorrelationId } from "@/lib/observability/correlation";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limit";

const PUBLIC_API_PATHS: RegExp[] = [
  /^\/api\/health$/,
  /^\/api\/og$/,
  /^\/api\/auth\/login$/,
  /^\/api\/signup$/,
  /^\/api\/email\/inbound\/webhook$/,
  /^\/api\/email\/inbound\/debug$/,
  /^\/api\/email\/webhooks$/,
  /^\/api\/notifications\/webhooks$/,
  /^\/api\/vault\/webhook\/email$/,
  /^\/api\/vault\/quick-upload$/,
  /^\/api\/v1\/chat\/completions$/,
  /^\/api\/v1\/notes$/,
  /^\/api\/events\/dispatch$/,
  /^\/api\/bots\/escalate$/,
];

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PATHS.some((pattern) => pattern.test(pathname));
}

function isMutatingMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

function isTrustedOrigin(originHost: string, requestHost: string) {
  if (originHost === requestHost) {
    return true;
  }

  const isOpenPeople = (host: string) =>
    host === "openpeople.ai" || host.endsWith(".openpeople.ai");
  const isLocalhost = (host: string) =>
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1");

  return (
    (isOpenPeople(originHost) && isOpenPeople(requestHost)) ||
    (isLocalhost(originHost) && isLocalhost(requestHost))
  );
}

function passesCsrfCheck(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return true;
  }

  const requestHost = request.headers.get("host");
  if (!requestHost) {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return isTrustedOrigin(originHost, requestHost);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return isTrustedOrigin(refererHost, requestHost);
    } catch {
      return false;
    }
  }

  return false;
}

async function loggingMiddleware(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Process the request
    const { response, user } = await updateSession(request);
    const { pathname } = new URL(request.url);

    let finalResponse = response;

    if (pathname.startsWith("/api")) {
      const rateLimitResult = checkRateLimit(request, pathname);
      const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

      if (!rateLimitResult.allowed) {
        finalResponse = NextResponse.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders,
              "Retry-After": String(
                Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
              ),
            },
          }
        );
      } else {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        if (!isPublicApiPath(pathname) && !user) {
          finalResponse = NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        } else if (isMutatingMethod(request.method) && !passesCsrfCheck(request)) {
          finalResponse = NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      }

      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        finalResponse.headers.set(key, value);
      });
    }

    // Log the request
    const duration = Date.now() - startTime;
    const statusCode = finalResponse.status;

    logRequest(
      request.method,
      request.url,
      statusCode,
      duration,
      {
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      }
    );

    return finalResponse;
  } catch (error) {
    // Log errors
    const duration = Date.now() - startTime;
    logRequest(
      request.method,
      request.url,
      500,
      duration,
      {
        error: error as Error,
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      }
    );

    throw error;
  }
}

export async function middleware(request: NextRequest) {
  return await withRequestContext(
    withCorrelationId(loggingMiddleware)
  )(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (*.svg, *.png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
