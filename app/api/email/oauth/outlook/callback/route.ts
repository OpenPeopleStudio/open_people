import { NextRequest, NextResponse } from "next/server";
import { emailOAuth } from "@/lib/email/oauth";

/* ═══════════════════════════════════════════════════════════════════════════
   Outlook OAuth Callback
   GET /api/email/oauth/outlook/callback - Handle Outlook OAuth redirect
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Outlook OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/admin/email/accounts?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/admin/email/accounts?error=Missing OAuth parameters", request.url)
      );
    }

    const result = await emailOAuth.handleOutlookCallback(code, state);

    if (result.success) {
      return NextResponse.redirect(
        new URL(`/admin/email/accounts?success=Outlook connected successfully`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        `/admin/email/accounts?error=${encodeURIComponent(result.error || "Unknown error")}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Outlook OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/email/accounts?error=${encodeURIComponent("OAuth callback failed")}`,
        request.url
      )
    );
  }
}
