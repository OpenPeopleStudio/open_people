# Feedback & Ratings System

> **Priority:** P2 - Medium  
> **Category:** Collaboration & Governance  
> **Status:** Planned

## Overview

Collect, analyze, and act on user feedback for AI responses, enabling continuous improvement through direct user input and systematic quality tracking.

## Problem Statement

AI improvement requires feedback:
- No systematic way to collect user opinions
- Feedback scattered across channels
- Difficult to correlate feedback with AI changes
- No loop from feedback to improvement
- User frustration when feedback ignored

## User Stories

### As an End User
- I want to rate AI responses easily
- I want to report problems
- I want to see my feedback is valued

### As a Product Manager
- I want to understand user satisfaction
- I want to identify problematic patterns
- I want to prioritize improvements

### As an ML Engineer
- I want labeled data from feedback
- I want to identify failure modes
- I want to measure improvement impact

### As a Quality Analyst
- I want to analyze feedback trends
- I want to categorize issues
- I want to track resolution

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Feedback & Ratings System                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Collection Methods                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Thumbs  │  │  Star   │  │  Free   │              │   │
│  │  │ Up/Down │  │ Rating  │  │  Text   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Multi  │  │ Report  │  │ Follow  │              │   │
│  │  │ Choice  │  │ Issue   │  │   Up    │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Analysis   │  │   Action    │  │  Learning   │         │
│  │   Engine    │  │   Queue     │  │    Loop     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Feedback Types

| Type | Use Case | Data Collected |
|------|----------|----------------|
| Thumbs | Quick satisfaction | Binary rating |
| Stars | Granular rating | 1-5 scale |
| Text | Detailed feedback | Free-form text |
| Multi-choice | Categorized issues | Selected options |
| Report | Serious problems | Issue details |
| Regenerate | Implicit negative | Regeneration request |

## Database Schema

```sql
-- Feedback & Ratings Schema

-- Feedback configurations
CREATE TABLE feedback_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Where to show
    application_ids JSONB, -- NULL = all
    
    -- Feedback types enabled
    feedback_types JSONB NOT NULL, -- ['thumbs', 'text', 'report']
    
    -- When to prompt
    prompt_strategy VARCHAR(50) DEFAULT 'always', -- 'always', 'random', 'on_negative', 'never'
    prompt_rate DECIMAL(3,2) DEFAULT 1.0, -- For random strategy
    
    -- Questions for detailed feedback
    questions JSONB,
    -- [
    --   {id: 'accuracy', question: 'Was the response accurate?', type: 'thumbs'},
    --   {id: 'helpful', question: 'Was this helpful?', type: 'stars'},
    --   {id: 'issue', question: 'What was the issue?', type: 'multi', options: [...]}
    -- ]
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback submissions
CREATE TABLE feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    config_id UUID REFERENCES feedback_configs(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    application_id VARCHAR(255),
    
    -- User (can be anonymous)
    user_id UUID,
    session_id VARCHAR(255),
    
    -- Rating
    rating_type VARCHAR(50) NOT NULL, -- 'thumbs', 'stars', 'text', 'report'
    rating_value INTEGER, -- 0/1 for thumbs, 1-5 for stars
    
    -- Detailed responses
    responses JSONB,
    -- {accuracy: true, helpful: 4, issue: 'incorrect_info'}
    
    -- Free text
    feedback_text TEXT,
    
    -- Context (denormalized for analysis)
    model_used VARCHAR(255),
    prompt_id UUID,
    input_preview TEXT,
    output_preview TEXT,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    
    -- Classification
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    categories JSONB DEFAULT '[]', -- Auto-detected categories
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback categories/tags
CREATE TABLE feedback_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    -- Parent for hierarchy
    parent_id UUID REFERENCES feedback_categories(id),
    
    -- Auto-detection
    keywords JSONB, -- Keywords that trigger this category
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue reports (serious problems)
CREATE TABLE feedback_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES feedback_submissions(id),
    
    -- Issue classification
    issue_type VARCHAR(50) NOT NULL, -- 'harmful', 'incorrect', 'offensive', 'bug', 'other'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Details
    description TEXT NOT NULL,
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'investigating', 'resolved', 'wont_fix'
    assigned_to UUID REFERENCES users(id),
    
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback actions (what was done based on feedback)
CREATE TABLE feedback_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Related feedback
    submission_ids JSONB NOT NULL, -- Can be triggered by multiple
    
    -- Action taken
    action_type VARCHAR(50) NOT NULL, -- 'prompt_update', 'guardrail_added', 'model_change', 'training_data'
    action_description TEXT NOT NULL,
    
    -- Impact
    impact_metrics JSONB,
    -- {satisfaction_before: 3.2, satisfaction_after: 4.1}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Aggregated feedback metrics
CREATE TABLE feedback_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Dimensions
    application_id VARCHAR(255),
    model_name VARCHAR(255),
    prompt_id UUID,
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Volume
    total_responses INTEGER DEFAULT 0,
    feedback_count INTEGER DEFAULT 0,
    feedback_rate DECIMAL(5,4),
    
    -- Ratings
    thumbs_up INTEGER DEFAULT 0,
    thumbs_down INTEGER DEFAULT 0,
    thumbs_ratio DECIMAL(5,4),
    
    avg_star_rating DECIMAL(3,2),
    star_distribution JSONB, -- {1: 5, 2: 10, 3: 20, 4: 40, 5: 25}
    
    -- Sentiment
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    
    -- Issues
    issue_count INTEGER DEFAULT 0,
    
    -- Categories
    category_counts JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NPS/CSAT surveys
CREATE TABLE feedback_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    survey_type VARCHAR(50) NOT NULL, -- 'nps', 'csat', 'custom'
    
    -- Questions
    questions JSONB NOT NULL,
    
    -- Targeting
    target_users JSONB, -- Criteria for who sees survey
    sample_rate DECIMAL(3,2) DEFAULT 0.1,
    
    -- Schedule
    active_from TIMESTAMPTZ,
    active_until TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses
CREATE TABLE feedback_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES feedback_surveys(id),
    
    user_id UUID,
    
    responses JSONB NOT NULL,
    
    -- For NPS
    nps_score INTEGER,
    nps_category VARCHAR(20), -- 'promoter', 'passive', 'detractor'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_configs_tenant ON feedback_configs(tenant_id);
CREATE INDEX idx_feedback_submissions_tenant ON feedback_submissions(tenant_id, created_at DESC);
CREATE INDEX idx_feedback_submissions_audit ON feedback_submissions(audit_log_id);
CREATE INDEX idx_feedback_submissions_rating ON feedback_submissions(rating_type, rating_value);
CREATE INDEX idx_feedback_submissions_unprocessed ON feedback_submissions(processed) WHERE processed = false;
CREATE INDEX idx_feedback_issues_status ON feedback_issues(status) WHERE status NOT IN ('resolved', 'wont_fix');
CREATE INDEX idx_feedback_metrics_tenant ON feedback_metrics(tenant_id, bucket_timestamp DESC);
CREATE INDEX idx_feedback_surveys_tenant ON feedback_surveys(tenant_id);
CREATE INDEX idx_feedback_survey_responses ON feedback_survey_responses(survey_id, created_at DESC);
```

## API Endpoints

```
# Configurations
GET    /api/feedback/configs              # List configs
POST   /api/feedback/configs              # Create config
PUT    /api/feedback/configs/:id          # Update config

# Submit feedback (for end users)
POST   /api/feedback                      # Submit feedback
POST   /api/feedback/report               # Report issue

# Review feedback (for admins)
GET    /api/feedback/submissions          # List submissions
GET    /api/feedback/submissions/:id      # Get submission
PUT    /api/feedback/submissions/:id      # Update/categorize

# Issues
GET    /api/feedback/issues               # List issues
PUT    /api/feedback/issues/:id           # Update issue
POST   /api/feedback/issues/:id/resolve   # Resolve issue

# Actions
GET    /api/feedback/actions              # List actions taken
POST   /api/feedback/actions              # Record action

# Metrics
GET    /api/feedback/metrics              # Get metrics
GET    /api/feedback/dashboard            # Dashboard data
GET    /api/feedback/trends               # Trend analysis

# Surveys
GET    /api/feedback/surveys              # List surveys
POST   /api/feedback/surveys              # Create survey
POST   /api/feedback/surveys/:id/respond  # Submit survey response
GET    /api/feedback/surveys/:id/results  # Get survey results
```

## UI Components

### End User Components

1. **Feedback Widget**
   - Thumbs up/down buttons
   - Star rating component
   - Text input
   - Report issue form

### Admin Dashboard Pages

2. **Feedback Overview** (`/admin/feedback`)
   - Satisfaction trends
   - Recent feedback
   - Open issues
   - Category breakdown

3. **Feedback Explorer** (`/admin/feedback/submissions`)
   - Submission list
   - Filter and search
   - Category tagging
   - Export

4. **Issue Tracker** (`/admin/feedback/issues`)
   - Issue queue
   - Assignment
   - Resolution workflow
   - SLA tracking

5. **Analytics** (`/admin/feedback/analytics`)
   - Satisfaction trends
   - NPS tracking
   - Category analysis
   - Impact of changes

6. **Survey Manager** (`/admin/feedback/surveys`)
   - Survey list
   - Survey builder
   - Results analysis

## Dependencies

- **Existing:** AI Audit Logs
- **Related:** Quality Scoring, HITL Workflows
- **External:** Optional sentiment analysis model

## Security Considerations

- Anonymous feedback option
- PII in feedback handling
- Rate limiting submissions
- Spam detection
- Feedback data retention

## Success Metrics

| Metric | Target |
|--------|--------|
| Feedback collection rate | > 10% |
| Response time to issues | < 24 hours |
| Satisfaction improvement | +10% over baseline |
| Issue resolution rate | > 90% |

## Implementation Notes

### Phase 1: Basic Collection
- Thumbs up/down
- Simple text feedback
- Basic dashboard

### Phase 2: Advanced Collection
- Multi-question feedback
- Issue reporting
- Categorization

### Phase 3: Analysis
- Sentiment analysis
- Trend detection
- Impact tracking

### Phase 4: Closed Loop
- Feedback to action tracking
- Improvement measurement
- Predictive insights
