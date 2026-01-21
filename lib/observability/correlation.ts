/**
 * Correlation ID Middleware
 *
 * Provides request tracing across the entire application stack.
 * Generates and propagates correlation IDs for distributed tracing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { setRequestContext } from './logger';

// ═══════════════════════════════════════════════════════════════════════════
// Correlation ID Management
// ═══════════════════════════════════════════════════════════════════════════

const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract correlation ID from request headers
 */
export function getCorrelationIdFromRequest(request: NextRequest): string {
  return (
    request.headers.get(CORRELATION_ID_HEADER) ||
    request.headers.get(REQUEST_ID_HEADER) ||
    generateCorrelationId()
  );
}

/**
 * Create response with correlation ID headers
 */
export function createResponseWithCorrelationId(
  response: NextResponse,
  correlationId: string
): NextResponse {
  // Clone the response to avoid modifying the original
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // Add correlation ID headers
  newResponse.headers.set(CORRELATION_ID_HEADER, correlationId);
  newResponse.headers.set(REQUEST_ID_HEADER, correlationId);

  return newResponse;
}

/**
 * Middleware to handle correlation IDs
 */
export function withCorrelationId(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const correlationId = getCorrelationIdFromRequest(request);

    // Set correlation ID in request context
    setRequestContext({
      correlationId,
      requestId: correlationId,
    });

    try {
      const response = await handler(request, ...args);

      // Add correlation ID to response headers
      if (response instanceof NextResponse) {
        return createResponseWithCorrelationId(response, correlationId);
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Set tenant context in current request
 */
export function setTenantContext(tenantId: string) {
  setRequestContext({ tenantId });
}

/**
 * Set user context in current request
 */
export function setUserContext(userId: string) {
  setRequestContext({ userId });
}

/**
 * Set session context in current request
 */
export function setSessionContext(sessionId: string) {
  setRequestContext({ sessionId });
}