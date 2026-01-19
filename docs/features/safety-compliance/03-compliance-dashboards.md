# Compliance Dashboards

> **Priority:** P1 - High  
> **Category:** Safety & Compliance  
> **Status:** Planned

## Overview

Centralized dashboards for tracking compliance with AI regulations (EU AI Act, SOC2, GDPR, HIPAA) with automated evidence collection, gap analysis, and audit-ready reporting.

## Problem Statement

Organizations face increasing AI regulation complexity:
- Multiple overlapping regulations (EU AI Act, GDPR, sector-specific)
- Manual compliance tracking is error-prone and expensive
- Auditors require evidence that's scattered across systems
- Compliance gaps discovered too late in audit processes
- No unified view of AI governance posture

## User Stories

### As a Compliance Officer
- I want a single view of our AI compliance status
- I want automated evidence collection for audits
- I want alerts when we fall out of compliance

### As a CISO
- I want to demonstrate due diligence in AI governance
- I want to track compliance across all AI applications
- I want executive-ready compliance reports

### As an Auditor
- I want organized evidence packages
- I want clear audit trails for AI decisions
- I want to verify controls are operating effectively

### As a Legal Counsel
- I want to track regulatory changes impacting our AI
- I want documentation for regulatory submissions
- I want risk assessment records

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Compliance Dashboard                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Framework Library                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ EU AI   │  │  GDPR   │  │  SOC2   │              │   │
│  │  │   Act   │  │         │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  HIPAA  │  │ ISO27001│  │ Custom  │              │   │
│  │  │         │  │         │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Evidence   │  │    Gap      │  │   Report    │         │
│  │ Collection  │  │  Analysis   │  │  Generator  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Supported Frameworks

| Framework | Focus | Key Requirements |
|-----------|-------|------------------|
| EU AI Act | AI-specific | Risk classification, transparency, human oversight |
| GDPR | Data privacy | Consent, data subject rights, DPIAs |
| SOC2 | Security controls | Trust service criteria |
| HIPAA | Healthcare | PHI protection, access controls |
| ISO 27001 | Information security | ISMS requirements |
| NIST AI RMF | AI risk management | Risk management framework |

### Components

1. **Framework Library** - Pre-built compliance frameworks with requirements
2. **Control Mapping** - Map platform features to compliance controls
3. **Evidence Collector** - Automated evidence gathering
4. **Gap Analyzer** - Identify compliance gaps
5. **Report Generator** - Create audit-ready reports
6. **Alert System** - Notify on compliance drift

## Database Schema

```sql
-- Compliance Dashboards Schema

-- Compliance frameworks
CREATE TABLE compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Framework info
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    version VARCHAR(50),
    description TEXT,
    
    -- Categorization
    framework_type VARCHAR(50) NOT NULL, -- 'regulation', 'standard', 'guideline'
    jurisdiction VARCHAR(100), -- 'EU', 'US', 'Global'
    industry VARCHAR(100), -- 'Healthcare', 'Finance', 'General'
    
    -- Structure
    requirements_count INTEGER DEFAULT 0,
    
    -- Metadata
    effective_date DATE,
    documentation_url VARCHAR(500),
    
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Framework requirements (controls)
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    
    -- Requirement identification
    requirement_id VARCHAR(100) NOT NULL, -- e.g., 'Article 13', 'CC6.1'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES compliance_requirements(id),
    section VARCHAR(255),
    
    -- Classification
    category VARCHAR(100), -- 'transparency', 'security', 'governance'
    criticality VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Applicability
    ai_risk_levels JSONB, -- ['high', 'limited'] for EU AI Act
    
    -- Guidance
    implementation_guidance TEXT,
    evidence_requirements TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant's adopted frameworks
CREATE TABLE tenant_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    framework_id UUID NOT NULL REFERENCES compliance_frameworks(id),
    
    -- Adoption
    adopted_at TIMESTAMPTZ DEFAULT NOW(),
    target_compliance_date DATE,
    
    -- Scope
    scope_description TEXT,
    in_scope_applications JSONB, -- NULL = all, or specific app IDs
    
    -- Status
    overall_status VARCHAR(20) DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'compliant', 'non_compliant'
    compliance_score DECIMAL(5,2), -- Percentage
    
    -- Review
    last_assessment_date TIMESTAMPTZ,
    next_assessment_date TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, framework_id)
);

-- Control assessments
CREATE TABLE compliance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_framework_id UUID NOT NULL REFERENCES tenant_frameworks(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES compliance_requirements(id),
    
    -- Assessment
    status VARCHAR(20) NOT NULL, -- 'not_assessed', 'compliant', 'partial', 'non_compliant', 'not_applicable'
    
    -- Implementation
    implementation_status VARCHAR(50), -- 'not_started', 'in_progress', 'implemented', 'verified'
    implementation_notes TEXT,
    
    -- Evidence
    has_evidence BOOLEAN DEFAULT false,
    evidence_sufficient BOOLEAN,
    
    -- Gaps
    gap_description TEXT,
    remediation_plan TEXT,
    remediation_due_date DATE,
    
    -- Assignment
    owner_id UUID REFERENCES users(id),
    
    -- Timestamps
    assessed_at TIMESTAMPTZ,
    assessed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence items
CREATE TABLE compliance_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
    
    -- Evidence info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) NOT NULL, -- 'document', 'screenshot', 'log', 'config', 'automated'
    
    -- Storage
    file_url VARCHAR(500),
    file_type VARCHAR(100),
    file_size INTEGER,
    
    -- For automated evidence
    source_system VARCHAR(100), -- 'audit_logs', 'pii_detection', etc.
    source_query TEXT,
    automated_at TIMESTAMPTZ,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Review
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance issues/findings
CREATE TABLE compliance_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_framework_id UUID NOT NULL REFERENCES tenant_frameworks(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES compliance_assessments(id),
    
    -- Finding details
    finding_type VARCHAR(50) NOT NULL, -- 'gap', 'deficiency', 'observation', 'improvement'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact TEXT,
    
    -- Remediation
    remediation_status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'remediated', 'accepted'
    remediation_plan TEXT,
    remediation_due_date DATE,
    remediation_owner_id UUID REFERENCES users(id),
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit events
CREATE TABLE compliance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Audit info
    audit_type VARCHAR(50) NOT NULL, -- 'internal', 'external', 'certification', 'regulatory'
    audit_name VARCHAR(255) NOT NULL,
    
    -- Scope
    frameworks JSONB NOT NULL, -- Framework IDs included
    
    -- Timeline
    audit_start_date DATE,
    audit_end_date DATE,
    
    -- Auditor
    auditor_name VARCHAR(255),
    auditor_organization VARCHAR(255),
    
    -- Outcome
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
    outcome VARCHAR(50), -- 'passed', 'passed_with_findings', 'failed'
    findings_count INTEGER,
    
    -- Report
    report_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance score history (for trending)
CREATE TABLE compliance_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_framework_id UUID NOT NULL REFERENCES tenant_frameworks(id) ON DELETE CASCADE,
    
    recorded_at TIMESTAMPTZ NOT NULL,
    compliance_score DECIMAL(5,2) NOT NULL,
    
    -- Breakdown
    compliant_count INTEGER,
    partial_count INTEGER,
    non_compliant_count INTEGER,
    not_assessed_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_compliance_requirements_framework ON compliance_requirements(framework_id);
CREATE INDEX idx_tenant_frameworks_tenant ON tenant_frameworks(tenant_id);
CREATE INDEX idx_compliance_assessments_tenant_framework ON compliance_assessments(tenant_framework_id);
CREATE INDEX idx_compliance_assessments_status ON compliance_assessments(status);
CREATE INDEX idx_compliance_evidence_assessment ON compliance_evidence(assessment_id);
CREATE INDEX idx_compliance_findings_tenant ON compliance_findings(tenant_framework_id);
CREATE INDEX idx_compliance_findings_status ON compliance_findings(remediation_status) WHERE remediation_status != 'remediated';
CREATE INDEX idx_compliance_audits_tenant ON compliance_audits(tenant_id);
CREATE INDEX idx_compliance_score_history ON compliance_score_history(tenant_framework_id, recorded_at DESC);
```

## API Endpoints

```
# Frameworks
GET    /api/compliance/frameworks         # List available frameworks
GET    /api/compliance/frameworks/:id     # Get framework details
GET    /api/compliance/frameworks/:id/requirements # Get requirements

# Tenant Frameworks
GET    /api/compliance/adopted            # List adopted frameworks
POST   /api/compliance/adopt              # Adopt framework
PUT    /api/compliance/adopted/:id        # Update adoption settings
DELETE /api/compliance/adopted/:id        # Remove framework

# Assessments
GET    /api/compliance/assessments        # List assessments
PUT    /api/compliance/assessments/:id    # Update assessment
POST   /api/compliance/assessments/bulk   # Bulk update

# Evidence
GET    /api/compliance/evidence           # List evidence
POST   /api/compliance/evidence           # Upload evidence
POST   /api/compliance/evidence/auto      # Trigger auto-collection
DELETE /api/compliance/evidence/:id       # Remove evidence

# Findings
GET    /api/compliance/findings           # List findings
POST   /api/compliance/findings           # Create finding
PUT    /api/compliance/findings/:id       # Update finding

# Audits
GET    /api/compliance/audits             # List audits
POST   /api/compliance/audits             # Schedule audit
PUT    /api/compliance/audits/:id         # Update audit

# Reports
GET    /api/compliance/reports/dashboard  # Dashboard data
GET    /api/compliance/reports/status     # Status report
POST   /api/compliance/reports/export     # Export report
GET    /api/compliance/reports/evidence-package # Generate evidence package
```

## UI Components

### Admin Dashboard Pages

1. **Compliance Overview** (`/admin/compliance`)
   - Overall compliance posture
   - Score by framework
   - Open findings summary
   - Upcoming audit timeline

2. **Framework Detail** (`/admin/compliance/frameworks/:id`)
   - Requirement tree view
   - Assessment status by requirement
   - Gap analysis
   - Score trend

3. **Assessment Workbench** (`/admin/compliance/assess`)
   - Requirement checklist
   - Evidence attachment
   - Notes and status updates
   - Bulk operations

4. **Evidence Library** (`/admin/compliance/evidence`)
   - Evidence catalog
   - Auto-collection status
   - Validity tracking
   - Evidence gaps

5. **Findings Tracker** (`/admin/compliance/findings`)
   - Open findings list
   - Remediation tracking
   - Due date management
   - Finding trends

6. **Audit Management** (`/admin/compliance/audits`)
   - Audit calendar
   - Audit prep checklists
   - Evidence package generation
   - Audit history

7. **Reports** (`/admin/compliance/reports`)
   - Executive summary
   - Detailed compliance report
   - Gap analysis report
   - Trend analysis

## Dependencies

- **Existing:** AI Audit Logs, PII Detection, Content Moderation
- **Related:** All governance features contribute evidence
- **External:** Document storage for evidence

## Security Considerations

- Role-based access to compliance data
- Audit log all compliance changes
- Evidence integrity verification
- Secure evidence storage
- Compliance data encryption

## Success Metrics

| Metric | Target |
|--------|--------|
| Compliance score | > 90% |
| Evidence coverage | > 95% |
| Findings remediation SLA | 90% on-time |
| Audit preparation time | Reduced by 50% |

## Implementation Notes

### Phase 1: Framework Foundation
- Core framework library (EU AI Act, GDPR, SOC2)
- Basic assessment workflow
- Manual evidence upload

### Phase 2: Automation
- Automated evidence collection
- Gap analysis
- Compliance scoring

### Phase 3: Reporting
- Report generation
- Evidence packages
- Trend analysis

### Phase 4: Advanced
- Custom frameworks
- Regulatory change tracking
- Predictive compliance
