# Privacy & Data Protection

This document details the privacy practices, data handling procedures, and user rights implementation for the OpenPeople.ai platform.

## Table of Contents

- [Privacy Principles](#privacy-principles)
- [Data Collection](#data-collection)
- [Data Processing](#data-processing)
- [Data Subject Rights](#data-subject-rights)
- [Consent Management](#consent-management)
- [Data Retention](#data-retention)
- [International Data Transfers](#international-data-transfers)
- [Privacy by Design](#privacy-by-design)

---

## Privacy Principles

### Core Principles

1. **Transparency**: Clear communication about data practices
2. **Purpose Limitation**: Data used only for stated purposes
3. **Data Minimization**: Collect only what's necessary
4. **Accuracy**: Keep data accurate and up-to-date
5. **Storage Limitation**: Retain data only as long as needed
6. **Integrity & Confidentiality**: Protect data appropriately
7. **Accountability**: Demonstrate compliance

### Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIVACY ARCHITECTURE                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  COLLECTION LAYER                                                    │    │
│  │  • Consent capture                                                   │    │
│  │  • Purpose declaration                                               │    │
│  │  • Data minimization                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PROCESSING LAYER                                                    │    │
│  │  • Lawful basis verification                                        │    │
│  │  • Purpose limitation enforcement                                   │    │
│  │  • Access controls (RLS)                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PROTECTION LAYER                                                    │    │
│  │  • Encryption at rest                                               │    │
│  │  • Encryption in transit                                            │    │
│  │  • Tenant isolation                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  RIGHTS LAYER                                                        │    │
│  │  • Access requests                                                  │    │
│  │  • Deletion requests                                                │    │
│  │  • Data portability                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Collection

### Personal Data Categories

| Category | Examples | Lawful Basis |
|----------|----------|--------------|
| **Identity Data** | Name, email, profile photo | Contract performance |
| **Account Data** | Username, password hash, role | Contract performance |
| **Usage Data** | Features used, timestamps | Legitimate interest |
| **Technical Data** | IP address, browser, device | Legitimate interest |
| **Communication Data** | Support messages | Contract performance |
| **Transaction Data** | Billing info, invoices | Contract performance |

### Data Collected Per Role

```typescript
// Minimum data by user type
const dataCollectionMap = {
  platformUser: {
    required: ['email', 'password_hash'],
    optional: ['name', 'avatar_url'],
    automatic: ['created_at', 'last_login'],
  },
  tenantOwner: {
    required: ['email', 'password_hash', 'tenant_id'],
    optional: ['name', 'avatar_url', 'phone'],
    automatic: ['created_at', 'last_login', 'role'],
    billing: ['billing_email', 'company_name'],
  },
  tenantMember: {
    required: ['email', 'password_hash', 'tenant_id'],
    optional: ['name', 'avatar_url'],
    automatic: ['created_at', 'last_login', 'role'],
  },
};
```

### Collection Methods

| Method | Data Types | Notice Provided |
|--------|------------|-----------------|
| Registration forms | Identity, account | Privacy policy link |
| Service usage | Usage, technical | Cookie notice |
| Support channels | Communication | Support terms |
| Payment forms | Transaction | Payment terms |

---

## Data Processing

### Processing Activities

| Activity | Purpose | Legal Basis | Retention |
|----------|---------|-------------|-----------|
| Account creation | Service provision | Contract | Account lifetime |
| Authentication | Security | Contract | Session duration |
| Usage analytics | Service improvement | Legitimate interest | 2 years |
| Email notifications | Service communication | Contract | Until unsubscribe |
| Marketing emails | Marketing | Consent | Until withdrawal |
| Support | Customer service | Contract | 2 years |
| Billing | Payment processing | Contract | 7 years (legal) |

### Processing Records

```typescript
// Record of Processing Activities (ROPA)
interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  internationalTransfers: boolean;
  retentionPeriod: string;
  securityMeasures: string[];
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 
              'vital_interests' | 'public_task' | 'legitimate_interest';
  legitimateInterestAssessment?: string;
}

const processingActivities: ProcessingActivity[] = [
  {
    id: 'pa-001',
    name: 'User Authentication',
    purpose: 'Verify user identity for service access',
    dataCategories: ['identity', 'account'],
    dataSubjects: ['platform users', 'tenant members'],
    recipients: ['internal systems'],
    internationalTransfers: false,
    retentionPeriod: 'Account lifetime',
    securityMeasures: ['encryption', 'access controls', 'audit logging'],
    legalBasis: 'contract',
  },
  // ... more activities
];
```

### Data Minimization Implementation

```sql
-- Only select necessary columns
SELECT 
  id,
  email,
  name,
  role
FROM profiles
WHERE tenant_id = current_user_tenant_id();

-- Don't select: password_hash, internal_notes, etc.
```

---

## Data Subject Rights

### Rights Overview

| Right | Description | Response Time |
|-------|-------------|---------------|
| **Access** | View collected data | 30 days |
| **Rectification** | Correct inaccurate data | 30 days |
| **Erasure** | Delete personal data | 30 days |
| **Restriction** | Limit processing | 30 days |
| **Portability** | Export data | 30 days |
| **Objection** | Object to processing | 30 days |

### Implementation

```typescript
// Data Subject Rights API
// /api/privacy/rights

export async function POST(request: Request) {
  const { rightType, userId } = await request.json();
  
  // Verify identity (important!)
  const verified = await verifyDataSubject(userId, request);
  if (!verified) {
    return Response.json({ error: 'Identity verification required' }, { status: 401 });
  }
  
  switch (rightType) {
    case 'access':
      return handleAccessRequest(userId);
    case 'erasure':
      return handleErasureRequest(userId);
    case 'portability':
      return handlePortabilityRequest(userId);
    default:
      return Response.json({ error: 'Unknown right type' }, { status: 400 });
  }
}

async function handleAccessRequest(userId: string) {
  const userData = await collectUserData(userId);
  
  // Log the request
  await logDSR(userId, 'access', 'completed');
  
  return Response.json({
    requestId: generateRequestId(),
    data: userData,
    exportedAt: new Date().toISOString(),
  });
}

async function handleErasureRequest(userId: string) {
  // Check for exceptions (legal obligations, etc.)
  const exceptions = await checkErasureExceptions(userId);
  if (exceptions.length > 0) {
    return Response.json({
      status: 'partial',
      exceptions,
      message: 'Some data retained due to legal obligations',
    });
  }
  
  // Perform deletion
  await deleteUserData(userId);
  
  // Log the request
  await logDSR(userId, 'erasure', 'completed');
  
  return Response.json({
    status: 'completed',
    deletedAt: new Date().toISOString(),
  });
}
```

### Data Export Format

```typescript
// Portable data export structure
interface UserDataExport {
  exportedAt: string;
  format: 'json';
  version: '1.0';
  
  profile: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    // ... other profile fields
  };
  
  activity: {
    logins: Array<{ timestamp: string; ip: string }>;
    actions: Array<{ type: string; timestamp: string }>;
  };
  
  content: {
    // User-generated content
  };
  
  preferences: {
    notifications: Record<string, boolean>;
    privacy: Record<string, boolean>;
  };
}
```

---

## Consent Management

### Consent Types

| Consent Type | Required For | Withdrawal |
|--------------|--------------|------------|
| Terms of Service | Account creation | Account deletion |
| Privacy Policy | Data processing | Account deletion |
| Marketing | Marketing emails | Settings toggle |
| Analytics | Usage tracking | Settings toggle |
| Cookies | Non-essential cookies | Banner/settings |

### Consent Storage

```sql
-- Consent records table
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  version TEXT NOT NULL,  -- Policy version consented to
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track consent changes
CREATE TABLE consent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'granted' or 'withdrawn'
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  metadata JSONB
);
```

### Consent UI Components

```typescript
// Consent banner component
interface ConsentBannerProps {
  onAcceptAll: () => void;
  onAcceptEssential: () => void;
  onCustomize: () => void;
}

// Consent preferences
interface ConsentPreferences {
  essential: true;  // Always required
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

// Check consent before processing
async function checkConsent(userId: string, type: string): Promise<boolean> {
  const consent = await supabase
    .from('user_consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('consent_type', type)
    .is('withdrawn_at', null)
    .single();
  
  return consent.data?.granted ?? false;
}
```

---

## Data Retention

### Retention Schedule

| Data Type | Retention Period | Basis |
|-----------|------------------|-------|
| Active account data | Account lifetime | Contract |
| Deleted account data | 30 days | Grace period |
| Usage logs | 2 years | Legitimate interest |
| Security logs | 2 years | Legal compliance |
| Billing records | 7 years | Legal requirement |
| Support tickets | 2 years | Service improvement |
| Marketing data | Until withdrawal | Consent |

### Automated Retention Enforcement

```sql
-- Retention policy enforcement function
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void AS $$
BEGIN
  -- Delete soft-deleted accounts after grace period
  DELETE FROM profiles
  WHERE deleted_at IS NOT NULL
  AND deleted_at < now() - interval '30 days';
  
  -- Anonymize old usage data
  UPDATE usage_logs
  SET 
    ip_address = 'anonymized',
    user_agent = 'anonymized',
    user_id = NULL
  WHERE created_at < now() - interval '2 years';
  
  -- Delete old support tickets (keep summary)
  DELETE FROM support_ticket_messages
  WHERE ticket_id IN (
    SELECT id FROM support_tickets
    WHERE closed_at < now() - interval '2 years'
  );
  
  -- Log retention enforcement
  INSERT INTO system_logs (event, details)
  VALUES ('retention_enforcement', jsonb_build_object(
    'timestamp', now(),
    'status', 'completed'
  ));
END;
$$ LANGUAGE plpgsql;

-- Schedule daily execution
SELECT cron.schedule(
  'enforce-retention',
  '0 3 * * *',  -- Daily at 3 AM
  'SELECT enforce_data_retention()'
);
```

### Data Deletion Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA DELETION WORKFLOW                               │
│                                                                              │
│  1. REQUEST                                                                  │
│     └── User initiates deletion or retention period expires                 │
│                                                                              │
│  2. VALIDATION                                                               │
│     └── Check for legal holds, exceptions                                   │
│                                                                              │
│  3. SOFT DELETE                                                              │
│     └── Mark records as deleted, remove from active queries                 │
│                                                                              │
│  4. GRACE PERIOD (30 days)                                                  │
│     └── Data recoverable if deletion was accidental                         │
│                                                                              │
│  5. HARD DELETE                                                              │
│     └── Permanent removal from database                                     │
│                                                                              │
│  6. BACKUP EXPIRATION                                                        │
│     └── Data removed from backups per retention schedule                    │
│                                                                              │
│  7. VERIFICATION                                                             │
│     └── Confirm deletion across all systems                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## International Data Transfers

### Data Location

| Data Type | Primary Location | Replicated To |
|-----------|------------------|---------------|
| Database | US (Supabase) | — |
| File Storage | Auto (Cloudflare) | Multi-region |
| Backups | US | — |
| Logs | US (Vercel) | — |

### Transfer Mechanisms

For EU → US transfers:

1. **Standard Contractual Clauses (SCCs)**
   - Incorporated in vendor agreements
   - Updated to 2021 EU Commission SCCs

2. **Supplementary Measures**
   - Encryption in transit and at rest
   - Access controls and audit logging
   - Data minimization

### Transfer Impact Assessment

```markdown
## Transfer Impact Assessment Template

### Transfer Details
- Data Categories: [List categories]
- Source Country: [Country]
- Destination Country: [Country]
- Transfer Mechanism: [SCC/Adequacy/Other]

### Risk Assessment
- Legal framework in destination: [Assessment]
- Government access risk: [Low/Medium/High]
- Technical measures: [List measures]
- Organizational measures: [List measures]

### Conclusion
[Transfer permitted / Additional measures required / Transfer not permitted]
```

---

## Privacy by Design

### Implementation Checklist

#### Data Minimization
- [ ] Only collect necessary fields
- [ ] Use pseudonymization where possible
- [ ] Implement data retention limits
- [ ] Review data collection periodically

#### Security
- [ ] Encrypt personal data at rest
- [ ] Use TLS for all transmissions
- [ ] Implement access controls
- [ ] Enable audit logging

#### Transparency
- [ ] Clear privacy policy
- [ ] Consent mechanisms
- [ ] Data access self-service
- [ ] Processing notifications

#### User Control
- [ ] Privacy settings dashboard
- [ ] Export functionality
- [ ] Deletion capability
- [ ] Consent management

### Privacy Impact Assessment (PIA)

```markdown
## Privacy Impact Assessment

### Project: [Feature Name]

### 1. Data Description
- What personal data will be collected?
- Who are the data subjects?
- What is the source of the data?

### 2. Purpose
- Why is this data needed?
- What is the lawful basis?
- How does this benefit users?

### 3. Data Flow
- Where will data be stored?
- Who will have access?
- Will data be shared externally?

### 4. Risks
- What are the privacy risks?
- What is the likelihood and severity?
- How will risks be mitigated?

### 5. Measures
- Technical measures:
- Organizational measures:
- User controls:

### 6. Approval
- [ ] Privacy review completed
- [ ] Security review completed
- [ ] Legal review completed (if required)

Date: [Date]
Reviewer: [Name]
```

---

## Privacy Contacts

### Data Protection Responsibilities

| Role | Responsibility | Contact |
|------|----------------|---------|
| Data Protection Officer | Compliance oversight | dpo@openpeople.ai |
| Security Team | Technical measures | security@openpeople.ai |
| Support Team | User requests | privacy@openpeople.ai |

### Reporting Privacy Concerns

Users can report privacy concerns via:
- Email: privacy@openpeople.ai
- In-app: Settings → Privacy → Contact Us
- Web: openpeople.ai/privacy/contact

---

## Related Documentation

- [Security Overview](./overview.md)
- [Compliance](./compliance.md)
- [Data Architecture](../architecture/database.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
