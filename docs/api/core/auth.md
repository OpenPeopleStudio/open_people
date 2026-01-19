# Authentication API

The Authentication API provides endpoints for user login, token management, and session handling.

## 🔑 Authentication Flow

OpenPeople.ai supports multiple authentication methods for different use cases:

1. **User Authentication** - Traditional email/password login
2. **Service Tokens** - Server-to-server authentication
3. **SSO Integration** - Third-party identity providers
4. **API Keys** - Long-lived access tokens

## 📋 Endpoints

### User Login

Authenticate a user with email and password.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "tenant_id": "optional-tenant-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "tenant_id": "tenant-123"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "refresh-token-here",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

**Example:**
```bash
curl -X POST https://api.openpeople.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Refresh Token

Refresh an expired access token using a refresh token.

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "expires_in": 3600
  }
}
```

### Logout

Invalidate the current session.

```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Service Token Generation

Generate a service token for server-to-server communication.

```http
POST /api/auth/service-token
```

**Headers:**
```
X-API-Key: your_master_api_key
```

**Request Body:**
```json
{
  "tenant_id": "tenant-123",
  "scopes": ["read", "write"],
  "expires_in": 86400,
  "description": "API integration for app"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "service-token-here",
    "expires_at": "2026-01-19T10:30:00Z",
    "scopes": ["read", "write"],
    "tenant_id": "tenant-123"
  }
}
```

### Validate Token

Check if a token is valid and get associated user information.

```http
GET /api/auth/validate
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "tenant_id": "tenant-123"
    },
    "scopes": ["read", "write"],
    "expires_at": "2026-01-19T10:30:00Z"
  }
}
```

## 🔐 Security Considerations

### Token Storage
- Store tokens securely (HttpOnly cookies for web apps)
- Never expose tokens in client-side logs
- Rotate tokens regularly for long-lived sessions

### Rate Limiting
Authentication endpoints are rate limited:
- Login: 5 attempts per minute per IP
- Token refresh: 10 requests per minute per user
- Service token generation: 100 requests per hour per API key

### Session Management
- Access tokens expire in 1 hour
- Refresh tokens expire in 30 days
- Automatic token refresh is handled by SDKs

## 🛠️ SDK Usage

### JavaScript/TypeScript
```typescript
import { OpenPeopleAuth } from '@openpeople/sdk';

const auth = new OpenPeopleAuth();

// Login
const { user, tokens } = await auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Automatic token refresh
auth.onTokenRefresh((newTokens) => {
  // Save new tokens
  localStorage.setItem('tokens', JSON.stringify(newTokens));
});

// Logout
await auth.logout();
```

### Python
```python
from openpeople.auth import OpenPeopleAuth

auth = OpenPeopleAuth()

# Login
user, tokens = auth.login('user@example.com', 'password')

# Check if token is valid
is_valid = auth.validate_token(tokens['access_token'])

# Logout
auth.logout()
```

## 🔄 Real-time Authentication Events

Subscribe to authentication-related events:

```javascript
import { OpenPeopleRealtime } from '@openpeople/sdk';

const realtime = new OpenPeopleRealtime({ apiKey: 'your_key' });

// Listen for login events
realtime.subscribe('auth.login', (event) => {
  console.log('User logged in:', event.user_id);
});

// Listen for logout events
realtime.subscribe('auth.logout', (event) => {
  console.log('User logged out:', event.user_id);
});
```

## 🚨 Error Responses

### Common Authentication Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `ACCOUNT_LOCKED` | 423 | Account is temporarily locked due to failed attempts |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_TOKEN` | 401 | Token is malformed or invalid |
| `INSUFFICIENT_SCOPES` | 403 | Token lacks required permissions |

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "remaining_attempts": 3
    }
  }
}
```

## 📞 Troubleshooting

### Common Issues

1. **"Invalid token" errors**
   - Check token expiration
   - Verify token format
   - Ensure correct tenant context

2. **Rate limiting**
   - Implement exponential backoff
   - Use service tokens for high-volume requests

3. **CORS issues**
   - Ensure correct Origin headers
   - Check preflight request handling

---

**API Version**: v1.0.0
**Last Updated**: January 18, 2026