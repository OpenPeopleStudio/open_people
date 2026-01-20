# KMS-Backed Secrets Strategy

> **Status:** Proposed  
> **Last Updated:** January 2026

## Overview

This document outlines the strategy for transitioning from environment-variable-based encryption to a KMS-backed envelope encryption system. This provides better key management, rotation, auditing, and "break glass" capabilities.

## Current State

The current implementation in `lib/api-keys/encryption.ts` uses:
- AES-256-GCM encryption
- Master key stored in environment variable (`API_KEYS_ENCRYPTION_KEY`)
- Single key for all tenants
- No key rotation mechanism
- No audit trail for key access

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECRETS MANAGEMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        AWS KMS                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │   Master    │  │   Tenant    │  │   Audit     │                   │   │
│  │  │     KEK     │  │   KEK Pool  │  │    Trail    │                   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                │                                             │
│                                ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Secrets Service                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │   Encrypt   │  │   Decrypt   │  │   Rotate    │                   │   │
│  │  │   Service   │  │   Service   │  │   Service   │                   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                │                                             │
│                                ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        PostgreSQL                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │ encrypted_secrets                                            │     │   │
│  │  │ - id, tenant_id, secret_type, key_id                        │     │   │
│  │  │ - encrypted_dek (KMS-encrypted)                             │     │   │
│  │  │ - encrypted_value (DEK-encrypted)                           │     │   │
│  │  │ - key_version, rotated_at                                   │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Envelope Encryption Pattern

### How It Works

1. **Key Encryption Key (KEK)**: Stored in AWS KMS, never leaves KMS
2. **Data Encryption Key (DEK)**: Generated per-tenant or per-secret, encrypted by KEK
3. **Secret Data**: Encrypted by the DEK

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Secret    │     │    DEK      │     │    KEK      │
│   (plain)   │     │  (plain)    │     │  (in KMS)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Encrypt with DEK  │ Encrypt with KEK  │
       ▼                   ▼                   │
┌─────────────┐     ┌─────────────┐            │
│  Encrypted  │     │  Encrypted  │◄───────────┘
│   Secret    │     │    DEK      │
└─────────────┘     └─────────────┘
       │                   │
       └───────┬───────────┘
               │
               ▼
        ┌─────────────┐
        │  Database   │
        │   Storage   │
        └─────────────┘
```

### Benefits

1. **Key Hierarchy**: Compromise of encrypted DEK doesn't expose KEK
2. **Fast Rotation**: Rotate DEKs without re-encrypting all data with KEK
3. **Audit Trail**: KMS provides automatic logging of all key operations
4. **Access Control**: IAM policies control who can use which keys
5. **Per-Tenant Isolation**: Each tenant can have their own DEK

## Implementation Plan

### Phase 1: Foundation

1. Create `lib/secrets/kms.ts` - KMS client wrapper
2. Create `lib/secrets/envelope.ts` - Envelope encryption implementation
3. Add `encrypted_secrets` table migration
4. Implement backward-compatible encryption service

### Phase 2: Migration

1. Add migration script for existing secrets
2. Dual-write during transition (old + new format)
3. Background job to re-encrypt existing secrets
4. Validation and verification

### Phase 3: Rotation & Operations

1. Implement DEK rotation (per-tenant)
2. Implement KEK rotation (platform-wide)
3. Add "break glass" emergency access
4. Audit logging integration

## Database Schema

```sql
-- Encrypted secrets with envelope encryption
CREATE TABLE encrypted_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Secret identity
  secret_type TEXT NOT NULL, -- 'api_key', 'oauth_token', 'credential'
  secret_name TEXT NOT NULL,
  
  -- Envelope encryption
  kms_key_id TEXT NOT NULL,      -- AWS KMS key ARN
  encrypted_dek BYTEA NOT NULL,   -- DEK encrypted by KMS
  encrypted_value BYTEA NOT NULL, -- Value encrypted by DEK
  
  -- Encryption metadata
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  iv BYTEA NOT NULL,
  auth_tag BYTEA,
  
  -- Key versioning
  key_version INTEGER NOT NULL DEFAULT 1,
  rotated_at TIMESTAMPTZ,
  
  -- Access control
  access_policy JSONB, -- Who can decrypt
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_accessed_at TIMESTAMPTZ,
  last_accessed_by UUID,
  access_count INTEGER DEFAULT 0,
  
  UNIQUE(tenant_id, secret_type, secret_name)
);

-- Secret access audit log
CREATE TABLE secret_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id UUID NOT NULL REFERENCES encrypted_secrets(id),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Access details
  accessor_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'decrypt', 'rotate', 'delete', 'reveal'
  access_granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_secret_access_log_secret ON secret_access_log(secret_id, created_at DESC);
CREATE INDEX idx_secret_access_log_tenant ON secret_access_log(tenant_id, created_at DESC);
```

## Key Rotation Strategy

### DEK Rotation (Per-Tenant)

```
1. Generate new DEK
2. Encrypt new DEK with same KEK
3. Re-encrypt secret values with new DEK
4. Update encrypted_dek and key_version
5. Old DEK kept for audit trail
```

### KEK Rotation (Platform-Wide)

```
1. Create new KMS key
2. For each tenant:
   a. Decrypt DEK with old KEK
   b. Encrypt DEK with new KEK
   c. Update kms_key_id and encrypted_dek
3. Schedule old KEK for deletion (with grace period)
```

## Break Glass Procedure

For emergency access when normal channels are unavailable:

1. **Authorized Personnel Only**: Requires two-person authorization
2. **Hardware Token**: Physical security key required
3. **Time-Limited**: Access expires after 4 hours
4. **Full Audit**: Every operation logged with justification
5. **Immediate Alert**: Security team notified

```sql
-- Break glass access record
CREATE TABLE break_glass_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authorization
  requestor_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  justification TEXT NOT NULL,
  
  -- Scope
  tenant_id UUID,
  secret_types TEXT[],
  
  -- Time bounds
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  
  -- Audit
  operations_performed JSONB DEFAULT '[]'
);
```

## RBAC Integration

Tie secret access to the existing RBAC system:

| Role | Can Encrypt | Can Decrypt | Can Rotate | Can Delete | Can Reveal |
|------|-------------|-------------|------------|------------|------------|
| super_admin | Yes | Yes | Yes | Yes | Yes |
| owner | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Limited* | No | No | Limited* |
| member | No | No | No | No | No |

*Limited = Only secrets they created or are explicitly granted access to

## AWS KMS Configuration

### Recommended Key Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAdminAccess",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT:role/KMSAdminRole"},
      "Action": ["kms:*"],
      "Resource": "*"
    },
    {
      "Sid": "AllowServiceAccess",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT:role/OpenPeopleServiceRole"},
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:EncryptionContext:service": "openpeople"
        }
      }
    }
  ]
}
```

### Environment Variables

```env
# AWS KMS Configuration
AWS_REGION=us-east-1
AWS_KMS_KEY_ARN=arn:aws:kms:us-east-1:123456789:key/xxx

# For local development (uses fallback encryption)
KMS_LOCAL_FALLBACK=true
KMS_LOCAL_KEY=<base64-encoded-32-byte-key>
```

## Migration Path

### From Current Implementation

1. **Read**: Check if secret uses new format (has `encrypted_dek`), else use legacy
2. **Write**: Always write new format
3. **Background**: Migrate existing secrets to new format
4. **Cleanup**: Remove legacy format support after migration complete

### Backward Compatibility

The new `lib/secrets/kms.ts` will detect and handle both formats:

```typescript
async function decryptSecret(secret: EncryptedSecret): Promise<string> {
  if (secret.encrypted_dek) {
    // New envelope encryption format
    return decryptWithEnvelope(secret);
  } else {
    // Legacy format - use existing implementation
    return legacyDecrypt(secret);
  }
}
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Migration completion | 100% of secrets |
| Key rotation frequency | DEKs monthly, KEK annually |
| Audit coverage | 100% of access operations |
| Break glass usage | < 1 per quarter |
| Decryption latency p99 | < 100ms |

## Security Considerations

1. **DEK Caching**: Cache decrypted DEKs in memory (short TTL) to reduce KMS calls
2. **Request Signing**: All KMS requests signed with request context
3. **Network Security**: KMS accessed via VPC endpoint
4. **Key Deletion**: 7-30 day waiting period before permanent deletion
5. **Cross-Region**: Consider multi-region keys for disaster recovery

## Related Documentation

- [API Keys Encryption](../../../lib/api-keys/encryption.ts)
- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [Envelope Encryption](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping)
