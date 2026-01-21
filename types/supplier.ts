/**
 * Supplier Insights Types
 *
 * Shared types for supplier-facing performance, inventory, and forecasting APIs.
 */

export type TimeGranularity = "day" | "week" | "month";

export interface TimeRange {
  from: string; // ISO date
  to: string;   // ISO date
}

export type UnitType = "glass" | "bottle" | "case";

export interface SalesRecord {
  sku: string;
  name: string;
  category: string;
  unit: UnitType;
  quantity: number;
  revenue: number;
  timestamp: string; // ISO datetime
  channel: "dine_in" | "bar" | "retail";
}

export interface InventoryRecord {
  sku: string;
  name: string;
  onHand: number;
  parLevel?: number;
  leadTimeDays?: number;
  safetyStock?: number;
  unit: UnitType;
}

export interface ReviewSignal {
  sku: string;
  averageRating: number;
  reviewCount: number;
  period: TimeRange;
}

export interface VelocityMetric {
  sku: string;
  avgDailyUnits: number;
  daysOfCover: number | null;
}

export interface MixMetric {
  sku: string;
  glassShare: number; // 0-1
  bottleShare: number; // 0-1
}

export interface KPIBundle {
  timeRange: TimeRange;
  totalRevenue: number;
  totalUnits: number;
  avgTicket?: number;
  topMovers: VelocityMetric[];
  laggards: VelocityMetric[];
  mix: MixMetric[];
  inventory: Array<InventoryRecord & { daysOfCover: number | null }>;
}

export interface ForecastRequest {
  sku?: string;
  daysForward?: number;
  targetServiceDays?: number;
}

export interface ForecastRecommendation {
  sku: string;
  currentOnHand: number;
  projectedDepletionInDays: number | null;
  recommendedOrderUnits: number;
  reason: string;
}

export interface ForecastResponse {
  recommendations: ForecastRecommendation[];
  assumptions: {
    daysForward: number;
    targetServiceDays: number;
  };
}

export interface ChatPrompt {
  message: string;
  from?: string; // supplier/staff identifier
  timeRange?: TimeRange;
  focusSku?: string;
}

export interface ChatReply {
  reply: string;
  context: {
    timeRange: TimeRange;
    focusSku?: string;
  };
}
