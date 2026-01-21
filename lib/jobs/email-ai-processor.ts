import { createClient } from "@/lib/supabase/server";
import { emailTriageWorker } from "@/lib/ai/jobs/email-triage";

/* ═══════════════════════════════════════════════════════════════════════════
   Email AI Processor Job
   Background job to process AI triage tasks from the queue
   ═══════════════════════════════════════════════════════════════════════════ */

export class EmailAIProcessorJob {
  private supabase = createClient();

  async run(): Promise<void> {
    console.log("[Email AI Processor] Starting job run");

    try {
      // Get pending AI tasks, ordered by priority
      const { data: pendingTasks, error } = await this.supabase
        .from("email_ai_queue")
        .select("*")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10); // Process up to 10 tasks per run

      if (error) {
        console.error("[Email AI Processor] Error fetching pending tasks:", error);
        return;
      }

      if (!pendingTasks || pendingTasks.length === 0) {
        console.log("[Email AI Processor] No pending tasks found");
        return;
      }

      console.log(`[Email AI Processor] Processing ${pendingTasks.length} tasks`);

      // Process each task
      for (const task of pendingTasks) {
        try {
          await this.processTask(task);
        } catch (taskError) {
          console.error(`[Email AI Processor] Error processing task ${task.id}:`, taskError);

          // Mark task as failed
          await this.supabase
            .from("email_ai_queue")
            .update({
              status: "failed",
              error_message: taskError instanceof Error ? taskError.message : "Unknown error",
              completed_at: new Date().toISOString(),
              retry_count: task.retry_count + 1,
            })
            .eq("id", task.id);
        }
      }

      console.log("[Email AI Processor] Job run completed");
    } catch (error) {
      console.error("[Email AI Processor] Job run failed:", error);
    }
  }

  private async processTask(task: any): Promise<void> {
    const { id, message_id, thread_id, tasks, retry_count, max_retries } = task;

    // Check if we've exceeded max retries
    if (retry_count >= max_retries) {
      console.warn(`[Email AI Processor] Task ${id} exceeded max retries (${max_retries})`);
      await this.supabase
        .from("email_ai_queue")
        .update({
          status: "failed",
          error_message: `Exceeded maximum retries (${max_retries})`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);
      return;
    }

    // Claim the task (prevent duplicate processing)
    const { error: claimError } = await this.supabase
      .from("email_ai_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending"); // Only claim if still pending

    if (claimError) {
      console.warn(`[Email AI Processor] Failed to claim task ${id}, may be processed by another worker`);
      return;
    }

    // Process the task
    await emailTriageWorker.process({
      messageId: message_id,
      threadId: thread_id,
      tasks,
    });

    console.log(`[Email AI Processor] Successfully processed task ${id}`);
  }

  async cleanup(): Promise<void> {
    console.log("[Email AI Processor] Running cleanup");

    try {
      // Mark stuck tasks as failed (processing for more than 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { error } = await this.supabase
        .from("email_ai_queue")
        .update({
          status: "failed",
          error_message: "Task timed out after 10 minutes",
          completed_at: new Date().toISOString(),
        })
        .eq("status", "processing")
        .lt("started_at", tenMinutesAgo);

      if (error) {
        console.error("[Email AI Processor] Cleanup error:", error);
      } else {
        console.log("[Email AI Processor] Cleanup completed");
      }
    } catch (error) {
      console.error("[Email AI Processor] Cleanup failed:", error);
    }
  }
}

// Export singleton instance
export const emailAIProcessor = new EmailAIProcessorJob();