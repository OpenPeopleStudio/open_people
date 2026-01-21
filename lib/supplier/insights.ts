/**
 * Supplier Insights utilities
 *
 * Provides lightweight computations for sales velocity, days-of-cover,
 * and reorder recommendations. Uses in-memory sample data for now; replace
 * with real POS/inventory sources when available.
 */

import {
  type SalesRecord,
  type InventoryRecord,
  type KPIBundle,
  type VelocityMetric,
  type ForecastResponse,
  type ForecastRecommendation,
  type ForecastRequest,
  type TimeRange,
} from "@/types/supplier";

// Sample data — replace with real data sources.
const sampleSales: SalesRecord[] = [
  {
    sku: "WINE-CHARD-001",
    name: "Chardonnay Reserve",
    category: "white",
    unit: "bottle",
    quantity: 42,
    revenue: 1470,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    channel: "dine_in",
  },
  {
    sku: "WINE-CHARD-001",
    name: "Chardonnay Reserve",
    category: "white",
    unit: "glass",
    quantity: 95,
    revenue: 855,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    channel: "bar",
  },
  {
    sku: "WINE-PN-002",
    name: "Pinot Noir Estate",
    category: "red",
    unit: "bottle",
    quantity: 30,
    revenue: 1260,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    channel: "dine_in",
  },
  {
    sku: "WINE-PN-002",
    name: "Pinot Noir Estate",
    category: "red",
    unit: "glass",
    quantity: 60,
    revenue: 720,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    channel: "bar",
  },
];

const sampleInventory: InventoryRecord[] = [
  {
    sku: "WINE-CHARD-001",
    name: "Chardonnay Reserve",
    onHand: 68,
    parLevel: 80,
    leadTimeDays: 5,
    safetyStock: 20,
    unit: "bottle",
  },
  {
    sku: "WINE-PN-002",
    name: "Pinot Noir Estate",
    onHand: 34,
    parLevel: 60,
    leadTimeDays: 7,
    safetyStock: 15,
    unit: "bottle",
  },
];

function parseTimeRange(from?: string, to?: string): TimeRange {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

function filterSalesByRange(sales: SalesRecord[], range: TimeRange) {
  const start = new Date(range.from).getTime();
  const end = new Date(range.to).getTime();
  return sales.filter((sale) => {
    const ts = new Date(sale.timestamp).getTime();
    return ts >= start && ts <= end;
  });
}

function daysBetween(range: TimeRange): number {
  const diff = new Date(range.to).getTime() - new Date(range.from).getTime();
  return Math.max(1, diff / (1000 * 60 * 60 * 24));
}

function computeVelocityMetrics(
  sales: SalesRecord[],
  range: TimeRange,
  inventory: InventoryRecord[]
): VelocityMetric[] {
  const totalDays = daysBetween(range);
  const grouped = new Map<string, { qty: number }>();

  for (const sale of sales) {
    const existing = grouped.get(sale.sku) || { qty: 0 };
    existing.qty += sale.quantity;
    grouped.set(sale.sku, existing);
  }

  return Array.from(grouped.entries()).map(([sku, { qty }]) => {
    const avgDailyUnits = qty / totalDays;
    const inv = inventory.find((i) => i.sku === sku);
    const daysOfCover =
      inv && avgDailyUnits > 0 ? Number((inv.onHand / avgDailyUnits).toFixed(1)) : null;
    return {
      sku,
      avgDailyUnits: Number(avgDailyUnits.toFixed(2)),
      daysOfCover,
    };
  });
}

function computeMix(sales: SalesRecord[]): Record<string, { glass: number; bottle: number }> {
  const mix = new Map<string, { glass: number; bottle: number }>();
  for (const sale of sales) {
    if (!["glass", "bottle"].includes(sale.unit)) continue;
    const entry = mix.get(sale.sku) || { glass: 0, bottle: 0 };
    if (sale.unit === "glass") entry.glass += sale.quantity;
    if (sale.unit === "bottle") entry.bottle += sale.quantity;
    mix.set(sale.sku, entry);
  }
  return Object.fromEntries(mix.entries());
}

export function buildKpis(
  options: { from?: string; to?: string; sku?: string } = {}
): KPIBundle {
  const range = parseTimeRange(options.from, options.to);
  const sales = filterSalesByRange(
    options.sku ? sampleSales.filter((s) => s.sku === options.sku) : sampleSales,
    range
  );

  const velocity = computeVelocityMetrics(sales, range, sampleInventory);
  const topMovers = [...velocity].sort((a, b) => b.avgDailyUnits - a.avgDailyUnits).slice(0, 5);
  const laggards = [...velocity].sort((a, b) => a.avgDailyUnits - b.avgDailyUnits).slice(0, 5);

  const mix = computeMix(sales);
  const mixArray = Object.entries(mix).map(([sku, m]) => {
    const total = m.glass + m.bottle || 1;
    return {
      sku,
      glassShare: Number((m.glass / total).toFixed(2)),
      bottleShare: Number((m.bottle / total).toFixed(2)),
    };
  });

  const inventoryWithCover = sampleInventory.map((inv) => {
    const vel = velocity.find((v) => v.sku === inv.sku);
    return {
      ...inv,
      daysOfCover: vel?.daysOfCover ?? null,
    };
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);

  return {
    timeRange: range,
    totalRevenue,
    totalUnits,
    topMovers,
    laggards,
    mix: mixArray,
    inventory: inventoryWithCover,
  };
}

export function buildForecast(
  request: ForecastRequest = {}
): ForecastResponse {
  const { daysForward = 14, targetServiceDays = 21, sku } = request;
  const kpis = buildKpis({ sku });
  const recommendations: ForecastRecommendation[] = [];

  for (const inv of kpis.inventory) {
    const vel = kpis.topMovers.find((v) => v.sku === inv.sku) ||
      kpis.laggards.find((v) => v.sku === inv.sku) ||
      { avgDailyUnits: 0, sku: inv.sku, daysOfCover: null };

    const projectedDepletionInDays =
      vel.avgDailyUnits > 0 ? Number((inv.onHand / vel.avgDailyUnits).toFixed(1)) : null;

    const neededForHorizon = vel.avgDailyUnits * (targetServiceDays + (inv.leadTimeDays || 0));
    const recommendedOrderUnits = Math.max(
      0,
      Math.ceil(neededForHorizon - inv.onHand + (inv.safetyStock || 0))
    );

    recommendations.push({
      sku: inv.sku,
      currentOnHand: inv.onHand,
      projectedDepletionInDays,
      recommendedOrderUnits,
      reason:
        recommendedOrderUnits > 0
          ? "Projected to dip below target coverage; account for lead time and safety stock."
          : "Stock sufficient for the chosen horizon.",
    });
  }

  return {
    recommendations,
    assumptions: {
      daysForward,
      targetServiceDays,
    },
  };
}

export function formatChatSummary({
  message,
  range,
  focusSku,
}: {
  message: string;
  range: TimeRange;
  focusSku?: string;
}): string {
  const kpis = buildKpis({ ...range, sku: focusSku });
  const top = kpis.topMovers[0];
  const lag = kpis.laggards[0];
  return [
    `You asked: "${message}".`,
    `Period: ${range.from.slice(0, 10)} → ${range.to.slice(0, 10)}.`,
    top ? `Top mover: ${top.sku} at ${top.avgDailyUnits} units/day.` : "No top mover data.",
    lag ? `Slowest: ${lag.sku} at ${lag.avgDailyUnits} units/day.` : "No laggard data.",
    focusSku ? `Focus SKU: ${focusSku}` : "No specific SKU focus.",
    `Recommendation preview: see /api/supplier-insights/forecast for reorder guidance.`,
  ].join(" ");
}

// Export sample data for testing/preview if needed.
export const supplierSample = {
  sales: sampleSales,
  inventory: sampleInventory,
};
