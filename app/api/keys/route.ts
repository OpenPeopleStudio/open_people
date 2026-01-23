import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  ApiKeysEncryptionConfigError,
  encryptApiKey,
  generateKeyHint,
  validateKeyFormat,
} from "@/lib/api-keys/encryption";
import { errorResponse, errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { createApiKeySchema } from "@/lib/schemas/api-keys";
import type { ApiKeyFilters } from "@/types/api-keys";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/keys
   List API keys for the authenticated user
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Get profile to check permissions (super_admin, owner, or admin can manage keys)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    const allowedRoles = ["super_admin", "owner", "admin"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return errors.forbidden("Access denied");
    }
    
    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const filters: ApiKeyFilters = {};
    const provider = searchParams.get("provider");
    const environment = searchParams.get("environment");
    const scope = searchParams.get("scope");
    const search = searchParams.get("search");
    const isActiveParam = searchParams.get("is_active");

    if (provider) filters.provider = provider;
    if (environment) filters.environment = environment;
    if (scope) filters.scope = scope;
    if (search) filters.search = search;
    if (isActiveParam === "true") filters.is_active = true;
    if (isActiveParam === "false") filters.is_active = false;
    
    // Build query
    let query = supabase
      .from("api_keys")
      .select("id, owner_id, tenant_id, name, provider, description, key_hint, environment, scope, project_name, metadata, tags, last_used_at, use_count, expires_at, is_active, created_at, updated_at", { count: "exact" })
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (filters.provider) {
      query = query.eq("provider", filters.provider);
    }
    if (filters.environment) {
      query = query.eq("environment", filters.environment);
    }
    if (filters.scope) {
      query = query.eq("scope", filters.scope);
    }
    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,project_name.ilike.%${filters.search}%`);
    }
    
    const { data: keys, error: keysError, count } = await query;
    
    if (keysError) {
      console.error("Failed to fetch keys:", keysError);
      return errorResponse(500, "Failed to fetch keys", {
        code: "KEYS_FETCH_FAILED",
      });
    }
    
    return NextResponse.json({
      keys: keys || [],
      total: count || 0,
    });
    
  } catch (error) {
    console.error("Keys fetch error:", error);
    return errors.serverError();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/keys
   Create a new API key
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Get profile to check permissions (super_admin, owner, or admin can create keys)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    const allowedRoles = ["super_admin", "owner", "admin"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return errors.forbidden("Access denied");
    }
    
    // Parse body
    const parsedBody = await parseJsonBody(request, createApiKeySchema);
    if ("error" in parsedBody) {
      return parsedBody.error;
    }

    const {
      name,
      provider,
      key,
      description,
      environment,
      scope,
      project_name,
      tags,
      expires_at,
      metadata,
    } = parsedBody.data;
    
    // Validate key format
    const validation = validateKeyFormat(provider, key);
    if (!validation.valid) {
      return errorResponse(400, validation.error ?? "Invalid API key format", {
        code: "INVALID_KEY_FORMAT",
      });
    }
    
    // Encrypt the key
    let encryptedKey: string;
    let iv: string;
    try {
      const encrypted = encryptApiKey(key);
      encryptedKey = encrypted.encryptedKey;
      iv = encrypted.iv;
    } catch (err) {
      if (err instanceof ApiKeysEncryptionConfigError) {
        return errorResponse(503, err.message, {
          code: "API_KEYS_ENCRYPTION_NOT_CONFIGURED",
        });
      }
      throw err;
    }

    const keyHint = generateKeyHint(key);
    
    // Insert the key
    const { data: newKey, error: insertError } = await supabase
      .from("api_keys")
      .insert({
        owner_id: user.id,
        name,
        provider,
        description,
        encrypted_key: encryptedKey,
        encryption_iv: iv,
        key_hint: keyHint,
        environment,
        scope,
        project_name,
        tags,
        expires_at,
        metadata,
      })
      .select("id, owner_id, tenant_id, name, provider, description, key_hint, environment, scope, project_name, metadata, tags, last_used_at, use_count, expires_at, is_active, created_at, updated_at")
      .single();
    
    if (insertError) {
      console.error("Failed to create key:", insertError);
      return errorResponse(500, "Failed to create key", {
        code: "KEY_CREATE_FAILED",
      });
    }
    
    // Log creation
    await supabase
      .from("api_key_usage")
      .insert({
        key_id: newKey.id,
        action: "created",
        source: "web",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    return NextResponse.json({
      key: newKey,
      // Return the plain key only on creation (user should save it)
      plain_key: key,
    });
    
  } catch (error) {
    console.error("Key create error:", error);
    return errors.serverError();
  }
}
