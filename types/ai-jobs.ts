export type AIWorkerJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AIWorkerId =
  | "chief-of-staff"
  | "ops"
  | "researcher"
  | "writer"
  | "inbox-triage"
  | "analyst";

export type AIWorkerJobType = "week_plan" | "ops_propose" | "generic";

export interface AIWorkerJobRow {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  worker_id: AIWorkerId | string;
  job_type: AIWorkerJobType | string;
  status: AIWorkerJobStatus;
  locked_at: string | null;
  locked_by: string | null;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  ai_run_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

