import { describe, expect, it } from "vitest";
import {
  buildEngageMailto,
  buildEngageMessage,
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
