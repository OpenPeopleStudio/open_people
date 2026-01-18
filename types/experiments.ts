/* ═══════════════════════════════════════════════════════════════════════════
   Experimentation & Feature Flags Types
   Types for A/B testing, feature flags, and experimentation
   ═══════════════════════════════════════════════════════════════════════════ */

export type ExperimentTier = "free" | "starter" | "pro" | "enterprise";

export type ExperimentPlan = {
  tier: ExperimentTier;
  name: string;
  price: number; // monthly price in dollars
  featureFlags: number; // -1 = unlimited
  activeExperiments: number; // -1 = unlimited
  eventsPerDay: number; // -1 = unlimited
  audienceRules: boolean;
  customEvents: boolean;
  features: string[];
};

export const EXPERIMENT_PLANS: Record<ExperimentTier, ExperimentPlan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    featureFlags: 5,
    activeExperiments: 2,
    eventsPerDay: 1000,
    audienceRules: false,
    customEvents: false,
    features: [
      "5 feature flags",
      "2 active experiments",
      "1,000 events/day",
      "Basic A/B testing",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 29,
    featureFlags: 20,
    activeExperiments: 10,
    eventsPerDay: 50000,
    audienceRules: true,
    customEvents: false,
    features: [
      "20 feature flags",
      "10 active experiments",
      "50,000 events/day",
      "Audience targeting",
      "Rollout controls",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 99,
    featureFlags: 100,
    activeExperiments: 50,
    eventsPerDay: 500000,
    audienceRules: true,
    customEvents: true,
    features: [
      "100 feature flags",
      "50 active experiments",
      "500,000 events/day",
      "Advanced targeting",
      "Custom events",
      "Conversion tracking",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 299,
    featureFlags: -1, // unlimited
    activeExperiments: -1, // unlimited
    eventsPerDay: -1, // unlimited
    audienceRules: true,
    customEvents: true,
    features: [
      "Unlimited flags",
      "Unlimited experiments",
      "Unlimited events",
      "Advanced targeting",
      "Custom events",
      "Conversion tracking",
      "Priority support",
      "SLA guarantee",
    ],
  },
};

export type ExperimentType = "ab_test" | "multivariate" | "feature_flag";
export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "archived";
export type TargetingRuleOperator = "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "in" | "not_in";

export type TargetingRule = {
  attribute: string; // e.g., "country", "user_role", "email"
  operator: TargetingRuleOperator;
  value: string | string[] | number;
};

export type Audience = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  rules: TargetingRule[];
  created_at: string;
  updated_at: string;
};

export type ExperimentVariant = {
  id: string;
  experiment_id: string;
  name: string;
  key: string; // e.g., "control", "variant_a"
  description: string | null;
  weight: number; // 0-100, sum of all variants should be 100
  is_control: boolean;
  metadata: Record<string, unknown> | null;
};

export type Experiment = {
  id: string;
  tenant_id: string;
  name: string;
  key: string; // unique identifier for SDK
  description: string | null;
  type: ExperimentType;
  status: ExperimentStatus;
  rollout_percentage: number; // 0-100
  audience_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  variants?: ExperimentVariant[];
  audience?: Audience | null;
};

export type FeatureFlag = {
  id: string;
  tenant_id: string;
  name: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number; // 0-100
  audience_id: string | null;
  created_at: string;
  updated_at: string;
  audience?: Audience | null;
};

export type ExposureEvent = {
  id: string;
  tenant_id: string;
  experiment_id: string | null;
  flag_id: string | null;
  variant_id: string | null;
  user_id: string | null; // authenticated user
  anonymous_id: string | null; // anonymous user
  session_id: string | null;
  attributes: Record<string, unknown> | null;
  created_at: string;
};

export type ConversionEvent = {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  event_name: string;
  event_value: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ExperimentStats = {
  experiment_id: string;
  variant_id: string;
  exposures: number;
  conversions: number;
  conversion_rate: number;
  unique_users: number;
};

export type ExperimentSubscription = {
  id: string;
  tenant_id: string;
  tier: ExperimentTier;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
};

export type ExperimentUsage = {
  tenant_id: string;
  period_start: string;
  active_experiments: number;
  active_flags: number;
  total_exposures: number;
  total_conversions: number;
};

// SDK types
export type SDKConfig = {
  experiments: {
    id: string;
    key: string;
    type: ExperimentType;
    status: ExperimentStatus;
    rollout_percentage: number;
    variants: {
      id: string;
      key: string;
      weight: number;
      is_control: boolean;
    }[];
    audience_rules?: TargetingRule[];
  }[];
  flags: {
    id: string;
    key: string;
    enabled: boolean;
    rollout_percentage: number;
    audience_rules?: TargetingRule[];
  }[];
};

export type VariantAssignment = {
  experimentKey: string;
  variantKey: string;
  variantId: string;
};

export type FlagEvaluation = {
  flagKey: string;
  enabled: boolean;
  eligible: boolean;
};

// Helper functions
export function canCreateExperiment(
  currentCount: number,
  plan: ExperimentPlan
): { allowed: boolean; reason?: string } {
  if (plan.activeExperiments === -1) return { allowed: true };
  
  if (currentCount >= plan.activeExperiments) {
    return {
      allowed: false,
      reason: `Active experiment limit reached (${plan.activeExperiments}). Upgrade your plan.`,
    };
  }
  
  return { allowed: true };
}

export function canCreateFlag(
  currentCount: number,
  plan: ExperimentPlan
): { allowed: boolean; reason?: string } {
  if (plan.featureFlags === -1) return { allowed: true };
  
  if (currentCount >= plan.featureFlags) {
    return {
      allowed: false,
      reason: `Feature flag limit reached (${plan.featureFlags}). Upgrade your plan.`,
    };
  }
  
  return { allowed: true };
}

export function isEventLimitExceeded(
  currentEvents: number,
  plan: ExperimentPlan
): boolean {
  if (plan.eventsPerDay === -1) return false;
  return currentEvents >= plan.eventsPerDay;
}

// Bucketing algorithm (consistent hash-based)
export function assignVariant(
  experimentKey: string,
  userId: string,
  variants: { id: string; key: string; weight: number }[]
): string {
  // Simple hash function for consistent bucketing
  const hash = simpleHash(experimentKey + userId);
  const bucket = hash % 100;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.key;
    }
  }
  
  // Fallback to first variant
  return variants[0]?.key || "control";
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Evaluate targeting rules
export function evaluateRules(
  rules: TargetingRule[],
  attributes: Record<string, unknown>
): boolean {
  if (rules.length === 0) return true;
  
  return rules.every((rule) => {
    const attrValue = attributes[rule.attribute];
    
    switch (rule.operator) {
      case "equals":
        return attrValue === rule.value;
      case "not_equals":
        return attrValue !== rule.value;
      case "contains":
        return String(attrValue).includes(String(rule.value));
      case "not_contains":
        return !String(attrValue).includes(String(rule.value));
      case "greater_than":
        return Number(attrValue) > Number(rule.value);
      case "less_than":
        return Number(attrValue) < Number(rule.value);
      case "in":
        return Array.isArray(rule.value) && rule.value.includes(attrValue as string);
      case "not_in":
        return Array.isArray(rule.value) && !rule.value.includes(attrValue as string);
      default:
        return false;
    }
  });
}

export function formatEventCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
