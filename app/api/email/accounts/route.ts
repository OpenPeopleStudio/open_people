import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/email/encryption";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Accounts API
   GET    /api/email/accounts      - List accounts
   POST   /api/email/accounts      - Create account
   PUT    /api/email/accounts      - Update account
   DELETE /api/email/accounts      - Delete account
   
   Super admins can specify tenant_id to manage accounts across tenants.
   Regular users can only manage accounts for their own tenant.
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

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenant_id");

    // Determine which tenant to query
    let tenantId = profile?.tenant_id;
    if (isSuperAdmin && requestedTenantId) {
      tenantId = requestedTenantId;
    }

    // Super admin can list all accounts if no tenant specified
    if (isSuperAdmin && !tenantId) {
      const { data: accounts, error } = await supabase
        .from("email_accounts")
        .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, managed_domain_id, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("List accounts error:", error);
        return NextResponse.json({ error: "Failed to list accounts" }, { status: 500 });
      }

      return NextResponse.json({ accounts: accounts || [] });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const { data: accounts, error } = await supabase
      .from("email_accounts")
      .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, managed_domain_id, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List accounts error:", error);
      return NextResponse.json({ error: "Failed to list accounts" }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error) {
    console.error("List accounts error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS for profile lookup and inserts
    const adminSupabase = await createSupabaseAdmin();

    const { data: profile, error: profileError } = await adminSupabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 });
    }

    const isSuperAdmin = profile?.role === "super_admin";

    const body = await request.json();
    
    // Super admin can specify tenant_id, otherwise use profile's tenant
    // Super admins can also create platform-level accounts with tenant_id = null
    let tenantId: string | null = profile?.tenant_id || null;
    if (isSuperAdmin) {
      // If tenant_id is explicitly provided, use it
      // If null/undefined is provided by super admin, allow platform-level account
      tenantId = body.tenant_id !== undefined ? body.tenant_id : tenantId;
    }

    // Non-super-admins must have a tenant
    if (!isSuperAdmin && !tenantId) {
      return NextResponse.json({ error: "No tenant found." }, { status: 403 });
    }
    const {
      name,
      email_address,
      is_default,
      provider,
      mode,
      managed_domain_id,
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      imap_host,
      imap_port,
      imap_secure,
      imap_user,
      imap_password,
      pop3_host,
      pop3_port,
      pop3_secure,
      pop3_user,
      pop3_password,
      resend_api_key_id,
      resend_domain,
      sync_enabled,
      sync_interval_minutes,
    } = body;

    if (!name || !email_address || !provider) {
      return NextResponse.json(
        { error: "Name, email address, and provider are required" },
        { status: 400 }
      );
    }

    // Encrypt passwords
    let smtp_password_encrypted, smtp_password_iv;
    let imap_password_encrypted, imap_password_iv;
    let pop3_password_encrypted, pop3_password_iv;

    if (smtp_password) {
      const encrypted = encryptCredential(smtp_password);
      smtp_password_encrypted = encrypted.encrypted;
      smtp_password_iv = encrypted.iv;
    }

    if (imap_password) {
      const encrypted = encryptCredential(imap_password);
      imap_password_encrypted = encrypted.encrypted;
      imap_password_iv = encrypted.iv;
    }

    if (pop3_password) {
      const encrypted = encryptCredential(pop3_password);
      pop3_password_encrypted = encrypted.encrypted;
      pop3_password_iv = encrypted.iv;
    }

    // Use admin client for insert to bypass RLS
    console.log("[POST /api/email/accounts] Inserting:", { 
      tenant_id: tenantId, 
      name, 
      email_address, 
      provider,
      mode,
      resend_domain,
    });

    const { data: account, error } = await adminSupabase
      .from("email_accounts")
      .insert({
        tenant_id: tenantId,
        name,
        email_address,
        is_default: is_default || false,
        provider,
        mode: mode || "custom",
        managed_domain_id: managed_domain_id || null,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_password_encrypted,
        smtp_password_iv,
        imap_host,
        imap_port,
        imap_secure,
        imap_user,
        imap_password_encrypted,
        imap_password_iv,
        pop3_host,
        pop3_port,
        pop3_secure,
        pop3_user,
        pop3_password_encrypted,
        pop3_password_iv,
        resend_api_key_id,
        resend_domain,
        sync_enabled: mode === "managed" ? false : (sync_enabled ?? true),
        sync_interval_minutes: sync_interval_minutes || 5,
      })
      .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, managed_domain_id, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, created_at, updated_at")
      .single();

    if (error) {
      console.error("[POST /api/email/accounts] Insert error:", error);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    console.log("[POST /api/email/accounts] Created:", account?.id);
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Create account error:", error);
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

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Handle password updates
    const updateData: Record<string, any> = { ...updates };
    delete updateData.smtp_password;
    delete updateData.imap_password;
    delete updateData.pop3_password;
    delete updateData.tenant_id; // Don't allow changing tenant_id

    if (updates.smtp_password) {
      const encrypted = encryptCredential(updates.smtp_password);
      updateData.smtp_password_encrypted = encrypted.encrypted;
      updateData.smtp_password_iv = encrypted.iv;
    }

    if (updates.imap_password) {
      const encrypted = encryptCredential(updates.imap_password);
      updateData.imap_password_encrypted = encrypted.encrypted;
      updateData.imap_password_iv = encrypted.iv;
    }

    if (updates.pop3_password) {
      const encrypted = encryptCredential(updates.pop3_password);
      updateData.pop3_password_encrypted = encrypted.encrypted;
      updateData.pop3_password_iv = encrypted.iv;
    }

    // Build query - super admin can update any account
    let query = supabase
      .from("email_accounts")
      .update(updateData)
      .eq("id", id);
    
    // Non-super admins can only update their own tenant's accounts
    if (!isSuperAdmin) {
      if (!profile?.tenant_id) {
        return NextResponse.json({ error: "No tenant found" }, { status: 403 });
      }
      query = query.eq("tenant_id", profile.tenant_id);
    }

    const { data: account, error } = await query
      .select("id, tenant_id, name, email_address, is_default, is_active, provider, mode, managed_domain_id, smtp_host, smtp_port, smtp_secure, smtp_user, imap_host, imap_port, imap_secure, imap_user, pop3_host, pop3_port, pop3_secure, pop3_user, resend_api_key_id, resend_domain, sync_enabled, sync_interval_minutes, last_sync_at, last_sync_error, created_at, updated_at")
      .single();

    if (error) {
      console.error("Update account error:", error);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS for profile lookup
    const adminSupabase = await createSupabaseAdmin();

    const { data: profile } = await adminSupabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Super admin uses admin client to bypass RLS (for tenant_id = null accounts)
    if (isSuperAdmin) {
      const { error } = await adminSupabase
        .from("email_accounts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
      }
    } else {
      // Non-super admins use regular client with RLS
      if (!profile?.tenant_id) {
        return NextResponse.json({ error: "No tenant found" }, { status: 403 });
      }

      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id);

      if (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
      }
    }

    console.log("[DELETE /api/email/accounts] Deleted:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
