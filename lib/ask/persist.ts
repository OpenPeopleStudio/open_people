import { after } from "next/server";
import { logAskQuestion, logAskReceived } from "@/lib/ask/log";
import {
  askDeploymentId,
  askDeviceClass,
  askRequestId,
  insertAskQuestionReceived,
  updateAskQuestionOutcome,
  type AskQuestionsDb,
} from "@/lib/ask/questions";

export type AskPersistSchedule = (work: () => Promise<unknown>) => void;

export type AskQuestionTrace = {
  id: string;
  received: Promise<{ id: string } | null>;
};

function defaultSchedule(work: () => Promise<unknown>): void {
  try {
    after(work);
  } catch {
    void work();
  }
}

function runScheduled(
  schedule: AskPersistSchedule | undefined,
  work: () => Promise<unknown>,
): void {
  (schedule ?? defaultSchedule)(work);
}

export function beginAskQuestionLog(input: {
  question: string;
  request?: Request;
  db?: AskQuestionsDb | null;
  schedule?: AskPersistSchedule;
}): AskQuestionTrace {
  const id = crypto.randomUUID();
  const requestId = input.request ? askRequestId(input.request) : crypto.randomUUID();
  const deviceClass = askDeviceClass(input.request?.headers.get("user-agent"));
  logAskReceived({
    question: input.question,
    id,
    requestId,
    deviceClass,
  });
  // Start the insert now so a hung model still leaves a received row.
  // after() / the injected schedule only keeps the isolate alive; it must
  // not delay the first token.
  const received = insertAskQuestionReceived(
    {
      id,
      question: input.question,
      request_id: requestId,
      deployment_id: askDeploymentId(),
      device_class: deviceClass,
    },
    input.db,
  );
  runScheduled(input.schedule, () => received);
  return { id, received };
}

export function completeAskQuestionLog(
  trace: AskQuestionTrace,
  outcome: {
    question: string;
    status: "answered" | "failed";
    covered: boolean;
    provider?: string;
    model?: string;
    fallbackFired?: boolean;
    error?: string;
  },
  opts?: {
    db?: AskQuestionsDb | null;
    schedule?: AskPersistSchedule;
  },
): void {
  logAskQuestion({
    question: outcome.question,
    covered: outcome.covered,
    provider: outcome.provider,
    model: outcome.model,
    fallbackFired: outcome.fallbackFired,
  });
  runScheduled(opts?.schedule, async () => {
    await trace.received;
    await updateAskQuestionOutcome(
      trace.id,
      {
        status: outcome.status,
        provider: outcome.provider,
        model: outcome.model,
        fallback_fired: outcome.fallbackFired,
        covered: outcome.covered,
        error: outcome.error,
      },
      opts?.db,
    );
  });
}
