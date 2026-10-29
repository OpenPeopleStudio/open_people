import { appendFileSync } from "node:fs";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger({ event: "ask" });

type QuestionEntry = {
  kind: "question";
  question: string;
  covered: boolean;
  provider?: string;
  model?: string;
  fallbackFired?: boolean;
  at: string;
};

type ReceivedEntry = {
  kind: "received";
  question: string;
  id: string;
  requestId?: string;
  deviceClass?: string;
  at: string;
};

type FollowUpEntry = {
  kind: "followup";
  question: string;
  covered: false;
  id?: string;
  at: string;
};

function clip(text: string): string {
  return text.trim().slice(0, 4000);
}

function appendAskLog(entry: QuestionEntry | ReceivedEntry | FollowUpEntry) {
  const path = process.env.ASK_LOG_PATH?.trim();
  if (!path) return;
  try {
    appendFileSync(path, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    log.warn({ err: error }, "ask.log_path_write_failed");
  }
}

export function logAskReceived(input: {
  question: string;
  id: string;
  requestId?: string;
  deviceClass?: string;
}) {
  const entry: ReceivedEntry = {
    kind: "received",
    question: clip(input.question),
    id: input.id,
    at: new Date().toISOString(),
  };
  if (input.requestId) entry.requestId = input.requestId;
  if (input.deviceClass) entry.deviceClass = input.deviceClass;
  log.info(entry, "ask.received");
  appendAskLog(entry);
}

export function logAskQuestion(input: {
  question: string;
  covered: boolean;
  provider?: string | undefined;
  model?: string | undefined;
  fallbackFired?: boolean | undefined;
}) {
  const entry: QuestionEntry = {
    kind: "question",
    question: clip(input.question),
    covered: input.covered,
    at: new Date().toISOString(),
  };
  if (input.provider) entry.provider = input.provider;
  if (input.model) entry.model = input.model;
  if (input.fallbackFired !== undefined) entry.fallbackFired = input.fallbackFired;
  log.info(entry, "ask.question");
  appendAskLog(entry);
}

export function logAskFollowUp(input: { question: string; id?: string }) {
  const entry: FollowUpEntry = {
    kind: "followup",
    question: clip(input.question),
    covered: false,
    at: new Date().toISOString(),
  };
  if (input.id) entry.id = input.id;
  log.info(entry, "ask.followup");
  appendAskLog(entry);
}
