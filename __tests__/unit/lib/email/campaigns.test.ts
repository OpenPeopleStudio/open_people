import { describe, expect, it } from "vitest";
import { mapCampaignRow, dedupeRecipients } from "@/lib/email/campaigns";

describe("campaign helpers", () => {
  it("maps campaign rows with recipients", () => {
    const row = {
      id: "1",
      tenant_id: "tenant-1",
      name: "Test",
      subject: "Hello",
      body_text: "Body",
      body_html: "<p>Body</p>",
      status: "draft",
      audience_description: "devtools",
      generated_via_ai: true,
      generation_prompt: "meme",
      sender_account_id: "acc",
      total_recipients: 2,
      metadata: { foo: "bar" },
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      recipients: [
        { id: "r1", campaign_id: "1", to_email: "a@example.com", status: "draft" as const, created_at: "2024-01-01" },
      ],
    };

    const mapped = mapCampaignRow(row);
    expect(mapped.name).toBe("Test");
    expect(mapped.recipients?.length).toBe(1);
    expect(mapped.metadata).toEqual({ foo: "bar" });
  });

  it("dedupes recipients case-insensitively", () => {
    const recipients = dedupeRecipients([
      { id: "r1", campaign_id: "1", to_email: "a@example.com", status: "draft" as const, created_at: "2024-01-01" },
      { id: "r2", campaign_id: "1", to_email: "A@example.com", status: "draft" as const, created_at: "2024-01-01" },
      { id: "r3", campaign_id: "1", to_email: "b@example.com", status: "draft" as const, created_at: "2024-01-01" },
    ]);

    expect(recipients.length).toBe(2);
    expect(recipients.find((r) => r.to_email === "b@example.com")).toBeTruthy();
  });
});
