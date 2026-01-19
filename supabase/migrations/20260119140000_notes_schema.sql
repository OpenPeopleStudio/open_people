-- ════════════════════════════════════════════════════════════════════════════
-- Project Notes Schema
-- Rich markdown notes with versioning, templates, and API access
-- ════════════════════════════════════════════════════════════════════════════

-- Note Categories (for organization)
CREATE TABLE IF NOT EXISTS note_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280', -- Hex color
  icon VARCHAR(50),                   -- Emoji or icon name
  
  parent_id UUID REFERENCES note_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(owner_id, slug)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES note_categories(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,                       -- Auto-generated or manual summary
  
  -- Metadata
  format VARCHAR(20) DEFAULT 'markdown', -- 'markdown', 'mdx', 'plain'
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',        -- Custom frontmatter data
  
  -- Project association
  project_name VARCHAR(255),          -- Link to a project
  
  -- Template
  is_template BOOLEAN DEFAULT false,
  template_name VARCHAR(255),
  template_description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_pinned BOOLEAN DEFAULT false,
  
  -- API Access
  is_api_accessible BOOLEAN DEFAULT false, -- Can be fetched via external API
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL, -- Restrict to specific key
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  
  UNIQUE(owner_id, slug)
);

-- Note Version History
CREATE TABLE IF NOT EXISTS note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  
  -- Snapshot
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Version info
  version INTEGER NOT NULL,
  change_summary TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note Templates (pre-built patterns)
CREATE TABLE IF NOT EXISTS note_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system template
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),              -- 'project', 'api', 'architecture', 'meeting', etc.
  
  -- Template content
  title_template VARCHAR(500),        -- e.g., "{{project}} - Architecture Overview"
  content_template TEXT NOT NULL,
  default_tags TEXT[] DEFAULT '{}',
  default_metadata JSONB DEFAULT '{}',
  
  -- Variables this template expects
  variables JSONB DEFAULT '[]',       -- [{name: "project", type: "string", required: true}]
  
  is_system BOOLEAN DEFAULT false,    -- System templates can't be deleted
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note Links (bi-directional references)
CREATE TABLE IF NOT EXISTS note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  
  link_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'parent', 'related'
  context TEXT,                       -- Surrounding text where link appears
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(source_note_id, target_note_id)
);

-- API Access Log for notes
CREATE TABLE IF NOT EXISTS note_api_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL,        -- 'read', 'list', 'export'
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_notes_owner ON notes(owner_id);
CREATE INDEX idx_notes_category ON notes(category_id);
CREATE INDEX idx_notes_project ON notes(project_name) WHERE project_name IS NOT NULL;
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_api_accessible ON notes(is_api_accessible) WHERE is_api_accessible = true;
CREATE INDEX idx_notes_slug ON notes(owner_id, slug);
CREATE INDEX idx_notes_template ON notes(is_template) WHERE is_template = true;
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));

CREATE INDEX idx_note_versions_note ON note_versions(note_id);
CREATE INDEX idx_note_versions_version ON note_versions(note_id, version DESC);

CREATE INDEX idx_note_categories_owner ON note_categories(owner_id);
CREATE INDEX idx_note_categories_parent ON note_categories(parent_id);

CREATE INDEX idx_note_templates_owner ON note_templates(owner_id);
CREATE INDEX idx_note_templates_category ON note_templates(category);

CREATE INDEX idx_note_links_source ON note_links(source_note_id);
CREATE INDEX idx_note_links_target ON note_links(target_note_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_api_access ENABLE ROW LEVEL SECURITY;

-- Categories: owner only
CREATE POLICY "note_categories_owner" ON note_categories
  FOR ALL USING (owner_id = auth.uid());

-- Notes: owner only (API access handled separately)
CREATE POLICY "notes_owner" ON notes
  FOR ALL USING (owner_id = auth.uid());

-- Versions: owner of parent note
CREATE POLICY "note_versions_owner" ON note_versions
  FOR ALL USING (
    note_id IN (SELECT id FROM notes WHERE owner_id = auth.uid())
  );

-- Templates: owner or system templates
CREATE POLICY "note_templates_access" ON note_templates
  FOR SELECT USING (owner_id = auth.uid() OR is_system = true);

CREATE POLICY "note_templates_modify" ON note_templates
  FOR ALL USING (owner_id = auth.uid() AND is_system = false);

-- Links: owner of source note
CREATE POLICY "note_links_owner" ON note_links
  FOR ALL USING (
    source_note_id IN (SELECT id FROM notes WHERE owner_id = auth.uid())
  );

-- API Access logs: super admin
CREATE POLICY "note_api_access_admin" ON note_api_access
  FOR ALL USING (is_super_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_note_slug(p_title TEXT, p_owner_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug
  base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 200);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM notes WHERE owner_id = p_owner_id AND slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate excerpt from content
CREATE OR REPLACE FUNCTION generate_note_excerpt(p_content TEXT, p_max_length INTEGER DEFAULT 200)
RETURNS TEXT AS $$
BEGIN
  -- Strip markdown formatting and take first N chars
  RETURN substring(
    regexp_replace(p_content, '#+\s*|[*_`~\[\]()]', '', 'g')
    from 1 for p_max_length
  );
END;
$$ LANGUAGE plpgsql;

-- Create version on update
CREATE OR REPLACE FUNCTION create_note_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content changed
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO note_versions (note_id, title, content, metadata, version, changed_by)
    VALUES (OLD.id, OLD.title, OLD.content, OLD.metadata, OLD.version, auth.uid());
    
    NEW.version := OLD.version + 1;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_note_version
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION create_note_version();

-- Update template use count
CREATE OR REPLACE FUNCTION increment_template_use()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metadata->>'template_id' IS NOT NULL THEN
    UPDATE note_templates
    SET use_count = use_count + 1
    WHERE id = (NEW.metadata->>'template_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_use
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_use();

-- ════════════════════════════════════════════════════════════════════════════
-- Seed System Templates
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO note_templates (name, description, category, title_template, content_template, variables, is_system) VALUES
(
  'Project Overview',
  'High-level project documentation with goals, stack, and structure',
  'project',
  '{{project}} - Project Overview',
  '# {{project}}

## Overview

Brief description of what this project does.

## Goals

- [ ] Primary goal
- [ ] Secondary goal

## Tech Stack

- **Frontend**: 
- **Backend**: 
- **Database**: 
- **Infrastructure**: 

## Project Structure

```
{{project}}/
├── src/
├── docs/
└── tests/
```

## Getting Started

```bash
# Installation
npm install

# Development
npm run dev
```

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| | | |

## Links

- Repository: 
- Documentation: 
- Staging: 
- Production: 
',
  '[{"name": "project", "type": "string", "required": true, "description": "Project name"}]',
  true
),
(
  'API Documentation',
  'Document an API endpoint with request/response examples',
  'api',
  '{{endpoint}} API',
  '# {{endpoint}}

## Overview

Description of what this endpoint does.

## Endpoint

```
{{method}} {{path}}
```

## Authentication

- Required: Yes/No
- Type: Bearer token / API Key

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

### Body

```json
{
  
}
```

## Response

### Success (200)

```json
{
  "success": true,
  "data": {}
}
```

### Error (400/401/500)

```json
{
  "error": "Error message"
}
```

## Examples

### cURL

```bash
curl -X {{method}} "https://api.example.com{{path}}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript

```javascript
const response = await fetch("{{path}}", {
  method: "{{method}}",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});
```
',
  '[{"name": "endpoint", "type": "string", "required": true}, {"name": "method", "type": "string", "required": true, "default": "GET"}, {"name": "path", "type": "string", "required": true}]',
  true
),
(
  'Architecture Decision Record',
  'Document important technical decisions',
  'architecture',
  'ADR-{{number}}: {{title}}',
  '# ADR-{{number}}: {{title}}

## Status

Proposed | Accepted | Deprecated | Superseded

## Context

What is the issue that we''re seeing that is motivating this decision or change?

## Decision

What is the change that we''re proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- 

### Negative

- 

### Neutral

- 

## Alternatives Considered

### Option 1

Description and why not chosen.

### Option 2

Description and why not chosen.

## References

- 
',
  '[{"name": "number", "type": "string", "required": true}, {"name": "title", "type": "string", "required": true}]',
  true
),
(
  'Meeting Notes',
  'Structured meeting notes with action items',
  'meeting',
  '{{date}} - {{topic}}',
  '# {{topic}}

**Date**: {{date}}
**Attendees**: 
**Duration**: 

## Agenda

1. 
2. 
3. 

## Discussion

### Topic 1



### Topic 2



## Decisions Made

- 

## Action Items

| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
| | | | ⏳ |

## Next Steps

- 

## Notes

',
  '[{"name": "date", "type": "string", "required": true}, {"name": "topic", "type": "string", "required": true}]',
  true
),
(
  'Agent Context',
  'Provide context for AI agents about a project or system',
  'ai',
  '{{project}} - Agent Context',
  '# Agent Context: {{project}}

> This document provides context for AI agents working on this project.

## Project Identity

**Name**: {{project}}
**Type**: 
**Primary Language**: 

## Core Concepts

### Domain Model

Key entities and their relationships:

- **Entity 1**: Description
- **Entity 2**: Description

### Key Patterns

Patterns used in this codebase:

- 

## Codebase Structure

```
{{project}}/
├── src/           # Source code
├── lib/           # Shared utilities
├── types/         # TypeScript types
└── tests/         # Test files
```

## Conventions

### Naming

- Files: kebab-case
- Components: PascalCase
- Functions: camelCase

### Code Style

- 

## Important Files

| File | Purpose |
|------|---------|
| | |

## Common Tasks

### Adding a New Feature

1. 
2. 
3. 

### Running Tests

```bash

```

## Gotchas

Things to watch out for:

- 

## External Dependencies

| Dependency | Purpose | Docs |
|------------|---------|------|
| | | |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| | | |
',
  '[{"name": "project", "type": "string", "required": true}]',
  true
)
ON CONFLICT DO NOTHING;
