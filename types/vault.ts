/**
 * Vault Types
 * Type definitions for the Super Admin Encrypted Vault
 */

// ═══════════════════════════════════════════════════════════════════════════
// Vault Space
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultSpace {
  id: string;
  owner_id: string;
  name: string;
  key_verification_hash: string;
  key_verification_salt: string;
  settings: VaultSettings;
  total_files: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface VaultSettings {
  auto_lock_minutes: number;
  require_2fa: boolean;
  retention_years: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Encryption Keys
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultEncryptionKey {
  id: string;
  vault_id: string;
  encrypted_dek: string;
  encryption_iv: string;
  encryption_salt: string;
  algorithm: string;
  key_derivation: string;
  is_active: boolean;
  created_at: string;
  rotated_at: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Folders
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultFolder {
  id: string;
  vault_id: string;
  parent_id: string | null;
  name: string;
  path: string;
  is_smart_folder: boolean;
  smart_folder_query: SmartFolderQuery | null;
  icon: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmartFolderQuery {
  ai_category?: string;
  ai_tags?: string[];
  date_range?: 'today' | 'this_week' | 'this_month' | 'this_year' | 'all';
  source_type?: 'manual' | 'email' | 'automation';
}

export interface FolderTreeNode extends VaultFolder {
  children: FolderTreeNode[];
  file_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Files
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultFile {
  id: string;
  vault_id: string;
  folder_id: string | null;
  r2_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  encryption_key_id: string;
  encryption_iv: string;
  content_hash: string;
  ai_summary: string | null;
  ai_category: AICategory | null;
  ai_subcategory: string | null;
  ai_tags: string[];
  ai_extracted_data: AIExtractedData | null;
  ai_confidence: number | null;
  ai_analyzed_at: string | null;
  ai_error: string | null;
  thumbnail_key: string | null;
  source_type: SourceType;
  source_metadata: SourceMetadata;
  status: FileStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
}

export type AICategory = 
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'statement'
  | 'id_document'
  | 'tax_document'
  | 'correspondence'
  | 'report'
  | 'image'
  | 'other';

export interface AIExtractedData {
  // Common fields
  document_date?: string;
  document_number?: string;
  
  // Invoice/Receipt specific
  vendor_name?: string;
  vendor_address?: string;
  total_amount?: number;
  currency?: string;
  line_items?: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total?: number;
  }>;
  tax_amount?: number;
  due_date?: string;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  
  // Contract specific
  parties?: string[];
  effective_date?: string;
  expiration_date?: string;
  key_terms?: string[];
  
  // Bank statement specific
  account_number?: string;
  statement_period?: { start: string; end: string };
  opening_balance?: number;
  closing_balance?: number;
  
  // ID document specific
  full_name?: string;
  id_number?: string;
  issue_date?: string;
  id_expiry_date?: string;
  
  // Additional extracted entities
  entities?: Array<{
    type: 'person' | 'organization' | 'date' | 'money' | 'address' | 'email' | 'phone';
    value: string;
    confidence: number;
  }>;
}

export type SourceType = 'manual' | 'email' | 'automation';

export interface SourceMetadata {
  // Email source
  email_from?: string;
  email_subject?: string;
  email_date?: string;
  email_message_id?: string;
  
  // Automation source
  rule_id?: string;
  rule_name?: string;
  
  // Upload metadata
  upload_ip?: string;
  upload_device?: string;
}

export type FileStatus = 'pending' | 'active' | 'archived' | 'deleted';

// File with folder info for display
export interface VaultFileWithFolder extends VaultFile {
  folder_path?: string;
  folder_name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Automation Rules
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultAutomationRule {
  id: string;
  vault_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  
  // Email matching
  email_from_pattern: string | null;
  email_from_exact: string[] | null;
  email_subject_pattern: string | null;
  email_subject_contains: string[] | null;
  
  // Attachment matching
  attachment_types: string[];
  attachment_name_pattern: string | null;
  min_attachment_size: number | null;
  max_attachment_size: number | null;
  
  // Actions
  target_folder_id: string | null;
  auto_approve: boolean;
  ai_classify: boolean;
  apply_tags: string[];
  
  // Stats
  files_processed: number;
  last_triggered_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationRuleInput {
  name: string;
  description?: string;
  email_from_pattern?: string;
  email_from_exact?: string[];
  email_subject_pattern?: string;
  email_subject_contains?: string[];
  attachment_types?: string[];
  attachment_name_pattern?: string;
  min_attachment_size?: number;
  max_attachment_size?: number;
  target_folder_id?: string;
  auto_approve?: boolean;
  ai_classify?: boolean;
  apply_tags?: string[];
  priority?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Inbox
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultInboxItem {
  id: string;
  vault_id: string;
  file_id: string;
  rule_id: string | null;
  suggested_folder_id: string | null;
  suggested_tags: string[];
  ai_category_preview: string | null;
  ai_summary_preview: string | null;
  source_email_from: string | null;
  source_email_subject: string | null;
  source_email_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  
  // Joined data
  file?: VaultFile;
  rule?: VaultAutomationRule;
  suggested_folder?: VaultFolder;
}

// ═══════════════════════════════════════════════════════════════════════════
// Suggestions
// ═══════════════════════════════════════════════════════════════════════════

export type SuggestionType = 
  | 'duplicate'
  | 'consolidate'
  | 'missing'
  | 'organize'
  | 'retention'
  | 'cleanup';

export type SuggestionPriority = 'low' | 'medium' | 'high';

export interface VaultSuggestion {
  id: string;
  vault_id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  file_ids: string[];
  suggested_action: SuggestedAction;
  status: 'pending' | 'applied' | 'dismissed' | 'expired';
  applied_at: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  confidence: number | null;
  created_at: string;
  expires_at: string | null;
  
  // Joined data
  files?: VaultFile[];
}

export type SuggestedAction = 
  | { action: 'delete'; file_ids: string[] }
  | { action: 'archive'; file_ids: string[] }
  | { action: 'move'; file_ids: string[]; target_folder_id: string }
  | { action: 'merge'; file_ids: string[]; output_filename: string }
  | { action: 'tag'; file_ids: string[]; tags: string[] }
  | { action: 'create_folder'; name: string; move_file_ids: string[] };

// ═══════════════════════════════════════════════════════════════════════════
// Audit Log
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultAuditEntry {
  id: string;
  vault_id: string;
  action: AuditAction;
  resource_type: 'file' | 'folder' | 'rule' | 'settings' | 'session' | null;
  resource_id: string | null;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export type AuditAction = 
  | 'vault_create'
  | 'vault_unlock'
  | 'vault_lock'
  | 'vault_settings_update'
  | 'password_change'
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'file_move'
  | 'file_archive'
  | 'file_restore'
  | 'folder_create'
  | 'folder_delete'
  | 'folder_rename'
  | 'rule_create'
  | 'rule_update'
  | 'rule_delete'
  | 'inbox_approve'
  | 'inbox_reject'
  | 'suggestion_apply'
  | 'suggestion_dismiss'
  | 'backup_create'
  | 'backup_download'
  | 'recovery_code_use'
  | 'qr_approval_request'
  | 'qr_approval_grant';

// ═══════════════════════════════════════════════════════════════════════════
// Sessions
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultSession {
  id: string;
  vault_id: string;
  type: 'primary' | 'qr_approval' | 'recovery';
  qr_challenge: string | null;
  qr_device_name: string | null;
  qr_requested_at: string | null;
  qr_expires_at: string | null;
  qr_approved: boolean | null;
  qr_approved_at: string | null;
  is_active: boolean;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  recovery_code_hash: string | null;
  recovery_code_used: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Recovery Codes
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultRecoveryCode {
  id: string;
  vault_id: string;
  code_hash: string;
  is_used: boolean;
  used_at: string | null;
  used_ip: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Backups
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultBackup {
  id: string;
  vault_id: string;
  r2_key: string;
  file_count: number;
  total_size_bytes: number;
  status: 'creating' | 'ready' | 'expired' | 'deleted';
  created_at: string;
  expires_at: string;
  downloaded_at: string | null;
  notes: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stats & Dashboard
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultStats {
  total_files: number;
  total_size_bytes: number;
  files_by_category: Record<AICategory, number>;
  pending_inbox: number;
  pending_suggestions: number;
  recent_activity_count: number;
}

export interface VaultDashboardData {
  vault: VaultSpace;
  stats: VaultStats;
  recent_files: VaultFile[];
  pending_inbox: VaultInboxItem[];
  suggestions: VaultSuggestion[];
  storage_breakdown: Array<{
    category: AICategory;
    count: number;
    size_bytes: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════════════════════

export interface VaultUnlockRequest {
  password: string;
  device_name?: string;
}

export interface VaultUnlockResponse {
  success: boolean;
  vault_id: string;
  session_id: string;
  expires_at: string;
}

export interface VaultSetupRequest {
  password: string;
  vault_name?: string;
}

export interface VaultSetupResponse {
  vault_id: string;
  recovery_codes: string[];
}

export interface VaultUploadRequest {
  filename: string;
  content_type: string;
  size_bytes: number;
  folder_id?: string;
}

export interface VaultUploadResponse {
  file_id: string;
  upload_url: string;
  encryption_key: string; // DEK for client-side encryption
  encryption_iv: string;
  thumbnail_upload_url?: string; // For thumbnail uploads
  thumbnail_key?: string; // R2 key for thumbnail
}

export interface VaultDownloadResponse {
  download_url: string;
  encryption_key: string; // DEK for client-side decryption
  encryption_iv: string;
  auth_tag: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

export interface VaultPreviewResponse {
  download_url: string;
  encryption_key: string; // DEK for client-side decryption
  encryption_iv: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  thumbnail_url: string | null; // For image thumbnails
  ai_summary: string | null; // For context in preview
  ai_category: AICategory | null; // For context in preview
}

export interface VaultSearchParams {
  query?: string;
  category?: AICategory;
  folder_id?: string;
  tags?: string[];
  source_type?: SourceType;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface VaultSearchResponse {
  files: VaultFileWithFolder[];
  total: number;
  has_more: boolean;
}

export interface QRApprovalRequest {
  challenge: string;
  approve: boolean;
}

export interface RecoveryCodeLoginRequest {
  code: string;
  new_password: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get icon for AI category
 */
export function getCategoryIcon(category: AICategory | null): string {
  const icons: Record<AICategory, string> = {
    invoice: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    receipt: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    contract: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    statement: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    id_document: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
    tax_document: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    correspondence: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    other: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  };
  
  return category ? icons[category] : icons.other;
}

/**
 * Get color for AI category
 */
export function getCategoryColor(category: AICategory | null): string {
  const colors: Record<AICategory, string> = {
    invoice: 'var(--electric-lime)',
    receipt: 'var(--electric-cyan)',
    contract: 'var(--electric-violet)',
    statement: 'var(--warning)',
    id_document: 'var(--error)',
    tax_document: 'var(--success)',
    correspondence: 'var(--info)',
    report: 'var(--text-secondary)',
    image: 'var(--electric-pink)',
    other: 'var(--text-muted)',
  };
  
  return category ? colors[category] : colors.other;
}

/**
 * Get human-readable label for category
 */
export function getCategoryLabel(category: AICategory | null): string {
  const labels: Record<AICategory, string> = {
    invoice: 'Invoice',
    receipt: 'Receipt',
    contract: 'Contract',
    statement: 'Statement',
    id_document: 'ID Document',
    tax_document: 'Tax Document',
    correspondence: 'Correspondence',
    report: 'Report',
    image: 'Image',
    other: 'Other',
  };
  
  return category ? labels[category] : 'Uncategorized';
}
