import type {
  SDKConfig,
  VariantAssignment,
  FlagEvaluation,
  TargetingRule,
} from "@/types/experiments";
import { assignVariant, evaluateRules } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   OpenPeople Experiments SDK
   Client-side helper for A/B testing and feature flags
   ═══════════════════════════════════════════════════════════════════════════ */

export class OpenPeopleExperiments {
  private config: SDKConfig | null = null;
  private tenantId: string;
  private userId: string | null = null;
  private anonymousId: string | null = null;
  private attributes: Record<string, unknown> = {};

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.anonymousId = this.getOrCreateAnonymousId();
  }

  // Initialize with user context
  setUser(userId: string, attributes: Record<string, unknown> = {}) {
    this.userId = userId;
    this.attributes = attributes;
  }

  // Set user attributes
  setAttributes(attributes: Record<string, unknown>) {
    this.attributes = { ...this.attributes, ...attributes };
  }

  // Fetch config from API
  async fetchConfig(): Promise<void> {
    try {
      const res = await fetch(
        `/api/experiments/config?tenant_id=${this.tenantId}`
      );
      if (res.ok) {
        this.config = await res.json();
      }
    } catch (error) {
      console.error("Failed to fetch experiments config:", error);
    }
  }

  // Get variant for an experiment
  getVariant(experimentKey: string): VariantAssignment | null {
    if (!this.config) {
      console.warn("Config not loaded. Call fetchConfig() first.");
      return null;
    }

    const experiment = this.config.experiments.find(
      (exp) => exp.key === experimentKey
    );

    if (!experiment || experiment.status !== "running") {
      return null;
    }

    // Check rollout percentage
    const rolloutHash = this.hash(experimentKey + "rollout" + this.getIdentifier());
    if ((rolloutHash % 100) >= experiment.rollout_percentage) {
      return null; // Not in rollout
    }

    // Check audience rules
    if (
      experiment.audience_rules &&
      !this.matchesAudienceRules(experiment.audience_rules)
    ) {
      return null;
    }

    // Assign variant
    const variantKey = assignVariant(
      experimentKey,
      this.getIdentifier(),
      experiment.variants
    );

    const variant = experiment.variants.find((v) => v.key === variantKey);

    if (!variant) {
      return null;
    }

    // Track exposure (async, don't block)
    this.trackExposure(experiment.id, variant.id);

    return {
      experimentKey,
      variantKey: variant.key,
      variantId: variant.id,
    };
  }

  // Check if feature flag is enabled
  isEnabled(flagKey: string): boolean {
    if (!this.config) {
      console.warn("Config not loaded. Call fetchConfig() first.");
      return false;
    }

    const flag = this.config.flags.find((f) => f.key === flagKey);

    if (!flag || !flag.enabled) {
      return false;
    }

    // Check rollout percentage
    const rolloutHash = this.hash(flagKey + "rollout" + this.getIdentifier());
    if ((rolloutHash % 100) >= flag.rollout_percentage) {
      return false;
    }

    // Check audience rules
    if (flag.audience_rules && !this.matchesAudienceRules(flag.audience_rules)) {
      return false;
    }

    // Track exposure (async)
    this.trackExposure(null, null, flag.id);

    return true;
  }

  // Evaluate flag with detailed result
  evaluateFlag(flagKey: string): FlagEvaluation {
    const enabled = this.isEnabled(flagKey);
    
    const flag = this.config?.flags.find((f) => f.key === flagKey);
    const eligible = flag ? true : false;

    return {
      flagKey,
      enabled,
      eligible,
    };
  }

  // Track exposure event
  private async trackExposure(
    experimentId?: string | null,
    variantId?: string | null,
    flagId?: string | null
  ) {
    try {
      await fetch("/api/experiments/exposure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: this.tenantId,
          experiment_id: experimentId,
          variant_id: variantId,
          flag_id: flagId,
          user_id: this.userId,
          anonymous_id: this.anonymousId,
          attributes: this.attributes,
        }),
      });
    } catch (error) {
      console.error("Failed to track exposure:", error);
    }
  }

  // Get identifier (user ID or anonymous ID)
  private getIdentifier(): string {
    return this.userId || this.anonymousId || "unknown";
  }

  // Match audience rules
  private matchesAudienceRules(rules: TargetingRule[]): boolean {
    return evaluateRules(rules, this.attributes);
  }

  // Get or create anonymous ID
  private getOrCreateAnonymousId(): string {
    const storageKey = "op_anon_id";

    if (typeof window === "undefined") {
      return "server-" + Math.random().toString(36).substring(2);
    }

    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = "anon-" + Math.random().toString(36).substring(2) + Date.now();
      localStorage.setItem(storageKey, id);
    }
    return id;
  }

  // Simple hash function
  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// React hook for experiments
export function useExperiments(tenantId: string) {
  if (typeof window === "undefined") {
    // Server-side: return no-op functions
    return {
      getVariant: () => null,
      isEnabled: () => false,
      evaluateFlag: (flagKey: string) => ({
        flagKey,
        enabled: false,
        eligible: false,
      }),
    };
  }

  // Client-side: create singleton instance
  const sdk = new OpenPeopleExperiments(tenantId);

  return {
    getVariant: (experimentKey: string) => sdk.getVariant(experimentKey),
    isEnabled: (flagKey: string) => sdk.isEnabled(flagKey),
    evaluateFlag: (flagKey: string) => sdk.evaluateFlag(flagKey),
    setUser: (userId: string, attributes?: Record<string, unknown>) =>
      sdk.setUser(userId, attributes),
    fetchConfig: () => sdk.fetchConfig(),
  };
}
