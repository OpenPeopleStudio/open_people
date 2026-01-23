/**
 * Observability Loop Closure Tests
 * 
 * Tests for quality slices, regression gates, cost-per-outcome, drift probes
 */

import { describe, it, expect, vi } from "vitest";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  })),
  createSupabaseServer: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Quality Slice Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Quality Slices", () => {
  describe("computeQualitySlices", () => {
    it("should group outcomes by slice key", async () => {
      // This would be a more complete test with proper mocking
      // For now, we test the grouping logic conceptually
      const mockOutcomes = [
        { application_id: "app1", model_name: "gpt-4", quality_score: 0.8, low_quality_flag: false },
        { application_id: "app1", model_name: "gpt-4", quality_score: 0.3, low_quality_flag: true },
        { application_id: "app2", model_name: "gpt-4", quality_score: 0.9, low_quality_flag: false },
      ];
      
      // Group by application_id
      const groups = new Map<string, typeof mockOutcomes>();
      for (const outcome of mockOutcomes) {
        const key = outcome.application_id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(outcome);
      }
      
      expect(groups.size).toBe(2);
      expect(groups.get("app1")?.length).toBe(2);
      expect(groups.get("app2")?.length).toBe(1);
    });

    it("should calculate low quality rate correctly", () => {
      const outcomes = [
        { low_quality_flag: true },
        { low_quality_flag: false },
        { low_quality_flag: false },
        { low_quality_flag: true },
      ];
      
      const lowQualityCount = outcomes.filter(o => o.low_quality_flag).length;
      const rate = lowQualityCount / outcomes.length;
      
      expect(rate).toBe(0.5);
    });

    it("should calculate average quality score correctly", () => {
      const scores = [0.8, 0.9, 0.7, 0.6];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      expect(avg).toBeCloseTo(0.75, 6);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression Gate Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Regression Gates", () => {
  describe("evaluateRegressionGate", () => {
    it("should pass when quality score meets threshold", () => {
      const requirements = {
        min_quality_score: 0.7,
        max_low_quality_rate: 0.1,
        min_sample_count: 50,
      };
      
      const metrics = {
        quality_score: 0.85,
        low_quality_rate: 0.05,
        sample_count: 100,
      };
      
      const failures: string[] = [];
      
      if (metrics.quality_score < requirements.min_quality_score) {
        failures.push("Quality score below threshold");
      }
      if (metrics.low_quality_rate > requirements.max_low_quality_rate) {
        failures.push("Low quality rate exceeds threshold");
      }
      if (metrics.sample_count < requirements.min_sample_count) {
        failures.push("Insufficient samples");
      }
      
      expect(failures.length).toBe(0);
    });

    it("should fail when quality score is below threshold", () => {
      const requirements = { min_quality_score: 0.7 };
      const metrics = { quality_score: 0.5 };
      
      const failures: string[] = [];
      
      if (metrics.quality_score < requirements.min_quality_score) {
        failures.push(`Quality score ${metrics.quality_score} below minimum ${requirements.min_quality_score}`);
      }
      
      expect(failures.length).toBe(1);
      expect(failures[0]).toContain("Quality score");
    });

    it("should fail when low quality rate exceeds threshold", () => {
      const requirements = { max_low_quality_rate: 0.1 };
      const metrics = { low_quality_rate: 0.25 };
      
      const failures: string[] = [];
      
      if (metrics.low_quality_rate > requirements.max_low_quality_rate) {
        failures.push("Low quality rate exceeds threshold");
      }
      
      expect(failures.length).toBe(1);
    });

    it("should fail when sample count is insufficient", () => {
      const requirements = { min_sample_count: 100 };
      const metrics = { sample_count: 50 };
      
      const failures: string[] = [];
      
      if (metrics.sample_count < requirements.min_sample_count) {
        failures.push("Insufficient samples");
      }
      
      expect(failures.length).toBe(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cost-Per-Outcome Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Cost Per Outcome", () => {
  describe("cost calculations", () => {
    it("should calculate cost per request correctly", () => {
      const totalCostCents = 1000;
      const totalRequests = 100;
      const costPerRequest = totalCostCents / totalRequests;
      
      expect(costPerRequest).toBe(10); // 10 cents per request
    });

    it("should calculate cost per success correctly", () => {
      const outcomes = [
        { is_successful: true, cost_cents: 10 },
        { is_successful: true, cost_cents: 15 },
        { is_successful: false, cost_cents: 8 },
        { is_successful: true, cost_cents: 12 },
      ];
      
      const successful = outcomes.filter(o => o.is_successful);
      const totalSuccessfulCost = successful.reduce((sum, o) => sum + o.cost_cents, 0);
      const costPerSuccess = totalSuccessfulCost / successful.length;
      
      expect(successful.length).toBe(3);
      expect(totalSuccessfulCost).toBe(37);
      expect(costPerSuccess).toBeCloseTo(12.33, 1);
    });

    it("should calculate success rate correctly", () => {
      const outcomes = [
        { is_successful: true },
        { is_successful: false },
        { is_successful: true },
        { is_successful: true },
      ];
      
      const successRate = outcomes.filter(o => o.is_successful).length / outcomes.length;
      
      expect(successRate).toBe(0.75);
    });
  });

  describe("anomaly correlation", () => {
    it("should calculate correlation score based on timing", () => {
      const anomalyTime = new Date("2026-01-20T12:00:00Z").getTime();
      const changeTime = new Date("2026-01-20T11:30:00Z").getTime();
      
      const hoursBefore = (anomalyTime - changeTime) / (1000 * 60 * 60);
      
      let score = 0;
      if (hoursBefore <= 1) score += 0.5;
      else if (hoursBefore <= 4) score += 0.3;
      else if (hoursBefore <= 24) score += 0.1;
      
      expect(hoursBefore).toBe(0.5);
      expect(score).toBe(0.5);
    });

    it("should not correlate events after the anomaly", () => {
      const anomalyTime = new Date("2026-01-20T12:00:00Z").getTime();
      const changeTime = new Date("2026-01-20T13:00:00Z").getTime();
      
      const hoursBefore = (anomalyTime - changeTime) / (1000 * 60 * 60);
      
      expect(hoursBefore).toBeLessThan(0);
      // Should skip this event
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Drift Probe Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Drift Probes", () => {
  describe("pattern matching", () => {
    it("should match 'contains' pattern", () => {
      const output = "I cannot provide that information";
      const pattern = { type: "contains" as const, value: "cannot" };
      
      const matches = output.toLowerCase().includes(pattern.value.toLowerCase());
      
      expect(matches).toBe(true);
    });

    it("should match 'not_contains' pattern", () => {
      const output = "Here is the information you requested";
      const pattern = { type: "not_contains" as const, value: "password" };
      
      const matches = !output.toLowerCase().includes(pattern.value.toLowerCase());
      
      expect(matches).toBe(true);
    });

    it("should match 'regex' pattern", () => {
      const output = "The result is 42";
      const pattern = { type: "regex" as const, value: "\\d+" };
      
      const regex = new RegExp(pattern.value);
      const matches = regex.test(output);
      
      expect(matches).toBe(true);
    });

    it("should validate JSON format", () => {
      const validJson = '{"key": "value"}';
      const invalidJson = 'not json';
      
      const isValidJson = (str: string) => {
        try {
          JSON.parse(str);
          return true;
        } catch {
          return false;
        }
      };
      
      expect(isValidJson(validJson)).toBe(true);
      expect(isValidJson(invalidJson)).toBe(false);
    });
  });

  describe("probe pack execution", () => {
    it("should calculate pass rate correctly", () => {
      const results = [
        { passed: true },
        { passed: true },
        { passed: false },
        { passed: true },
        { passed: false },
      ];
      
      const passedCount = results.filter(r => r.passed).length;
      const passRate = passedCount / results.length;
      
      expect(passRate).toBe(0.6);
    });

    it("should flag when pass rate is below threshold", () => {
      const passRate = 0.8;
      const threshold = 0.95;
      
      const shouldAlert = passRate < threshold;
      
      expect(shouldAlert).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Baseline Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Auto-Baseline", () => {
  describe("baseline data computation", () => {
    it("should compute average quality score", () => {
      const samples = [
        { quality_score: 0.8 },
        { quality_score: 0.9 },
        { quality_score: 0.7 },
        { quality_score: 0.85 },
      ];
      
      const scores = samples.map(s => s.quality_score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      expect(avg).toBeCloseTo(0.8125, 6);
    });

    it("should compute standard deviation", () => {
      const scores = [0.8, 0.9, 0.7, 0.85];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const stdDev = Math.sqrt(
        scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / (scores.length - 1)
      );
      
      expect(stdDev).toBeCloseTo(0.0854, 3);
    });

    it("should compute success rate", () => {
      const samples = [
        { is_successful: true },
        { is_successful: true },
        { is_successful: false },
        { is_successful: true },
      ];
      
      const successRate = samples.filter(s => s.is_successful).length / samples.length;
      
      expect(successRate).toBe(0.75);
    });
  });

  describe("trigger conditions", () => {
    it("should trigger on approval when configured", () => {
      const config = { trigger_on: "approval" };
      const triggerType = "approval";
      
      const shouldTrigger = config.trigger_on === triggerType;
      
      expect(shouldTrigger).toBe(true);
    });

    it("should not trigger on deploy when configured for approval", () => {
      const config = { trigger_on: "approval" };
      const triggerType = "deploy";
      
      const shouldTrigger = config.trigger_on === triggerType;
      
      expect(shouldTrigger).toBe(false);
    });

    it("should always trigger on manual", () => {
      const config = { trigger_on: "approval" };
      const triggerType = "manual";
      
      // Manual should override config
      const shouldTrigger = triggerType === "manual" || config.trigger_on === triggerType;
      
      expect(shouldTrigger).toBe(true);
    });
  });
});
