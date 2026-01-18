import { createSupabaseServer } from "@/lib/supabase/server";
import { getDownloadUrl, getPublicUrl } from "@/lib/storage/r2";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Download API
   GET /api/storage/download/[fileId] - Get presigned URL for file download
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Get file record
    const { data: file, error: fileError } = await supabase
      .from("storage_files")
      .select("*, bucket:storage_buckets(name, is_public)")
      .eq("id", fileId)
      .is("deleted_at", null)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check access permissions
    const isPublic = file.is_public || file.bucket?.is_public;

    if (!isPublic) {
      // File is private, require authentication
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user belongs to the same tenant
      const { data: profile } = await supabase
        .from("709_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id !== file.tenant_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // If public and has public URL configured, return that
    if (isPublic) {
      const publicUrl = getPublicUrl(file.key);
      if (publicUrl) {
        return NextResponse.json({
          downloadUrl: publicUrl,
          filename: file.filename,
          contentType: file.content_type,
          size: file.size,
          isPublic: true,
        });
      }
    }

    // Generate presigned download URL
    const downloadUrl = await getDownloadUrl(file.key, 3600); // 1 hour expiry

    // Track bandwidth usage (async, don't await)
    trackBandwidth(supabase, file.tenant_id, file.size);

    return NextResponse.json({
      downloadUrl,
      filename: file.filename,
      contentType: file.content_type,
      size: file.size,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Track bandwidth usage asynchronously
async function trackBandwidth(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  tenantId: string,
  bytes: number
) {
  try {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    await supabase.rpc("increment_bandwidth", {
      p_tenant_id: tenantId,
      p_period_start: periodStart.toISOString().split("T")[0],
      p_bytes: bytes,
    });
  } catch (error) {
    console.error("Failed to track bandwidth:", error);
  }
}
