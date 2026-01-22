import type { NextRequest } from "next/server";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { errorResponse, errors } from "./responses";

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
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    return {
      error: errors.unprocessableEntity("Invalid request body", {
        issues,
      }),
    };
  }

  return { data: result.data };
}
