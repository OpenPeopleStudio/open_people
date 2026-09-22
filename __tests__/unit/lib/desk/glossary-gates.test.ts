import { describe, expect, it } from "vitest";
import {
  DESK_SOURCES,
  FLOW_BARS,
  GATES,
  GLOSSARY,
  LADDER_FAMILIES,
  LADDER_POINTS,
  daysUntil,
  gateStates,
  railPosition,
} from "@/lib/desk";

describe("glossary", () => {
  it("gives every term three short lines and a resolvable where-link", () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(key).toMatch(/^[a-z0-9-]+$/);
      expect(entry.term.length).toBeGreaterThan(1);
      for (const line of [entry.what, entry.why]) {
        expect(line.trim().length).toBeGreaterThan(20);
        expect(line.split(/\s+/).length).toBeLessThanOrEqual(40);
      }
      if (entry.where) expect(entry.where.href).toMatch(/^\//);
    }
    expect(Object.keys(GLOSSARY).length).toBeGreaterThanOrEqual(30);
  });

  it("does not invent numbers the desk does not already carry", () => {
    const blob = Object.values(GLOSSARY)
      .map((e) => `${e.what} ${e.why}`)
      .join("\n");
    expect(blob).not.toMatch(/\$\d/);
    expect(blob).not.toMatch(/100–150 MW|4–6¢/);
  });
});

describe("gate clock math", () => {
  const today = new Date(2026, 8, 22); // 22 Sep 2026 local

  it("counts whole days to the next gates and marks passed gates", () => {
    expect(daysUntil("2026-10-05", today)).toBe(13);
    expect(daysUntil("2026-12-31", today)).toBe(100);
    expect(daysUntil("2027-03-31", today)).toBe(190);
    expect(daysUntil("2026-09-17", today)).toBe(-5);
    expect(daysUntil("2026-09-22", today)).toBe(0);
  });

  it("never goes negative in state and picks exactly one next gate", () => {
    const states = gateStates(GATES, today);
    expect(states.dcia).toBe("past");
    expect(states.house).toBe("past");
    expect(states.qc).toBe("next");
    expect(states.binding).toBe("future");
    expect(Object.values(states).filter((s) => s === "next")).toHaveLength(1);
    const later = gateStates(GATES, new Date(2027, 5, 1));
    expect(later.term).toBe("past");
    expect(later.gull).toBe("next");
  });

  it("places dates on the rail between the first and last on-scale gates", () => {
    expect(railPosition("2026-08-17", GATES)).toBe(0);
    expect(railPosition("2027-03-31", GATES)).toBe(1);
    const mid = railPosition("2026-12-31", GATES);
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
    expect(railPosition("2036-01-01", GATES)).toBe(1);
  });

  it("sources every gate and points preliminary gates at Annex B", () => {
    for (const gate of GATES) {
      expect(gate.sources.length).toBeGreaterThan(0);
      for (const id of gate.sources) expect(DESK_SOURCES[id]).toBeDefined();
      if (gate.kind === "preliminary") expect(gate.body.technical).toMatch(/Annex B/);
    }
  });
});

describe("ladder and flow data", () => {
  it("keeps 1.8 and 7.4 as separate rungs in the same family and the signed ¢ unpublished", () => {
    const start = LADDER_POINTS.find((p) => p.id === "reported-18");
    const avg = LADDER_POINTS.find((p) => p.id === "reported-74");
    expect(start?.family).toBe("reported");
    expect(avg?.family).toBe("reported");
    expect(start?.cents).not.toBe(avg?.cents);
    const signed = LADDER_POINTS.find((p) => p.family === "signed");
    expect(signed?.cents).toBeNull();
    expect(signed?.status).toBe("unknown");
    for (const p of LADDER_POINTS) {
      expect(LADDER_FAMILIES.some((f) => f.id === p.family)).toBe(true);
      for (const id of p.sources) expect(DESK_SOURCES[id]).toBeDefined();
    }
  });

  it("never draws a LAB-IND-1 rung or a compute megawatt", () => {
    expect(LADDER_POINTS.some((p) => /LAB-IND-1/i.test(p.label))).toBe(false);
    expect(FLOW_BARS.some((b) => /compute|data.?centre/i.test(b.label))).toBe(false);
    const queue = FLOW_BARS.find((b) => b.id === "queue");
    expect(queue?.mw).toBeNull();
    expect(queue?.fill).toBe("dashed");
  });
});
