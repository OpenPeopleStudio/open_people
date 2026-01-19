# OpenPeople.ai API Documentation

This section provides comprehensive documentation for the OpenPeople.ai REST API, SDKs, and integration endpoints.

## 🎯 API Overview

OpenPeople.ai provides a comprehensive REST API that enables programmatic access to all platform features, including multi-tenant management, AI governance, analytics, and third-party integrations.

### Key Features
- **RESTful Design** - Consistent, resource-based API endpoints
- **Multi-Tenant Support** - Automatic tenant isolation and context
- **Real-time Updates** - WebSocket support for live data
- **Comprehensive SDKs** - Client libraries for major languages
- **Webhook Integration** - Event-driven architecture support

## 🔐 Authentication

All API requests require authentication using Bearer tokens or API keys.

### Authentication Methods

#### 1. Bearer Token (Recommended)
```http
Authorization: Bearer your_jwt_token_here
```

#### 2. API Key
```http
X-API-Key: your_api_key_here
```

### Token Types

- **User Tokens**: For authenticated user operations
- **Service Tokens**: For server-to-server communication
- **Tenant Tokens**: For tenant-specific operations

### Obtaining Tokens

```bash
# User authentication
curl -X POST https://api.openpeople.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Service token generation
curl -X POST https://api.openpeople.ai/auth/service-token \
  -H "X-API-Key: your_master_key" \
  -d '{"tenant_id": "tenant-123", "scopes": ["read", "write"]}'
```

## 🌐 Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.openpeople.ai` |
| Staging | `https://api-staging.openpeople.ai` |
| Development | `http://localhost:3000/api` |

## 📋 API Response Format

All API responses follow a consistent JSON structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-01-18T10:30:00Z",
    "request_id": "req-123456",
    "version": "v1"
  },
  "pagination": { /* pagination info if applicable */ }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": { /* specific error details */ }
  },
  "meta": {
    "timestamp": "2026-01-18T10:30:00Z",
    "request_id": "req-123456"
  }
}
```

## 🔄 Rate Limiting

API requests are rate limited based on your plan tier:

| Plan | Requests/Minute | Requests/Hour |
|------|-----------------|----------------|
| Free | 100 | 1,000 |
| Starter | 1,000 | 10,000 |
| Pro | 10,000 | 100,000 |
| Enterprise | Unlimited | Unlimited |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📚 API Sections

### Core Platform APIs
- **[Authentication](./core/auth.md)** - User and service authentication
- **[Tenants](./core/tenants.md)** - Multi-tenant management
- **[Users](./core/users.md)** - User management and profiles

### Feature APIs
- **[AI Governance](./features/ai-governance.md)** - AI model registry and audit logs
- **[Safety & Compliance](./features/safety.md)** - Content moderation and PII detection
- **[Analytics](./features/analytics.md)** - Usage analytics and reporting
- **[Experiments](./features/experiments.md)** - A/B testing and feature flags

### Integration APIs
- **[Webhooks](./integrations/webhooks.md)** - Event subscriptions and delivery
- **[Storage](./integrations/storage.md)** - File upload and management
- **[Email](./integrations/email.md)** - Email sending and templates
- **[Notifications](./integrations/notifications.md)** - SMS and push notifications

### Administrative APIs
- **[Super Admin](./admin/overview.md)** - Platform administration
- **[Billing](./admin/billing.md)** - Subscription and payment management
- **[Analytics](./admin/analytics.md)** - Platform-wide analytics

## 🔧 SDKs and Libraries

### Official SDKs

#### JavaScript/TypeScript
```bash
npm install @openpeople/sdk
```

```typescript
import { OpenPeople } from '@openpeople/sdk';

const client = new OpenPeople({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.openpeople.ai'
});

// Authenticate user
const user = await client.auth.login('user@example.com', 'password');

// Access tenant data
const tenants = await client.tenants.list();
```

#### Python
```bash
pip install openpeople-sdk
```

```python
from openpeople import OpenPeople

client = OpenPeople(api_key='your_api_key')

# List AI models
models = client.ai_models.list(tenant_id='tenant-123')
```

#### Go
```bash
go get github.com/openpeople/go-sdk
```

```go
import "github.com/openpeople/go-sdk"

client := openpeople.NewClient("your_api_key")

// Get audit logs
logs, err := client.AuditLogs.List(context.Background(), &openpeople.ListOptions{
    TenantID: "tenant-123",
})
```

### Community SDKs
- **PHP**: [openpeople/php-sdk](https://github.com/openpeople/php-sdk)
- **Ruby**: [openpeople/ruby-sdk](https://github.com/openpeople/ruby-sdk)
- **Java**: [openpeople/java-sdk](https://github.com/openpeople/java-sdk)

## 🔄 Real-time Updates

Subscribe to real-time updates using WebSockets:

```javascript
import { OpenPeopleRealtime } from '@openpeople/sdk';

const realtime = new OpenPeopleRealtime({
  apiKey: 'your_api_key',
  tenantId: 'tenant-123'
});

// Subscribe to audit events
realtime.subscribe('audit_logs', (event) => {
  console.log('New audit event:', event);
});

// Subscribe to AI model changes
realtime.subscribe('ai_models', (event) => {
  console.log('Model updated:', event);
});
```

## 📊 API Analytics

Track API usage and performance through the admin dashboard or programmatically:

```typescript
// Get API usage statistics
const usage = await client.analytics.apiUsage({
  tenantId: 'tenant-123',
  period: '30d'
});

console.log(`Requests: ${usage.requests.total}`);
console.log(`Errors: ${usage.requests.errors}`);
```

## 🆘 Error Codes

Common API error codes and their meanings:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

## 📞 Support

Need help with the API?

- **📖 API Documentation**: This comprehensive guide
- **💬 Developer Community**: [GitHub Discussions](../../discussions)
- **🐛 Report Issues**: [GitHub Issues](../../issues) with `api` label
- **📧 Direct Support**: [api-support@openpeople.ai](mailto:api-support@openpeople.ai)

## 🔄 API Versioning

API versioning follows semantic versioning:

- **v1** (Current): Initial stable release
- **Breaking Changes**: New major version
- **Additions**: Minor version bump
- **Bug Fixes**: Patch version bump

Specify version in request headers:
```
Accept-Version: v1
```

---

**API Version**: v1.0.0
**Last Updated**: January 18, 2026