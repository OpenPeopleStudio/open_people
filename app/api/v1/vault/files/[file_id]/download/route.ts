import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage/r2";

export async function GET(request: Request, context: any) {
  const auth = await authenticateUser(request);
  if (!auth?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("vault_files")
    .select("id, r2_key")
    .eq("id", params.file_id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch file", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
  if (!data?.r2_key) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const url = await getDownloadUrl(data.r2_key, 900);
    return NextResponse.json({
      file_id: params.file_id,
      download_url: url,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("Failed to generate download URL", err);
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
}
