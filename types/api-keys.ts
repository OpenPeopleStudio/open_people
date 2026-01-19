/**
 * API Key Types
 */

export interface ApiKey {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  
  name: string;
  provider: string;
  description: string | null;
  
  // Encrypted storage (not exposed to client)
  encrypted_key?: string;
  encryption_iv?: string;
  
  // Safe to expose
  key_hint: string | null;
  
  environment: "development" | "staging" | "production";
  scope: "super_admin" | "tenant" | "project";
  project_name: string | null;
  
  metadata: Record<string, unknown>;
  tags: string[];
  
  last_used_at: string | null;
  use_count: number;
  expires_at: string | null;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface ApiKeyUsage {
  id: string;
  key_id: string;
  action: string;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApiKeyStats {
  total_keys: number;
  active_keys: number;
  expiring_soon: number;
  by_provider: Record<string, number>;
  by_environment: Record<string, number>;
}

// API Request/Response types

export interface CreateApiKeyRequest {
  name: string;
  provider: string;
  key: string; // Plain key (will be encrypted)
  description?: string;
  environment?: "development" | "staging" | "production";
  scope?: "super_admin" | "tenant" | "project";
  project_name?: string;
  tags?: string[];
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  environment?: "development" | "staging" | "production";
  project_name?: string;
  tags?: string[];
  expires_at?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyListResponse {
  keys: Omit<ApiKey, "encrypted_key" | "encryption_iv">[];
  total: number;
}

export interface ApiKeyDetailResponse {
  key: Omit<ApiKey, "encrypted_key" | "encryption_iv">;
  usage: ApiKeyUsage[];
}

export interface DecryptedKeyResponse {
  key: string; // The actual API key (only returned once on create or explicit reveal)
}

// Filter options
export interface ApiKeyFilters {
  provider?: string;
  environment?: string;
  scope?: string;
  is_active?: boolean;
  search?: string;
}
