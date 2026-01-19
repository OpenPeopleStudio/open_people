/**
 * Workflow, Tasks, Automation, and Observability Types
 */

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLY
// ════════════════════════════════════════════════════════════════════════════

export interface ContextRule {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  rule_type: "include" | "exclude" | "conditional";
  priority: number;
  target_type: "file" | "folder" | "note" | "entity" | "document" | "fact" | "memory";
  target_id: string | null;
  target_pattern: string | null;
  conditions: Record<string, unknown>;
  action: "always_include" | "always_exclude" | "include_if" | "exclude_if";
  action_params: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextAssembly {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  static_notes: string[];
  static_files: string[];
  static_folders: string[];
  static_entities: string[];
  static_documents: string[];
  include_facts: boolean;
  include_memories: boolean;
  include_goals: boolean;
  include_profile: boolean;
  fact_types: string[];
  memory_categories: string[];
  entity_types: string[];
  rule_ids: string[];
  max_tokens: number;
  max_facts: number;
  max_memories: number;
  max_chunks: number;
  use_count: number;
  last_used_at: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextAssemblyLog {
  id: string;
  assembly_id: string | null;
  conversation_id: string;
  message_id: string;
  query: string | null;
  rules_applied: RuleApplication[];
  included_items: {
    notes: string[];
    files: string[];
    facts: string[];
    memories: string[];
    chunks: string[];
  };
  excluded_items: {
    notes: string[];
    files: string[];
    facts: string[];
    memories: string[];
    chunks: string[];
  };
  total_tokens: number | null;
  assembly_time_ms: number | null;
  created_at: string;
}

export interface RuleApplication {
  rule_id: string;
  rule_name: string;
  action: string;
  target: string;
}

// ════════════════════════════════════════════════════════════════════════════
// PROJECTS & TASKS
// ════════════════════════════════════════════════════════════════════════════

export interface Project {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  parent_id: string | null;
  status: "active" | "paused" | "completed" | "archived";
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  progress: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Joined
  tasks?: Task[];
  children?: Project[];
}

export interface Task {
  id: string;
  owner_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  parent_id: string | null;
  position: number;
  assigned_to: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  tags: string[];
  labels: TaskLabel[];
  checklist: ChecklistItem[];
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Joined
  project?: Project;
  subtasks?: Task[];
  dependencies?: TaskDependency[];
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";
export type TaskPriority = "urgent" | "high" | "normal" | "low";

export interface TaskLabel {
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  done_at?: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  days?: string[];  // For weekly: ["mon", "wed", "fri"]
  day_of_month?: number;
  end_date?: string;
  max_occurrences?: number;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// OPERATING RHYTHMS
// ════════════════════════════════════════════════════════════════════════════

export interface OperatingRhythm {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  rhythm_type: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  schedule: RhythmSchedule;
  agenda_template: string | null;
  prompts: string[];
  checklist_template: { title: string; required: boolean }[];
  review_config: Record<string, boolean>;
  estimated_minutes: number;
  last_completed_at: string | null;
  streak: number;
  total_completions: number;
  is_active: boolean;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface RhythmSchedule {
  day_of_week?: number;  // 0-6
  day_of_month?: number;
  time: string;  // "09:00"
  timezone: string;
}

export interface RhythmCompletion {
  id: string;
  rhythm_id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  checklist_results: { title: string; done: boolean }[];
  outcomes: { type: string; content: string }[];
  ai_summary: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  entity_type: "task" | "project" | "rhythm" | "custom" | null;
  entity_id: string | null;
  remind_at: string;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  delivery_methods: ("in_app" | "email" | "sms" | "push")[];
  status: "pending" | "sent" | "snoozed" | "dismissed";
  snoozed_until: string | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// AUTOMATIONS & INTEGRATIONS
// ════════════════════════════════════════════════════════════════════════════

export interface Integration {
  id: string;
  owner_id: string;
  provider: IntegrationProvider;
  status: "active" | "expired" | "revoked" | "error";
  scopes: string[];
  token_expires_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type IntegrationProvider = 
  | "google" 
  | "slack" 
  | "github" 
  | "notion" 
  | "linear" 
  | "trello"
  | "asana"
  | "jira"
  | "hubspot"
  | "salesforce"
  | "stripe"
  | "calendar"
  | "drive";

export interface Webhook {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  endpoint_path: string;
  source: string | null;
  events: string[];
  action_type: "create_task" | "send_notification" | "run_automation" | "custom";
  action_config: Record<string, unknown>;
  is_active: boolean;
  total_calls: number;
  last_called_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  method: string | null;
  headers: Record<string, string>;
  body: unknown;
  status_code: number | null;
  response: unknown;
  processed: boolean;
  process_error: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface AutomationJob {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  trigger_type: "schedule" | "webhook" | "event" | "manual";
  trigger_config: TriggerConfig;
  actions: AutomationAction[];
  is_active: boolean;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TriggerConfig {
  cron?: string;
  event?: string;
  webhook_id?: string;
}

export interface AutomationAction {
  type: "http" | "ai" | "create_task" | "send_email" | "send_slack" | "update_entity" | "custom";
  config: Record<string, unknown>;
}

export interface JobRun {
  id: string;
  job_id: string;
  triggered_by: string | null;
  trigger_data: unknown;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed" | "cancelled";
  steps_completed: number;
  step_results: StepResult[];
  error_message: string | null;
  error_step: number | null;
  logs: string | null;
  created_at: string;
}

export interface StepResult {
  step: number;
  action_type: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration_ms: number;
}

// ════════════════════════════════════════════════════════════════════════════
// OBSERVABILITY
// ════════════════════════════════════════════════════════════════════════════

export interface AIRunToolCall {
  id: string;
  run_id: string;
  tool_name: string;
  tool_type: "function" | "retrieval" | "code_interpreter" | null;
  call_index: number | null;
  arguments: unknown;
  result: unknown;
  result_preview: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  status: "pending" | "completed" | "failed";
  error: string | null;
  created_at: string;
}

export interface AIFeedback {
  id: string;
  run_id: string | null;
  message_id: string | null;
  user_id: string;
  rating: "good" | "bad" | "neutral";
  rating_score: number | null;
  feedback_type: "accuracy" | "helpfulness" | "tone" | "completeness" | "safety" | null;
  feedback_text: string | null;
  issues: string[];
  expected_answer: string | null;
  created_at: string;
}

export interface AICost {
  id: string;
  run_id: string | null;
  owner_id: string;
  tenant_id: string | null;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost_cents: number;
  output_cost_cents: number;
  total_cost_cents: number;
  embedding_tokens: number;
  embedding_cost_cents: number;
  period_date: string;
  created_at: string;
}

export interface AICostBudget {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  period_type: "daily" | "weekly" | "monthly";
  budget_cents: number;
  current_usage_cents: number;
  period_start: string;
  alert_threshold_percent: number;
  alert_sent: boolean;
  on_exceed: "warn" | "block" | "downgrade_model";
  created_at: string;
  updated_at: string;
}

export interface AIEvaluation {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  test_cases: EvalTestCase[];
  model: string | null;
  system_prompt: string | null;
  last_run_at: string | null;
  last_run_results: EvalResult[] | null;
  pass_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface EvalTestCase {
  id: string;
  input: string;
  expected_output?: string;
  criteria: string[];
}

export interface EvalResult {
  test_case_id: string;
  passed: boolean;
  actual_output: string;
  score: number;
  feedback: string;
}

// ════════════════════════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════════════════════════

export interface SearchIndexEntry {
  id: string;
  owner_id: string;
  entity_type: SearchableEntityType;
  entity_id: string;
  title: string | null;
  content: string | null;
  content_preview: string | null;
  tags: string[];
  category: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  importance: number;
  access_count: number;
  last_accessed_at: string | null;
  indexed_at: string;
}

export type SearchableEntityType = 
  | "note" 
  | "file" 
  | "task" 
  | "project" 
  | "conversation" 
  | "message" 
  | "fact" 
  | "memory"
  | "document";

export interface SearchResult {
  entity_type: SearchableEntityType;
  entity_id: string;
  title: string | null;
  content_preview: string | null;
  relevance: number;
  match_type: "text" | "semantic";
  // Explanation of why this result is relevant
  relevance_explanation?: string;
}

export interface SearchQuery {
  id: string;
  user_id: string | null;
  query: string;
  filters: SearchFilters;
  result_count: number | null;
  results_clicked: { entity_type: string; entity_id: string; position: number }[];
  search_time_ms: number | null;
  created_at: string;
}

export interface SearchFilters {
  entity_types?: SearchableEntityType[];
  tags?: string[];
  category?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// API TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  start_date?: string;
  target_date?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  project_id?: string;
  parent_id?: string;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  checklist?: { title: string }[];
}

export interface CreateRhythmRequest {
  name: string;
  description?: string;
  rhythm_type: OperatingRhythm["rhythm_type"];
  schedule: RhythmSchedule;
  agenda_template?: string;
  prompts?: string[];
  checklist_template?: { title: string; required: boolean }[];
  estimated_minutes?: number;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  include_semantic?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
}
