/**
 * Unit tests for authentication middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withAuthentication,
  withRole,
  withPermission,
  withTenantAccess,
  withAuthAndAuthZ,
  UserRole,
  Permission,
} from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock the auth functions
vi.mock('@/lib/auth/auth', () => ({
  authenticateUser: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/auth/authorization', () => ({
  requirePermission: vi.fn(),
  requireRole: vi.fn(),
  requireTenantAccess: vi.fn(),
  requireAuth: vi.fn(),
}));

import { authenticateUser, requireAuth } from '@/lib/auth/auth';
import { requireAuth as requireAuthZ } from '@/lib/auth/authorization';

describe('Authentication Middleware', () => {
  const mockAuthResult = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      profile: { role: 'owner', tenant_id: 'tenant-456' },
    },
    tenantId: 'tenant-456',
  };

  const mockRequest = new NextRequest('http://localhost:3000/api/test');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('withAuthentication', () => {
    it('should call handler with auth context on successful authentication', async () => {
      (authenticateUser as any).mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuthentication(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(authenticateUser).toHaveBeenCalledWith(mockRequest);
      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toEqual({ success: true });
    });

    it('should return 401 for unauthenticated requests', async () => {
      (authenticateUser as any).mockResolvedValue(null);

      const mockHandler = vi.fn();
      const wrappedHandler = withAuthentication(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 401);
    });

    it('should handle handler errors gracefully', async () => {
      (authenticateUser as any).mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withAuthentication(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toHaveProperty('status', 500);
    });
  });

  describe('withRole', () => {
    it('should allow access for users with correct role', async () => {
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockImplementation((_requirements: any) => {
        void _requirements;
        return (handler: any) => handler;
      });

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withRole(UserRole.OWNER)(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(requireAuth).toHaveBeenCalledWith(mockRequest);
      expect(requireAuthZ).toHaveBeenCalledWith({ role: UserRole.OWNER });
      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toEqual({ success: true });
    });

    it('should deny access for users without correct role', async () => {
      const authZMiddleware = vi.fn().mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockReturnValue(authZMiddleware);

      const mockHandler = vi.fn();
      const wrappedHandler = withRole(UserRole.ADMIN)(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 403);
    });
  });

  describe('withPermission', () => {
    it('should allow access for users with correct permission', async () => {
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockImplementation((_requirements: any) => (handler: any) => handler);

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withPermission(Permission.NOTES_READ)(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(requireAuth).toHaveBeenCalledWith(mockRequest);
      expect(requireAuthZ).toHaveBeenCalledWith({ permission: Permission.NOTES_READ });
      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toEqual({ success: true });
    });
  });

  describe('withTenantAccess', () => {
    it('should allow access for users in correct tenant', async () => {
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockImplementation((_requirements: any) => (handler: any) => handler);

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withTenantAccess('tenant-456')(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(requireAuth).toHaveBeenCalledWith(mockRequest);
      expect(requireAuthZ).toHaveBeenCalledWith({ tenantId: 'tenant-456' });
      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toEqual({ success: true });
    });
  });

  describe('withAuthAndAuthZ', () => {
    it('should combine authentication and authorization', async () => {
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockImplementation((requirements: any) => {
        void requirements;
        return (handler: any) => handler;
      });

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuthAndAuthZ({
        role: UserRole.OWNER,
        permission: Permission.NOTES_READ,
        tenantId: 'tenant-456',
      })(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(requireAuth).toHaveBeenCalledWith(mockRequest);
      expect(requireAuthZ).toHaveBeenCalledWith({
        role: UserRole.OWNER,
        permission: Permission.NOTES_READ,
        tenantId: 'tenant-456',
      });
      expect(mockHandler).toHaveBeenCalledWith(mockAuthResult, mockRequest);
      expect(result).toEqual({ success: true });
    });

    it('should handle authentication failures', async () => {
      (requireAuth as any).mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));

      const mockHandler = vi.fn();
      const wrappedHandler = withAuthAndAuthZ({ role: UserRole.OWNER })(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 401);
    });

    it('should handle authorization failures', async () => {
      (requireAuth as any).mockResolvedValue(mockAuthResult);
      (requireAuthZ as any).mockReturnValue(() =>
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      );

      const mockHandler = vi.fn();
      const wrappedHandler = withAuthAndAuthZ({ role: UserRole.ADMIN })(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 403);
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions in handlers', async () => {
      (authenticateUser as any).mockResolvedValue(mockAuthResult);

      const mockHandler = vi.fn().mockRejectedValue(new Error('Handler crashed'));
      const wrappedHandler = withAuthentication(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
      expect(result).toHaveProperty('status', 500);
    });

    it('should handle non-NextResponse auth results', async () => {
      (authenticateUser as any).mockResolvedValue(null);

      const mockHandler = vi.fn();
      const wrappedHandler = withAuthentication(mockHandler);

      const result = await wrappedHandler(mockRequest);

      expect(result).toHaveProperty('status', 401);
    });
  });
});
