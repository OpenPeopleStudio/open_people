/**
 * Edge-safe correlation ID middleware.
 *
 * Avoids AsyncLocalStorage and only propagates headers/cookies.
 */

import { NextRequest, NextResponse } from "next/server";

const CORRELATION_ID_HEADER = "x-correlation-id";
const REQUEST_ID_HEADER = "x-request-id";
const CORRELATION_ID_COOKIE = "correlation-id";

export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getCorrelationIdFromRequest(request: NextRequest): string {
  return (
    request.headers.get(CORRELATION_ID_HEADER) ||
    request.headers.get(REQUEST_ID_HEADER) ||
    generateCorrelationId()
  );
}

export function createResponseWithCorrelationId(
  response: NextResponse,
  correlationId: string
): NextResponse {
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  newResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
  newResponse.headers.set(REQUEST_ID_HEADER, correlationId);
  newResponse.cookies.set(CORRELATION_ID_COOKIE, correlationId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return newResponse;
}

type CorrelationHandler = (request: NextRequest, ...args: unknown[]) => Promise<unknown>;

export function withCorrelationId(handler: CorrelationHandler) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const correlationId = getCorrelationIdFromRequest(request);

    const response = await handler(request, ...args);

    if (response instanceof NextResponse) {
      return createResponseWithCorrelationId(response, correlationId);
    }

    return response;
  };
}
