import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { file_id: string } }
) {
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
    .eq("id", params.file_id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch file", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { file_id: string } }
) {
  const auth = await authenticateUser(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("vault_files")
    .update({ status: "deleted" })
    .eq("id", params.file_id);

  if (error) {
    console.error("Failed to delete file", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
