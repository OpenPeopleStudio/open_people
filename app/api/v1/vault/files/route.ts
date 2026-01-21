import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUploadUrl } from "@/lib/storage/r2";

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("vault_files")
    .select(
      "id, vault_id, folder_id, filename, size_bytes, content_type, ai_summary, ai_tags, ai_category, status, created_at, updated_at, r2_key"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to list vault files", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.filename || !body.content_type || !body.size_bytes) {
    return NextResponse.json(
      { error: "filename, content_type, size_bytes are required" },
      { status: 400 }
    );
  }

  const fileId = crypto.randomUUID();
  const objectPath = `vault/${fileId}/${body.filename}`;

  try {
    const { url } = await getUploadUrl(
      auth.user.profile.tenant_id,
      "vault",
      objectPath,
      body.content_type,
      900
    );

    return NextResponse.json(
      {
        file_id: fileId,
        upload_url: url,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate upload URL", error);
    return NextResponse.json(
      {
        file_id: fileId,
        upload_url: null,
        expires_at: null,
        error: "Storage not configured",
      },
      { status: 503 }
    );
  }
}
