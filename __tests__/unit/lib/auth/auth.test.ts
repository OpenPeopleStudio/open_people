/**
 * Unit tests for authentication utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateUser, requireAuth, withAuth, hasPermission, hasRole } from '@/lib/auth/auth';
import { createSupabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/observability/logger', () => ({
  logAuth: vi.fn(),
}));

describe('Authentication Utilities', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createSupabaseServer as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('authenticateUser', () => {
    it('should return authenticated user with profile', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { id: 'user-123', role: 'owner', tenant_id: 'tenant-456' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateUser(request);

      expect(result).toEqual({
        user: {
          ...mockUser,
          profile: mockProfile,
        },
        tenantId: 'tenant-456',
      });
    });

    it('should return null for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateUser(request);

      expect(result).toBeNull();
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateUser(request);

      expect(result?.user.profile).toBeUndefined();
      expect(result?.tenantId).toBeUndefined();
    });
  });

  describe('requireAuth', () => {
    it('should return auth result for authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { id: 'user-123', role: 'owner', tenant_id: 'tenant-456' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(request);

      expect(result).toEqual({
        user: {
          ...mockUser,
          profile: mockProfile,
        },
        tenantId: 'tenant-456',
      });
    });

    it('should return NextResponse for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(request);

      expect(result).toHaveProperty('status', 401);
    });
  });

  describe('withAuth', () => {
    it('should wrap handler and provide auth context', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProfile = { id: 'user-123', role: 'owner', tenant_id: 'tenant-456' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(
        {
          user: {
            ...mockUser,
            profile: mockProfile,
          },
          tenantId: 'tenant-456',
        },
        request
      );
      expect(result).toEqual({ success: true });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const mockHandler = vi.fn();
      const wrappedHandler = withAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toHaveProperty('status', 401);
    });
  });
});