/**
 * Centralized Authorization Logic
 *
 * Provides role-based access control (RBAC) and resource-based permissions
 * to replace scattered authorization checks across API routes.
 */

import { NextResponse } from 'next/server';
import { logAuthZ } from '@/lib/observability/logger';
import { performanceMonitor } from '@/lib/observability/performance';
import { alertSuspiciousActivity } from '@/lib/observability/alerting';
import type { AuthResult, AuthenticatedUser } from './auth';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OWNER = 'owner',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum Permission {
  // Vault permissions
  VAULT_READ = 'vault:read',
  VAULT_WRITE = 'vault:write',
  VAULT_DELETE = 'vault:delete',
  VAULT_ADMIN = 'vault:admin',

  // Notes permissions
  NOTES_READ = 'notes:read',
  NOTES_WRITE = 'notes:write',
  NOTES_DELETE = 'notes:delete',

  // Chat permissions
  CHAT_READ = 'chat:read',
  CHAT_WRITE = 'chat:write',

  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',

  // Tenant permissions
  TENANT_READ = 'tenant:read',
  TENANT_WRITE = 'tenant:write',
  TENANT_ADMIN = 'tenant:admin',
}

/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.OWNER, UserRole.MEMBER, UserRole.GUEST],
  [UserRole.ADMIN]: [UserRole.OWNER, UserRole.MEMBER, UserRole.GUEST],
  [UserRole.OWNER]: [UserRole.MEMBER, UserRole.GUEST],
  [UserRole.MEMBER]: [UserRole.GUEST],
  [UserRole.GUEST]: [],
};

/**
 * Default role permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.VAULT_READ, Permission.VAULT_WRITE, Permission.VAULT_DELETE, Permission.VAULT_ADMIN,
    Permission.NOTES_READ, Permission.NOTES_WRITE, Permission.NOTES_DELETE,
    Permission.CHAT_READ, Permission.CHAT_WRITE,
    Permission.ADMIN_READ, Permission.ADMIN_WRITE, Permission.ADMIN_DELETE,
    Permission.TENANT_READ, Permission.TENANT_WRITE, Permission.TENANT_ADMIN,
  ],
  [UserRole.ADMIN]: [
    Permission.VAULT_READ, Permission.VAULT_WRITE, Permission.VAULT_DELETE,
    Permission.NOTES_READ, Permission.NOTES_WRITE, Permission.NOTES_DELETE,
    Permission.CHAT_READ, Permission.CHAT_WRITE,
    Permission.ADMIN_READ, Permission.ADMIN_WRITE,
    Permission.TENANT_READ, Permission.TENANT_WRITE,
  ],
  [UserRole.OWNER]: [
    Permission.VAULT_READ, Permission.VAULT_WRITE, Permission.VAULT_DELETE,
    Permission.NOTES_READ, Permission.NOTES_WRITE, Permission.NOTES_DELETE,
    Permission.CHAT_READ, Permission.CHAT_WRITE,
    Permission.TENANT_READ,
  ],
  [UserRole.MEMBER]: [
    Permission.VAULT_READ, Permission.VAULT_WRITE,
    Permission.NOTES_READ, Permission.NOTES_WRITE,
    Permission.CHAT_READ, Permission.CHAT_WRITE,
  ],
  [UserRole.GUEST]: [
    Permission.VAULT_READ,
    Permission.NOTES_READ,
    Permission.CHAT_READ,
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: Permission,
  resourceOwnerId?: string
): boolean {
  const userRole = user.profile?.role as UserRole;
  if (!userRole) {
    logAuthZ('permission_check', false, {
      userId: user.id,
      permission,
      reason: 'no_role',
    });
    performanceMonitor.incrementCounter('authz_denied_total', 1, {
      reason: 'no_role',
      permission,
    });
    return false;
  }

  // Get all permissions for this role (including inherited)
  const userPermissions = getRolePermissions(userRole);

  // Check direct permission
  if (userPermissions.includes(permission)) {
    logAuthZ('permission_check', true, {
      userId: user.id,
      permission,
      role: userRole,
    });
    performanceMonitor.incrementCounter('authz_granted_total', 1, {
      permission,
      role: userRole,
    });
    return true;
  }

  // Special case: owners have full access to their own resources
  if (resourceOwnerId && user.id === resourceOwnerId) {
    logAuthZ('ownership_check', true, {
      userId: user.id,
      permission,
      resourceOwnerId,
    });
    performanceMonitor.incrementCounter('authz_granted_total', 1, {
      permission,
      reason: 'ownership',
      role: userRole,
    });
    return true;
  }

  // Permission denied
  logAuthZ('permission_check', false, {
    userId: user.id,
    permission,
    role: userRole,
    resourceOwnerId,
  });
  performanceMonitor.incrementCounter('authz_denied_total', 1, {
    permission,
    role: userRole,
  });

  // Alert on suspicious permission attempts
  if (permission.includes('admin') || permission.includes('delete')) {
    void alertSuspiciousActivity('unauthorized_permission_attempt', {
      userId: user.id,
      permission,
      role: userRole,
      resourceOwnerId,
    });
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthenticatedUser,
  permissions: Permission[],
  resourceOwnerId?: string
): boolean {
  return permissions.some(permission => hasPermission(user, permission, resourceOwnerId));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthenticatedUser,
  permissions: Permission[],
  resourceOwnerId?: string
): boolean {
  return permissions.every(permission => hasPermission(user, permission, resourceOwnerId));
}

/**
 * Check if user has a specific role or higher
 */
export function hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
  const userRole = user.profile?.role as UserRole;
  if (!userRole) {
    logAuthZ('role_check', false, {
      userId: user.id,
      requiredRole,
      reason: 'no_role',
    });
    return false;
  }

  const hasRequiredRole = getEffectiveRoles(userRole).includes(requiredRole);

  logAuthZ('role_check', hasRequiredRole, {
    userId: user.id,
    userRole,
    requiredRole,
  });

  if (!hasRequiredRole) {
    performanceMonitor.incrementCounter('authz_denied_total', 1, {
      reason: 'insufficient_role',
      userRole,
      requiredRole,
    });
  }

  return hasRequiredRole;
}

/**
 * Get all permissions for a role (including inherited)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const permissions = new Set<Permission>();

  // Add permissions for this role
  ROLE_PERMISSIONS[role]?.forEach(permission => permissions.add(permission));

  // Add permissions from lower roles (inheritance)
  const inheritedRoles = ROLE_HIERARCHY[role] || [];
  inheritedRoles.forEach(inheritedRole => {
    ROLE_PERMISSIONS[inheritedRole]?.forEach(permission => permissions.add(permission));
  });

  return Array.from(permissions);
}

/**
 * Get all roles that a user effectively has (including inherited)
 */
export function getEffectiveRoles(role: UserRole): UserRole[] {
  return [role, ...(ROLE_HIERARCHY[role] || [])];
}

/**
 * Authorization middleware - requires specific permission
 */
export function requirePermission(permission: Permission, resourceOwnerId?: string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return async (auth: AuthResult, ...args: T): Promise<R | NextResponse> => {
      if (!hasPermission(auth.user, permission, resourceOwnerId)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(auth, ...args);
    };
  };
}

/**
 * Authorization middleware - requires specific role
 */
export function requireRole(requiredRole: UserRole) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return async (auth: AuthResult, ...args: T): Promise<R | NextResponse> => {
      if (!hasRole(auth.user, requiredRole)) {
        return NextResponse.json(
          { error: 'Insufficient role' },
          { status: 403 }
        );
      }

      return await handler(auth, ...args);
    };
  };
}

/**
 * Authorization middleware - requires resource ownership OR specific permission
 */
export function requireOwnershipOrPermission(
  permission: Permission,
  getResourceOwnerId?: (args: any[]) => string
) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return async (auth: AuthResult, ...args: T): Promise<R | NextResponse> => {
      const resourceOwnerId = getResourceOwnerId ? getResourceOwnerId(args) : undefined;

      if (!hasPermission(auth.user, permission, resourceOwnerId)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(auth, ...args);
    };
  };
}

/**
 * Check tenant access - ensures user belongs to the correct tenant
 */
export function requireTenantAccess(tenantId: string) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return async (auth: AuthResult, ...args: T): Promise<R | NextResponse> => {
      // Super admins can access all tenants
      if (hasRole(auth.user, UserRole.SUPER_ADMIN)) {
        return await handler(auth, ...args);
      }

      // Regular users must belong to the tenant
      if (auth.user.profile?.tenant_id !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied: wrong tenant' },
          { status: 403 }
        );
      }

      return await handler(auth, ...args);
    };
  };
}

/**
 * Combined authorization middleware
 * Supports multiple authorization requirements
 */
export interface AuthRequirements {
  permission?: Permission;
  role?: UserRole;
  tenantId?: string;
  resourceOwnerId?: string;
}

export function requireAuth(requirements: AuthRequirements) {
  return function <T extends any[], R>(
    handler: (auth: AuthResult, ...args: T) => Promise<R> | R
  ) {
    return async (auth: AuthResult, ...args: T): Promise<R | NextResponse> => {
      // Check role requirement
      if (requirements.role && !hasRole(auth.user, requirements.role)) {
        return NextResponse.json(
          { error: 'Insufficient role' },
          { status: 403 }
        );
      }

      // Check permission requirement
      if (requirements.permission && !hasPermission(auth.user, requirements.permission, requirements.resourceOwnerId)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check tenant access
      if (requirements.tenantId) {
        if (!hasRole(auth.user, UserRole.SUPER_ADMIN) && auth.user.profile?.tenant_id !== requirements.tenantId) {
          return NextResponse.json(
            { error: 'Access denied: wrong tenant' },
            { status: 403 }
          );
        }
      }

      return await handler(auth, ...args);
    };
  };
}
