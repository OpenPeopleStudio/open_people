/**
 * Authentication & Authorization Middleware
 *
 * Combines authentication and authorization into easy-to-use middleware
 * functions for API routes. Replaces the need for scattered auth code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireAuth, type AuthResult } from './auth';
import {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  requireTenantAccess,
  requireAuth as requireAuthZ,
  type Permission,
  type UserRole,
  type AuthRequirements,
} from './authorization';

/**
 * Combined middleware with authentication and authorization
 */
export function withAuthAndAuthZ(requirements?: AuthRequirements) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return async (request: NextRequest, ...args: T): Promise<R | NextResponse> => {
      // First authenticate
      const auth = await requireAuth(request);
      if (auth instanceof NextResponse) {
        return auth;
      }

      // Then authorize if requirements specified
      if (requirements) {
        const authZMiddleware = requireAuthZ(requirements);
        const result = await authZMiddleware((authCtx, ...rest) => handler(authCtx, request, ...rest))(auth, request, ...args);
        return result;
      }

      // Just authentication required
      return await handler(auth, request, ...args);
    };
  };
}

/**
 * Simple authentication-only middleware
 */
export const withAuthentication = withAuth;

/**
 * Permission-based middleware
 */
export function withPermission(permission: Permission, resourceOwnerId?: string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ permission, resourceOwnerId })(
      async (auth, ...args) => {
        return await handler(auth, ...args);
      }
    );
  };
}

/**
 * Role-based middleware
 */
export function withRole(role: UserRole) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ role })(
      async (auth, ...args) => {
        return await handler(auth, ...args);
      }
    );
  };
}

/**
 * Tenant-based middleware
 */
export function withTenantAccess(tenantId: string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ tenantId })(
      async (auth, ...args) => {
        return await handler(auth, ...args);
      }
    );
  };
}

/**
 * Ownership-based middleware
 */
export function withOwnership(getResourceOwnerId: (args: any[]) => string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({
      permission: Permission.VAULT_WRITE, // Example permission
      resourceOwnerId: getResourceOwnerId([]), // Will be overridden at runtime
    })(
      async (auth, ...args) => {
        return await handler(auth, ...args);
      }
    );
  };
}

/**
 * Tenant-scoped auth helper
 * - Requires an authenticated user
 * - Requires tenantId to be present on the auth context
 */
export function withTenantAuth() {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ requireTenant: true })(async (auth, ...args) => {
      if (!auth.tenantId) {
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 }
        );
      }
      return handler(auth, ...args);
    });
  };
}

/**
 * Super-admin-only auth helper
 */
export function withSuperAdminAuth() {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ role: 'super_admin' })(async (auth, ...args) => {
      return handler(auth, ...args);
    });
  };
}

/**
 * Helper function to extract resource owner ID from route params
 */
export function getResourceOwnerFromParams(paramName: string = 'userId') {
  return (args: any[]) => {
    const request = args[0] as NextRequest;
    const url = new URL(request.url);
    return url.searchParams.get(paramName) || '';
  };
}

/**
 * Helper function to extract resource owner from request body
 */
export function getResourceOwnerFromBody(fieldName: string = 'user_id') {
  return async (args: any[]) => {
    const request = args[0] as NextRequest;
    try {
      const body = await request.json();
      return body[fieldName] || '';
    } catch {
      return '';
    }
  };
}

// Re-export common helpers (avoid name collisions between auth and authorization)
export * from './auth';
export {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  requireTenantAccess,
  hasPermission,
  hasRole,
  Permission,
  UserRole,
} from './authorization';
