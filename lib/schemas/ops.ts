import { z } from "zod";

export const opsCommitRequestSchema = z.object({
  run_id: z.string().min(1),
  selected_task_ids: z.array(z.string()).optional(),
  selected_update_ids: z.array(z.string()).optional(),
  overrides: z.record(z.unknown()).optional(),
});

export type OpsCommitRequestSchema = z.infer<typeof opsCommitRequestSchema>;
