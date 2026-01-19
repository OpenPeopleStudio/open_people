import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateUploadToken } from "@/lib/quick-share/tokens";
import type { CreateUploadTokenRequest } from "@/types/quick-share";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/tokens
   List upload tokens for the current user's vault
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user's vault
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    
    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }
    
    // Get tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("vault_upload_tokens")
      .select("*")
      .eq("vault_id", vault.id)
      .order("created_at", { ascending: false });
    
    if (tokensError) {
      console.error("Failed to fetch tokens:", tokensError);
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
    }
    
    return NextResponse.json({ tokens: tokens || [] });
    
  } catch (error) {
    console.error("Tokens fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/tokens
   Create a new upload token
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user's vault
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    
    if (!vault) {
      return NextResponse.json({ error: "Vault not found. Please set up your vault first." }, { status: 404 });
    }
    
    // Parse body
    const body: CreateUploadTokenRequest = await request.json();
    const {
      name,
      default_folder_id,
      allowed_types = [],
      max_file_size_mb = 100,
      rate_limit_per_hour = 60,
      rate_limit_per_day = 500,
      auto_approve = false,
      expires_at,
    } = body;
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Generate token
    const { token, hash, prefix } = generateUploadToken();
    
    // Create token record
    const { data: tokenRecord, error: insertError } = await supabase
      .from("vault_upload_tokens")
      .insert({
        vault_id: vault.id,
        owner_id: user.id,
        name: name.trim(),
        token_hash: hash,
        token_prefix: prefix,
        permissions: { upload: true, auto_approve },
        default_folder_id,
        allowed_types,
        max_file_size_mb,
        rate_limit_per_hour,
        rate_limit_per_day,
        expires_at,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to create token:", insertError);
      return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
    }
    
    // Return token (only shown once)
    return NextResponse.json({
      token: tokenRecord,
      plain_token: token, // User must save this - never shown again
    });
    
  } catch (error) {
    console.error("Token create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
