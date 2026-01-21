import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("devices")
    .select("id, name, platform, tenant_id, user_id, last_ip, last_user_agent, created_at")
    .eq("user_id", auth.user.id);

  if (error && error.code !== "42P01") {
    console.error("Failed to list devices", error);
    return NextResponse.json({ error: "Failed to list devices" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.platform) {
    return NextResponse.json(
      { error: "name and platform are required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("devices")
    .insert({
      name: body.name,
      platform: body.platform,
      fingerprint: body.fingerprint,
      tenant_id: auth.user.profile.tenant_id,
      user_id: auth.user.id,
      last_ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      last_user_agent: request.headers.get("user-agent"),
    })
    .select("id, name, platform, tenant_id, user_id, created_at")
    .maybeSingle();

  if (error && error.code !== "42P01") {
    console.error("Failed to register device", error);
    return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
  }

  return NextResponse.json(
    data ?? {
      id: crypto.randomUUID(),
      name: body.name,
      platform: body.platform,
      tenant_id: auth.user.profile.tenant_id,
      user_id: auth.user.id,
      created_at: new Date().toISOString(),
    },
    { status: 201 }
  );
}
