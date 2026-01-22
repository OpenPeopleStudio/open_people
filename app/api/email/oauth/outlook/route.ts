import { createSupabaseServer } from "@/lib/supabase/server";
import { emailOAuth } from "@/lib/email/oauth";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Outlook OAuth URL
   GET /api/email/oauth/outlook - Get Outlook OAuth authorization URL
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Create state parameter with user/tenant info
    const state = JSON.stringify({
      tenantId: profile.tenant_id,
      userId: user.id,
      provider: "outlook",
    });

    const authUrl = emailOAuth.generateOutlookAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Outlook OAuth URL generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
