/**
 * Unit tests for authorization logic
 */

import { describe, it, expect, vi } from 'vitest';
import {
  hasPermission,
  hasRole,
  getRolePermissions,
  getEffectiveRoles,
  UserRole,
  Permission,
} from '@/lib/auth/authorization';

describe('Authorization Logic', () => {
  describe('Role Hierarchy', () => {
    it('should return correct permissions for each role', () => {
      expect(getRolePermissions(UserRole.SUPER_ADMIN)).toContain(Permission.VAULT_ADMIN);
      expect(getRolePermissions(UserRole.ADMIN)).toContain(Permission.VAULT_WRITE);
      expect(getRolePermissions(UserRole.OWNER)).toContain(Permission.NOTES_WRITE);
      expect(getRolePermissions(UserRole.MEMBER)).toContain(Permission.CHAT_READ);
      expect(getRolePermissions(UserRole.GUEST)).toContain(Permission.VAULT_READ);
    });

    it('should inherit permissions from lower roles', () => {
      const adminPermissions = getRolePermissions(UserRole.ADMIN);
      const ownerPermissions = getRolePermissions(UserRole.OWNER);

      // Admin should have all owner permissions plus additional ones
      expect(adminPermissions.length).toBeGreaterThan(ownerPermissions.length);
      expect(ownerPermissions.every(p => adminPermissions.includes(p))).toBe(true);
    });
  });

  describe('getEffectiveRoles', () => {
    it('should return role and all inherited roles', () => {
      expect(getEffectiveRoles(UserRole.SUPER_ADMIN)).toEqual([
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.OWNER,
        UserRole.MEMBER,
        UserRole.GUEST,
      ]);

      expect(getEffectiveRoles(UserRole.OWNER)).toEqual([
        UserRole.OWNER,
        UserRole.MEMBER,
        UserRole.GUEST,
      ]);

      expect(getEffectiveRoles(UserRole.GUEST)).toEqual([
        UserRole.GUEST,
      ]);
    });
  });

  describe('hasRole', () => {
    const mockUser = (role: string) => ({
      id: 'user-123',
      email: 'test@example.com',
      profile: { role },
    });

    it('should return true for exact role match', () => {
      expect(hasRole(mockUser(UserRole.ADMIN), UserRole.ADMIN)).toBe(true);
    });

    it('should return true for inherited roles', () => {
      expect(hasRole(mockUser(UserRole.SUPER_ADMIN), UserRole.ADMIN)).toBe(true);
      expect(hasRole(mockUser(UserRole.ADMIN), UserRole.OWNER)).toBe(false);
    });

    it('should return false for invalid user', () => {
      expect(hasRole({ id: 'user-123' }, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasPermission', () => {
    const mockUser = (role: string) => ({
      id: 'user-123',
      email: 'test@example.com',
      profile: { role },
    });

    it('should grant permissions based on role', () => {
      expect(hasPermission(mockUser(UserRole.OWNER), Permission.NOTES_WRITE)).toBe(true);
      expect(hasPermission(mockUser(UserRole.MEMBER), Permission.VAULT_ADMIN)).toBe(false);
    });

    it('should allow resource ownership override', () => {
      const resourceOwnerId = 'user-123'; // Same as mock user

      // Even a guest should be able to modify their own resources
      expect(hasPermission(
        mockUser(UserRole.GUEST),
        Permission.NOTES_WRITE,
        resourceOwnerId
      )).toBe(true);
    });

    it('should deny access for non-owners', () => {
      const resourceOwnerId = 'different-user';

      expect(hasPermission(
        mockUser(UserRole.GUEST),
        Permission.NOTES_WRITE,
        resourceOwnerId
      )).toBe(false);
    });

    it('should handle missing profile gracefully', () => {
      const userWithoutProfile = { id: 'user-123', email: 'test@example.com' };

      expect(hasPermission(userWithoutProfile, Permission.VAULT_READ)).toBe(false);
    });
  });

  describe('Permission Constants', () => {
    it('should define all expected permissions', () => {
      expect(Permission.VAULT_READ).toBe('vault:read');
      expect(Permission.NOTES_WRITE).toBe('notes:write');
      expect(Permission.CHAT_READ).toBe('chat:read');
      expect(Permission.ADMIN_DELETE).toBe('admin:delete');
      expect(Permission.TENANT_ADMIN).toBe('tenant:admin');
    });
  });

  describe('UserRole Constants', () => {
    it('should define all expected roles', () => {
      expect(UserRole.SUPER_ADMIN).toBe('super_admin');
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.OWNER).toBe('owner');
      expect(UserRole.MEMBER).toBe('member');
      expect(UserRole.GUEST).toBe('guest');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or invalid inputs', () => {
      expect(hasPermission(null as any, Permission.VAULT_READ)).toBe(false);
      expect(hasPermission(undefined as any, Permission.VAULT_READ)).toBe(false);
      expect(hasRole(null as any, UserRole.ADMIN)).toBe(false);
      expect(hasRole(undefined as any, UserRole.ADMIN)).toBe(false);
    });

    it('should handle unknown roles gracefully', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        profile: { role: 'unknown_role' },
      };

      expect(hasPermission(mockUser, Permission.VAULT_READ)).toBe(false);
      expect(hasRole(mockUser, UserRole.ADMIN)).toBe(false);
    });
  });
});