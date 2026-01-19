import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  encryptApiKey,
  decryptApiKey,
  generateKeyHint,
  validateKeyFormat,
} from "@/lib/api-keys/encryption";
import type { CreateApiKeyRequest, ApiKeyFilters } from "@/types/api-keys";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if super admin
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }
    
    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const filters: ApiKeyFilters = {
      provider: searchParams.get("provider") || undefined,
      environment: searchParams.get("environment") || undefined,
      scope: searchParams.get("scope") || undefined,
      is_active: searchParams.get("is_active") === "true" ? true : 
                 searchParams.get("is_active") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
    };
    
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
      return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
    }
    
    return NextResponse.json({
      keys: keys || [],
      total: count || 0,
    });
    
  } catch (error) {
    console.error("Keys fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if super admin
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }
    
    // Parse body
    const body: CreateApiKeyRequest = await request.json();
    const {
      name,
      provider,
      key,
      description,
      environment = "development",
      scope = "super_admin",
      project_name,
      tags = [],
      expires_at,
      metadata = {},
    } = body;
    
    // Validate required fields
    if (!name || !provider || !key) {
      return NextResponse.json(
        { error: "name, provider, and key are required" },
        { status: 400 }
      );
    }
    
    // Validate key format
    const validation = validateKeyFormat(provider, key);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Encrypt the key
    const { encryptedKey, iv } = encryptApiKey(key);
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
      return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
