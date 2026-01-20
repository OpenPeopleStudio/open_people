/**
 * Document Lineage & Provenance
 *
 * Track document origin, version, source connector, and permission context.
 * Every chunk knows where it came from and can be traced back to its source.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  DocumentLineage,
  ChunkLineage,
  ChunkWithLineage,
  SourceConnector,
  SourceConnectorType,
} from "@/types/rag";

// ═══════════════════════════════════════════════════════════════════════════
// Document Lineage
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateDocumentLineageOptions {
  documentId: string;
  sourceType: DocumentLineage["source_type"];
  sourceConnectorId?: string;
  externalId?: string;
  externalUrl?: string;
  externalPath?: string;
  sourceVersion?: string;
  sourceModifiedAt?: string;
  sourceHash?: string;
  extractionMethod?: DocumentLineage["extraction_method"];
  extractionConfig?: Record<string, unknown>;
  parentDocumentId?: string;
  derivationType?: DocumentLineage["derivation_type"];
  sourcePermissions?: Record<string, unknown>;
  accessGroups?: string[];
  importedBy?: string;
  syncRunId?: string;
}

/**
 * Create lineage record for a document.
 */
export async function createDocumentLineage(
  options: CreateDocumentLineageOptions
): Promise<DocumentLineage> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_document_lineage")
    .insert({
      document_id: options.documentId,
      source_type: options.sourceType,
      source_connector_id: options.sourceConnectorId,
      external_id: options.externalId,
      external_url: options.externalUrl,
      external_path: options.externalPath,
      source_version: options.sourceVersion,
      source_modified_at: options.sourceModifiedAt,
      source_hash: options.sourceHash,
      extraction_method: options.extractionMethod,
      extraction_config: options.extractionConfig,
      parent_document_id: options.parentDocumentId,
      derivation_type: options.derivationType,
      source_permissions: options.sourcePermissions,
      access_groups: options.accessGroups,
      imported_by: options.importedBy,
      sync_run_id: options.syncRunId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document lineage: ${error.message}`);
  }

  return data as DocumentLineage;
}

/**
 * Get lineage for a document.
 */
export async function getDocumentLineage(
  documentId: string
): Promise<DocumentLineage | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_document_lineage")
    .select("*")
    .eq("document_id", documentId)
    .single();

  if (error || !data) return null;
  return data as DocumentLineage;
}

/**
 * Update document lineage when source changes.
 */
export async function updateDocumentLineageFromSync(
  documentId: string,
  updates: {
    sourceVersion?: string;
    sourceModifiedAt?: string;
    sourceHash?: string;
    isDeletedInSource?: boolean;
    syncRunId?: string;
  }
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  const updateData: Record<string, unknown> = {};

  if (updates.sourceVersion) updateData.source_version = updates.sourceVersion;
  if (updates.sourceModifiedAt) updateData.source_modified_at = updates.sourceModifiedAt;
  if (updates.sourceHash) updateData.source_hash = updates.sourceHash;
  if (updates.syncRunId) updateData.sync_run_id = updates.syncRunId;

  if (updates.isDeletedInSource !== undefined) {
    updateData.is_deleted_in_source = updates.isDeletedInSource;
    if (updates.isDeletedInSource) {
      updateData.deleted_in_source_at = new Date().toISOString();
    }
  }

  await supabase
    .from("kb_document_lineage")
    .update(updateData)
    .eq("document_id", documentId);
}

// ═══════════════════════════════════════════════════════════════════════════
// Chunk Lineage
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateChunkLineageOptions {
  chunkId: string;
  documentLineageId: string;
  sourcePage?: number;
  sourceSection?: string;
  sourceParagraph?: number;
  chunkingStrategy: ChunkLineage["chunking_strategy"];
  chunkConfig?: Record<string, unknown>;
  inheritsDocumentPermissions?: boolean;
  chunkLevelPermissions?: Record<string, unknown>;
}

/**
 * Create lineage record for a chunk.
 */
export async function createChunkLineage(
  options: CreateChunkLineageOptions
): Promise<ChunkLineage> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_chunk_lineage")
    .insert({
      chunk_id: options.chunkId,
      document_lineage_id: options.documentLineageId,
      source_page: options.sourcePage,
      source_section: options.sourceSection,
      source_paragraph: options.sourceParagraph,
      chunking_strategy: options.chunkingStrategy,
      chunk_config: options.chunkConfig,
      inherits_document_permissions: options.inheritsDocumentPermissions ?? true,
      chunk_level_permissions: options.chunkLevelPermissions,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chunk lineage: ${error.message}`);
  }

  return data as ChunkLineage;
}

/**
 * Create lineage records for multiple chunks in batch.
 */
export async function createChunkLineageBatch(
  chunks: CreateChunkLineageOptions[]
): Promise<void> {
  if (chunks.length === 0) return;

  const supabase = await createSupabaseAdmin();

  const records = chunks.map((c) => ({
    chunk_id: c.chunkId,
    document_lineage_id: c.documentLineageId,
    source_page: c.sourcePage,
    source_section: c.sourceSection,
    source_paragraph: c.sourceParagraph,
    chunking_strategy: c.chunkingStrategy,
    chunk_config: c.chunkConfig,
    inherits_document_permissions: c.inheritsDocumentPermissions ?? true,
    chunk_level_permissions: c.chunkLevelPermissions,
  }));

  const { error } = await supabase.from("kb_chunk_lineage").insert(records);

  if (error) {
    throw new Error(`Failed to create chunk lineage batch: ${error.message}`);
  }
}

/**
 * Get chunk with full lineage context.
 */
export async function getChunkWithLineage(
  chunkId: string
): Promise<ChunkWithLineage | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase.rpc("get_chunk_with_lineage", {
    p_chunk_id: chunkId,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as ChunkWithLineage;
}

/**
 * Get chunks with lineage for multiple chunk IDs.
 */
export async function getChunksWithLineage(
  chunkIds: string[]
): Promise<ChunkWithLineage[]> {
  if (chunkIds.length === 0) return [];

  const results: ChunkWithLineage[] = [];

  // Process in batches to avoid query limits
  const batchSize = 50;
  for (let i = 0; i < chunkIds.length; i += batchSize) {
    const batch = chunkIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) => getChunkWithLineage(id))
    );
    results.push(...batchResults.filter((r): r is ChunkWithLineage => r !== null));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// Source Connectors
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateSourceConnectorOptions {
  tenantId: string;
  name: string;
  connectorType: SourceConnectorType;
  config: Record<string, unknown>;
  credentialsSecretId?: string;
  syncMode?: "full" | "incremental";
  syncFrequency?: "hourly" | "daily" | "weekly" | "manual";
  createdBy?: string;
}

/**
 * Create a source connector.
 */
export async function createSourceConnector(
  options: CreateSourceConnectorOptions
): Promise<SourceConnector> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_source_connectors")
    .insert({
      tenant_id: options.tenantId,
      name: options.name,
      connector_type: options.connectorType,
      config: options.config,
      credentials_secret_id: options.credentialsSecretId,
      sync_mode: options.syncMode ?? "incremental",
      sync_frequency: options.syncFrequency ?? "daily",
      created_by: options.createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create source connector: ${error.message}`);
  }

  return data as SourceConnector;
}

/**
 * Update connector sync status.
 */
export async function updateConnectorSyncStatus(
  connectorId: string,
  status: "success" | "partial" | "failed",
  error?: string,
  documentsCount?: number
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  const updateData: Record<string, unknown> = {
    last_sync_at: new Date().toISOString(),
    last_sync_status: status,
    updated_at: new Date().toISOString(),
  };

  if (error) updateData.last_sync_error = error;
  if (documentsCount !== undefined) {
    updateData.last_document_count = documentsCount;
    if (status === "success") {
      updateData.documents_synced = documentsCount;
    }
  }

  // Calculate next sync time based on frequency
  const { data: connector } = await supabase
    .from("kb_source_connectors")
    .select("sync_frequency")
    .eq("id", connectorId)
    .single();

  if (connector) {
    const intervals: Record<string, number> = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };
    const interval = intervals[connector.sync_frequency];
    if (interval) {
      updateData.next_sync_at = new Date(Date.now() + interval).toISOString();
    }
  }

  await supabase
    .from("kb_source_connectors")
    .update(updateData)
    .eq("id", connectorId);
}

/**
 * Get connectors due for sync.
 */
export async function getConnectorsDueForSync(
  tenantId?: string
): Promise<SourceConnector[]> {
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("kb_source_connectors")
    .select("*")
    .eq("status", "active")
    .neq("sync_frequency", "manual")
    .or(`next_sync_at.is.null,next_sync_at.lte.${new Date().toISOString()}`);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get connectors: ${error.message}`);
  }

  return (data || []) as SourceConnector[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a content hash for change detection.
 */
export function generateContentHash(content: string): string {
  // Simple hash for change detection (not cryptographic)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if document content has changed based on hash.
 */
export async function hasDocumentChanged(
  documentId: string,
  newContentHash: string
): Promise<boolean> {
  const lineage = await getDocumentLineage(documentId);
  if (!lineage) return true;
  return lineage.source_hash !== newContentHash;
}
