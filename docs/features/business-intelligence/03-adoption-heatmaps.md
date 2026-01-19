# Adoption Heatmaps

> **Priority:** P3 - Low  
> **Category:** Business Intelligence  
> **Status:** Planned

## Overview

Visual representation of AI usage across organizational dimensions (teams, departments, locations, time), identifying adoption patterns and opportunities.

## Problem Statement

Understanding adoption distribution is challenging:
- Some teams heavily adopt, others don't
- Usage patterns vary by time and context
- Hard to identify underserved areas
- Missed opportunities for expansion
- No visual way to see adoption landscape

## User Stories

### As an AI Program Manager
- I want to see where AI is being adopted
- I want to identify low-adoption areas
- I want to target enablement efforts

### As an Executive
- I want a bird's eye view of AI adoption
- I want to see departmental differences
- I want to track adoption progress

### As a Change Manager
- I want to identify adoption champions
- I want to find resistance patterns
- I want to measure training effectiveness

### As a Team Lead
- I want to see how my team compares
- I want to understand peak usage times
- I want to drive adoption in my area

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Adoption Heatmaps                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Heatmap Types                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Org    │  │  Time   │  │Geographic│              │   │
│  │  │Structure│  │  Based  │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Feature │  │  User   │  │ Custom  │              │   │
│  │  │  Usage  │  │ Journey │  │ Matrix  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Data     │  │Visualization│  │   Export    │         │
│  │ Aggregation │  │   Engine    │  │   Engine    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Heatmap Dimensions

| Dimension | Description |
|-----------|-------------|
| Organization | Teams, departments, divisions |
| Time | Hour of day, day of week, month |
| Geography | Office, region, country |
| Feature | AI features/capabilities |
| User Journey | Onboarding → Power user stages |
| Custom | Any custom attribute |

## Database Schema

```sql
-- Adoption Heatmaps Schema

-- Organizational structure (for hierarchy visualization)
CREATE TABLE org_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Node info
    node_type VARCHAR(50) NOT NULL, -- 'company', 'division', 'department', 'team'
    name VARCHAR(255) NOT NULL,
    
    -- Hierarchy
    parent_id UUID REFERENCES org_structure(id),
    path LTREE, -- For efficient tree queries
    
    -- Attributes
    location VARCHAR(100),
    cost_center VARCHAR(100),
    
    -- User count
    headcount INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adoption metrics by org unit
CREATE TABLE adoption_by_org (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    org_node_id UUID NOT NULL REFERENCES org_structure(id),
    
    -- Period
    date DATE NOT NULL,
    
    -- Adoption metrics
    headcount INTEGER,
    active_users INTEGER,
    adoption_rate DECIMAL(5,4),
    
    -- Engagement
    total_requests INTEGER,
    requests_per_active_user DECIMAL(10,2),
    
    -- Features
    features_used INTEGER,
    
    -- Trend
    adoption_change_7d DECIMAL(5,4),
    adoption_change_30d DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_node_id, date)
);

-- Time-based adoption patterns
CREATE TABLE adoption_by_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Time dimensions
    date DATE NOT NULL,
    hour_of_day INTEGER, -- 0-23, NULL for daily aggregates
    day_of_week INTEGER, -- 0-6 (Sun-Sat), NULL for daily aggregates
    
    -- Optional org filter
    org_node_id UUID REFERENCES org_structure(id),
    
    -- Metrics
    request_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geographic adoption
CREATE TABLE adoption_by_geography (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Geography
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    office VARCHAR(100),
    
    -- Period
    date DATE NOT NULL,
    
    -- Metrics
    headcount INTEGER,
    active_users INTEGER,
    adoption_rate DECIMAL(5,4),
    request_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature adoption matrix
CREATE TABLE adoption_by_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Feature
    feature_name VARCHAR(100) NOT NULL,
    
    -- Period
    date DATE NOT NULL,
    
    -- Optional org filter
    org_node_id UUID REFERENCES org_structure(id),
    
    -- Metrics
    total_users INTEGER,
    feature_users INTEGER,
    adoption_rate DECIMAL(5,4),
    
    -- Usage intensity
    avg_uses_per_user DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User journey stages
CREATE TABLE user_journey_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(100) NOT NULL,
    
    -- Stage definition
    stage_order INTEGER NOT NULL,
    
    -- Criteria
    criteria JSONB NOT NULL,
    -- {
    --   min_active_days: 1,
    --   max_active_days: 7,
    --   min_requests: 1,
    --   max_requests: 10
    -- }
    
    -- Display
    color VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stage assignments
CREATE TABLE user_stage_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    stage_id UUID NOT NULL REFERENCES user_journey_stages(id),
    
    -- Period
    date DATE NOT NULL,
    
    -- Journey metrics
    days_in_stage INTEGER,
    entered_stage_at DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id, date)
);

-- Custom heatmap configurations
CREATE TABLE heatmap_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Heatmap type
    heatmap_type VARCHAR(50) NOT NULL, -- 'org', 'time', 'geo', 'feature', 'custom'
    
    -- Dimensions
    row_dimension JSONB NOT NULL, -- {type: 'org', level: 'team'}
    column_dimension JSONB, -- {type: 'time', granularity: 'day_of_week'}
    
    -- Metric to display
    metric VARCHAR(100) NOT NULL, -- 'adoption_rate', 'requests', 'active_users'
    
    -- Visualization
    color_scale JSONB,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_structure_tenant ON org_structure(tenant_id);
CREATE INDEX idx_org_structure_parent ON org_structure(parent_id);
CREATE INDEX idx_org_structure_path ON org_structure USING gist(path);
CREATE INDEX idx_adoption_by_org_tenant ON adoption_by_org(tenant_id, date DESC);
CREATE INDEX idx_adoption_by_org_node ON adoption_by_org(org_node_id, date DESC);
CREATE INDEX idx_adoption_by_time_tenant ON adoption_by_time(tenant_id, date DESC);
CREATE INDEX idx_adoption_by_geo_tenant ON adoption_by_geography(tenant_id, date DESC);
CREATE INDEX idx_adoption_by_feature_tenant ON adoption_by_feature(tenant_id, date DESC);
CREATE INDEX idx_user_stage_assignments ON user_stage_assignments(tenant_id, date DESC);
```

## API Endpoints

```
# Organization heatmap
GET    /api/heatmaps/org                  # Org structure heatmap
GET    /api/heatmaps/org/:nodeId          # Drill down

# Time heatmap
GET    /api/heatmaps/time                 # Time-based heatmap
GET    /api/heatmaps/time/weekly          # Day of week pattern

# Geographic heatmap
GET    /api/heatmaps/geo                  # Geographic heatmap

# Feature heatmap
GET    /api/heatmaps/features             # Feature adoption matrix

# User journey
GET    /api/heatmaps/journey              # User journey funnel
GET    /api/heatmaps/journey/stages       # Stage definitions
POST   /api/heatmaps/journey/stages       # Define stage

# Custom heatmaps
GET    /api/heatmaps/custom               # List custom heatmaps
POST   /api/heatmaps/custom               # Create custom heatmap
GET    /api/heatmaps/custom/:id           # Get custom heatmap data

# Org structure
GET    /api/org-structure                 # Get org structure
POST   /api/org-structure/sync            # Sync from HR system

# Export
POST   /api/heatmaps/export               # Export heatmap
```

## UI Components

### Admin Dashboard Pages

1. **Heatmap Gallery** (`/admin/heatmaps`)
   - Available heatmaps
   - Quick insights
   - Create custom

2. **Org Heatmap** (`/admin/heatmaps/org`)
   - Treemap visualization
   - Drill-down navigation
   - Adoption by team/department
   - Comparison mode

3. **Time Heatmap** (`/admin/heatmaps/time`)
   - Hour × Day grid
   - Peak usage identification
   - Pattern detection
   - Animation over time

4. **Geographic Heatmap** (`/admin/heatmaps/geo`)
   - World/region map
   - Office markers
   - Adoption by location

5. **Feature Matrix** (`/admin/heatmaps/features`)
   - Features × Teams matrix
   - Adoption intensity
   - Feature recommendations

6. **User Journey** (`/admin/heatmaps/journey`)
   - Funnel visualization
   - Stage progression
   - Drop-off analysis

7. **Custom Heatmap Builder** (`/admin/heatmaps/custom/new`)
   - Dimension selector
   - Metric chooser
   - Color configuration
   - Preview

## Dependencies

- **Existing:** Usage Analytics, User data
- **Related:** ROI Tracking
- **External:** Optional HR system sync

## Security Considerations

- Org structure data sensitivity
- Role-based view restrictions
- Anonymization options
- Export controls

## Success Metrics

| Metric | Target |
|--------|--------|
| Heatmap usage | Weekly by leadership |
| Adoption coverage | 100% of org visible |
| Action rate | 50% of insights acted on |
| Adoption variance | Reduced by 30% |

## Implementation Notes

### Phase 1: Basic Heatmaps
- Org structure heatmap
- Simple time heatmap
- Basic visualizations

### Phase 2: Advanced Visualizations
- Geographic map
- Feature matrix
- Interactive drill-down

### Phase 3: User Journey
- Stage definitions
- Funnel visualization
- Progression tracking

### Phase 4: Custom & AI
- Custom heatmap builder
- Pattern detection
- Recommendations
