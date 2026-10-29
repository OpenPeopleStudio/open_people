import { createLogger } from "@/lib/observability/logger";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const log = createLogger({ event: "ask" });

const MAX_QUESTION = 4000;
const MAX_ERROR = 500;

export type AskDeviceClass = "mobile" | "desktop" | "unknown";
export type AskQuestionStatus = "received" | "answered" | "failed";
export type AskQuestionOutcomeStatus = "answered" | "failed";

type ThenableWrite = PromiseLike<{ error: { message: string } | null }>;

export type AskQuestionsDb = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => ThenableWrite;
    update: (row: Record<string, unknown>) => {
      eq: (column: string, value: string) => ThenableWrite;
    };
  };
};

export type AskQuestionReceived = {
  id: string;
  question: string;
  request_id?: string | null;
  deployment_id?: string | null;
  device_class?: AskDeviceClass | null;
};

export type AskQuestionOutcome = {
  status: AskQuestionOutcomeStatus;
  provider?: string;
  model?: string;
  fallback_fired?: boolean;
  covered?: boolean;
  error?: string | null;
};

function clipQuestion(text: string): string {
  return text.trim().slice(0, MAX_QUESTION);
}

function clipError(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/AIza[\w-]+|sk-[a-zA-Z0-9]+|or-[\w-]+|eyJ[\w.-]+/g, "[redacted]")
    .trim()
    .slice(0, MAX_ERROR) || null;
}

function outcomeStatus(status: AskQuestionOutcomeStatus): AskQuestionOutcomeStatus {
  switch (status) {
    case "answered":
    case "failed":
      return status;
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

export function askDeviceClass(userAgent: string | null | undefined): AskDeviceClass {
  if (!userAgent?.trim()) return "unknown";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function askRequestId(req: Request): string {
  return (
    req.headers.get("x-vercel-id")?.trim() ||
    req.headers.get("x-request-id")?.trim() ||
    crypto.randomUUID()
  );
}

export function askDeploymentId(): string | null {
  return process.env.VERCEL_DEPLOYMENT_ID?.trim() || null;
}

function askStoreConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function getAskQuestionsDb(): AskQuestionsDb | null {
  if (!askStoreConfigured()) return null;
  try {
    return createSupabaseAdmin() as unknown as AskQuestionsDb;
  } catch (error) {
    log.warn({ err: error }, "ask.store_unavailable");
    return null;
  }
}

function resolveDb(db?: AskQuestionsDb | null): AskQuestionsDb | null {
  if (db === undefined) return getAskQuestionsDb();
  return db;
}

export async function insertAskQuestionReceived(
  input: AskQuestionReceived,
  db?: AskQuestionsDb | null,
): Promise<{ id: string } | null> {
  const client = resolveDb(db);
  if (!client) {
    log.warn({}, "ask.store_unavailable");
    return null;
  }

  const row: Record<string, unknown> = {
    id: input.id,
    question: clipQuestion(input.question),
    status: "received" satisfies AskQuestionStatus,
  };
  if (input.request_id) row.request_id = input.request_id;
  if (input.deployment_id) row.deployment_id = input.deployment_id;
  if (input.device_class) row.device_class = input.device_class;

  try {
    const { error } = await client.from("ask_questions").insert(row);
    if (error) {
      log.warn({ err: error.message }, "ask.store_write_failed");
      return null;
    }
    return { id: input.id };
  } catch (error) {
    log.warn({ err: error }, "ask.store_write_failed");
    return null;
  }
}

export async function updateAskQuestionOutcome(
  id: string,
  outcome: AskQuestionOutcome,
  db?: AskQuestionsDb | null,
): Promise<boolean> {
  const client = resolveDb(db);
  if (!client) {
    log.warn({}, "ask.store_unavailable");
    return false;
  }

  const row: Record<string, unknown> = {
    status: outcomeStatus(outcome.status),
  };
  if (outcome.provider) row.provider = outcome.provider;
  if (outcome.model) row.model = outcome.model;
  if (outcome.fallback_fired !== undefined) row.fallback_fired = outcome.fallback_fired;
  if (outcome.covered !== undefined) row.covered = outcome.covered;
  if (outcome.status === "failed") {
    const error = clipError(outcome.error);
    if (error) row.error = error;
  }

  try {
    const { error } = await client.from("ask_questions").update(row).eq("id", id);
    if (error) {
      log.warn({ err: error.message }, "ask.store_write_failed");
      return false;
    }
    return true;
  } catch (error) {
    log.warn({ err: error }, "ask.store_write_failed");
    return false;
  }
}
