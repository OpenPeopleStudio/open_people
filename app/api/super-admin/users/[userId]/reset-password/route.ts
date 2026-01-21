/**
 * Super Admin User Password Reset API
 *
 * Allows super admins to reset user passwords.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleResetPassword = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const userId = request.nextUrl.pathname.split('/')[2]; // Extract userId from path

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const { password } = await request.json();

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  try {
    // Update user password
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      console.error('Failed to reset password:', error);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Log the password reset
    await supabase
      .from('vault_audit_log')
      .insert({
        vault_id: 'platform', // Password resets are platform-wide
        action: 'password_reset',
        resource_type: 'user',
        resource_id: userId,
        performed_by: auth.user.id,
        success: true,
        metadata: {
          method: 'admin_reset',
        },
      });

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
});

export const POST = handleResetPassword;