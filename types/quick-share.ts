/**
 * Quick Share Types
 */

export interface UploadToken {
  id: string;
  vault_id: string;
  owner_id: string;
  
  name: string;
  token_prefix: string;
  
  permissions: {
    upload: boolean;
    auto_approve: boolean;
  };
  default_folder_id: string | null;
  allowed_types: string[];
  max_file_size_mb: number;
  
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  
  upload_count: number;
  last_used_at: string | null;
  last_ip_address: string | null;
  last_user_agent: string | null;
  
  is_active: boolean;
  expires_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface UploadTokenUsage {
  id: string;
  token_id: string;
  file_id: string | null;
  filename: string | null;
  file_size_bytes: number | null;
  content_type: string | null;
  success: boolean;
  error_message: string | null;
  ai_suggested_folder: string | null;
  ai_category: string | null;
  ai_tags: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  client_type: string | null;
  created_at: string;
}

export interface QuickShareInboxItem {
  id: string;
  vault_id: string;
  file_id: string;
  token_id: string | null;
  suggested_folder_id: string | null;
  suggested_folder_path: string | null;
  ai_category: string | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  confidence_score: number | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  source_device: string | null;
  source_ip: string | null;
  created_at: string;
  
  // Joined
  file?: {
    id: string;
    filename: string;
    content_type: string;
    size_bytes: number;
  };
}

// API Request/Response types

export interface CreateUploadTokenRequest {
  name: string;
  default_folder_id?: string;
  allowed_types?: string[];
  max_file_size_mb?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  auto_approve?: boolean;
  expires_at?: string;
}

export interface UpdateUploadTokenRequest {
  name?: string;
  default_folder_id?: string | null;
  allowed_types?: string[];
  max_file_size_mb?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  auto_approve?: boolean;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface QuickUploadResponse {
  success: boolean;
  file_id?: string;
  filename?: string;
  inbox_id?: string;
  ai_summary?: string;
  ai_category?: string;
  ai_tags?: string[];
  suggested_folder?: string;
  auto_approved?: boolean;
  error?: string;
}

export interface TokenListResponse {
  tokens: UploadToken[];
}

export interface TokenCreateResponse {
  token: UploadToken;
  plain_token: string; // Only returned once on creation
}
