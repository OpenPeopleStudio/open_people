import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: () => ({}),
}));

import { emailSync } from "@/lib/email/sync";

describe("email sync IMAP mapping", () => {
  it("maps parsed IMAP messages into webhook-ready shape", () => {
    const parseImapMessage = (emailSync as unknown as {
      parseImapMessage: (message: Record<string, unknown>) => Record<string, unknown>;
    }).parseImapMessage;

    const parsed = parseImapMessage({
      uid: "101",
      messageId: "<msg-1>",
      inReplyTo: "<msg-0>",
      references: ["<msg-0>", "<msg-00>"],
      from: { email: "from@example.com" },
      to: [{ email: "to@example.com" }],
      cc: [{ email: "cc@example.com" }],
      subject: "Hello",
      bodyText: "Hello world",
      bodyHtml: "<p>Hello world</p>",
      attachments: [{ filename: "file.txt", size: 12, content_type: "text/plain" }],
      date: new Date("2025-01-01T00:00:00.000Z"),
    });

    expect(parsed.message_id).toBe("<msg-1>");
    expect(parsed.from).toBe("from@example.com");
    expect(parsed.to).toEqual(["to@example.com"]);
    expect(parsed.cc).toEqual(["cc@example.com"]);
    expect(parsed.subject).toBe("Hello");
    expect(parsed.text).toBe("Hello world");
    expect(parsed.html).toBe("<p>Hello world</p>");
    expect(parsed.in_reply_to).toBe("<msg-0>");
    expect(parsed.references).toEqual(["<msg-0>", "<msg-00>"]);
    expect(parsed.attachments).toEqual([{ filename: "file.txt", size: 12, content_type: "text/plain" }]);
    expect(parsed.date).toBe("2025-01-01T00:00:00.000Z");
  });

  it("falls back to UID-derived message id when missing", () => {
    const parseImapMessage = (emailSync as unknown as {
      parseImapMessage: (message: Record<string, unknown>) => Record<string, unknown>;
    }).parseImapMessage;

    const parsed = parseImapMessage({
      uid: "202",
      from: { email: "from@example.com" },
      to: [{ email: "to@example.com" }],
      attachments: [],
    });

    expect(parsed.message_id).toBe("imap-202");
  });
});
