import { createSupabaseServer } from "@/lib/supabase/server";
import { deleteFile } from "@/lib/storage/r2";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Files API
   GET /api/storage/files - List files
   DELETE /api/storage/files - Delete file(s)
   ═══════════════════════════════════════════════════════════════════════════ */

// Platform storage tenant for super-admin users
const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant (super-admin uses platform tenant)
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    // Use platform tenant for super-admin, otherwise use user's tenant
    const tenantId = profile?.role === "super_admin" 
      ? PLATFORM_TENANT_ID 
      : profile?.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get("bucket");
    const prefix = searchParams.get("prefix") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("storage_files")
      .select("*, bucket:storage_buckets(name)", { count: "exact" })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bucketName) {
      // Get bucket ID first
      const { data: bucket } = await supabase
        .from("storage_buckets")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("name", bucketName)
        .single();

      if (bucket) {
        query = query.eq("bucket_id", bucket.id);
      }
    }

    if (prefix) {
      query = query.ilike("key", `%${prefix}%`);
    }

    const { data: files, count, error } = await query;

    if (error) {
      console.error("List files error:", error);
      return NextResponse.json(
        { error: "Failed to list files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: files || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant (super-admin uses platform tenant)
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    // Use platform tenant for super-admin, otherwise use user's tenant
    const tenantId = profile?.role === "super_admin" 
      ? PLATFORM_TENANT_ID 
      : profile?.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: "Missing fileIds array" },
        { status: 400 }
      );
    }

    // Get files to delete
    const { data: files, error: filesError } = await supabase
      .from("storage_files")
      .select("id, key")
      .eq("tenant_id", tenantId)
      .in("id", fileIds)
      .is("deleted_at", null);

    if (filesError) {
      console.error("Get files error:", filesError);
      return NextResponse.json(
        { error: "Failed to get files" },
        { status: 500 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    // Delete from R2
    const deletePromises = files.map((file) =>
      deleteFile(file.key).catch((err) => {
        console.error(`Failed to delete ${file.key} from R2:`, err);
        return null; // Continue with other deletions
      })
    );

    await Promise.all(deletePromises);

    // Soft delete in database (for versioning/recovery)
    const { error: updateError } = await supabase
      .from("storage_files")
      .update({ deleted_at: new Date().toISOString() })
      .in(
        "id",
        files.map((f) => f.id)
      );

    if (updateError) {
      console.error("Update files error:", updateError);
      return NextResponse.json(
        { error: "Failed to update file records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: files.length,
    });
  } catch (error) {
    console.error("Delete files error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
