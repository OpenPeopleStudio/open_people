import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/api-keys/encryption";
import type { UpdateApiKeyRequest } from "@/types/api-keys";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/keys/[keyId]
   Get a specific API key with usage history
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the key
    const { data: key, error: keyError } = await supabase
      .from("api_keys")
      .select("id, owner_id, tenant_id, name, provider, description, key_hint, environment, scope, project_name, metadata, tags, last_used_at, use_count, expires_at, is_active, created_at, updated_at")
      .eq("id", keyId)
      .eq("owner_id", user.id)
      .single();
    
    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    // Get recent usage
    const { data: usage } = await supabase
      .from("api_key_usage")
      .select("*")
      .eq("key_id", keyId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    return NextResponse.json({
      key,
      usage: usage || [],
    });
    
  } catch (error) {
    console.error("Key fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/keys/[keyId]
   Update an API key
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify ownership
    const { data: existing } = await supabase
      .from("api_keys")
      .select("id")
      .eq("id", keyId)
      .eq("owner_id", user.id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    // Parse body
    const body: UpdateApiKeyRequest = await request.json();
    const {
      name,
      description,
      environment,
      project_name,
      tags,
      expires_at,
      is_active,
      metadata,
    } = body;
    
    // Build update object
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (environment !== undefined) updates.environment = environment;
    if (project_name !== undefined) updates.project_name = project_name;
    if (tags !== undefined) updates.tags = tags;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (is_active !== undefined) updates.is_active = is_active;
    if (metadata !== undefined) updates.metadata = metadata;
    
    // Update the key
    const { data: updatedKey, error: updateError } = await supabase
      .from("api_keys")
      .update(updates)
      .eq("id", keyId)
      .select("id, owner_id, tenant_id, name, provider, description, key_hint, environment, scope, project_name, metadata, tags, last_used_at, use_count, expires_at, is_active, created_at, updated_at")
      .single();
    
    if (updateError) {
      console.error("Failed to update key:", updateError);
      return NextResponse.json({ error: "Failed to update key" }, { status: 500 });
    }
    
    // Log update
    await supabase
      .from("api_key_usage")
      .insert({
        key_id: keyId,
        action: "updated",
        source: "web",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { updated_fields: Object.keys(body) },
      });
    
    return NextResponse.json({ key: updatedKey });
    
  } catch (error) {
    console.error("Key update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/keys/[keyId]
   Delete an API key
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify ownership and get key name for logging
    const { data: existing } = await supabase
      .from("api_keys")
      .select("id, name")
      .eq("id", keyId)
      .eq("owner_id", user.id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    // Delete the key
    const { error: deleteError } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId);
    
    if (deleteError) {
      console.error("Failed to delete key:", deleteError);
      return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Key delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
