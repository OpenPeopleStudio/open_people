"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_VOICE_MODE,
  VOICE_QUERY_PARAM,
  VOICE_STORAGE_KEY,
  parseStoredVoiceMode,
  parseVoiceQueryParam,
  voiceModeToQueryValue,
  type VoiceMode,
} from "@/lib/voice-mode";

type VoiceModeContextValue = {
  mode: VoiceMode;
  setMode: (mode: VoiceMode) => void;
};

const VoiceModeContext = createContext<VoiceModeContextValue | null>(null);

const listeners = new Set<() => void>();
let clientMode: VoiceMode | null = null;
let didPersistUrl = false;

function persistMode(mode: VoiceMode) {
  try {
    window.localStorage.setItem(VOICE_STORAGE_KEY, mode);
  } catch {
    // Private mode / blocked storage — preference still works for this session.
  }
}

function writeQuery(mode: VoiceMode) {
  const url = new URL(window.location.href);
  url.searchParams.set(VOICE_QUERY_PARAM, voiceModeToQueryValue(mode));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function readClientMode(): VoiceMode {
  const fromUrl = parseVoiceQueryParam(
    new URLSearchParams(window.location.search).get(VOICE_QUERY_PARAM)
  );
  if (fromUrl) return fromUrl;
  try {
    const stored = parseStoredVoiceMode(window.localStorage.getItem(VOICE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_VOICE_MODE;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!didPersistUrl) {
    didPersistUrl = true;
    const fromUrl = parseVoiceQueryParam(
      new URLSearchParams(window.location.search).get(VOICE_QUERY_PARAM)
    );
    if (fromUrl) persistMode(fromUrl);
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): VoiceMode {
  if (clientMode === null) clientMode = readClientMode();
  return clientMode;
}

function getServerSnapshot(): VoiceMode {
  return DEFAULT_VOICE_MODE;
}

function applyMode(next: VoiceMode) {
  clientMode = next;
  persistMode(next);
  writeQuery(next);
  emit();
}

/** Test-only: clear the client store between jsdom cases. */
export function resetVoiceModeStore() {
  clientMode = null;
  didPersistUrl = false;
}

export function VoiceModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setMode = useCallback((next: VoiceMode) => {
    applyMode(next);
  }, []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <VoiceModeContext.Provider value={value}>{children}</VoiceModeContext.Provider>;
}

export function useVoiceMode() {
  const ctx = useContext(VoiceModeContext);
  if (!ctx) {
    throw new Error("useVoiceMode must be used within VoiceModeProvider");
  }
  return ctx;
}

/** Depth helpers on top of the same store. */
export function useDepth() {
  const { mode, setMode } = useVoiceMode();
  return {
    depth: mode,
    setDepth: setMode,
    isPlain: mode === "plain",
    isGuided: mode === "guided",
    isTechnical: mode === "technical",
  };
}
