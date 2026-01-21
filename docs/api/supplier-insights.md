# Supplier Insights API (Suppliers & Staff)

Expose restaurant performance, wine cellar status, and trends to suppliers with scoped access, forecasts, and a conversational helper.

## Auth & Access
- Header: `x-supplier-key: <token>` (use supplier-scoped keys for vendors, staff keys for internal users).
- Roles: `supplier` (read-only metrics, forecasts, chat); `staff` (full, can include internal notes when wired).
- Rate limits: start with 60 req/min per key; audit log all supplier calls.

## Endpoints

### GET `/api/supplier-insights`
**Purpose:** KPIs & trends for a time range and optional SKU.

Query:
- `from` (ISO date, optional; default now-30d)
- `to` (ISO date, optional; default now)
- `sku` (optional, single SKU filter)

Response (excerpt):
```json
{
  "summary": {
    "timeRange": { "from": "...", "to": "..." },
    "totalRevenue": 2580,
    "totalUnits": 227
  },
  "topMovers": [{ "sku": "WINE-CHARD-001", "avgDailyUnits": 15.3, "daysOfCover": 4.4 }],
  "laggards": [...],
  "mix": [{ "sku": "WINE-CHARD-001", "glassShare": 0.69, "bottleShare": 0.31 }],
  "inventory": [{ "sku": "WINE-CHARD-001", "onHand": 68, "daysOfCover": 4.4 }]
}
```

### POST `/api/supplier-insights/forecast`
**Purpose:** Reorder guidance using velocity + lead time + safety stock.

Body:
```json
{ "sku": "WINE-CHARD-001", "daysForward": 14, "targetServiceDays": 21 }
```

Response:
```json
{
  "assumptions": { "daysForward": 14, "targetServiceDays": 21 },
  "recommendations": [
    {
      "sku": "WINE-CHARD-001",
      "currentOnHand": 68,
      "projectedDepletionInDays": 4.4,
      "recommendedOrderUnits": 74,
      "reason": "Projected to dip below target coverage; account for lead time and safety stock."
    }
  ]
}
```

### POST `/api/supplier-insights/chat`
**Purpose:** Conversational Q&A (stub) grounded on metrics; wire to LLM later.

Body:
```json
{
  "message": "How are Chardonnay sales trending?",
  "timeRange": { "from": "2026-01-01", "to": "2026-01-31" },
  "focusSku": "WINE-CHARD-001"
}
```

Response:
```json
{
  "reply": "... grounded summary ...",
  "context": { "timeRange": { "from": "...", "to": "..." }, "focusSku": "WINE-CHARD-001" }
}
```

## Data & Derivations (current stubs)
- Sources: POS sales (glass/bottle), inventory on hand, wine cellar catalog.
- Metrics: velocity (units/day), days-of-cover = onHand / velocity, mix (%glass/%bottle), top movers vs laggards.
- Forecast: recommended order = target service horizon + lead time + safety stock − onHand (floored at 0).
- Reviews: placeholder; add once available.

## LLM Grounding Contract (forward path)
- Tools: `getMetrics(timeRange, sku?)`, `getForecast(sku?, daysForward?, targetServiceDays?)`.
- Guardrails: scope to supplier key; enforce SKU whitelist per supplier; return only aggregated data.
- Context: time range, SKU focus, key assumptions; refuse unsupported asks (e.g., raw PII).

## Testing Plan
- Unit: metrics calculations (velocity, days-of-cover, mix), forecast math edge cases (zero velocity, high safety stock).
- Contract tests: example requests vs stable JSON shapes for the three endpoints.
- Fixtures: sample POS sales, inventory, lead times; glass vs bottle mix.
