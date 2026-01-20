/* ═══════════════════════════════════════════════════════════════════════════
   Unified AI Gateway Endpoint
   OpenAI-compatible /v1/chat/completions with policy-aware routing
   ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  evaluateGatewayRequest,
  loadGatewayProviders,
  getProviderConfig,
} from "@/lib/gateway";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { RequestContext } from "@/types/policy";
import type { ChatMessage } from "@/types/ai-providers";

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
  tenantId: string,
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

  return {
    request_id: crypto.randomUUID(),
    user_id: userId,
    model: gatewayReq.model,
    input_text: inputText,
    input_tokens: estimatedInputTokens,
    timestamp: new Date().toISOString(),
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      undefined,
    user_agent: req.headers.get("user-agent") || undefined,
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

  // Decrypt API key (simplified - would need actual decryption)
  const apiKey = provider.api_key_encrypted
    ? Buffer.from(provider.api_key_encrypted).toString("utf8")
    : process.env.OPENAI_API_KEY;

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

    // 2. Parse request body
    const body: GatewayRequest = await req.json();
    requestedModel = body.model;

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: "messages is required and must be a non-empty array",
            type: "invalid_request_error",
            code: "invalid_request",
          },
        },
        { status: 400 }
      );
    }

    // 3. Build request context
    const context = buildRequestContext(req, body, tenantId, authResult.userId);
    requestId = context.request_id!;

    // 4. Evaluate gateway policies and routing
    const gatewayResult = await evaluateGatewayRequest(tenantId, context, {
      includeBudget: true,
      includeTrace: body._gateway?.trace,
    });

    // 5. Check policy decision
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

      return NextResponse.json(
        {
          error: {
            message: `Request denied by policy: ${gatewayResult.policy_reasons.join("; ")}`,
            type: "policy_error",
            code: "request_denied",
          },
        },
        { status: 403 }
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

      return NextResponse.json(
        {
          error: {
            message: "Request requires approval before processing",
            type: "policy_error",
            code: "approval_required",
            request_id: requestId,
          },
        },
        { status: 202 }
      );
    }

    // 6. Get provider client based on routing decision
    const providerId =
      body._gateway?.force_provider ||
      gatewayResult.routing.provider_id ||
      "default-openai";
    
    const actualModel = gatewayResult.routing.model || body.model;

    const client = await createProviderClient(tenantId, providerId);
    if (!client) {
      return NextResponse.json(
        {
          error: {
            message: "No available AI provider configured",
            type: "server_error",
            code: "no_provider",
          },
        },
        { status: 503 }
      );
    }

    // 7. Modify request if needed (e.g., add safety prompt)
    let messages = body.messages;
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

    // 8. Make the actual API call
    const completion = await client.chat.completions.create({
      model: actualModel,
      messages: messages,
      temperature:
        gatewayResult.routing.modified_request?.temperature ?? body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      frequency_penalty: body.frequency_penalty,
      presence_penalty: body.presence_penalty,
      stop: body.stop,
      stream: body.stream ?? false,
    });

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
      input_tokens: usage?.prompt_tokens,
      output_tokens: usage?.completion_tokens,
      latency_ms: latencyMs,
      status: "success",
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

    return NextResponse.json(response);
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
      return NextResponse.json(
        {
          error: {
            message: error.message,
            type: error.type || "api_error",
            code: error.code || "provider_error",
          },
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Internal server error",
          type: "server_error",
          code: "internal_error",
        },
      },
      { status: 500 }
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
