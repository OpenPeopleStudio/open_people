/**
 * Edge-safe logger for middleware.
 *
 * Avoids Node-only dependencies (pino, async_hooks) and logs via console.
 */

import type { NextRequest } from "next/server";

type LogContext = {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  op?: boolean;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: unknown;
};

type RequestHandler = (request: NextRequest, ...args: unknown[]) => Promise<unknown>;

export function withRequestContext(handler: RequestHandler) {
  return async (request: NextRequest, ...args: unknown[]) => {
    return await handler(request, ...args);
  };
}

export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context: LogContext = {}
) {
  const payload = {
    method,
    url,
    statusCode,
    duration,
    ...context,
  };

  if (statusCode >= 500) {
    console.error("Request failed", payload);
  } else if (statusCode >= 400) {
    console.warn("Request error", payload);
  } else if (duration > 1000) {
    console.warn("Slow request", payload);
  } else {
    console.info("Request completed", payload);
  }
}
