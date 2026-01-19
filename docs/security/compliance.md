# Compliance Documentation

This document outlines the compliance frameworks, certifications, and regulatory requirements that OpenPeople.ai adheres to, along with implementation details for maintaining compliance.

## Table of Contents

- [Compliance Overview](#compliance-overview)
- [Data Protection Regulations](#data-protection-regulations)
- [Security Standards](#security-standards)
- [Industry Compliance](#industry-compliance)
- [Compliance Controls](#compliance-controls)
- [Audit and Reporting](#audit-and-reporting)
- [Vendor Compliance](#vendor-compliance)

---

## Compliance Overview

### Compliance Commitment

OpenPeople.ai is committed to maintaining compliance with applicable laws, regulations, and industry standards. Our multi-tenant architecture is designed with compliance as a foundational requirement.

### Compliance Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLIANCE FRAMEWORK                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  REGULATORY COMPLIANCE                                               │    │
│  │  • GDPR (EU Data Protection)                                        │    │
│  │  • CCPA (California Privacy)                                        │    │
│  │  • SOC 2 Type II (Roadmap)                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SECURITY STANDARDS                                                  │    │
│  │  • OWASP Top 10                                                     │    │
│  │  • CIS Controls                                                     │    │
│  │  • ISO 27001 (Aligned)                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  OPERATIONAL STANDARDS                                               │    │
│  │  • Data Retention Policies                                          │    │
│  │  • Incident Response                                                │    │
│  │  • Business Continuity                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Compliance Status

| Regulation/Standard | Status | Notes |
|---------------------|--------|-------|
| GDPR | Compliant | EU data protection |
| CCPA | Compliant | California privacy |
| SOC 2 Type II | Roadmap | Q3 2026 target |
| ISO 27001 | Aligned | Framework adoption |
| HIPAA | Not applicable | Unless tenant requires |
| PCI DSS | Delegated | Via Stripe |

---

## Data Protection Regulations

### GDPR Compliance

The General Data Protection Regulation applies to all EU residents' data.

#### GDPR Principles Implementation

| Principle | Implementation |
|-----------|----------------|
| **Lawfulness** | Explicit consent, legitimate interest documented |
| **Purpose Limitation** | Data used only for stated purposes |
| **Data Minimization** | Only necessary data collected |
| **Accuracy** | User self-service data correction |
| **Storage Limitation** | Automated retention policies |
| **Integrity & Confidentiality** | Encryption, access controls, RLS |
| **Accountability** | Audit logs, documentation |

#### Data Subject Rights

```typescript
// GDPR rights implementation
interface DataSubjectRights {
  access: () => Promise<UserData>;        // Art. 15 - Right of access
  rectification: (data) => Promise<void>; // Art. 16 - Right to rectification
  erasure: () => Promise<void>;           // Art. 17 - Right to erasure
  portability: () => Promise<ExportData>; // Art. 20 - Right to data portability
  restriction: () => Promise<void>;       // Art. 18 - Right to restriction
  objection: () => Promise<void>;         // Art. 21 - Right to object
}
```

#### Data Subject Request Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA SUBJECT REQUEST (DSR) WORKFLOW                       │
│                                                                              │
│  1. REQUEST RECEIVED                                                         │
│     └── Via email, in-app, or designated channel                            │
│                                                                              │
│  2. IDENTITY VERIFICATION                                                    │
│     └── Confirm requestor is the data subject                               │
│                                                                              │
│  3. REQUEST VALIDATION                                                       │
│     └── Determine applicable rights, check exceptions                       │
│                                                                              │
│  4. EXECUTION                                                                │
│     └── Access, export, delete, or modify data                              │
│                                                                              │
│  5. RESPONSE                                                                 │
│     └── Provide response within 30 days (GDPR)                              │
│                                                                              │
│  6. DOCUMENTATION                                                            │
│     └── Log request and outcome for compliance                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### CCPA Compliance

California Consumer Privacy Act requirements:

| Right | Implementation |
|-------|----------------|
| Right to Know | Data access endpoint |
| Right to Delete | Account deletion flow |
| Right to Opt-Out | Cookie consent, marketing opt-out |
| Right to Non-Discrimination | No service degradation |

### Data Processing Agreements

For enterprise customers requiring DPAs:

```markdown
## Data Processing Agreement (DPA)

OpenPeople.ai acts as a Data Processor for tenant data.
- Tenants remain Data Controllers
- Processing limited to service provision
- Sub-processors listed and disclosed
- Standard Contractual Clauses available
```

---

## Security Standards

### OWASP Top 10 Mitigation

| Vulnerability | Mitigation |
|--------------|------------|
| **A01: Broken Access Control** | RLS, RBAC, authorization checks |
| **A02: Cryptographic Failures** | TLS 1.3, AES-256 at rest |
| **A03: Injection** | Parameterized queries, input validation |
| **A04: Insecure Design** | Threat modeling, security reviews |
| **A05: Security Misconfiguration** | Secure defaults, hardening |
| **A06: Vulnerable Components** | Dependency scanning, updates |
| **A07: Authentication Failures** | Supabase Auth, session management |
| **A08: Data Integrity Failures** | Code signing, integrity checks |
| **A09: Logging Failures** | Comprehensive audit logging |
| **A10: SSRF** | URL validation, network isolation |

### CIS Controls (Prioritized)

| Control | Implementation | Priority |
|---------|----------------|----------|
| Inventory of Assets | Automated asset tracking | High |
| Data Protection | Encryption, classification | High |
| Secure Configuration | Hardened defaults | High |
| Access Control | RBAC, least privilege | High |
| Audit Logging | Comprehensive logging | High |
| Incident Response | IR plan, runbooks | Medium |
| Penetration Testing | Annual testing | Medium |
| Security Training | Team training | Medium |

### SOC 2 Preparation (Roadmap)

Trust Service Criteria for SOC 2 Type II:

| Criteria | Status | Implementation |
|----------|--------|----------------|
| **Security** | In Progress | Access controls, encryption, monitoring |
| **Availability** | In Progress | SLA, redundancy, DR |
| **Confidentiality** | In Progress | Data classification, access controls |
| **Processing Integrity** | Planned | Validation, error handling |
| **Privacy** | In Progress | GDPR/CCPA compliance |

---

## Industry Compliance

### AI Governance Specific

As an AI governance platform, additional considerations:

| Requirement | Implementation |
|-------------|----------------|
| Model Transparency | Audit logs for AI interactions |
| Bias Monitoring | Built-in fairness metrics |
| Human Oversight | HITL workflow support |
| Explainability | Decision logging |

### Financial Services (Optional)

For fintech tenants:

| Requirement | Support |
|-------------|---------|
| PCI DSS | Via Stripe (no card data stored) |
| SOX | Audit trails available |
| FINRA | Configurable retention |

### Healthcare (Optional)

For healthcare tenants requiring HIPAA:

| Requirement | Support |
|-------------|---------|
| PHI Protection | Additional encryption options |
| BAA | Available for enterprise |
| Audit Requirements | Extended logging |

---

## Compliance Controls

### Technical Controls

```typescript
// Compliance control implementation
const complianceControls = {
  // Access Control
  accessControl: {
    implementation: 'RBAC + RLS',
    verification: 'Automated policy testing',
    documentation: 'Role definitions, access matrices',
  },
  
  // Encryption
  encryption: {
    atRest: 'AES-256 (Supabase managed)',
    inTransit: 'TLS 1.3',
    keyManagement: 'Provider managed',
  },
  
  // Audit Logging
  auditLogging: {
    coverage: 'All security-relevant events',
    retention: '1 year (configurable)',
    tamperProof: 'Append-only, checksummed',
  },
  
  // Data Protection
  dataProtection: {
    classification: 'Automated + manual',
    retention: 'Policy-based automation',
    deletion: 'Secure erasure verified',
  },
};
```

### Administrative Controls

| Control | Description | Owner |
|---------|-------------|-------|
| Security Policy | Documented security policies | Security Lead |
| Access Reviews | Quarterly access reviews | IT Admin |
| Training | Annual security training | HR |
| Vendor Management | Third-party assessments | Security Lead |
| Incident Response | IR plan and testing | Security Lead |

### Data Retention Policies

```sql
-- Automated data retention
CREATE OR REPLACE FUNCTION enforce_retention_policy()
RETURNS void AS $$
BEGIN
  -- Delete audit logs older than retention period
  DELETE FROM audit_logs
  WHERE created_at < now() - interval '1 year';
  
  -- Delete soft-deleted records after grace period
  DELETE FROM profiles
  WHERE deleted_at < now() - interval '30 days';
  
  -- Archive old usage data
  INSERT INTO usage_archive
  SELECT * FROM tenant_usage
  WHERE period_start < date_trunc('month', now() - interval '2 years');
  
  DELETE FROM tenant_usage
  WHERE period_start < date_trunc('month', now() - interval '2 years');
END;
$$ LANGUAGE plpgsql;

-- Schedule retention enforcement
-- (Run via Supabase pg_cron or external scheduler)
```

---

## Audit and Reporting

### Audit Trail Requirements

| Event Category | Retention | Details Logged |
|----------------|-----------|----------------|
| Authentication | 1 year | User, IP, success/failure, method |
| Authorization | 1 year | User, resource, action, result |
| Data Access | 1 year | User, table, operation, count |
| Configuration Changes | 2 years | User, setting, old/new values |
| Security Events | 2 years | Full context |

### Compliance Reports

```typescript
// Generate compliance report
async function generateComplianceReport(
  tenantId: string,
  period: { start: Date; end: Date }
) {
  return {
    period,
    tenantId,
    
    // Access control summary
    accessControl: {
      totalUsers: await countUsers(tenantId),
      roleDistribution: await getRoleDistribution(tenantId),
      accessReviews: await getAccessReviewStatus(tenantId),
    },
    
    // Security events
    securityEvents: {
      failedLogins: await countFailedLogins(tenantId, period),
      privilegedActions: await countPrivilegedActions(tenantId, period),
      securityAlerts: await getSecurityAlerts(tenantId, period),
    },
    
    // Data handling
    dataHandling: {
      dataSubjectRequests: await getDSRCount(tenantId, period),
      dataExports: await getDataExports(tenantId, period),
      deletionRequests: await getDeletionRequests(tenantId, period),
    },
    
    // System health
    systemHealth: {
      uptime: await calculateUptime(period),
      incidents: await getIncidents(period),
      vulnerabilities: await getVulnerabilityStatus(),
    },
  };
}
```

### External Audits

| Audit Type | Frequency | Scope |
|------------|-----------|-------|
| Penetration Testing | Annual | Full platform |
| Security Assessment | Annual | Infrastructure + application |
| Compliance Audit | Annual | SOC 2 (roadmap) |
| Code Review | Continuous | All changes |

---

## Vendor Compliance

### Sub-Processor List

| Vendor | Service | Data Processed | Compliance |
|--------|---------|----------------|------------|
| Vercel | Hosting | Application data | SOC 2, GDPR |
| Supabase | Database, Auth | All tenant data | SOC 2, GDPR |
| Cloudflare | Storage (R2) | Files | SOC 2, GDPR |
| Resend | Email | Email addresses, content | SOC 2, GDPR |
| Twilio | SMS | Phone numbers, messages | SOC 2, GDPR |

### Vendor Assessment Criteria

```markdown
## Vendor Security Assessment

### Required
- [ ] SOC 2 Type II report
- [ ] Data Processing Agreement
- [ ] Encryption at rest and in transit
- [ ] Access controls and audit logging
- [ ] Incident response capability

### Preferred
- [ ] ISO 27001 certification
- [ ] Penetration testing reports
- [ ] Business continuity plan
- [ ] Security SLA
```

### Data Flow with Vendors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW MAP                                        │
│                                                                              │
│  User Data                                                                   │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Vercel    │────►│  Supabase   │────►│  Backups    │                   │
│  │  (Transit)  │     │  (Storage)  │     │ (Encrypted) │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                            │                                                 │
│                            ▼                                                 │
│                      ┌─────────────┐                                        │
│                      │     R2      │                                        │
│                      │   (Files)   │                                        │
│                      └─────────────┘                                        │
│                                                                              │
│  Communications                                                              │
│     │                                                                        │
│     ├──────────────►  Resend (Email)                                        │
│     └──────────────►  Twilio (SMS)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Compliance Checklist

### Monthly

- [ ] Review access logs for anomalies
- [ ] Process any data subject requests
- [ ] Update sub-processor agreements if needed
- [ ] Review security alerts and incidents

### Quarterly

- [ ] Access review and cleanup
- [ ] Vulnerability scan and remediation
- [ ] Update compliance documentation
- [ ] Review data retention compliance

### Annually

- [ ] Penetration testing
- [ ] Security training for all team members
- [ ] Full compliance audit
- [ ] Update policies and procedures
- [ ] Vendor re-assessment

---

## Related Documentation

- [Security Overview](./overview.md)
- [Privacy](./privacy.md)
- [Data Architecture](../architecture/database.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
