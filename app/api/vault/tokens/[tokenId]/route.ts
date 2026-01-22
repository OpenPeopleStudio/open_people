import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { UpdateUploadTokenRequest } from "@/types/quick-share";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/tokens/[tokenId]
   Get a single token with usage history
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await context.params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get token
    const { data: token, error: tokenError } = await supabase
      .from("vault_upload_tokens")
      .select("*")
      .eq("id", tokenId)
      .eq("owner_id", user.id)
      .single();
    
    if (tokenError || !token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    
    // Get recent usage
    const { data: usage } = await supabase
      .from("vault_upload_token_usage")
      .select("*")
      .eq("token_id", tokenId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    return NextResponse.json({
      token,
      usage: usage || [],
    });
    
  } catch (error) {
    console.error("Token fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/vault/tokens/[tokenId]
   Update a token
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await context.params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify ownership
    const { data: existing } = await supabase
      .from("vault_upload_tokens")
      .select("id, permissions")
      .eq("id", tokenId)
      .eq("owner_id", user.id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    
    // Parse body
    const body: UpdateUploadTokenRequest = await request.json();
    const {
      name,
      default_folder_id,
      allowed_types,
      max_file_size_mb,
      rate_limit_per_hour,
      rate_limit_per_day,
      auto_approve,
      is_active,
      expires_at,
    } = body;
    
    // Build update object
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updates.name = name;
    if (default_folder_id !== undefined) updates.default_folder_id = default_folder_id;
    if (allowed_types !== undefined) updates.allowed_types = allowed_types;
    if (max_file_size_mb !== undefined) updates.max_file_size_mb = max_file_size_mb;
    if (rate_limit_per_hour !== undefined) updates.rate_limit_per_hour = rate_limit_per_hour;
    if (rate_limit_per_day !== undefined) updates.rate_limit_per_day = rate_limit_per_day;
    if (is_active !== undefined) updates.is_active = is_active;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    
    if (auto_approve !== undefined) {
      updates.permissions = {
        ...existing.permissions,
        auto_approve,
      };
    }
    
    // Update token
    const { data: token, error: updateError } = await supabase
      .from("vault_upload_tokens")
      .update(updates)
      .eq("id", tokenId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update token:", updateError);
      return NextResponse.json({ error: "Failed to update token" }, { status: 500 });
    }
    
    return NextResponse.json({ token });
    
  } catch (error) {
    console.error("Token update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/tokens/[tokenId]
   Delete a token
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await context.params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Delete (RLS handles ownership)
    const { error: deleteError } = await supabase
      .from("vault_upload_tokens")
      .delete()
      .eq("id", tokenId)
      .eq("owner_id", user.id);
    
    if (deleteError) {
      console.error("Failed to delete token:", deleteError);
      return NextResponse.json({ error: "Failed to delete token" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Token delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
