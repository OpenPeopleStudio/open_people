/**
 * Super Admin Users API
 *
 * Provides user management capabilities for super admins:
 * - List all users across tenants
 * - Create new users
 * - Filter and search users
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetUsers = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN, // Only super admins can manage users
})(async (auth, request: NextRequest) => {
  void auth;
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const tenant = searchParams.get('tenant') || '';

  // Build query for users with profile and tenant information
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      tenant_id,
      created_at,
      tenant:tenants(id, name, slug)
    `);

  // Apply filters
  if (role) {
    query = query.eq('role', role);
  }

  if (tenant) {
    query = query.eq('tenant_id', tenant);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: profiles, error } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }

  // Get auth user data for additional fields
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  // Merge profile and auth data
  const users = profiles?.map(profile => {
    const authUser = authUsers?.users.find(u => u.id === profile.id);
    const tenantRecord = profile.tenant as { name?: string } | { name?: string }[] | null;
    const tenantName = Array.isArray(tenantRecord) ? tenantRecord[0]?.name : tenantRecord?.name;

    return {
      id: profile.id,
      email: profile.email || authUser?.email || '',
      full_name: profile.full_name,
      role: profile.role,
      tenant_id: profile.tenant_id,
      tenant_name: tenantName,
      status: authUser?.email_confirmed_at ? 'active' : 'inactive',
      last_sign_in_at: authUser?.last_sign_in_at,
      created_at: profile.created_at,
      email_confirmed_at: authUser?.email_confirmed_at,
    };
  }) || [];

  return NextResponse.json({
    users,
    total: users.length,
  });
});

const handleCreateUser = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const { email, password, full_name, role, tenant_id } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role: role || 'member',
        tenant_id: tenant_id || null,
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Log the user creation
    await supabase
      .from('vault_audit_log')
      .insert({
        vault_id: tenant_id || 'platform', // Use tenant_id or 'platform' for cross-tenant logging
        action: 'user_created',
        resource_type: 'user',
        resource_id: authUser.user.id,
        performed_by: auth.user.id,
        success: true,
        metadata: {
          email,
          role,
          tenant_id,
        },
      });

    return NextResponse.json({
      user: {
        id: authUser.user.id,
        email,
        full_name,
        role,
        tenant_id,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});

export const GET = handleGetUsers;
export const POST = handleCreateUser;
