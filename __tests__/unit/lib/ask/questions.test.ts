import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { logAskReceived } from "@/lib/ask/log";
import {
  beginAskQuestionLog,
  completeAskQuestionLog,
} from "@/lib/ask/persist";
import {
  askDeviceClass,
  insertAskQuestionReceived,
  updateAskQuestionOutcome,
  type AskQuestionsDb,
} from "@/lib/ask/questions";

const MIGRATION = resolve(
  process.cwd(),
  "supabase/migrations/20261029133000_ask_questions.sql",
);

function mockDb(options: {
  insertError?: string;
  updateError?: string;
  onInsert?: (row: Record<string, unknown>) => void;
  onUpdate?: (row: Record<string, unknown>, id: string) => void;
}): AskQuestionsDb {
  return {
    from(table: string) {
      expect(table).toBe("ask_questions");
      return {
        insert(row: Record<string, unknown>) {
          options.onInsert?.(row);
          return Promise.resolve({
            error: options.insertError ? { message: options.insertError } : null,
          });
        },
        update(row: Record<string, unknown>) {
          return {
            eq(_column: string, id: string) {
              options.onUpdate?.(row, id);
              return Promise.resolve({
                error: options.updateError ? { message: options.updateError } : null,
              });
            },
          };
        },
      };
    },
  };
}

describe("ask device class", () => {
  it("maps coarse classes without keeping the user agent", () => {
    expect(askDeviceClass("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe(
      "mobile",
    );
    expect(askDeviceClass("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15")).toBe(
      "desktop",
    );
    expect(askDeviceClass(null)).toBe("unknown");
    expect(askDeviceClass("")).toBe("unknown");
  });
});

describe("ask_questions persist", () => {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  afterEach(() => {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
  });

  it("inserts a received row with the question and no personal headers", async () => {
    let inserted: Record<string, unknown> | undefined;
    const db = mockDb({ onInsert: (row) => { inserted = row; } });
    const id = "11111111-1111-4111-8111-111111111111";
    const result = await insertAskQuestionReceived(
      {
        id,
        question: "What is still unknown?",
        request_id: "sfo1::req-1",
        deployment_id: "dpl_test",
        device_class: "mobile",
      },
      db,
    );
    expect(result).toEqual({ id });
    expect(inserted).toMatchObject({
      id,
      question: "What is still unknown?",
      status: "received",
      request_id: "sfo1::req-1",
      deployment_id: "dpl_test",
      device_class: "mobile",
    });
    expect(inserted?.ip).toBeUndefined();
    expect(inserted?.user_agent).toBeUndefined();
    expect(inserted?.email).toBeUndefined();
    expect(inserted?.name).toBeUndefined();
  });

  it("updates the same row to answered or failed", async () => {
    const updates: Array<{ row: Record<string, unknown>; id: string }> = [];
    const db = mockDb({
      onUpdate: (row, id) => {
        updates.push({ row, id });
      },
    });
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      await updateAskQuestionOutcome(
        id,
        {
          status: "answered",
          provider: "openrouter",
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          fallback_fired: true,
          covered: true,
        },
        db,
      ),
    ).toBe(true);
    expect(
      await updateAskQuestionOutcome(
        id,
        {
          status: "failed",
          provider: "google",
          model: "gemini-flash-lite-latest",
          fallback_fired: true,
          covered: false,
          error: "first-token-timeout",
        },
        db,
      ),
    ).toBe(true);
    expect(updates[0]?.row).toMatchObject({
      status: "answered",
      provider: "openrouter",
      fallback_fired: true,
      covered: true,
    });
    expect(updates[1]?.row).toMatchObject({
      status: "failed",
      error: "first-token-timeout",
    });
    expect(JSON.stringify(updates)).not.toMatch(/AIza|sk-|or-/i);
  });

  it("returns null and does not throw when env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(
      insertAskQuestionReceived({
        id: "11111111-1111-4111-8111-111111111111",
        question: "What is still unknown?",
      }),
    ).resolves.toBeNull();
    await expect(
      updateAskQuestionOutcome("11111111-1111-4111-8111-111111111111", {
        status: "failed",
        covered: false,
      }),
    ).resolves.toBe(false);
  });

  it("returns null and does not throw when the table is missing", async () => {
    const db = mockDb({
      insertError: "Could not find the table 'public.ask_questions' in the schema cache",
      updateError: "Could not find the table 'public.ask_questions' in the schema cache",
    });
    await expect(
      insertAskQuestionReceived(
        {
          id: "11111111-1111-4111-8111-111111111111",
          question: "What is still unknown?",
        },
        db,
      ),
    ).resolves.toBeNull();
    await expect(
      updateAskQuestionOutcome(
        "11111111-1111-4111-8111-111111111111",
        { status: "failed", covered: false },
        db,
      ),
    ).resolves.toBe(false);
  });
});

describe("ask question persist schedule", () => {
  it("logs ask.received then inserts before the outcome update", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    const previous = process.env.ASK_LOG_PATH;
    process.env.ASK_LOG_PATH = path;
    const order: string[] = [];
    const db = mockDb({
      onInsert: (row) => {
        order.push(`insert:${String(row.status)}`);
      },
      onUpdate: (row) => {
        order.push(`update:${String(row.status)}`);
      },
    });
    const scheduled: Array<() => Promise<unknown>> = [];
    const trace = beginAskQuestionLog({
      question: "What is still unknown?",
      request: new Request("https://www.openpeople.ai/api/ask", {
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
          "x-vercel-id": "sfo1::req-trace",
        },
      }),
      db,
      schedule: (work) => {
        scheduled.push(work);
      },
    });
    const receivedLine = readFileSync(path, "utf8").trim();
    const received = JSON.parse(receivedLine) as Record<string, unknown>;
    expect(received.kind).toBe("received");
    expect(received.question).toBe("What is still unknown?");
    expect(received.id).toBe(trace.id);
    expect(received.requestId).toBe("sfo1::req-trace");
    expect(received.deviceClass).toBe("mobile");
    expect(received.email).toBeUndefined();
    expect(received.ip).toBeUndefined();
    expect(received.userAgent).toBeUndefined();
    expect(receivedLine).not.toMatch(/@/);

    completeAskQuestionLog(
      trace,
      {
        question: "What is still unknown?",
        status: "answered",
        covered: true,
        provider: "google",
        model: "gemini-flash-lite-latest",
        fallbackFired: false,
      },
      { db, schedule: (work) => { scheduled.push(work); } },
    );

    for (const work of scheduled) await work();
    expect(order).toEqual(["insert:received", "update:answered"]);

    if (previous === undefined) delete process.env.ASK_LOG_PATH;
    else process.env.ASK_LOG_PATH = previous;
  });

  it("still records a failed outcome when the model errors", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const db = mockDb({
      onUpdate: (row) => {
        updates.push(row);
      },
    });
    const scheduled: Array<() => Promise<unknown>> = [];
    const schedule = (work: () => Promise<unknown>) => {
      scheduled.push(work);
    };
    const trace = beginAskQuestionLog({
      question: "What is still unknown?",
      db,
      schedule,
    });
    completeAskQuestionLog(
      trace,
      {
        question: "What is still unknown?",
        status: "failed",
        covered: false,
        provider: "google",
        model: "gemini-flash-lite-latest",
        fallbackFired: true,
        error: "first-token-timeout",
      },
      { db, schedule },
    );
    for (const work of scheduled) await work();
    expect(updates[0]).toMatchObject({
      status: "failed",
      error: "first-token-timeout",
      fallback_fired: true,
    });
  });
});

describe("ask.received runtime log", () => {
  const previous = process.env.ASK_LOG_PATH;

  afterEach(() => {
    if (previous === undefined) delete process.env.ASK_LOG_PATH;
    else process.env.ASK_LOG_PATH = previous;
  });

  it("writes ask.received with the question and no email", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskReceived({
      question: "What is still unknown?",
      id: "11111111-1111-4111-8111-111111111111",
      requestId: "req-1",
      deviceClass: "desktop",
    });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.kind).toBe("received");
    expect(row.question).toBe("What is still unknown?");
    expect(row.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(row.email).toBeUndefined();
    expect(row.ip).toBeUndefined();
    expect(row.userAgent).toBeUndefined();
    expect(line).not.toMatch(/@/);
  });
});

describe("ask route records received before the model", () => {
  it("starts the durable log after parsing and before runAskWithFallback", () => {
    const route = readFileSync(join(process.cwd(), "app/api/ask/route.ts"), "utf8");
    expect(route).toMatch(/beginAskQuestionLog/);
    expect(route).toMatch(/completeAskQuestionLog/);
    const receivedAt = route.indexOf("beginAskQuestionLog");
    const modelAt = route.indexOf("runAskWithFallback");
    expect(receivedAt).toBeGreaterThan(-1);
    expect(modelAt).toBeGreaterThan(receivedAt);
  });
});

describe("ask_questions migration", () => {
  it("creates a private service-role table with no anon policy", () => {
    expect(existsSync(MIGRATION)).toBe(true);
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toMatch(/create table if not exists public\.ask_questions/);
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).toMatch(/revoke all on table public\.ask_questions from public, anon, authenticated/);
    expect(sql).toMatch(/grant all on table public\.ask_questions to service_role/);
    expect(sql).toMatch(/to service_role/);
    expect(sql).not.toMatch(/to anon/);
    expect(sql).not.toMatch(/\bip\b/);
    expect(sql).not.toMatch(/user_agent/);
    expect(sql).toMatch(/status text not null/);
    expect(sql).toMatch(/request_id/);
    expect(sql).toMatch(/deployment_id/);
    expect(sql).toMatch(/drop table public\.ask_questions/);
  });
});
