/* ═══════════════════════════════════════════════════════════════════════════
   Unified AI Gateway Endpoint
   OpenAI-compatible /v1/chat/completions with policy-aware routing
   ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { evaluateGatewayRequest } from "@/lib/gateway";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { RequestContext } from "@/types/policy";
import type { ChatMessage } from "@/types/ai-providers";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/rate-limit";
import { z } from "zod";
import {
  ApiKeysEncryptionConfigError,
  decryptApiKey,
} from "@/lib/api-keys/encryption";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GatewayRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  user?: string;
  // Gateway-specific extensions
  _gateway?: {
    trace?: boolean;
    bypass_cache?: boolean;
    force_provider?: string;
  };
}

interface GatewayLogEntry {
  tenant_id: string;
  request_id: string;
  requested_model: string;
  actual_provider: string;
  actual_model: string;
  routing_rule_id?: string;
  failover_occurred: boolean;
  failover_attempts: number;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms: number;
  status: "success" | "error" | "timeout";
  error_code?: string;
  error_message?: string;
}

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 6000;
const MAX_TOTAL_CHARS = 48000;
const MAX_TOKENS = 4096;

const EXPLICIT_ALLOWED_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4o-mini-1",
  "gpt-4o-mini-1.5",
  "gpt-4-turbo",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-3.5-turbo",
];

const ALLOWED_MODEL_PREFIXES = ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "o1-", "o3-"];

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

const gatewayRequestSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(MAX_TOKENS).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  user: z.string().max(128).optional(),
  _gateway: z
    .object({
      trace: z.boolean().optional(),
      bypass_cache: z.boolean().optional(),
      force_provider: z.string().optional(),
    })
    .optional(),
});

function formatValidationIssues(issues: z.ZodIssue[]) {
  return {
    issues: issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  };
}

function isAllowedModel(model: string): boolean {
  return (
    EXPLICIT_ALLOWED_MODELS.includes(model) ||
    ALLOWED_MODEL_PREFIXES.some((prefix) => model.startsWith(prefix))
  );
}

function decodeProviderApiKey(raw: unknown): string | null {
  if (!raw) return null;

  const asString =
    typeof raw === "string"
      ? raw
      : Buffer.isBuffer(raw)
        ? raw.toString("utf8")
        : ArrayBuffer.isView(raw)
          ? Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8")
          : "";

  if (!asString) return null;

  try {
    const parsed = JSON.parse(asString) as { encryptedKey?: string; iv?: string };
    if (parsed.encryptedKey && parsed.iv) {
      return decryptApiKey({
        encryptedKey: parsed.encryptedKey,
        iv: parsed.iv,
      });
    }
  } catch {
    // Not JSON, fall through
  }

  try {
    const decoded = Buffer.from(asString, "base64").toString("utf8");
    if (decoded && decoded.length >= 16) {
      return decoded;
    }
  } catch {
    // Ignore base64 failures
  }

  if (asString.length >= 16) {
    return asString;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Key Validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateApiKey(
  authHeader: string | null
): Promise<{ valid: boolean; tenantId?: string; userId?: string; error?: string }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  // Check for OpenPeople gateway API key format (op_sk_...)
  if (apiKey.startsWith("op_sk_")) {
    const supabase = await createSupabaseAdmin();

    // Hash the key for lookup
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: gatewayKey } = await supabase
      .from("gateway_api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (!gatewayKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check expiration
    if (gatewayKey.expires_at && new Date(gatewayKey.expires_at) < new Date()) {
      return { valid: false, error: "API key expired" };
    }

    // Update last used timestamp
    await supabase
      .from("gateway_api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        total_requests: (gatewayKey.total_requests || 0) + 1,
      })
      .eq("id", gatewayKey.id);

    return {
      valid: true,
      tenantId: gatewayKey.tenant_id,
      userId: gatewayKey.created_by,
    };
  }

  // If not a gateway key, check if it's an internal request with tenant header
  // This allows internal services to use the gateway
  return { valid: false, error: "Invalid API key format. Use op_sk_... format." };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Request Context from Gateway Request
// ─────────────────────────────────────────────────────────────────────────────

function buildRequestContext(
  req: NextRequest,
  gatewayReq: GatewayRequest,
  userId?: string
): RequestContext {
  const userMessage = gatewayReq.messages.find((m) => m.role === "user");
  const inputText = userMessage?.content || "";

  // Estimate tokens (rough: ~4 chars per token)
  const totalInputChars = gatewayReq.messages.reduce(
    (sum, m) => sum + (m.content?.length || 0),
    0
  );
  const estimatedInputTokens = Math.ceil(totalInputChars / 4);

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  return {
    request_id: crypto.randomUUID(),
    model: gatewayReq.model,
    input_text: inputText,
    input_tokens: estimatedInputTokens,
    timestamp: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
    ...(ipAddress ? { ip_address: ipAddress } : {}),
    ...(userAgent ? { user_agent: userAgent } : {}),
    // PII and risk signals would be populated by pre-processing middleware
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Provider Client
// ─────────────────────────────────────────────────────────────────────────────

async function createProviderClient(
  tenantId: string,
  providerId: string
): Promise<OpenAI | null> {
  const supabase = await createSupabaseAdmin();

  const { data: provider } = await supabase
    .from("gateway_providers")
    .select("*")
    .eq("id", providerId)
    .eq("tenant_id", tenantId)
    .single();

  if (!provider) {
    // Fallback to OpenAI with env key
    if (process.env.OPENAI_API_KEY) {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return null;
  }

  let apiKey: string | null = null;
  try {
    apiKey = decodeProviderApiKey(provider.api_key_encrypted);
  } catch (error) {
    if (error instanceof ApiKeysEncryptionConfigError) {
      console.error("Provider key decryption failed: encryption key not configured");
    } else {
      console.error("Provider key decryption failed:", error);
    }
  }

  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY || null;
  }

  return new OpenAI({
    apiKey: apiKey || "not-needed",
    baseURL: provider.base_url,
    timeout: 60000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Gateway Request
// ─────────────────────────────────────────────────────────────────────────────

async function logGatewayRequest(entry: GatewayLogEntry): Promise<void> {
  try {
    const supabase = await createSupabaseAdmin();
    await supabase.from("gateway_requests").insert(entry);
  } catch (error) {
    console.error("Failed to log gateway request:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/chat/completions
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let tenantId: string | undefined;
  let requestId: string = crypto.randomUUID();
  let requestedModel: string = "";
  let tenantRateLimitHeaders: Record<string, string> | null = null;
  const applyRateLimitHeaders = (response: NextResponse) => {
    if (tenantRateLimitHeaders) {
      Object.entries(tenantRateLimitHeaders).forEach(([key, value]) =>
        response.headers.set(key, value)
      );
    }
    return response;
  };

  try {
    // 1. Validate API key
    const authResult = await validateApiKey(req.headers.get("authorization"));
    if (!authResult.valid || !authResult.tenantId) {
      return NextResponse.json(
        {
          error: {
            message: authResult.error || "Unauthorized",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        },
        { status: 401 }
      );
    }
    tenantId = authResult.tenantId;

    // 2. Per-tenant rate limit (separate from IP-based middleware limit)
    const tenantRateLimit = checkRateLimit(
      { headers: req.headers, method: req.method },
      "/api/v1/chat/completions",
      [
        {
          pattern: /^\/api\/v1\/chat\/completions$/,
          limit: 120,
          windowMs: 60_000,
        },
      ]
    );
    tenantRateLimitHeaders = getRateLimitHeaders(tenantRateLimit);

    if (!tenantRateLimit.allowed) {
      const rateLimited = NextResponse.json(
        {
          error: {
            message: "Tenant rate limit exceeded",
            type: "rate_limit_error",
            code: "rate_limit_exceeded",
          },
        },
        { status: 429 }
      );
      Object.entries(tenantRateLimitHeaders).forEach(([key, value]) =>
        rateLimited.headers.set(key, value)
      );
      return rateLimited;
    }

    // 3. Parse & validate request body
    let body: GatewayRequest;
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "Invalid JSON payload",
              type: "invalid_request_error",
              code: "invalid_json",
            },
          },
          { status: 400 }
        )
      );
    }

    const parsedBodyResult = gatewayRequestSchema.safeParse(rawBody);
    if (!parsedBodyResult.success) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "Invalid request payload",
              details: formatValidationIssues(parsedBodyResult.error.issues),
              type: "invalid_request_error",
              code: "invalid_request",
            },
          },
          { status: 400 }
        )
      );
    }

    try {
      const parsedBody = parsedBodyResult.data;
      const gatewayPayload = parsedBody._gateway
        ? {
            ...(parsedBody._gateway.trace !== undefined
              ? { trace: parsedBody._gateway.trace }
              : {}),
            ...(parsedBody._gateway.bypass_cache !== undefined
              ? { bypass_cache: parsedBody._gateway.bypass_cache }
              : {}),
            ...(parsedBody._gateway.force_provider !== undefined
              ? { force_provider: parsedBody._gateway.force_provider }
              : {}),
          }
        : undefined;

      body = {
        model: parsedBody.model,
        messages: parsedBody.messages,
        ...(parsedBody.max_tokens !== undefined ? { max_tokens: parsedBody.max_tokens } : {}),
        ...(parsedBody.temperature !== undefined ? { temperature: parsedBody.temperature } : {}),
        ...(parsedBody.top_p !== undefined ? { top_p: parsedBody.top_p } : {}),
        ...(parsedBody.frequency_penalty !== undefined
          ? { frequency_penalty: parsedBody.frequency_penalty }
          : {}),
        ...(parsedBody.presence_penalty !== undefined
          ? { presence_penalty: parsedBody.presence_penalty }
          : {}),
        ...(parsedBody.stop !== undefined ? { stop: parsedBody.stop } : {}),
        ...(parsedBody.stream !== undefined ? { stream: parsedBody.stream } : {}),
        ...(parsedBody.user !== undefined ? { user: parsedBody.user } : {}),
        ...(gatewayPayload ? { _gateway: gatewayPayload } : {}),
      };
    } catch (error) {
      throw error;
    }
    requestedModel = body.model;

    if (!isAllowedModel(body.model)) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "Requested model is not allowed",
              type: "invalid_request_error",
              code: "model_not_allowed",
            },
          },
          { status: 400 }
        )
      );
    }

    if (body.stream === true) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "Streaming is not supported for this endpoint.",
              type: "invalid_request_error",
              code: "stream_not_supported",
            },
          },
          { status: 400 }
        )
      );
    }

    const totalChars = body.messages.reduce(
      (sum, message) => sum + (message.content?.length || 0),
      0
    );

    if (totalChars > MAX_TOTAL_CHARS) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: `Request too large. Combined message content exceeds ${MAX_TOTAL_CHARS} characters.`,
              type: "invalid_request_error",
              code: "payload_too_large",
            },
          },
          { status: 413 }
        )
      );
    }

    const normalizedMaxTokens = Math.min(body.max_tokens ?? 2048, MAX_TOKENS);
    const normalizedBody: GatewayRequest = {
      model: body.model,
      messages: body.messages,
      max_tokens: normalizedMaxTokens,
      ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
      ...(body.top_p !== undefined ? { top_p: body.top_p } : {}),
      ...(body.frequency_penalty !== undefined
        ? { frequency_penalty: body.frequency_penalty }
        : {}),
      ...(body.presence_penalty !== undefined
        ? { presence_penalty: body.presence_penalty }
        : {}),
      ...(body.stop !== undefined ? { stop: body.stop } : {}),
      ...(body.stream !== undefined ? { stream: body.stream } : {}),
      ...(body.user !== undefined ? { user: body.user } : {}),
      ...(body._gateway !== undefined ? { _gateway: body._gateway } : {}),
    };

    // 4. Build request context
    const context = buildRequestContext(req, normalizedBody, authResult.userId);
    requestId = context.request_id!;

    // 5. Evaluate gateway policies and routing
    const includeTrace = normalizedBody._gateway?.trace;
    const gatewayOptions =
      includeTrace === undefined
        ? { includeBudget: true }
        : { includeBudget: true, includeTrace };

    const gatewayResult = await evaluateGatewayRequest(tenantId, context, gatewayOptions);

    // 6. Check policy decision
    if (gatewayResult.policy_decision === "deny") {
      await logGatewayRequest({
        tenant_id: tenantId,
        request_id: requestId,
        requested_model: requestedModel,
        actual_provider: "",
        actual_model: "",
        failover_occurred: false,
        failover_attempts: 0,
        latency_ms: Date.now() - startTime,
        status: "error",
        error_code: "policy_denied",
        error_message: gatewayResult.policy_reasons.join("; "),
      });

      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: `Request denied by policy: ${gatewayResult.policy_reasons.join("; ")}`,
              type: "policy_error",
              code: "request_denied",
            },
          },
          { status: 403 }
        )
      );
    }

    if (gatewayResult.policy_decision === "require_approval") {
      await logGatewayRequest({
        tenant_id: tenantId,
        request_id: requestId,
        requested_model: requestedModel,
        actual_provider: "",
        actual_model: "",
        failover_occurred: false,
        failover_attempts: 0,
        latency_ms: Date.now() - startTime,
        status: "error",
        error_code: "approval_required",
        error_message: "Request requires approval",
      });

      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "Request requires approval before processing",
              type: "policy_error",
              code: "approval_required",
              request_id: requestId,
            },
          },
          { status: 202 }
        )
      );
    }

    // 7. Get provider client based on routing decision
    const providerId =
      normalizedBody._gateway?.force_provider ||
      gatewayResult.routing.provider_id ||
      "default-openai";
    
    const actualModel = gatewayResult.routing.model || normalizedBody.model;

    const client = await createProviderClient(tenantId, providerId);
    if (!client) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: "No available AI provider configured",
              type: "server_error",
              code: "no_provider",
            },
          },
          { status: 503 }
        )
      );
    }

    // 8. Modify request if needed (e.g., add safety prompt)
    let messages = normalizedBody.messages;
    if (gatewayResult.routing.modified_request?.system_prompt_prefix) {
      const systemMessage = messages.find((m) => m.role === "system");
      if (systemMessage) {
        systemMessage.content =
          gatewayResult.routing.modified_request.system_prompt_prefix +
          "\n\n" +
          systemMessage.content;
      } else {
        messages = [
          {
            role: "system",
            content: gatewayResult.routing.modified_request.system_prompt_prefix,
          },
          ...messages,
        ];
      }
    }

    // 9. Make the actual API call
    const completionRequest: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: actualModel,
        messages: messages,
        stream: false,
        max_tokens: normalizedMaxTokens,
        ...(gatewayResult.routing.modified_request?.temperature !== undefined
          ? { temperature: gatewayResult.routing.modified_request.temperature }
          : normalizedBody.temperature !== undefined
            ? { temperature: normalizedBody.temperature }
            : {}),
        ...(normalizedBody.top_p !== undefined ? { top_p: normalizedBody.top_p } : {}),
        ...(normalizedBody.frequency_penalty !== undefined
          ? { frequency_penalty: normalizedBody.frequency_penalty }
          : {}),
        ...(normalizedBody.presence_penalty !== undefined
          ? { presence_penalty: normalizedBody.presence_penalty }
          : {}),
        ...(normalizedBody.stop !== undefined ? { stop: normalizedBody.stop } : {}),
      };

    const completion = await client.chat.completions.create(completionRequest);

    const latencyMs = Date.now() - startTime;

    // 9. Log successful request
    const usage = "usage" in completion ? completion.usage : undefined;
    await logGatewayRequest({
      tenant_id: tenantId,
      request_id: requestId,
      requested_model: requestedModel,
      actual_provider: providerId,
      actual_model: actualModel,
      failover_occurred: providerId !== body._gateway?.force_provider && actualModel !== body.model,
      failover_attempts: 0,
      latency_ms: latencyMs,
      status: "success",
      ...(usage?.prompt_tokens !== undefined ? { input_tokens: usage.prompt_tokens } : {}),
      ...(usage?.completion_tokens !== undefined
        ? { output_tokens: usage.completion_tokens }
        : {}),
    });

    // 10. Return response with gateway metadata
    const response = {
      ...completion,
      _gateway: body._gateway?.trace
        ? {
            request_id: requestId,
            routing: gatewayResult.routing,
            policy_decision: gatewayResult.policy_decision,
            latency_ms: latencyMs,
          }
        : undefined,
    };

    return applyRateLimitHeaders(NextResponse.json(response));
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Log error
    if (tenantId) {
      await logGatewayRequest({
        tenant_id: tenantId,
        request_id: requestId,
        requested_model: requestedModel,
        actual_provider: "",
        actual_model: "",
        failover_occurred: false,
        failover_attempts: 0,
        latency_ms: latencyMs,
        status: "error",
        error_code: "internal_error",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.error("Gateway error:", error);

    // Check for specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              message: error.message,
              type: error.type || "api_error",
              code: error.code || "provider_error",
            },
          },
          { status: error.status || 500 }
        )
      );
    }

    return applyRateLimitHeaders(
      NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Internal server error",
            type: "server_error",
            code: "internal_error",
          },
        },
        { status: 500 }
      )
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/chat/completions - Not supported (return helpful error)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(
    {
      error: {
        message:
          "GET is not supported for /v1/chat/completions. Use POST with a JSON body.",
        type: "invalid_request_error",
        code: "method_not_allowed",
      },
    },
    { status: 405 }
  );
}
