import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Buckets API
   GET /api/storage/buckets - List buckets
   POST /api/storage/buckets - Create bucket
   DELETE /api/storage/buckets - Delete bucket
   ═══════════════════════════════════════════════════════════════════════════ */

// Platform storage tenant for super-admin users
const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  void request;
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

    // Get buckets with file counts
    const { data: buckets, error } = await supabase
      .from("storage_buckets")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List buckets error:", error);
      return NextResponse.json(
        { error: "Failed to list buckets" },
        { status: 500 }
      );
    }

    // Get file counts for each bucket
    const bucketsWithCounts = await Promise.all(
      (buckets || []).map(async (bucket) => {
        const { count } = await supabase
          .from("storage_files")
          .select("*", { count: "exact", head: true })
          .eq("bucket_id", bucket.id)
          .is("deleted_at", null);

        const { data: sizeData } = await supabase
          .from("storage_files")
          .select("size")
          .eq("bucket_id", bucket.id)
          .is("deleted_at", null);

        const totalSize = (sizeData || []).reduce(
          (sum, f) => sum + (f.size || 0),
          0
        );

        return {
          ...bucket,
          file_count: count || 0,
          total_size: totalSize,
        };
      })
    );

    return NextResponse.json({ buckets: bucketsWithCounts });
  } catch (error) {
    console.error("List buckets error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { name, isPublic, corsOrigins } = body;

    if (!name) {
      return NextResponse.json({ error: "Bucket name is required" }, { status: 400 });
    }

    // Validate bucket name (alphanumeric, hyphens, underscores only)
    const validName = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z0-9]$/i;
    if (!validName.test(name) || name.length < 3 || name.length > 63) {
      return NextResponse.json(
        {
          error:
            "Bucket name must be 3-63 characters, alphanumeric with hyphens/underscores",
        },
        { status: 400 }
      );
    }

    // Create bucket
    const { data: bucket, error } = await supabase
      .from("storage_buckets")
      .insert({
        tenant_id: tenantId,
        name: name.toLowerCase(),
        is_public: isPublic || false,
        cors_origins: corsOrigins || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "A bucket with this name already exists" },
          { status: 409 }
        );
      }
      console.error("Create bucket error:", error);
      return NextResponse.json(
        { error: "Failed to create bucket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bucket });
  } catch (error) {
    console.error("Create bucket error:", error);
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
    const { bucketId, force } = body;

    if (!bucketId) {
      return NextResponse.json({ error: "Bucket ID is required" }, { status: 400 });
    }

    // Check if bucket belongs to tenant
    const { data: bucket, error: bucketError } = await supabase
      .from("storage_buckets")
      .select("id, name")
      .eq("id", bucketId)
      .eq("tenant_id", tenantId)
      .single();

    if (bucketError || !bucket) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
    }

    // Check if bucket has files
    const { count } = await supabase
      .from("storage_files")
      .select("*", { count: "exact", head: true })
      .eq("bucket_id", bucketId)
      .is("deleted_at", null);

    if (count && count > 0 && !force) {
      return NextResponse.json(
        {
          error: "Bucket is not empty. Use force=true to delete anyway.",
          fileCount: count,
        },
        { status: 409 }
      );
    }

    // If force delete, soft delete all files first
    if (force && count && count > 0) {
      await supabase
        .from("storage_files")
        .update({ deleted_at: new Date().toISOString() })
        .eq("bucket_id", bucketId);
    }

    // Delete bucket
    const { error: deleteError } = await supabase
      .from("storage_buckets")
      .delete()
      .eq("id", bucketId);

    if (deleteError) {
      console.error("Delete bucket error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete bucket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bucket error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
