import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { authorizeAskAdmin } from "@/lib/ask/admin";
import { parseFollowUp } from "@/lib/ask/follow-up";
import { knowledgeIsPlaceholder, loadProposalKnowledge } from "@/lib/ask/knowledge";
import { logAskFollowUp, logAskQuestion } from "@/lib/ask/log";
import {
  ASK_MODEL_DEFAULT,
  answerLooksCovered,
  askModel,
  buildAskInstructions,
  lastUserText,
} from "@/lib/ask/prompt";
import { parseFollowupsStatus, parseMarkAnswered } from "@/lib/ask/store";

describe("ask prompt", () => {
  it("binds answers to the knowledge file and the honesty rules", () => {
    const instructions = buildAskInstructions("PLACEHOLDER KNOWLEDGE");
    expect(instructions).toContain("PLACEHOLDER KNOWLEDGE");
    expect(instructions).toMatch(/CONFIRMED/);
    expect(instructions).toMatch(/REPORTED/);
    expect(instructions).toMatch(/ESTIMATE/);
    expect(instructions).toMatch(/UNKNOWN/);
    expect(instructions).toMatch(/Never invent numbers/);
    expect(instructions).toMatch(/Never claim a partner/);
    expect(instructions).toMatch(/SWL/);
    expect(instructions).toMatch(/follow-up form/);
    expect(instructions).toMatch(/AI assistant for Open People/);
  });

  it("treats UNKNOWN answers as not covered", () => {
    expect(answerLooksCovered("CONFIRMED: Open People is the proponent.")).toBe(true);
    expect(answerLooksCovered("UNKNOWN. That is not in the knowledge file. Use the follow-up form.")).toBe(
      false,
    );
  });

  it("reads the last user text part", () => {
    expect(
      lastUserText([
        { role: "user", parts: [{ type: "text", text: "first" }] },
        { role: "assistant", parts: [{ type: "text", text: "hi" }] },
        { role: "user", parts: [{ type: "text", text: "What is still unknown?" }] },
      ]),
    ).toBe("What is still unknown?");
  });

  it("defaults the Gateway model id", () => {
    expect(ASK_MODEL_DEFAULT).toBe("openai/gpt-4.1-mini");
    expect(askModel()).toMatch(/\//);
  });
});

describe("ask knowledge placeholder", () => {
  it("ships an empty knowledge file Tom’s team can replace", () => {
    const text = loadProposalKnowledge();
    expect(knowledgeIsPlaceholder(text)).toBe(true);
    expect(text).toMatch(/placeholder/i);
    expect(text).not.toMatch(/\$\d/);
  });
});

describe("ask follow-up parse", () => {
  it("requires a real email and a question", () => {
    expect(parseFollowUp({})).toEqual({
      ok: false,
      error: "A working email is required so Tom can reply.",
    });
    expect(parseFollowUp({ email: "not-an-email", question: "What is the campus?" })).toEqual({
      ok: false,
      error: "A working email is required so Tom can reply.",
    });
    expect(parseFollowUp({ email: "tom@openpeople.ai", question: "Hi" }).ok).toBe(false);
    const parsed = parseFollowUp({
      name: "Ada",
      email: "ada@example.com",
      question: "What is still unknown in the proposal?",
    });
    expect(parsed).toEqual({
      ok: true,
      spam: false,
      value: {
        name: "Ada",
        email: "ada@example.com",
        question: "What is still unknown in the proposal?",
      },
    });
  });

  it("swallows honeypot spam as a fake success", () => {
    expect(
      parseFollowUp({
        email: "bot@example.com",
        question: "Buy this now please",
        company_website: "https://spam.example",
      }),
    ).toEqual({ ok: true, spam: true });
  });
});

describe("ask question log", () => {
  const previous = process.env.ASK_LOG_PATH;

  afterEach(() => {
    if (previous === undefined) delete process.env.ASK_LOG_PATH;
    else process.env.ASK_LOG_PATH = previous;
  });

  it("writes question text and covered, never an email field", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskQuestion({ question: "What is unknown?", covered: false });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.kind).toBe("question");
    expect(row.question).toBe("What is unknown?");
    expect(row.covered).toBe(false);
    expect(line).not.toMatch(/@/);
    expect(row.email).toBeUndefined();
  });

  it("logs a stored follow-up without name or email", () => {
    const dir = mkdtempSync(join(tmpdir(), "ask-log-"));
    const path = join(dir, "ask.jsonl");
    process.env.ASK_LOG_PATH = path;
    logAskFollowUp({
      question: "What is still unknown?",
      id: "11111111-1111-4111-8111-111111111111",
    });
    const line = readFileSync(path, "utf8");
    const row = JSON.parse(line) as Record<string, unknown>;
    expect(row.kind).toBe("followup");
    expect(row.question).toBe("What is still unknown?");
    expect(row.covered).toBe(false);
    expect(row.email).toBeUndefined();
    expect(row.name).toBeUndefined();
    expect(line).not.toMatch(/@/);
  });
});

describe("ask follow-up has no Resend", () => {
  it("does not import or mention Resend in the follow-up path", () => {
    const followUp = readFileSync(join(process.cwd(), "lib/ask/follow-up.ts"), "utf8");
    const route = readFileSync(join(process.cwd(), "app/api/ask/follow-up/route.ts"), "utf8");
    expect(followUp).not.toMatch(/resend/i);
    expect(route).not.toMatch(/resend/i);
  });
});

describe("ask admin poll helpers", () => {
  const previous = process.env.ASK_ADMIN_TOKEN;

  afterEach(() => {
    if (previous === undefined) delete process.env.ASK_ADMIN_TOKEN;
    else process.env.ASK_ADMIN_TOKEN = previous;
  });

  it("rejects missing or wrong bearer tokens", () => {
    delete process.env.ASK_ADMIN_TOKEN;
    expect(authorizeAskAdmin(new Request("https://openpeople.ai/api/ask/followups"))).toBe(false);

    process.env.ASK_ADMIN_TOKEN = "secret-token-value";
    expect(authorizeAskAdmin(new Request("https://openpeople.ai/api/ask/followups"))).toBe(false);
    expect(
      authorizeAskAdmin(
        new Request("https://openpeople.ai/api/ask/followups", {
          headers: { authorization: "Bearer wrong-token-value" },
        }),
      ),
    ).toBe(false);
    expect(
      authorizeAskAdmin(
        new Request("https://openpeople.ai/api/ask/followups", {
          headers: { authorization: "Bearer secret-token-value" },
        }),
      ),
    ).toBe(true);
  });

  it("defaults status to open and parses mark-answered ids", () => {
    expect(parseFollowupsStatus(null)).toBe("open");
    expect(parseFollowupsStatus("answered")).toBe("answered");
    expect(parseFollowupsStatus("all")).toBe("all");
    expect(parseFollowupsStatus("nope")).toBe("open");
    expect(parseMarkAnswered({ id: "11111111-1111-4111-8111-111111111111" })).toEqual({
      ok: true,
      ids: ["11111111-1111-4111-8111-111111111111"],
    });
    expect(parseMarkAnswered({})).toMatchObject({ ok: false });
  });
});
