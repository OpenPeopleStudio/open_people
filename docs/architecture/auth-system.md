# Centralized Authentication & Authorization

This document describes the centralized auth/authz system that replaces scattered authentication logic across API routes.

## Overview

The authentication system provides:
- **Unified authentication** - Single source for user authentication
- **Role-based access control (RBAC)** - Permission-based authorization
- **Tenant isolation** - Multi-tenant access control
- **Resource ownership** - Object-level permissions
- **Middleware integration** - Easy-to-use decorators for API routes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│   Middleware     │───▶│  Handlers       │
│                 │    │                  │    │                 │
│ • withAuth()    │    │ • Authentication │    │ • Business      │
│ • withRole()    │    │ • Authorization  │    │ • Logic         │
│ • withPermission│    │ • Tenant Check   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Authentication  │    │ Authorization    │    │ Database        │
│ • User lookup   │    │ • RBAC           │    │ • Profiles       │
│ • Profile data  │    │ • Permissions    │    │ • Roles          │
│ • Session mgmt  │    │ • Resource access│    │ • Tenants        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### Authentication (`lib/auth/auth.ts`)

Handles user authentication and session management.

```typescript
// Authenticate user
const auth = await authenticateUser(request);
if (!auth) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Access user data
const { user, tenantId } = auth;
const userId = user.id;
const role = user.profile?.role;
```

### Authorization (`lib/auth/authorization.ts`)

Manages permissions and access control.

```typescript
// Check permissions
if (!hasPermission(user, Permission.VAULT_READ)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

// Check roles
if (!hasRole(user, UserRole.ADMIN)) {
  return NextResponse.json({ error: 'Admin required' }, { status: 403 });
}
```

### Middleware (`lib/auth/middleware.ts`)

Provides easy-to-use decorators for API routes.

```typescript
// Simple authentication
export const GET = withAuthentication(async (auth) => {
  // User is authenticated, access auth.user
  return NextResponse.json({ user: auth.user });
});

// Role-based access
export const POST = withRole(UserRole.ADMIN)(async (auth) => {
  // Only admins can access this
  return NextResponse.json({ success: true });
});

// Permission-based access
export const PUT = withPermission(Permission.VAULT_WRITE)(async (auth) => {
  // Must have vault write permission
  return NextResponse.json({ success: true });
});

// Combined requirements
export const DELETE = withAuthAndAuthZ({
  role: UserRole.OWNER,
  permission: Permission.NOTES_DELETE,
  tenantId: 'tenant-123'
})(async (auth) => {
  // Complex authorization requirements
  return NextResponse.json({ success: true });
});
```

## User Roles & Permissions

### Role Hierarchy

```
SUPER_ADMIN (highest)
├── ADMIN
├── OWNER
├── MEMBER
└── GUEST (lowest)
```

Higher roles inherit permissions from lower roles.

### Available Permissions

#### Vault Permissions
- `VAULT_READ` - View vault contents
- `VAULT_WRITE` - Create/modify vault items
- `VAULT_DELETE` - Delete vault items
- `VAULT_ADMIN` - Administrative vault operations

#### Notes Permissions
- `NOTES_READ` - View notes
- `NOTES_WRITE` - Create/edit notes
- `NOTES_DELETE` - Delete notes

#### Chat Permissions
- `CHAT_READ` - View chat history
- `CHAT_WRITE` - Send messages

#### Admin Permissions
- `ADMIN_READ` - View admin data
- `ADMIN_WRITE` - Modify settings
- `ADMIN_DELETE` - Delete admin data

#### Tenant Permissions
- `TENANT_READ` - View tenant info
- `TENANT_WRITE` - Modify tenant settings
- `TENANT_ADMIN` - Administrative tenant operations

## Usage Examples

### Basic Authentication

```typescript
// app/api/user/profile/route.ts
import { withAuthentication } from '@/lib/auth/middleware';

export const GET = withAuthentication(async (auth) => {
  // User is guaranteed to be authenticated
  const profile = await getUserProfile(auth.user.id);
  return NextResponse.json({ profile });
});
```

### Role-Based Authorization

```typescript
// app/api/admin/users/route.ts
import { withRole, UserRole } from '@/lib/auth/middleware';

export const GET = withRole(UserRole.ADMIN)(async (auth) => {
  // Only admins can list users
  const users = await getAllUsers();
  return NextResponse.json({ users });
});
```

### Resource Ownership

```typescript
// app/api/notes/[noteId]/route.ts
import { withPermission, Permission } from '@/lib/auth/middleware';

export const DELETE = withPermission(
  Permission.NOTES_DELETE,
  // Allow if user owns the note
  (args) => args[0].params.noteId // Extract noteId from params
)(async (auth, request) => {
  const noteId = request.params.noteId;
  const note = await getNote(noteId);

  // Additional ownership check
  if (note.user_id !== auth.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  await deleteNote(noteId);
  return NextResponse.json({ success: true });
});
```

### Multi-Tenant Access

```typescript
// app/api/tenant/settings/route.ts
import { withTenantAccess } from '@/lib/auth/middleware';

export const GET = withTenantAccess('tenant-123')(async (auth) => {
  // User must belong to tenant-123
  const settings = await getTenantSettings('tenant-123');
  return NextResponse.json({ settings });
});
```

## Migration Guide

### Before (Scattered Auth)

```typescript
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  }

  // Business logic...
}
```

### After (Centralized Auth)

```typescript
import { withRole, UserRole } from '@/lib/auth/middleware';

export const GET = withRole(UserRole.ADMIN)(async (auth) => {
  // User is authenticated and has admin role
  // Business logic...
});
```

## Error Handling

The middleware automatically handles common auth errors:

- **401 Unauthorized** - User not authenticated
- **403 Forbidden** - Insufficient permissions/role
- **500 Internal Server Error** - Database/other errors

Custom error handling can be added in route handlers:

```typescript
export const POST = withAuthentication(async (auth) => {
  try {
    // Business logic that might fail
    const result = await riskyOperation();
    return NextResponse.json({ result });
  } catch (error) {
    // Custom error handling
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 422 }
    );
  }
});
```

## Security Considerations

### Authentication
- Uses Supabase's built-in JWT validation
- Automatic token refresh handling
- Secure session management

### Authorization
- Defense in depth with multiple permission checks
- Role hierarchy prevents privilege escalation
- Resource ownership validation

### Multi-Tenant Security
- Tenant isolation enforced at middleware level
- Cross-tenant access requires explicit SUPER_ADMIN role
- Tenant context propagated through request lifecycle

### Audit Logging
- All authentication events logged
- Permission checks recorded
- Failed access attempts tracked
- Integration with observability system

## Testing

### Unit Tests

```typescript
// Test permission checking
describe('Authorization', () => {
  it('should allow admin to delete notes', () => {
    const user = createMockUser({ role: 'admin' });
    expect(hasPermission(user, Permission.NOTES_DELETE)).toBe(true);
  });

  it('should deny guest note deletion', () => {
    const user = createMockUser({ role: 'guest' });
    expect(hasPermission(user, Permission.NOTES_DELETE)).toBe(false);
  });
});
```

### Integration Tests

```typescript
// Test middleware integration
describe('API Routes', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/profile')
      .expect(401);
  });

  it('should allow authenticated users', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

## Performance Considerations

- **Caching**: User profiles cached with React's `cache()`
- **Database Efficiency**: Single query for user + profile data
- **Middleware Overhead**: Minimal performance impact
- **Role Calculation**: Computed once per request

## Related Documentation

- [API Routes](../api/)
- [Database Schema](../database.md)
- [Tenant Architecture](../multi-tenancy.md)
- [Security Overview](../../security/overview.md)