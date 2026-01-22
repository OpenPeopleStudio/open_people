/**
 * Login API Endpoint
 *
 * Handles user authentication with security monitoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { alertFailedLogin } from "@/lib/observability/alerting";
import { logAuth } from "@/lib/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // Log failed authentication attempt
      await alertFailedLogin(
        undefined, // userId not available for failed login
        ip,
        userAgent
      );

      logAuth('login', false, {
        email,
        error: new Error(error.message),
        ip,
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Log successful authentication
    logAuth('login', true, {
      userId: data.user.id,
      email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
