/**
 * Test Setup
 * 
 * This file runs before all tests.
 * Configure global mocks, test utilities, and environment.
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// Environment
// ═══════════════════════════════════════════════════════════════════════════

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// ═══════════════════════════════════════════════════════════════════════════
// Global Mocks
// ═══════════════════════════════════════════════════════════════════════════

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle Hooks
// ═══════════════════════════════════════════════════════════════════════════

beforeAll(() => {
  // Global setup
});

afterEach(() => {
  // Clear all mocks between tests
  vi.clearAllMocks();
});

afterAll(() => {
  // Global teardown
});

// ═══════════════════════════════════════════════════════════════════════════
// Test Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const mockData: Record<string, unknown[]> = {};
  
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn((table: string) => ({
      ...mockQuery,
      // Allow setting mock data per table
      _table: table,
      _mockData: mockData[table] || [],
    })),
    ...overrides,
  };
}

/**
 * Create a mock authenticated user
 */
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  };
}

/**
 * Create a mock tenant
 */
export function createMockTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    slug: 'test-tenant',
    status: 'active',
    primary_domain: 'test-tenant.openpeople.ai',
    settings: {},
    ...overrides,
  };
}

/**
 * Create a mock NextRequest
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
) {
  const { method = 'GET', headers = {}, body } = options;
  
  return {
    url,
    method,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Request;
}
