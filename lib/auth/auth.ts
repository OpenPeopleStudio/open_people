/**
 * Centralized Authentication Logic
 *
 * Provides unified authentication utilities to replace scattered auth code
 * across API routes. Handles user authentication, session management, and
 * basic user profile retrieval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuth, logAuthZ } from '@/lib/observability/logger';
import { performanceMonitor } from '@/lib/observability/performance';
import { alertFailedLogin, alertSuspiciousActivity } from '@/lib/observability/alerting';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedUser extends User {
  profile?: {
    id: string;
    role: string;
    tenant_id?: string;
    email?: string;
    full_name?: string;
  };
}

export interface AuthResult {
  user: AuthenticatedUser;
  tenantId?: string;
}

/**
 * Authenticate user from request
 * Replaces the repetitive `await supabase.auth.getUser()` pattern
 */
export async function authenticateUser(
  request: NextRequest
): Promise<AuthResult | null> {
  try {
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Record failed auth attempt
      performanceMonitor.incrementCounter('auth_failed_total', 1, {
        reason: authError?.message || 'no_user',
      });

      logAuth('request', false, {
        error: authError?.message || 'No authenticated user',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      // Check for potential brute force attempts
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      if (ip) {
        // This would be implemented with a rate limiter/cache
        // For now, just log suspicious patterns
        await alertSuspiciousActivity('failed_auth_attempt', {
          ip,
          userAgent: request.headers.get('user-agent'),
          endpoint: request.url,
        });
      }

      return null;
    }

    // Get user profile with role information
    const { data: profile } = await supabase
      .from('709_profiles')
      .select('id, role, tenant_id, email, full_name')
      .eq('id', user.id)
      .single();

    const authenticatedUser: AuthenticatedUser = {
      ...user,
      profile: profile ? {
        id: profile.id,
        role: profile.role,
        tenant_id: profile.tenant_id,
        email: profile.email,
        full_name: profile.full_name,
      } : undefined,
    };

    // Record successful auth
    performanceMonitor.incrementCounter('auth_success_total', 1, {
      role: profile?.role || 'unknown',
      tenant_id: profile?.tenant_id || 'unknown',
    });

    logAuth('request', true, {
      userId: user.id,
      role: profile?.role,
      tenantId: profile?.tenant_id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return {
      user: authenticatedUser,
      tenantId: profile?.tenant_id,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const auth = await authenticateUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    ) as any;
  }
  return auth;
}

/**
 * Create authentication middleware wrapper
 * Wraps route handlers to automatically handle authentication
 */
export function withAuth<T extends any[], R>(
  handler: (auth: AuthResult, ...args: T) => Promise<R> | R
) {
  return async (request: NextRequest, ...args: T): Promise<R | NextResponse> => {
    const auth = await authenticateUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      return await handler(auth, request, ...args);
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Get user profile for authenticated user
 * Cached to avoid repeated database calls
 */
import { cache } from 'react';

export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServer();

  const { data: profile, error } = await supabase
    .from('709_profiles')
    .select('id, role, tenant_id, email, full_name')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }

  return profile;
});

/**
 * Validate user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string | string[]): boolean {
  if (!user.profile?.role) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.profile.role);
}

/**
 * Validate user belongs to tenant
 */
export function belongsToTenant(user: AuthenticatedUser, tenantId: string): boolean {
  return user.profile?.tenant_id === tenantId;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.profile?.role === 'super_admin';
}

/**
 * Check if user owns resource (by user_id field)
 */
export function ownsResource(user: AuthenticatedUser, resourceUserId: string): boolean {
  return user.id === resourceUserId;
}