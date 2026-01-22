import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> }
) {
  const { device_id } = await params;
  const auth = await authenticateUser(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = `dev_${crypto.randomUUID().replace(/-/g, "")}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  return NextResponse.json(
    {
      token,
      device_id,
      expires_at: expiresAt,
    },
    { status: 201 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> }
) {
  const { device_id } = await params;
  const auth = await authenticateUser(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // No persistence yet; acknowledge revoke.
  return NextResponse.json({ device_id, revoked: true }, { status: 200 });
}
