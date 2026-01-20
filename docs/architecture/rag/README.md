# RAG Infrastructure

> **Status:** Active  
> **Version:** 1.0.0  
> **Last Updated:** January 2026

## Overview

This document describes the RAG (Retrieval-Augmented Generation) infrastructure enhancements that ensure "RAG doesn't become vibes" - every retrieval is explainable, traceable, and measurable.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RAG INFRASTRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     DOCUMENT INGESTION                                │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │   │
│  │  │ Source  │  │   PII   │  │ Chunker │  │ Lineage │                 │   │
│  │  │Connector│──▶│ Scanner │──▶│         │──▶│ Tracker │                 │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      VECTOR STORE                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │  Chunks + Embeddings + Lineage + PII Metadata                │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    EXPLAINABLE RETRIEVAL                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │   │
│  │  │ Semantic│  │ Explain │  │ Rerank  │  │   Log   │                 │   │
│  │  │ Search  │──▶│  Why    │──▶│(optional)│──▶│ Results │                 │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       EVALUATION                                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │   │
│  │  │  Test   │  │Retrieval│  │ Answer  │  │Halluc.  │                 │   │
│  │  │  Sets   │──▶│ Metrics │──▶│Grounding│──▶│Detection│                 │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Document Lineage & Provenance

Every chunk knows its origin:

- **Source Connector**: Where the document came from (Confluence, Notion, S3, etc.)
- **External IDs**: Identifiers in the source system
- **Version Tracking**: Source version, modification time, content hash
- **Permission Context**: Original permissions from source system
- **Derivation Chain**: For summarized/split documents

```typescript
// Get chunk with full lineage
const chunk = await getChunkWithLineage(chunkId);
console.log(chunk.source_connector_type); // "confluence"
console.log(chunk.external_url);          // "https://company.atlassian.net/..."
console.log(chunk.source_version);        // "v3"
console.log(chunk.source_section);        // "Installation > Prerequisites"
```

### 2. Retrieval Explainability

Every search result includes "why this chunk":

- **Semantic Score**: Embedding similarity
- **Selection Reasons**: Why this chunk was selected
- **Matched Terms**: Query terms found in chunk
- **Matched Entities**: Entities in both query and chunk
- **Confidence**: Overall confidence with factor breakdown

```typescript
const result = await explainableSearch({
  query: "How do I configure SSO?",
  explain: true,
});

// Each result includes:
// {
//   chunk: { ... },
//   score: 0.87,
//   explanation: {
//     reasons: [
//       { type: "semantic_match", detail: "High semantic similarity", score: 0.87 },
//       { type: "keyword_match", keywords: ["configure", "SSO"], score: 0.8 },
//     ],
//     confidence: 0.85,
//     confidence_factors: { semantic: 0.87, keyword: 0.8 }
//   }
// }
```

### 3. RAG Evaluation Suite

Measure retrieval quality with standard metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| **Recall** | Retrieved relevant / Total relevant | > 0.8 |
| **Precision@K** | Relevant in top K / K | > 0.7 |
| **MRR** | Mean Reciprocal Rank | > 0.7 |
| **NDCG** | Normalized DCG | > 0.75 |
| **Grounding** | Answer grounded in context | > 0.85 |
| **Faithfulness** | Answer matches expected | > 0.8 |

```typescript
// Create test set
const testSet = await createEvalTestSet({
  name: "SSO Documentation Tests",
  description: "Test SSO-related queries",
});

// Add test cases
await addEvalTestCase({
  testSetId: testSet.id,
  query: "How do I configure SAML SSO?",
  expectedChunks: ["chunk-123", "chunk-456"],
  expectedAnswer: "To configure SAML SSO, navigate to...",
  minRecall: 0.8,
  minMrr: 0.7,
});

// Run evaluation
const results = await runEval({ test_set_id: testSet.id });
console.log(results.metrics); // { recall: 0.85, mrr: 0.78, ... }
```

### 4. PII Scanning at Ingest

Classify documents and protect sensitive data:

- **Detection**: Regex + pattern matching for common PII types
- **Classification**: none → low → medium → high → critical
- **Actions**: allow, block, redact, quarantine, manual review
- **Chunk-Level**: Track exactly where PII was found

```typescript
const scanResult = await scanDocument({
  documentId: doc.id,
  content: doc.content,
  chunks: chunks,
  tenantId: tenant.id,
});

// Result:
// {
//   pii_classification: "medium",
//   pii_types_found: ["email", "phone"],
//   pii_counts: { email: 3, phone: 2 },
//   action_taken: "redacted",
//   shouldBlock: false,
//   redactedChunks: [{ id: "...", content: "Contact [EMAIL_REDACTED]..." }]
// }
```

**PII Types Detected:**

| Type | Risk | Example Pattern |
|------|------|-----------------|
| SSN | Critical | `123-45-6789` |
| Credit Card | Critical | `4111-1111-1111-1111` |
| API Key | High | `sk_live_...` |
| Password | High | `password: secret123` |
| Email | Low | `user@example.com` |
| Phone | Low | `(555) 123-4567` |

## Database Schema

Key tables added:

- `kb_source_connectors` - External source configurations
- `kb_document_lineage` - Document origin and version tracking
- `kb_chunk_lineage` - Chunk position and permissions
- `kb_retrieval_sessions` - Group related queries
- `kb_retrieval_results` - Logged retrievals with metadata
- `kb_retrieval_result_chunks` - Individual chunk results with explanations
- `kb_retrieval_feedback` - User feedback on results
- `kb_eval_test_sets` - Evaluation test sets
- `kb_eval_test_cases` - Individual test cases with ground truth
- `kb_eval_runs` - Evaluation run results
- `kb_pii_scan_results` - Document-level PII scan results
- `kb_pii_chunk_detections` - Chunk-level PII detections
- `kb_pii_policies` - Per-tenant PII handling policies

## Usage Examples

### Document Ingestion with Full Tracking

```typescript
import { 
  createDocumentLineage, 
  createChunkLineageBatch,
  scanDocument 
} from "@/lib/rag";

// 1. Create document with lineage
const lineage = await createDocumentLineage({
  documentId: doc.id,
  sourceType: "connector",
  sourceConnectorId: connector.id,
  externalId: externalDoc.id,
  externalUrl: externalDoc.url,
  sourceVersion: externalDoc.version,
  sourceHash: generateContentHash(content),
});

// 2. Scan for PII
const scan = await scanDocument({
  documentId: doc.id,
  content: doc.content,
  chunks: chunks,
  tenantId: tenant.id,
});

if (scan.shouldBlock) {
  throw new Error("Document blocked due to PII");
}

// 3. Create chunk lineage
await createChunkLineageBatch(
  chunks.map((c, i) => ({
    chunkId: c.id,
    documentLineageId: lineage.id,
    chunkingStrategy: "semantic",
    sourceSection: c.metadata?.section,
  }))
);
```

### Search with Explainability

```typescript
import { explainableSearch, submitRetrievalFeedback } from "@/lib/rag";

const result = await explainableSearch({
  query: userQuery,
  tenantId: tenant.id,
  userId: user.id,
  top_k: 5,
  min_score: 0.7,
  explain: true,
  include_lineage: true,
  include_pii_info: true,
});

// Use results
for (const chunk of result.results) {
  console.log(`[${chunk.rank}] ${chunk.chunk.document_title}`);
  console.log(`  Score: ${chunk.score}`);
  console.log(`  Source: ${chunk.chunk.source_connector_type}`);
  console.log(`  Reasons:`, chunk.explanation?.reasons);
}

// Collect feedback
await submitRetrievalFeedback({
  retrievalId: result.retrieval_id,
  feedbackSource: "user",
  userId: user.id,
  feedbackType: "helpful",
  rating: 5,
});
```

### Running Evaluation

```typescript
import { runEval, getEvalRun } from "@/lib/rag";

// Run evaluation
const result = await runEval({
  test_set_id: testSetId,
  run_type: "full",
});

// Check results
console.log("Pass Rate:", result.metrics?.pass_rate);
console.log("Avg Recall:", result.metrics?.recall);
console.log("Avg MRR:", result.metrics?.mrr);

if (result.failed_cases?.length > 0) {
  console.log("Failed cases:");
  for (const fc of result.failed_cases) {
    console.log(`  - ${fc.query}: ${fc.reason}`);
  }
}
```

## Security Considerations

1. **PII Handling**: Configure policies per tenant for compliance
2. **Access Control**: Chunk lineage preserves source permissions
3. **Audit Trail**: All retrievals and scans are logged
4. **Redaction**: Sensitive content can be automatically redacted
5. **Review Queue**: High-risk documents flagged for manual review

## Related Documentation

- [Knowledge Base Management](../../features/collaboration-governance/04-knowledge-base.md)
- [MLF Foundation Schema](../../api/features/chat.md)
- [Event Backbone](../events/README.md)
