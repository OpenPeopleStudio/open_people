import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ApiKeysEncryptionConfigError, decryptApiKey } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/keys/[keyId]/reveal
   Decrypt and reveal the actual API key
   
   This is a sensitive operation and is logged.
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(
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
    
    // Get the key with encrypted data
    const { data: key, error: keyError } = await supabase
      .from("api_keys")
      .select("id, owner_id, name, encrypted_key, encryption_iv")
      .eq("id", keyId)
      .eq("owner_id", user.id)
      .single();
    
    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    // Decrypt the key
    let decryptedKey: string;
    try {
      decryptedKey = decryptApiKey({
        encryptedKey: key.encrypted_key,
        iv: key.encryption_iv,
      });
    } catch (decryptError) {
      if (decryptError instanceof ApiKeysEncryptionConfigError) {
        return NextResponse.json(
          { error: decryptError.message, code: "API_KEYS_ENCRYPTION_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
      console.error("Failed to decrypt key:", decryptError);
      return NextResponse.json({ error: "Failed to decrypt key" }, { status: 500 });
    }
    
    // Log the reveal action
    await supabase
      .from("api_key_usage")
      .insert({
        key_id: keyId,
        action: "revealed",
        source: "web",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    return NextResponse.json({ key: decryptedKey });
    
  } catch (error) {
    console.error("Key reveal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
