import { createSupabaseServer } from "@/lib/supabase/server";
import { getUploadUrl, getTenantFileKey } from "@/lib/storage/r2";
import { STORAGE_PLANS, canUploadFile } from "@/types/storage";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Upload API
   POST /api/storage/upload - Get presigned URL for file upload
   ═══════════════════════════════════════════════════════════════════════════ */

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

    // Get user's tenant
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const tenantId = profile.tenant_id;

    // Parse request body
    const body = await request.json();
    const { filename, contentType, size, bucketName, path } = body;

    if (!filename || !contentType || !size || !bucketName) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, size, bucketName" },
        { status: 400 }
      );
    }

    // Get tenant's storage subscription
    const { data: subscription } = await supabase
      .from("storage_subscriptions")
      .select("tier, status")
      .eq("tenant_id", tenantId)
      .single();

    // Default to free tier if no subscription
    const tier = subscription?.tier || "free";
    const plan = STORAGE_PLANS[tier as keyof typeof STORAGE_PLANS];

    if (!plan) {
      return NextResponse.json({ error: "Invalid storage plan" }, { status: 500 });
    }

    // Check subscription status
    if (subscription?.status && !["active", "trialing"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "Storage subscription is not active" },
        { status: 403 }
      );
    }

    // Get current storage usage
    const { data: usageData } = await supabase.rpc("get_tenant_storage_stats", {
      p_tenant_id: tenantId,
    });

    const currentUsage = usageData?.[0]?.total_storage_bytes || 0;

    // Check if upload is allowed
    const uploadCheck = canUploadFile(currentUsage, size, plan);
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 403 });
    }

    // Check if bucket exists, create if not
    const { data: bucket } = await supabase
      .from("storage_buckets")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", bucketName)
      .single();

    let bucketId = bucket?.id;

    if (!bucketId) {
      // Create the bucket
      const { data: newBucket, error: bucketError } = await supabase
        .from("storage_buckets")
        .insert({
          tenant_id: tenantId,
          name: bucketName,
          is_public: false,
        })
        .select("id")
        .single();

      if (bucketError) {
        console.error("Bucket creation error:", bucketError);
        return NextResponse.json(
          { error: "Failed to create bucket" },
          { status: 500 }
        );
      }

      bucketId = newBucket.id;
    }

    // Generate full file path
    const filePath = path ? `${path}/${filename}` : filename;
    const key = getTenantFileKey(tenantId, bucketName, filePath);

    // Get presigned upload URL
    const { url: uploadUrl } = await getUploadUrl(
      tenantId,
      bucketName,
      filePath,
      contentType,
      3600 // 1 hour expiry
    );

    // Create file record in database (pending state)
    const { data: fileRecord, error: fileError } = await supabase
      .from("storage_files")
      .insert({
        tenant_id: tenantId,
        bucket_id: bucketId,
        key: key,
        filename: filename,
        content_type: contentType,
        size: size,
        is_public: false,
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (fileError) {
      console.error("File record error:", fileError);
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl,
      fileId: fileRecord.id,
      key,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
