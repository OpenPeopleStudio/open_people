import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/status
   Check if current user has a vault and its status
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is super admin
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can access vaults" },
        { status: 403 }
      );
    }
    
    // Get user's vault
    const { data: vault, error: vaultError } = await supabase
      .from("vault_spaces")
      .select("*")
      .eq("owner_id", user.id)
      .single();
    
    if (vaultError || !vault) {
      // No vault exists
      return NextResponse.json(
        { error: "No vault found" },
        { status: 404 }
      );
    }
    
    // Return vault info (without sensitive encryption data)
    return NextResponse.json({
      vault: {
        id: vault.id,
        name: vault.name,
        settings: vault.settings,
        total_files: vault.total_files,
        total_size_bytes: vault.total_size_bytes,
        created_at: vault.created_at,
        updated_at: vault.updated_at,
      },
    });
    
  } catch (error) {
    console.error("Vault status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
