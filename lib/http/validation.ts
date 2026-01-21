import type { NextRequest } from "next/server";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { errorResponse } from "./responses";

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
): Promise<{ data: ZodInfer<TSchema> } | { error: ReturnType<typeof errorResponse> }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      error: errorResponse(400, "Invalid JSON payload", {
        code: "INVALID_JSON",
      }),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: errorResponse(400, "Invalid request body", {
        code: "INVALID_BODY",
        details: result.error.format(),
      }),
    };
  }

  return { data: result.data };
}
