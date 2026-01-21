import { NextResponse } from "next/server";

export interface ApiError {
  message: string;
  code?: string;
  type?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

interface ErrorOptions {
  code?: string;
  type?: string;
  details?: unknown;
  headers?: HeadersInit;
}

export function errorResponse(
  status: number,
  message: string,
  options: ErrorOptions = {}
) {
  const { code, type, details, headers } = options;

  const payload: ApiErrorResponse = {
    error: {
      message,
      ...(code ? { code } : {}),
      ...(type ? { type } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(payload, { status, headers });
}

export const errors = {
  badRequest: (message = "Bad request", details?: unknown) =>
    errorResponse(400, message, {
      code: "BAD_REQUEST",
      ...(details !== undefined ? { details } : {}),
    }),
  unauthorized: (message = "Unauthorized") =>
    errorResponse(401, message, { code: "UNAUTHORIZED" }),
  forbidden: (message = "Forbidden") =>
    errorResponse(403, message, { code: "FORBIDDEN" }),
  notFound: (message = "Not found") =>
    errorResponse(404, message, { code: "NOT_FOUND" }),
  conflict: (message = "Conflict") =>
    errorResponse(409, message, { code: "CONFLICT" }),
  tooManyRequests: (message = "Rate limit exceeded") =>
    errorResponse(429, message, { code: "RATE_LIMITED" }),
  serverError: (message = "Internal server error", details?: unknown) =>
    errorResponse(500, message, {
      code: "INTERNAL_SERVER_ERROR",
      ...(details !== undefined ? { details } : {}),
    }),
};
