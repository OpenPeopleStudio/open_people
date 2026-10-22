import { appendFileSync } from "node:fs";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ event: "ask" });

type QuestionEntry = {
  kind: "question";
  question: string;
  covered: boolean;
  at: string;
};

type FollowUpEntry = {
  kind: "followup";
  question: string;
  covered: false;
  delivered: "email" | "log";
  at: string;
  name?: string;
  email?: string;
};

function clip(text: string): string {
  return text.trim().slice(0, 4000);
}

function appendAskLog(entry: QuestionEntry | FollowUpEntry) {
  const path = process.env.ASK_LOG_PATH?.trim();
  if (!path) return;
  try {
    appendFileSync(path, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    log.warn({ err: error }, "ask.log_path_write_failed");
  }
}

export function logAskQuestion(input: { question: string; covered: boolean }) {
  const entry: QuestionEntry = {
    kind: "question",
    question: clip(input.question),
    covered: input.covered,
    at: new Date().toISOString(),
  };
  log.info(entry, "ask.question");
  appendAskLog(entry);
}

export function logAskFollowUp(input: {
  question: string;
  delivered: "email" | "log";
  name?: string;
  email?: string;
}) {
  const entry: FollowUpEntry = {
    kind: "followup",
    question: clip(input.question),
    covered: false,
    delivered: input.delivered,
    at: new Date().toISOString(),
  };
  if (input.delivered === "log") {
    entry.name = input.name ?? "";
    entry.email = input.email ?? "";
  }
  log.info(entry, "ask.followup");
  appendAskLog(entry);
}
