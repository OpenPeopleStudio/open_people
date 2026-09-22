import { COST_MARKERS, type CostMarker } from "@/lib/desk";

export type ContestedSlotId = "life-average" | "start" | "heritage";

export type ContestedSlot = {
  id: ContestedSlotId;
  kicker: string;
  /** Marker ids to try, first hit wins. Parallel copy PRs may add new ids. */
  markerIds: readonly string[];
};

/**
 * Equal-weight contested export stories on /costs.
 *
 * TODO(contested-copy): a parallel PR may land a sourced life-average marker
 * (~7.4¢). Do not invent 7.4 / 1.8 / 0.2 here. Wire through COST_MARKERS only.
 */
export const CONTESTED_RATE_SLOTS: readonly ContestedSlot[] = [
  {
    id: "life-average",
    kicker: "Life-average",
    markerIds: ["life-average", "cf-life-average", "hq-life-average", "life-avg"],
  },
  {
    id: "start",
    kicker: "Start",
    markerIds: ["reported-export-path", "start-year", "hq-start"],
  },
  {
    id: "heritage",
    kicker: "Heritage",
    markerIds: ["heritage-mills", "heritage"],
  },
];

export function findContestedMarker(
  slot: ContestedSlot,
  markers: readonly CostMarker[] = COST_MARKERS,
): CostMarker | null {
  for (const id of slot.markerIds) {
    const hit = markers.find((row) => row.id === id);
    if (hit) return hit;
  }
  return null;
}

export function resolveContestedSlots(markers: readonly CostMarker[] = COST_MARKERS) {
  return CONTESTED_RATE_SLOTS.map((slot) => ({
    slot,
    marker: findContestedMarker(slot, markers),
  }));
}
