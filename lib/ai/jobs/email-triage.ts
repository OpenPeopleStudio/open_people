import { createClient } from "@/lib/supabase/server";
import { createAIProvider } from "@/lib/ai/providers";
import { DEFAULT_MODEL } from "@/lib/ai/prompts/inboxTriage";
import type { EmailMessage, EmailThread } from "@/types/email";

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

  private async runCompletion(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    const ai = createAIProvider();
    const response = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

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
    const prompt = `Summarize this email in 2-3 sentences, focusing on the key request or information:

From: ${message.from_name || ""} <${message.from_address}>
Subject: ${message.subject}
Body: ${message.body_text || message.body_html || ""}

Keep the summary concise but capture all essential information.`;

    return this.runCompletion(prompt, 0.3, 200);
  }

  private async classifyMessage(message: EmailMessage): Promise<{
    priority: "urgent" | "high" | "normal" | "low";
    intent: "support" | "sales" | "admin" | "internal" | "spam" | "unknown";
    sentiment: "positive" | "neutral" | "negative";
    score: number;
  }> {
    const prompt = `Analyze this email and classify it. Return ONLY a JSON object with these fields:
- priority: "urgent" | "high" | "normal" | "low" (based on urgency and importance)
- intent: "support" | "sales" | "admin" | "internal" | "spam" | "unknown" (main purpose)
- sentiment: "positive" | "neutral" | "negative" (tone of the message)
- score: number 0-1 (how confident you are in this classification)

Email:
From: ${message.from_name || ""} <${message.from_address}>
Subject: ${message.subject}
Body: ${message.body_text || message.body_html || ""}`;

    const content = await this.runCompletion(prompt, 0.1, 300);

    try {
      const result = JSON.parse(content);
      return {
        priority: result.priority || "normal",
        intent: result.intent || "unknown",
        sentiment: result.sentiment || "neutral",
        score: Math.max(0, Math.min(1, result.score || 0.5)),
      };
    } catch (error) {
      console.error("Failed to parse classification response");
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

    const content = await this.runCompletion(prompt, 0.7, 1000);

    try {
      const result = JSON.parse(content);
      const bodyText = typeof result.body_text === "string" ? result.body_text : "";
      const bodyHtml =
        typeof result.body_html === "string" && result.body_html.length > 0
          ? result.body_html
          : this.textToHtml(bodyText);
      const subject = typeof result.subject === "string" ? result.subject : undefined;
      const confidence =
        typeof result.confidence === "number" ? result.confidence : 0.5;

      const base = {
        body_html: bodyHtml,
        body_text: bodyText,
        confidence: Math.max(0, Math.min(1, confidence)),
      };

      return subject !== undefined ? { ...base, subject } : base;
    } catch (error) {
      console.error("Failed to parse suggestion response");
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
      const priorityKey =
        typeof priority === "string" && priority in priorityScores
          ? (priority as keyof typeof priorityScores)
          : "normal";
      updateData.ai_priority_score = priorityScores[priorityKey] * score;

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
    const { data: messageData, error: messageError } = await this.supabase
      .from("email_messages")
      .select("tenant_id")
      .eq("id", messageId)
      .single();

    if (messageError || !messageData?.tenant_id) {
      throw new Error("Message tenant not found");
    }

    const insertData: {
      tenant_id: string;
      message_id: string;
      body_html: string;
      body_text: string;
      confidence_score: number;
      thread_id?: string;
      subject?: string;
    } = {
      tenant_id: messageData.tenant_id,
      message_id: messageId,
      body_html: suggestion.body_html,
      body_text: suggestion.body_text,
      confidence_score: suggestion.confidence,
    };

    if (threadId) {
      insertData.thread_id = threadId;
    }

    if (suggestion.subject !== undefined) {
      insertData.subject = suggestion.subject;
    }

    await this.supabase
      .from("email_suggestions")
      .insert(insertData);
  }
}

// Export singleton instance
export const emailTriageWorker = new EmailTriageWorker();
