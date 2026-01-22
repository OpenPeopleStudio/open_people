/**
 * Authentication & Authorization Middleware
 *
 * Combines authentication and authorization into easy-to-use middleware
 * functions for API routes. Replaces the need for scattered auth code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireAuth, type AuthResult } from './auth';
import {
  requireAuth as requireAuthZ,
  hasPermission,
  Permission,
  UserRole,
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
        const authZHandler = requireAuthZ(requirements)(handler);
        return await authZHandler(auth, request, ...args);
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
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    const requirements: AuthRequirements = {
      permission,
      ...(resourceOwnerId ? { resourceOwnerId } : {}),
    };
    return withAuthAndAuthZ(requirements)(
      async (auth, request, ...args: T) => {
        return await handler(auth, request, ...args);
      }
    );
  };
}

/**
 * Role-based middleware
 */
export function withRole(role: UserRole) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ role })(
      async (auth, request, ...args: T) => {
        return await handler(auth, request, ...args);
      }
    );
  };
}

/**
 * Tenant-based middleware
 */
export function withTenantAccess(tenantId: string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ tenantId })(
      async (auth, request, ...args: T) => {
        return await handler(auth, request, ...args);
      }
    );
  };
}

/**
 * Ownership-based middleware
 */
export function withOwnership(
  getResourceOwnerId: (args: any[]) => string,
  permission: Permission = Permission.VAULT_WRITE
) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ()(async (auth, request, ...args: T) => {
      const resourceOwnerId = getResourceOwnerId([request, ...args]);
      if (!hasPermission(auth.user, permission, resourceOwnerId)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
      return await handler(auth, request, ...args);
    });
  };
}

/**
 * Tenant-scoped auth helper
 * - Requires an authenticated user
 * - Requires tenantId to be present on the auth context
 */
export function withTenantAuth() {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ()(async (auth, request, ...args: T) => {
      const tenantId = auth.tenantId ?? auth.user.profile?.tenant_id;
      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant context required" },
          { status: 400 }
        );
      }
      return handler(auth, request, ...args);
    });
  };
}

/**
 * Super-admin-only auth helper
 */
export function withSuperAdminAuth() {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, request: NextRequest, ...args: T) => Promise<R> | R
  ) {
    return withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN })(async (auth, request, ...args: T) => {
      return handler(auth, request, ...args);
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
