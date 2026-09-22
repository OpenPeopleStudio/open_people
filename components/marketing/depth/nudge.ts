"use client";

import { useSyncExternalStore } from "react";

/**
 * Nudge settings and the one-at-a-time rule.
 * A nudge is a quiet inline line under a card ("Want the receipt for 1.8¢?").
 * Never a toast, never a modal, one per card per session, one visible at a time,
 * off under reduced motion, and switchable off in the rail.
 */
const STORAGE_KEY = "op.nudges";
const SESSION_PREFIX = "op.nudged:";

const listeners = new Set<() => void>();
let enabled: boolean | null = null;
let activeId: string | null = null;

function read(): boolean {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "on";
  } catch {
    return true;
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function nudgesEnabled(): boolean {
  if (enabled === null) enabled = read();
  return enabled;
}

export function setNudgesEnabled(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // ignore
  }
  if (!next) activeId = null;
  emit();
}

export function useNudgesEnabled() {
  return useSyncExternalStore(subscribe, nudgesEnabled, () => true);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function alreadyNudged(id: string): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

export function markNudged(id: string) {
  try {
    window.sessionStorage.setItem(SESSION_PREFIX + id, "1");
  } catch {
    // ignore
  }
}

/** Claim the single visible nudge slot. Returns false if another card holds it. */
export function claimNudge(id: string): boolean {
  if (activeId && activeId !== id) return false;
  activeId = id;
  return true;
}

export function releaseNudge(id: string) {
  if (activeId === id) activeId = null;
}

/** Test-only. */
export function resetNudgeStore() {
  enabled = null;
  activeId = null;
}
