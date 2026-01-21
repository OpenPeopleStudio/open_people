import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/status
   Check if current user has a vault and its status
   ═══════════════════════════════════════════════════════════════════════════ */

const handleGetVaultStatus = withAuthAndAuthZ({
  role: UserRole.OWNER, // Owner or higher (includes admin, super_admin)
})(async (auth) => {
  const supabase = await createSupabaseServer();

  // Get user's vault
  const { data: vault, error: vaultError } = await supabase
    .from("vault_spaces")
    .select("*")
    .eq("owner_id", auth.user.id)
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
});

// Export the wrapped handler
export const GET = handleGetVaultStatus;
