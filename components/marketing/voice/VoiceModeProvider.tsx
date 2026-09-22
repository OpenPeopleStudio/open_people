"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

export function VoiceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VoiceMode>(DEFAULT_VOICE_MODE);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseVoiceQueryParam(params.get(VOICE_QUERY_PARAM));
    if (fromUrl) {
      setModeState(fromUrl);
      persistMode(fromUrl);
      return;
    }
    try {
      const stored = parseStoredVoiceMode(window.localStorage.getItem(VOICE_STORAGE_KEY));
      if (stored) setModeState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setMode = useCallback((next: VoiceMode) => {
    setModeState(next);
    persistMode(next);
    writeQuery(next);
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
