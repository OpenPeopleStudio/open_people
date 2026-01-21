/**
 * Notes Types
 */

export interface NoteCategory {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  owner_id: string;
  category_id: string | null;

  title: string;
  slug: string;
  content: string;
  excerpt: string | null;

  format: "markdown" | "mdx" | "plain";
  tags: string[];
  metadata: Record<string, unknown>;

  project_name: string | null;

  is_template: boolean;
  template_name: string | null;
  template_description: string | null;

  status: "draft" | "published" | "archived";
  is_pinned: boolean;

  is_api_accessible: boolean;
  api_key_id: string | null;

  created_at: string;
  updated_at: string;
  published_at: string | null;

  version: number;

  // Sharing settings
  is_public: boolean;
  public_slug?: string;
  allow_comments: boolean;
  collaborators?: NoteCollaborator[];

  // Joined data
  category?: NoteCategory;
}

export interface NoteCollaborator {
  id: string;
  note_id: string;
  user_id: string;
  permission: "read" | "write" | "admin";
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  user_email?: string;
  user_name?: string;
}

export interface NoteComment {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  parent_id?: string; // For threaded comments
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  replies?: NoteComment[];
}

export interface NoteVersion {
  id: string;
  note_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  version: number;
  change_summary: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface NoteTemplate {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string | null;
  content_template: string;
  default_tags: string[];
  default_metadata: Record<string, unknown>;
  variables: TemplateVariable[];
  is_system: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required: boolean;
  default?: string;
  description?: string;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  link_type: "reference" | "parent" | "related";
  context: string | null;
  created_at: string;
}

// API Request/Response types

export interface CreateNoteRequest {
  title: string;
  content?: string;
  category_id?: string;
  format?: "markdown" | "mdx" | "plain";
  tags?: string[];
  metadata?: Record<string, unknown>;
  project_name?: string;
  status?: "draft" | "published" | "archived";
  is_pinned?: boolean;
  is_api_accessible?: boolean;
  api_key_id?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  category_id?: string | null;
  format?: "markdown" | "mdx" | "plain";
  tags?: string[];
  metadata?: Record<string, unknown>;
  project_name?: string | null;
  status?: "draft" | "published" | "archived";
  is_pinned?: boolean;
  is_api_accessible?: boolean;
  api_key_id?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
}

export interface NoteFilters {
  category_id?: string;
  project_name?: string;
  status?: string;
  is_pinned?: boolean;
  is_template?: boolean;
  tags?: string[];
  search?: string;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
}

export interface ExternalNoteResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  format: string;
  tags: string[];
  metadata: Record<string, unknown>;
  project_name: string | null;
  version: number;
  updated_at: string;
}
