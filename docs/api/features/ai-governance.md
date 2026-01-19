# AI Governance API

The AI Governance API provides endpoints for managing AI models, monitoring usage, and maintaining audit trails for AI alignment and compliance.

## 🎯 Overview

This API enables organizations to:
- Register and manage AI models
- Track AI usage and performance
- Maintain comprehensive audit logs
- Monitor for bias and safety issues
- Ensure compliance with governance policies

## 📋 Core Endpoints

### AI Model Registry

#### List Models
```http
GET /api/ai/models
```

**Query Parameters:**
- `tenant_id` (optional): Filter by tenant
- `status` (optional): Filter by status (`active`, `inactive`, `deprecated`)
- `provider` (optional): Filter by provider (`openai`, `anthropic`, etc.)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "model-123",
      "name": "GPT-4 Turbo",
      "provider": "openai",
      "model_id": "gpt-4-turbo",
      "version": "2024-04-09",
      "status": "active",
      "capabilities": ["text-generation", "function-calling"],
      "safety_score": 8.5,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Register New Model
```http
POST /api/ai/models
```

**Request Body:**
```json
{
  "name": "Custom Model v1",
  "provider": "custom",
  "model_id": "custom-model-1",
  "version": "1.0.0",
  "capabilities": ["text-generation", "classification"],
  "endpoints": {
    "completion": "https://api.example.com/completion",
    "embeddings": "https://api.example.com/embeddings"
  },
  "safety_requirements": {
    "content_moderation": true,
    "pii_detection": true,
    "bias_monitoring": true
  },
  "rate_limits": {
    "requests_per_minute": 100,
    "tokens_per_minute": 10000
  }
}
```

#### Update Model
```http
PUT /api/ai/models/{model_id}
```

#### Deactivate Model
```http
DELETE /api/ai/models/{model_id}
```

### Audit Logs

#### Create Audit Entry
```http
POST /api/ai/audit
```

**Request Body:**
```json
{
  "model_id": "model-123",
  "user_id": "user-456",
  "tenant_id": "tenant-789",
  "action": "completion",
  "input": {
    "prompt": "Generate a summary of...",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 150
    }
  },
  "output": {
    "text": "The summary is...",
    "tokens_used": 45,
    "processing_time_ms": 1200
  },
  "metadata": {
    "request_id": "req-12345",
    "ip_address": "192.168.1.1",
    "user_agent": "OpenPeople-SDK/1.0.0"
  }
}
```

#### Query Audit Logs
```http
GET /api/ai/audit
```

**Query Parameters:**
- `model_id` (optional): Filter by model
- `user_id` (optional): Filter by user
- `tenant_id` (optional): Filter by tenant
- `action` (optional): Filter by action type
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-123",
      "timestamp": "2026-01-18T10:30:00Z",
      "model_id": "model-123",
      "user_id": "user-456",
      "action": "completion",
      "input_tokens": 25,
      "output_tokens": 45,
      "processing_time_ms": 1200,
      "safety_flags": [],
      "cost_cents": 1.25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

### Bias & Safety Monitoring

#### Report Safety Issue
```http
POST /api/ai/safety/reports
```

**Request Body:**
```json
{
  "audit_id": "audit-123",
  "issue_type": "bias_detected",
  "severity": "medium",
  "description": "Model showed bias in gender representation",
  "evidence": {
    "input": "Describe a successful CEO",
    "output": "A successful CEO is typically male...",
    "bias_score": 0.75,
    "categories": ["gender_bias"]
  },
  "actions_taken": ["flagged_for_review"],
  "reported_by": "system"
}
```

#### Get Safety Metrics
```http
GET /api/ai/safety/metrics
```

**Query Parameters:**
- `tenant_id` (optional): Filter by tenant
- `model_id` (optional): Filter by model
- `period` (optional): Time period (`1d`, `7d`, `30d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "total_requests": 15000,
    "safety_incidents": 23,
    "bias_detected": 12,
    "content_violations": 8,
    "pii_exposures": 3,
    "response_rate_ms": 850,
    "error_rate": 0.02,
    "safety_score": 9.2
  }
}
```

### Usage Analytics

#### Get Usage Statistics
```http
GET /api/ai/analytics/usage
```

**Query Parameters:**
- `tenant_id`: Tenant identifier
- `period`: Time period (`1d`, `7d`, `30d`, `90d`)
- `group_by`: Grouping (`model`, `user`, `hour`, `day`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "total_requests": 45230,
    "total_tokens": 1250000,
    "total_cost_cents": 1250.50,
    "models_used": 5,
    "unique_users": 125,
    "avg_response_time_ms": 890,
    "peak_usage_hour": 14,
    "cost_by_model": {
      "gpt-4": 750.25,
      "claude-3": 425.30,
      "custom-model": 74.95
    },
    "usage_trends": [
      {
        "date": "2026-01-01",
        "requests": 1200,
        "tokens": 35000,
        "cost_cents": 42.50
      }
    ]
  }
}
```

## 🔧 SDK Usage Examples

### JavaScript/TypeScript
```typescript
import { OpenPeopleAI } from '@openpeople/sdk';

const ai = new OpenPeopleAI({ apiKey: 'your_key' });

// Register a new model
const model = await ai.models.register({
  name: 'Custom GPT',
  provider: 'custom',
  capabilities: ['text-generation']
});

// Log AI usage
await ai.audit.log({
  model_id: model.id,
  action: 'completion',
  input: { prompt: 'Hello world' },
  output: { text: 'Hello! How can I help?' }
});

// Get safety metrics
const metrics = await ai.safety.getMetrics({
  tenant_id: 'tenant-123',
  period: '7d'
});
```

### Python
```python
from openpeople.ai import OpenPeopleAI

ai = OpenPeopleAI(api_key='your_key')

# Query audit logs with filters
logs = ai.audit.query(
    tenant_id='tenant-123',
    start_date='2026-01-01',
    end_date='2026-01-18',
    action='completion'
)

# Get usage analytics
usage = ai.analytics.usage(
    tenant_id='tenant-123',
    period='30d',
    group_by='model'
)
```

## 🔄 Real-time Monitoring

Subscribe to AI governance events:

```javascript
import { OpenPeopleRealtime } from '@openpeople/sdk';

const realtime = new OpenPeopleRealtime({ apiKey: 'your_key' });

// Monitor model usage
realtime.subscribe('ai.usage', (event) => {
  console.log(`Model ${event.model_id} used by ${event.user_id}`);
});

// Monitor safety incidents
realtime.subscribe('ai.safety.incident', (event) => {
  console.log('Safety incident detected:', event);
});
```

## 📊 Cost Tracking

Track AI usage costs automatically:

```typescript
// Get cost breakdown
const costs = await ai.analytics.costs({
  tenant_id: 'tenant-123',
  period: '30d'
});

console.log(`Total cost: $${costs.total_cents / 100}`);
console.log(`Cost by provider:`, costs.by_provider);
```

## 🚨 Error Handling

Common error responses:

```json
{
  "success": false,
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "AI model not found",
    "details": { "model_id": "invalid-id" }
  }
}
```

| Error Code | Description |
|------------|-------------|
| `MODEL_NOT_FOUND` | Specified model doesn't exist |
| `INVALID_MODEL_CONFIG` | Model configuration is invalid |
| `USAGE_LIMIT_EXCEEDED` | Rate limit or quota exceeded |
| `SAFETY_VIOLATION` | Content safety violation detected |
| `AUDIT_LOG_FAILED` | Failed to create audit entry |

## 📞 Support

For AI Governance API support:
- **Documentation**: This guide and [API Overview](../overview.md)
- **Examples**: [SDK Examples](../sdk/)
- **Issues**: [GitHub Issues](../../../issues) with `ai-governance` label

---

**API Version**: v1.0.0
**Last Updated**: January 18, 2026