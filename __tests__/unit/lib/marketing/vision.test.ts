import { describe, expect, it } from "vitest";
import { VISION_DESCRIPTION, VISION_SENTENCES, VISION_TITLE } from "@/lib/marketing/vision";

describe("vision copy", () => {
  it("keeps Tom Lane’s four sentences verbatim", () => {
    expect(VISION_SENTENCES.join(" ")).toBe(
      "People who care for this land should prosper from it. People working toward a shared goal should share in what it yields. Big goals raise hard questions; hard questions lead to discovery, and a better life for everyone who calls Earth home. Explorers bring us together.",
    );
  });

  it("uses the first sentence as the share description", () => {
    expect(VISION_TITLE).toBe("Vision — Open People");
    expect(VISION_DESCRIPTION).toBe(VISION_SENTENCES[0]);
  });
});
