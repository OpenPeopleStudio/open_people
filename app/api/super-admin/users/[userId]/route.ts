/**
 * Super Admin User Management API
 *
 * Individual user operations for super admins:
 * - Get user details
 * - Update user profile and settings
 * - Delete users
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetUser = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const userId = request.nextUrl.pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  // Get user profile with tenant information
  const { data: profile, error: profileError } = await supabase
    .from('709_profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      tenant_id,
      created_at,
      tenant:tenants(id, name, slug)
    `)
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get auth user data
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users.find(u => u.id === userId);

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email || authUser?.email || '',
      full_name: profile.full_name,
      role: profile.role,
      tenant_id: profile.tenant_id,
      tenant_name: Array.isArray(profile.tenant) ? profile.tenant[0]?.name : profile.tenant?.name,
      status: authUser?.email_confirmed_at ? 'active' : 'inactive',
      last_sign_in_at: authUser?.last_sign_in_at,
      created_at: profile.created_at,
      email_confirmed_at: authUser?.email_confirmed_at,
    },
  });
});

const handleUpdateUser = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const userId = request.nextUrl.pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const updates = await request.json();

  // Prevent updating super admin roles unless you're a super admin
  if (updates.role && updates.role === 'super_admin' && auth.user.id !== userId) {
    // Additional check: don't allow non-super-admins to create super admins
    const { data: currentUser } = await supabase
      .from('709_profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single();

    if (currentUser?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  try {
    // Update profile
    const { error: profileError } = await supabase
      .from('709_profiles')
      .update({
        full_name: updates.full_name,
        role: updates.role,
        tenant_id: updates.tenant_id,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Update auth user if needed
    if (updates.status) {
      if (updates.status === 'suspended') {
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '8760h', // 1 year ban (effectively permanent)
        });
      } else if (updates.status === 'active') {
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '0', // Remove ban
        });
      }
    }

    // Log the user update
    await supabase
      .from('vault_audit_log')
      .insert({
        vault_id: updates.tenant_id || 'platform',
        action: 'user_updated',
        resource_type: 'user',
        resource_id: userId,
        performed_by: auth.user.id,
        success: true,
        metadata: updates,
      });

    return NextResponse.json({
      message: 'User updated successfully',
      user: { id: userId, ...updates },
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
});

const handleDeleteUser = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const userId = request.nextUrl.pathname.split('/').pop();

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  // Prevent deleting yourself
  if (userId === auth.user.id) {
    return NextResponse.json(
      { error: 'Cannot delete your own account' },
      { status: 400 }
    );
  }

  try {
    // Get user info for logging before deletion
    const { data: profile } = await supabase
      .from('709_profiles')
      .select('email, role, tenant_id')
      .eq('id', userId)
      .single();

    // Delete profile first (due to foreign key constraints)
    const { error: profileError } = await supabase
      .from('709_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to delete profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete user profile' },
        { status: 500 }
      );
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Log the user deletion
    await supabase
      .from('vault_audit_log')
      .insert({
        vault_id: profile?.tenant_id || 'platform',
        action: 'user_deleted',
        resource_type: 'user',
        resource_id: userId,
        performed_by: auth.user.id,
        success: true,
        metadata: {
          email: profile?.email,
          role: profile?.role,
        },
      });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
});

export const GET = handleGetUser;
export const PATCH = handleUpdateUser;
export const DELETE = handleDeleteUser;