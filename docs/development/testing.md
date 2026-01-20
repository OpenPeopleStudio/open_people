# Testing Strategy & Guidelines

This document outlines the testing strategies, frameworks, and best practices for ensuring quality and reliability across the OpenPeople.ai platform.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Database Testing](#database-testing)
- [API Testing](#api-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Core Principles

1. **Test Early, Test Often**: Catch bugs before they reach production
2. **Automate Everything**: Manual testing doesn't scale
3. **Test in Isolation**: Each test should be independent
4. **Test the Right Things**: Focus on business-critical paths
5. **Fast Feedback**: Tests should run quickly

### Testing Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Code Coverage | 80%+ | Lines covered |
| Test Speed | < 5 min | CI pipeline duration |
| Flaky Tests | < 1% | Tests that fail intermittently |
| Bug Escape Rate | < 5% | Bugs found in production |

---

## Testing Pyramid

```
                    ┌───────────┐
                    │    E2E    │  Few, slow, expensive
                    │   Tests   │  Critical user journeys
                    ├───────────┤
                    │           │
                    │Integration│  Some, medium speed
                    │   Tests   │  Component interactions
                    │           │
                    ├───────────┤
                    │           │
                    │           │
                    │   Unit    │  Many, fast, cheap
                    │   Tests   │  Individual functions
                    │           │
                    │           │
                    └───────────┘
```

### Test Distribution

| Type | Percentage | Typical Count | Run Time |
|------|------------|---------------|----------|
| Unit | 70% | 500+ | < 1 min |
| Integration | 20% | 100+ | 2-3 min |
| E2E | 10% | 20-50 | 5-10 min |

---

## Unit Testing

### Framework Setup

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

### Unit Test Examples

#### Testing Utility Functions

```typescript
// lib/tenant.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeHost, extractSubdomain, isMarketingDomain } from './tenant';

describe('normalizeHost', () => {
  it('should remove port from host', () => {
    expect(normalizeHost('localhost:3000')).toBe('localhost');
  });

  it('should convert to lowercase', () => {
    expect(normalizeHost('OpenPeople.AI')).toBe('openpeople.ai');
  });

  it('should handle null input', () => {
    expect(normalizeHost(null)).toBe('');
  });
});

describe('extractSubdomain', () => {
  it('should extract subdomain from openpeople.ai domain', () => {
    expect(extractSubdomain('acme.openpeople.ai')).toBe('acme');
  });

  it('should return null for www subdomain', () => {
    expect(extractSubdomain('www.openpeople.ai')).toBe(null);
  });

  it('should handle localhost subdomains', () => {
    expect(extractSubdomain('acme.localhost')).toBe('acme');
  });
});

describe('isMarketingDomain', () => {
  it('should return true for root domain', () => {
    expect(isMarketingDomain('openpeople.ai')).toBe(true);
  });

  it('should return true for www subdomain', () => {
    expect(isMarketingDomain('www.openpeople.ai')).toBe(true);
  });

  it('should return false for tenant subdomain', () => {
    expect(isMarketingDomain('acme.openpeople.ai')).toBe(false);
  });
});
```

#### Testing React Components

```typescript
// components/NavBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavBar } from './NavBar';

// Mock the tenant context
vi.mock('@/context/TenantContext', () => ({
  useTenant: () => ({
    tenant: {
      id: 'test-tenant',
      name: 'Test Tenant',
      slug: 'test',
    },
  }),
}));

describe('NavBar', () => {
  it('should render tenant name', () => {
    render(<NavBar />);
    expect(screen.getByText('Test Tenant')).toBeInTheDocument();
  });

  it('should toggle mobile menu on click', () => {
    render(<NavBar />);
    const menuButton = screen.getByRole('button', { name: /menu/i });
    
    fireEvent.click(menuButton);
    expect(screen.getByRole('navigation')).toHaveClass('open');
  });
});
```

### Unit Test Best Practices

```typescript
// DO: Test one thing per test
it('should validate email format', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});

it('should reject invalid email', () => {
  expect(validateEmail('invalid')).toBe(false);
});

// DON'T: Test multiple things
it('should validate emails', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
  expect(validateEmail('')).toBe(false);
});

// DO: Use descriptive test names
describe('TenantService', () => {
  describe('createTenant', () => {
    it('should create tenant with valid data', () => {});
    it('should throw error when slug already exists', () => {});
    it('should generate unique slug when not provided', () => {});
  });
});

// DO: Use test fixtures
const validTenant = {
  name: 'Test Tenant',
  slug: 'test-tenant',
  status: 'active',
};

const invalidTenant = {
  name: '',  // Invalid: empty name
  slug: 'test',
};
```

---

## Integration Testing

### Database Integration Tests

```typescript
// tests/integration/tenant.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Tenant Integration', () => {
  let testTenantId: string;

  beforeAll(async () => {
    // Setup: Create test tenant
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name: 'Integration Test Tenant',
        slug: `test-${Date.now()}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    testTenantId = data.id;
  });

  afterAll(async () => {
    // Cleanup: Remove test tenant
    await supabase
      .from('tenants')
      .delete()
      .eq('id', testTenantId);
  });

  it('should fetch tenant by slug', async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', testTenantId)
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Integration Test Tenant');
  });

  it('should enforce RLS for tenant data', async () => {
    // Create a client with anon key (simulating regular user)
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Without authentication, should not see tenant
    const { data } = await anonClient
      .from('tenants')
      .select('*')
      .eq('id', testTenantId);

    expect(data).toHaveLength(0);
  });
});
```

### API Integration Tests

```typescript
// tests/integration/api/storage.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Storage API', () => {
  let authToken: string;
  let testBucketId: string;

  beforeAll(async () => {
    // Get auth token
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD,
      }),
    });
    const { token } = await loginRes.json();
    authToken = token;
  });

  it('should create a storage bucket', async () => {
    const res = await fetch(`${API_URL}/api/storage/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'test-bucket',
        isPublic: false,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('test-bucket');
    testBucketId = data.id;
  });

  it('should upload a file', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test content']), 'test.txt');

    const res = await fetch(`${API_URL}/api/storage/upload?bucketId=${testBucketId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filename).toBe('test.txt');
  });

  afterAll(async () => {
    // Cleanup: Delete test bucket
    if (testBucketId) {
      await fetch(`${API_URL}/api/storage/buckets/${testBucketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
    }
  });
});
```

---

## End-to-End Testing

### Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign in', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should allow user to sign out', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

```typescript
// tests/e2e/tenant-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tenant Management (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', process.env.SUPER_ADMIN_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.SUPER_ADMIN_PASSWORD!);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/super-admin/);
  });

  test('should list all tenants', async ({ page }) => {
    await page.goto('/super-admin/tenants');
    
    await expect(page.locator('[data-testid="tenant-list"]')).toBeVisible();
    const tenantRows = page.locator('[data-testid="tenant-row"]');
    await expect(tenantRows).toHaveCount(await tenantRows.count());
  });

  test('should create a new tenant', async ({ page }) => {
    await page.goto('/super-admin/tenants');
    await page.click('[data-testid="create-tenant-button"]');

    const uniqueSlug = `test-tenant-${Date.now()}`;
    await page.fill('[data-testid="tenant-name-input"]', 'E2E Test Tenant');
    await page.fill('[data-testid="tenant-slug-input"]', uniqueSlug);
    await page.click('[data-testid="submit-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

---

## Database Testing

### RLS Policy Testing

```typescript
// tests/database/rls.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Row Level Security Policies', () => {
  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let tenantA: { id: string; userId: string };
  let tenantB: { id: string; userId: string };

  beforeAll(async () => {
    // Setup: Create two tenants with users
    // ... setup code
  });

  it('should prevent user from accessing other tenant data', async () => {
    // Create client authenticated as Tenant A user
    const tenantAClient = await createAuthenticatedClient(tenantA.userId);

    // Try to access Tenant B data
    const { data, error } = await tenantAClient
      .from('tenant_data')
      .select('*')
      .eq('tenant_id', tenantB.id);

    // Should return empty result (not error) due to RLS
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('should allow super admin to access all tenant data', async () => {
    const superAdminClient = await createAuthenticatedClient(superAdminUserId);

    const { data: tenantAData } = await superAdminClient
      .from('tenant_data')
      .select('*')
      .eq('tenant_id', tenantA.id);

    const { data: tenantBData } = await superAdminClient
      .from('tenant_data')
      .select('*')
      .eq('tenant_id', tenantB.id);

    expect(tenantAData.length).toBeGreaterThan(0);
    expect(tenantBData.length).toBeGreaterThan(0);
  });
});
```

### Migration Testing

```typescript
// tests/database/migrations.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Database Migrations', () => {
  it('should apply migrations without errors', () => {
    expect(() => {
      execSync('supabase db push --dry-run', { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should be idempotent', () => {
    // Run migrations twice
    execSync('supabase db push', { stdio: 'pipe' });
    expect(() => {
      execSync('supabase db push', { stdio: 'pipe' });
    }).not.toThrow();
  });
});
```

---

## API Testing

### API Test Utilities

```typescript
// tests/utils/api.ts
import { createClient } from '@supabase/supabase-js';

export async function createTestUser(role: string = 'member') {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = `test-${Date.now()}@example.com`;
  const password = 'testpassword123';

  const { data: authData } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  return { email, password, userId: authData.user!.id };
}

export async function getAuthToken(email: string, password: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return data.session!.access_token;
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${process.env.TEST_API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  return {
    status: res.status,
    data: await res.json().catch(() => null),
    headers: res.headers,
  };
}
```

### API Contract Tests

```typescript
// tests/api/contracts/email.test.ts
import { describe, it, expect } from 'vitest';
import { apiRequest, getAuthToken } from '../utils/api';

describe('Email API Contract', () => {
  let token: string;

  beforeAll(async () => {
    token = await getAuthToken(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );
  });

  describe('POST /api/email/send', () => {
    it('should accept valid email request', async () => {
      const { status, data } = await apiRequest('/api/email/send', {
        method: 'POST',
        token,
        body: JSON.stringify({
          to: 'recipient@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
        }),
      });

      expect(status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status');
    });

    it('should reject invalid email address', async () => {
      const { status, data } = await apiRequest('/api/email/send', {
        method: 'POST',
        token,
        body: JSON.stringify({
          to: 'invalid-email',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('should require authentication', async () => {
      const { status } = await apiRequest('/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      });

      expect(status).toBe(401);
    });
  });
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://openpeople.ai';

export default function () {
  // Test homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test API endpoint
  const apiRes = http.get(`${BASE_URL}/api/health`);
  check(apiRes, {
    'api status is 200': (r) => r.status === 200,
    'api response is valid': (r) => JSON.parse(r.body).status === 'ok',
  });

  sleep(1);
}
```

### Performance Benchmarks

```typescript
// tests/performance/benchmarks.test.ts
import { describe, it, expect } from 'vitest';

describe('Performance Benchmarks', () => {
  it('should resolve tenant in under 50ms', async () => {
    const start = performance.now();
    
    await resolveTenantByHost('acme.openpeople.ai');
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      fetch(`${process.env.TEST_API_URL}/api/health`)
    );

    const results = await Promise.all(requests);
    const successful = results.filter(r => r.status === 200);

    expect(successful.length).toBe(100);
  });
});
```

---

## Security Testing

### Security Test Suite

```typescript
// tests/security/auth.test.ts
import { describe, it, expect } from 'vitest';
import { apiRequest } from '../utils/api';

describe('Authentication Security', () => {
  it('should rate limit login attempts', async () => {
    const attempts = Array(10).fill(null).map(() =>
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      })
    );

    const results = await Promise.all(attempts);
    const rateLimited = results.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should not leak user existence on login failure', async () => {
    const existingUser = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'wrongpassword',
      }),
    });

    const nonExistingUser = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexisting@example.com',
        password: 'wrongpassword',
      }),
    });

    // Error messages should be identical
    expect(existingUser.data.error).toBe(nonExistingUser.data.error);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = 'eyJ...expired...token';

    const { status } = await apiRequest('/api/protected', {
      token: expiredToken,
    });

    expect(status).toBe(401);
  });
});
```

### SQL Injection Testing

```typescript
// tests/security/injection.test.ts
describe('SQL Injection Prevention', () => {
  const maliciousInputs = [
    "'; DROP TABLE tenants; --",
    "1 OR 1=1",
    "1; SELECT * FROM profiles",
    "' UNION SELECT * FROM auth.users --",
  ];

  it.each(maliciousInputs)('should safely handle: %s', async (input) => {
    const { status } = await apiRequest(`/api/tenants?search=${encodeURIComponent(input)}`);
    
    // Should not cause server error
    expect(status).not.toBe(500);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:security": "vitest run tests/security"
  }
}
```

---

## Related Documentation

- [Development Setup](./setup.md)
- [Contributing Guidelines](./contributing.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
