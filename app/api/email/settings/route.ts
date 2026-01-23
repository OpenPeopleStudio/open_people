import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Settings API
   GET  /api/email/settings - Get email settings for tenant
   PUT  /api/email/settings - Update email settings for tenant
   
   Settings are stored in tenant_email_settings table (JSONB columns)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const adminSupabase = await createSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenant_id");

    // Determine tenant
    let tenantId = profile?.tenant_id;
    if (isSuperAdmin && requestedTenantId) {
      tenantId = requestedTenantId;
    }

    // For super admin without tenant, return defaults
    if (!tenantId) {
      return NextResponse.json({
        settings: {
          defaults: {
            default_account_id: null,
            default_signature_id: null,
            reply_to_same_account: true,
            include_signature_in_replies: true,
            auto_save_drafts: true,
            draft_save_interval_seconds: 30,
          },
          notifications: {
            email_notifications: true,
            push_notifications: false,
            notify_on_new_email: true,
            notify_on_reply: true,
            notify_on_mention: true,
            digest_frequency: "none",
          },
          sync: {
            auto_sync_enabled: true,
            sync_interval_minutes: 5,
            sync_on_open: true,
            max_emails_per_sync: 100,
            sync_sent_folder: true,
            sync_deleted_folder: false,
          },
          security: {
            block_external_images: false,
            block_tracking_pixels: true,
            warn_external_links: true,
            require_tls: true,
          },
        },
      });
    }

    // Try to get existing settings
    const { data: settings } = await adminSupabase
      .from("email_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (settings) {
      return NextResponse.json({ settings });
    }

    // Return defaults if no settings exist
    return NextResponse.json({
      settings: {
        defaults: {
          default_account_id: null,
          default_signature_id: null,
          reply_to_same_account: true,
          include_signature_in_replies: true,
          auto_save_drafts: true,
          draft_save_interval_seconds: 30,
        },
        notifications: {
          email_notifications: true,
          push_notifications: false,
          notify_on_new_email: true,
          notify_on_reply: true,
          notify_on_mention: true,
          digest_frequency: "none",
        },
        sync: {
          auto_sync_enabled: true,
          sync_interval_minutes: 5,
          sync_on_open: true,
          max_emails_per_sync: 100,
          sync_sent_folder: true,
          sync_deleted_folder: false,
        },
        security: {
          block_external_images: false,
          block_tracking_pixels: true,
          warn_external_links: true,
          require_tls: true,
        },
      },
    });
  } catch (error) {
    console.error("Get email settings error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const adminSupabase = await createSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const body = await request.json();
    const { section, defaults, notifications, sync, security, tenant_id } = body;

    // Determine tenant
    let tenantId = profile?.tenant_id;
    if (isSuperAdmin && tenant_id) {
      tenantId = tenant_id;
    }

    // Super admin without tenant - settings not persisted (OK)
    if (!tenantId) {
      return NextResponse.json({ 
        success: true, 
        message: "Settings applied (not persisted for platform-level)" 
      });
    }

    // Check if settings exist
    const { data: existingSettings } = await adminSupabase
      .from("email_settings")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    // Build update object based on section
    const updateData: Record<string, unknown> = {
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    if (section === "defaults" && defaults) {
      updateData.defaults = defaults;
    }
    if (section === "notifications" && notifications) {
      updateData.notifications = notifications;
    }
    if (section === "sync" && sync) {
      updateData.sync = sync;
    }
    if (section === "security" && security) {
      updateData.security = security;
    }

    let result;
    if (existingSettings) {
      // Update existing
      result = await adminSupabase
        .from("email_settings")
        .update(updateData)
        .eq("tenant_id", tenantId)
        .select()
        .single();
    } else {
      // Insert new with defaults for other sections
      const insertData = {
        tenant_id: tenantId,
        defaults: defaults || {
          default_account_id: null,
          default_signature_id: null,
          reply_to_same_account: true,
          include_signature_in_replies: true,
          auto_save_drafts: true,
          draft_save_interval_seconds: 30,
        },
        notifications: notifications || {
          email_notifications: true,
          push_notifications: false,
          notify_on_new_email: true,
          notify_on_reply: true,
          notify_on_mention: true,
          digest_frequency: "none",
        },
        sync: sync || {
          auto_sync_enabled: true,
          sync_interval_minutes: 5,
          sync_on_open: true,
          max_emails_per_sync: 100,
          sync_sent_folder: true,
          sync_deleted_folder: false,
        },
        security: security || {
          block_external_images: false,
          block_tracking_pixels: true,
          warn_external_links: true,
          require_tls: true,
        },
      };

      result = await adminSupabase
        .from("email_settings")
        .insert(insertData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Save email settings error:", result.error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: result.data });
  } catch (error) {
    console.error("Update email settings error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
