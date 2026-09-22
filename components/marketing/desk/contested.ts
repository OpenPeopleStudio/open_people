import { CONTESTED_EXPORT } from "@/lib/desk";

export type ContestedSlotId = "start" | "life-average";

export type ContestedSlot = {
  id: ContestedSlotId;
  /** One-breath scan line a non-expert can read in five seconds. */
  kicker: string;
  path: "start" | "average";
};

/**
 * Two equal-weight columns on /costs. Heritage 0.2¢ stays in section 01 —
 * it is a different era, not a third measurement of the new paper.
 * Facts come from CONTESTED_EXPORT.start / .average (landed on main).
 */
export const CONTESTED_RATE_SLOTS: readonly ContestedSlot[] = [
  {
    id: "start",
    kicker: "Starts ~1.8¢ in 2027",
    path: "start",
  },
  {
    id: "life-average",
    kicker: "Averages ~7.4¢ over the life",
    path: "average",
  },
];

export function resolveContestedSlots(data = CONTESTED_EXPORT) {
  return CONTESTED_RATE_SLOTS.map((slot) => ({
    slot,
    marker: data[slot.path],
  }));
}
