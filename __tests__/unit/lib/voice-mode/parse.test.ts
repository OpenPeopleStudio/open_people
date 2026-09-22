import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_MODE,
  ENGAGE_CHECKS,
  HOME_GATES,
  SCALE_ANCHORS,
  VOICE_STORAGE_KEY,
  parseStoredVoiceMode,
  parseVoiceQueryParam,
  voiceModeLabel,
  voiceModeToQueryValue,
} from "@/lib/voice-mode";

describe("voice mode parse", () => {
  it("defaults to plain and stores technical under op.voiceMode", () => {
    expect(DEFAULT_VOICE_MODE).toBe("plain");
    expect(VOICE_STORAGE_KEY).toBe("op.voiceMode");
    expect(voiceModeLabel("plain")).toBe("Plain language");
    expect(voiceModeLabel("technical")).toBe("Technical");
    expect(voiceModeLabel("guided")).toBe("Guided");
  });

  it("maps shareable ?v= values and ignores unknown params", () => {
    expect(parseVoiceQueryParam("plain")).toBe("plain");
    expect(parseVoiceQueryParam("tech")).toBe("technical");
    expect(parseVoiceQueryParam("guided")).toBe("guided");
    expect(parseVoiceQueryParam("technical")).toBeNull();
    expect(parseVoiceQueryParam("everyday")).toBeNull();
    expect(parseVoiceQueryParam("")).toBeNull();
    expect(parseVoiceQueryParam(null)).toBeNull();
  });

  it("reads stored plain | technical only", () => {
    expect(parseStoredVoiceMode("plain")).toBe("plain");
    expect(parseStoredVoiceMode("technical")).toBe("technical");
    expect(parseStoredVoiceMode("guided")).toBe("guided");
    expect(parseStoredVoiceMode("tech")).toBeNull();
  });

  it("writes ?v=plain and ?v=tech", () => {
    expect(voiceModeToQueryValue("plain")).toBe("plain");
    expect(voiceModeToQueryValue("technical")).toBe("tech");
    expect(voiceModeToQueryValue("guided")).toBe("guided");
  });
});

describe("scale anchors", () => {
  it("pairs every first-slice metaphor with a live-page technical twin", () => {
    const pairs = Object.values(SCALE_ANCHORS);
    expect(pairs.length).toBeGreaterThanOrEqual(5);
    for (const pair of pairs) {
      expect(pair.plain.trim().length).toBeGreaterThan(20);
      expect(pair.technical.trim().length).toBeGreaterThan(20);
      expect(pair.source.trim().length).toBeGreaterThan(0);
    }
  });

  it("does not invent cents, NPV billions, or demand seats in plain copy", () => {
    const plain = [
      ...Object.values(SCALE_ANCHORS).map((pair) => pair.plain),
      ...HOME_GATES.map((gate) => gate.plain),
      ...ENGAGE_CHECKS.map((check) => check.plain),
    ].join("\n");
    expect(plain).not.toMatch(/¢/);
    expect(plain).not.toMatch(/\$\d/);
    expect(plain).not.toMatch(/NPV/i);
    expect(plain).not.toMatch(/demand seat/i);
  });

  it("keeps GATES numbers and grounds retained MW + TWh in live figures", () => {
    expect(HOME_GATES.map((gate) => gate.v)).toEqual(["21–18", "5 Oct", "YE 2026", "31 Mar"]);
    expect(SCALE_ANCHORS.exportScale.technical).toContain("43 TWh");
    expect(SCALE_ANCHORS.exportScale.plain).toContain("43 TWh");
    expect(SCALE_ANCHORS.retainedMw.technical).toContain("2,350 MW");
    expect(SCALE_ANCHORS.retainedMw.plain).toContain("illustration, not a project");
    expect(SCALE_ANCHORS.federalAssessment.technical).toContain("2,000 MW");
    expect(SCALE_ANCHORS.heritagePrice.plain).not.toMatch(/¢/);
    expect(SCALE_ANCHORS.gulIslandRange.technical).toContain("2,250 MW");
  });
});
