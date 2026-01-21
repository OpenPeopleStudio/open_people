import { createClient } from "@/lib/supabase/server";
import { createAIProvider } from "@/lib/ai/providers";
import type { EmailMessage, EmailThread, EmailSuggestion } from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Email AI Triage Job
   Processes incoming emails for AI analysis, scoring, and suggestions
   ═══════════════════════════════════════════════════════════════════════════ */

export interface EmailTriageJob {
  messageId: string;
  threadId?: string;
  tasks: ("summarize" | "classify" | "suggest_reply")[];
}

export class EmailTriageWorker {
  private supabase = createClient();

  async process(job: EmailTriageJob): Promise<void> {
    const { messageId, threadId, tasks } = job;

    try {
      console.log(`[Email Triage] Processing message ${messageId}`);

      // Get message details
      const { data: message, error: messageError } = await this.supabase
        .from("email_messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (messageError || !message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // Update AI queue status
      await this.supabase
        .from("email_ai_queue")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
        })
        .eq("message_id", messageId);

      const results: Record<string, any> = {};

      // Process each task
      for (const task of tasks) {
        try {
          switch (task) {
            case "summarize":
              results.summary = await this.generateSummary(message);
              break;
            case "classify":
              results.classification = await this.classifyMessage(message);
              break;
            case "suggest_reply":
              results.suggestion = await this.generateSuggestion(message, threadId);
              break;
          }
        } catch (error) {
          console.error(`[Email Triage] Task ${task} failed:`, error);
          results[`${task}_error`] = error instanceof Error ? error.message : "Unknown error";
        }
      }

      // Update thread with AI results if we have a thread
      if (threadId) {
        await this.updateThreadWithAI(threadId, results);
      }

      // Store AI suggestions if generated
      if (results.suggestion) {
        await this.storeSuggestion(messageId, threadId, results.suggestion);
      }

      // Mark AI processing as complete
      await this.supabase
        .from("email_ai_queue")
        .update({
          status: "completed",
          results,
          completed_at: new Date().toISOString(),
        })
        .eq("message_id", messageId);

      console.log(`[Email Triage] Completed processing message ${messageId}`);
    } catch (error) {
      console.error(`[Email Triage] Failed to process message ${messageId}:`, error);

      // Mark as failed
      await this.supabase
        .from("email_ai_queue")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("message_id", messageId);
    }
  }

  private async generateSummary(message: EmailMessage): Promise<string> {
    const ai = createAIProvider();

    const prompt = `Summarize this email in 2-3 sentences, focusing on the key request or information:

From: ${message.from_name || ""} <${message.from_address}>
Subject: ${message.subject}
Body: ${message.body_text || message.body_html || ""}

Keep the summary concise but capture all essential information.`;

    const response = await ai.complete({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      maxTokens: 200,
    });

    return response.content.trim();
  }

  private async classifyMessage(message: EmailMessage): Promise<{
    priority: "urgent" | "high" | "normal" | "low";
    intent: "support" | "sales" | "admin" | "internal" | "spam" | "unknown";
    sentiment: "positive" | "neutral" | "negative";
    score: number;
  }> {
    const ai = createAIProvider();

    const prompt = `Analyze this email and classify it. Return ONLY a JSON object with these fields:
- priority: "urgent" | "high" | "normal" | "low" (based on urgency and importance)
- intent: "support" | "sales" | "admin" | "internal" | "spam" | "unknown" (main purpose)
- sentiment: "positive" | "neutral" | "negative" (tone of the message)
- score: number 0-1 (how confident you are in this classification)

Email:
From: ${message.from_name || ""} <${message.from_address}>
Subject: ${message.subject}
Body: ${message.body_text || message.body_html || ""}`;

    const response = await ai.complete({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      maxTokens: 300,
    });

    try {
      const result = JSON.parse(response.content.trim());
      return {
        priority: result.priority || "normal",
        intent: result.intent || "unknown",
        sentiment: result.sentiment || "neutral",
        score: Math.max(0, Math.min(1, result.score || 0.5)),
      };
    } catch (error) {
      console.error("Failed to parse classification response:", response.content);
      return {
        priority: "normal",
        intent: "unknown",
        sentiment: "neutral",
        score: 0.5,
      };
    }
  }

  private async generateSuggestion(
    message: EmailMessage,
    threadId?: string
  ): Promise<{ subject?: string; body_html: string; body_text: string; confidence: number } | null> {
    // Skip suggestion for certain types of emails
    if (this.shouldSkipSuggestion(message)) {
      return null;
    }

    const ai = createAIProvider();

    // Get thread context if available
    let threadContext = "";
    if (threadId) {
      const { data: threadMessages } = await this.supabase
        .from("email_messages")
        .select("direction, subject, body_text, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(5);

      if (threadMessages && threadMessages.length > 1) {
        threadContext = "\n\nPrevious messages in thread:\n" +
          threadMessages.slice(0, -1).map((msg, i) =>
            `Message ${i + 1} (${msg.direction}): ${msg.body_text?.substring(0, 200)}...`
          ).join("\n");
      }
    }

    const prompt = `You are a professional email assistant. Generate a helpful, appropriate reply to this email.

IMPORTANT RULES:
- Keep the reply professional and friendly
- Be concise but comprehensive
- Address the main points raised
- If you need more information, ask specific questions
- Do not make commitments you can't keep
- Do not include any meta-commentary about being an AI

Email to reply to:
From: ${message.from_name || ""} <${message.from_address}>
Subject: ${message.subject}
Body: ${message.body_text || message.body_html || ""}${threadContext}

Generate a reply with:
1. Subject line (if different from original)
2. HTML body
3. Plain text body
4. Confidence score (0-1) of how appropriate this reply is

Return ONLY a JSON object with fields: subject, body_html, body_text, confidence`;

    const response = await ai.complete({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 1000,
    });

    try {
      const result = JSON.parse(response.content.trim());
      return {
        subject: result.subject,
        body_html: result.body_html || this.textToHtml(result.body_text),
        body_text: result.body_text,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch (error) {
      console.error("Failed to parse suggestion response:", response.content);
      return null;
    }
  }

  private shouldSkipSuggestion(message: EmailMessage): boolean {
    const subject = message.subject?.toLowerCase() || "";
    const body = message.body_text?.toLowerCase() || message.body_html?.toLowerCase() || "";

    // Skip newsletters, notifications, etc.
    const skipPatterns = [
      "unsubscribe",
      "newsletter",
      "notification",
      "receipt",
      "invoice",
      "billing",
      "statement",
      "digest",
      "weekly",
      "monthly",
      "report",
    ];

    return skipPatterns.some(pattern =>
      subject.includes(pattern) || body.includes(pattern)
    );
  }

  private textToHtml(text: string): string {
    return text
      .split("\n\n")
      .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  private async updateThreadWithAI(threadId: string, results: Record<string, any>): Promise<void> {
    const updateData: Partial<EmailThread> = {};

    if (results.summary) {
      updateData.ai_summary = results.summary;
    }

    if (results.classification) {
      const { priority, intent, sentiment, score } = results.classification;

      // Convert priority to numeric score (higher = more urgent)
      const priorityScores = { urgent: 0.9, high: 0.7, normal: 0.5, low: 0.3 };
      updateData.ai_priority_score = priorityScores[priority] * score;

      updateData.ai_intent = intent;
      updateData.ai_sentiment = sentiment;
    }

    updateData.ai_processed_at = new Date().toISOString();

    await this.supabase
      .from("email_threads")
      .update(updateData)
      .eq("id", threadId);
  }

  private async storeSuggestion(
    messageId: string,
    threadId: string | undefined,
    suggestion: { subject?: string; body_html: string; body_text: string; confidence: number }
  ): Promise<void> {
    await this.supabase
      .from("email_suggestions")
      .insert({
        tenant_id: (await this.supabase
          .from("email_messages")
          .select("tenant_id")
          .eq("id", messageId)
          .single()).data?.tenant_id,
        message_id: messageId,
        thread_id: threadId,
        subject: suggestion.subject,
        body_html: suggestion.body_html,
        body_text: suggestion.body_text,
        confidence_score: suggestion.confidence,
      });
  }
}

// Export singleton instance
export const emailTriageWorker = new EmailTriageWorker();