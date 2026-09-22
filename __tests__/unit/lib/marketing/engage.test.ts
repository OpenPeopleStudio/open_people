import { describe, expect, it } from "vitest";
import {
  ENGAGE_SHARE_BLURB,
  ENGAGE_SHARE_TITLE,
  ENGAGE_TO,
  ENGAGE_URL,
  buildEngageClipboard,
  buildEngageMailto,
  buildEngageMessage,
  buildEngageSharePayload,
  encodeMailto,
} from "@/lib/marketing/engage";

describe("engage mailto helper", () => {
  it("encodes spaces as plus for mailto query strings", () => {
    expect(encodeMailto("Keep firm power in NL")).toBe("Keep+firm+power+in+NL");
  });

  it("builds a message that never claims a DCIA seat", () => {
    const message = buildEngageMessage({
      name: "Jane Doe",
      email: "jane@example.com",
      org: "Mining NL stakeholder",
      note: "Keep unused retain power in Labrador.",
      interests: ["firm-power", "mining"],
    });
    expect(message).toContain("Jane Doe");
    expect(message).toContain("Firm in-province power");
    expect(message).toContain("Not a DCIA party");
    expect(message).toContain("openpeople.ai/engage");
  });

  it("points mailto at tom@openpeople.ai with a keep-power subject", () => {
    const href = buildEngageMailto({
      name: "Jane Doe",
      email: "jane@example.com",
      interests: ["transparency"],
    });
    expect(href.startsWith("mailto:tom@openpeople.ai?")).toBe(true);
    expect(href).toContain("subject=Keep+firm+power+in+NL");
    expect(href).toContain("Jane+Doe");
  });
});

describe("engage copy-first helper", () => {
  it("puts To, Subject, and message in a pasteable clipboard block", () => {
    const clipboard = buildEngageClipboard({
      name: "Jane Doe",
      email: "jane@example.com",
      org: "Town council",
      note: "Unused retain should stay in Labrador.",
      interests: ["mining"],
    });
    expect(clipboard.startsWith(`To: ${ENGAGE_TO}\nSubject: Keep firm power in NL — Jane Doe\n\n`)).toBe(
      true
    );
    expect(clipboard).toContain("Mining / resources");
    expect(clipboard).toContain("Unused retain should stay in Labrador.");
    expect(clipboard).toContain("Not a DCIA party, offtake seat, or demand seat.");
  });

  it("does not URL-encode the clipboard body", () => {
    const clipboard = buildEngageClipboard({
      name: "Jane Doe",
      email: "jane@example.com",
      interests: [],
    });
    expect(clipboard).not.toContain("Keep+firm+power");
    expect(clipboard).toContain("Keep firm power in NL — Jane Doe");
  });
});

describe("engage share helper", () => {
  it("keeps mining-first voice and the public URL", () => {
    expect(ENGAGE_SHARE_TITLE).toBe("Keep firm power in Newfoundland and Labrador");
    expect(ENGAGE_SHARE_BLURB).toContain("21–18");
    expect(ENGAGE_SHARE_BLURB).toContain("not a contract");
    expect(ENGAGE_SHARE_BLURB).toContain("mines first");
    expect(ENGAGE_SHARE_BLURB).toContain(ENGAGE_URL);
  });

  it("builds a native share payload with title, text, and url", () => {
    expect(buildEngageSharePayload()).toEqual({
      title: ENGAGE_SHARE_TITLE,
      text: ENGAGE_SHARE_BLURB,
      url: ENGAGE_URL,
    });
  });
});
