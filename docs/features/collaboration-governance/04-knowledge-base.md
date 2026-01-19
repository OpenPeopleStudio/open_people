# Knowledge Base Management

> **Priority:** P2 - Medium  
> **Category:** Collaboration & Governance  
> **Status:** Planned

## Overview

Managed document storage and retrieval for RAG (Retrieval-Augmented Generation) systems, with access controls, versioning, and quality monitoring.

## Problem Statement

Organizations struggle with RAG data management:
- Documents scattered across systems
- No access control for sensitive documents
- Difficulty tracking what's in the knowledge base
- Quality issues in retrieved content
- No visibility into retrieval performance

## User Stories

### As a Knowledge Manager
- I want to organize and curate AI knowledge bases
- I want to control who can access what documents
- I want to track document usage and quality

### As a Developer
- I want easy APIs to add documents to knowledge bases
- I want to test retrieval quality
- I want multiple knowledge bases for different use cases

### As a Compliance Officer
- I want to audit what documents AI can access
- I want to ensure sensitive data is protected
- I want document retention policies

### As an End User
- I want AI answers based on accurate information
- I want to know where answers come from
- I want up-to-date information

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Knowledge Base Management                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Document Pipeline                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Ingest  │──▶│ Process │──▶│  Store  │              │   │
│  │  │         │  │ & Chunk │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Vector    │  │   Access    │  │   Quality   │         │
│  │   Store     │  │   Control   │  │   Monitor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| Document Ingestion | Upload and process documents |
| Chunking Engine | Split documents into retrievable chunks |
| Embedding Service | Generate vector embeddings |
| Vector Store | Store and search embeddings |
| Access Control | Permission-based retrieval |
| Quality Monitoring | Track retrieval quality |

## Database Schema

```sql
-- Knowledge Base Management Schema

-- Knowledge bases
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    
    -- Access
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'team', 'public'
    
    -- Stats
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Documents
CREATE TABLE kb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    
    -- Document info
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'upload', 'url', 'api', 'connector'
    source_url VARCHAR(1000),
    
    -- File info
    file_type VARCHAR(50),
    file_size INTEGER,
    file_hash VARCHAR(64),
    
    -- Content
    raw_content TEXT,
    
    -- Processing
    processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_error TEXT,
    processed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    
    -- Classification
    classification VARCHAR(50), -- 'public', 'internal', 'confidential', 'restricted'
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES kb_documents(id),
    
    -- Stats
    chunk_count INTEGER DEFAULT 0,
    retrieval_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Document chunks
CREATE TABLE kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id),
    
    -- Chunk content
    content TEXT NOT NULL,
    
    -- Position
    chunk_index INTEGER NOT NULL,
    start_char INTEGER,
    end_char INTEGER,
    
    -- Embedding
    embedding VECTOR(1536),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Stats
    retrieval_count INTEGER DEFAULT 0,
    avg_relevance_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base access control
CREATE TABLE kb_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    
    -- Who has access
    grantee_type VARCHAR(20) NOT NULL, -- 'user', 'role', 'team', 'application'
    grantee_id VARCHAR(255) NOT NULL,
    
    -- Permission level
    permission VARCHAR(20) NOT NULL, -- 'read', 'write', 'admin'
    
    granted_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retrieval logs
CREATE TABLE kb_retrieval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id),
    
    -- Query
    query_text TEXT NOT NULL,
    query_embedding VECTOR(1536),
    
    -- Results
    results JSONB NOT NULL, -- [{chunk_id, score, content_preview}]
    result_count INTEGER,
    
    -- Context
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    user_id UUID,
    application_id VARCHAR(255),
    
    -- Performance
    latency_ms INTEGER,
    
    -- Quality signals
    user_feedback VARCHAR(20), -- 'helpful', 'not_helpful', 'incorrect'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync connectors
CREATE TABLE kb_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    
    -- Connector type
    connector_type VARCHAR(50) NOT NULL, -- 'confluence', 'notion', 'gdrive', 'sharepoint', 's3'
    
    -- Configuration (encrypted sensitive fields)
    config JSONB NOT NULL,
    
    -- Sync settings
    sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'error'
    last_error TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality metrics
CREATE TABLE kb_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Volume
    retrieval_count INTEGER DEFAULT 0,
    unique_queries INTEGER DEFAULT 0,
    
    -- Quality
    avg_top_score DECIMAL(4,3),
    feedback_helpful_count INTEGER DEFAULT 0,
    feedback_not_helpful_count INTEGER DEFAULT 0,
    
    -- Coverage
    documents_retrieved INTEGER DEFAULT 0,
    zero_result_queries INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_bases_tenant ON knowledge_bases(tenant_id);
CREATE INDEX idx_kb_documents_kb ON kb_documents(knowledge_base_id);
CREATE INDEX idx_kb_documents_status ON kb_documents(processing_status);
CREATE INDEX idx_kb_chunks_document ON kb_chunks(document_id);
CREATE INDEX idx_kb_chunks_kb ON kb_chunks(knowledge_base_id);

-- Vector search index
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

CREATE INDEX idx_kb_access ON kb_access(knowledge_base_id);
CREATE INDEX idx_kb_retrieval_logs_kb ON kb_retrieval_logs(knowledge_base_id, created_at DESC);
CREATE INDEX idx_kb_connectors_kb ON kb_connectors(knowledge_base_id);
CREATE INDEX idx_kb_quality_metrics ON kb_quality_metrics(knowledge_base_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Knowledge Bases
GET    /api/kb                            # List knowledge bases
POST   /api/kb                            # Create knowledge base
GET    /api/kb/:id                        # Get knowledge base
PUT    /api/kb/:id                        # Update knowledge base
DELETE /api/kb/:id                        # Delete knowledge base

# Documents
GET    /api/kb/:id/documents              # List documents
POST   /api/kb/:id/documents              # Add document
GET    /api/kb/:id/documents/:docId       # Get document
PUT    /api/kb/:id/documents/:docId       # Update document
DELETE /api/kb/:id/documents/:docId       # Delete document
POST   /api/kb/:id/documents/bulk         # Bulk upload

# Chunks
GET    /api/kb/:id/chunks                 # List chunks
GET    /api/kb/:id/chunks/:chunkId        # Get chunk

# Search/Retrieval
POST   /api/kb/:id/search                 # Search knowledge base
POST   /api/kb/search                     # Search across multiple KBs

# Access
GET    /api/kb/:id/access                 # List access rules
POST   /api/kb/:id/access                 # Grant access
DELETE /api/kb/:id/access/:accessId       # Revoke access

# Connectors
GET    /api/kb/:id/connectors             # List connectors
POST   /api/kb/:id/connectors             # Add connector
PUT    /api/kb/:id/connectors/:cId        # Update connector
POST   /api/kb/:id/connectors/:cId/sync   # Trigger sync

# Quality
GET    /api/kb/:id/quality                # Get quality metrics
POST   /api/kb/:id/feedback               # Submit feedback
```

## UI Components

### Admin Dashboard Pages

1. **Knowledge Base Overview** (`/admin/kb`)
   - KB list
   - Document counts
   - Quality scores
   - Quick actions

2. **KB Detail** (`/admin/kb/:id`)
   - Document list
   - Stats dashboard
   - Search test
   - Access management

3. **Document Manager** (`/admin/kb/:id/documents`)
   - Document table
   - Upload interface
   - Processing status
   - Metadata editor

4. **Chunk Viewer** (`/admin/kb/:id/chunks`)
   - Chunk browser
   - Embedding visualization
   - Quality indicators

5. **Connectors** (`/admin/kb/:id/connectors`)
   - Connector list
   - Add connector wizard
   - Sync status
   - Error logs

6. **Quality Dashboard** (`/admin/kb/:id/quality`)
   - Retrieval quality trends
   - Feedback analysis
   - Coverage gaps
   - Improvement suggestions

## Dependencies

- **Existing:** Storage, RBAC
- **Related:** API Gateway (for retrieval)
- **External:**
  - Vector database (pgvector or dedicated)
  - Embedding model
  - Document parsers

## Security Considerations

- Document classification enforcement
- Access control on retrieval
- Encryption at rest
- Audit logging for access
- PII detection in documents

## Success Metrics

| Metric | Target |
|--------|--------|
| Retrieval relevance (MRR) | > 0.8 |
| Processing success rate | > 99% |
| Query latency | < 200ms |
| User satisfaction | > 85% |

## Implementation Notes

### Phase 1: Basic KB
- Document upload and processing
- Basic chunking and embedding
- Simple search

### Phase 2: Access Control
- Permission-based access
- Document classification
- Audit logging

### Phase 3: Connectors
- External source sync
- Incremental updates
- Conflict resolution

### Phase 4: Quality
- Quality monitoring
- Feedback collection
- Auto-optimization
