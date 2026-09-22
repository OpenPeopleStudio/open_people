export const VOICE_MODES = ["plain", "technical"] as const;
export type VoiceMode = (typeof VOICE_MODES)[number];

export const DEFAULT_VOICE_MODE: VoiceMode = "plain";
export const VOICE_STORAGE_KEY = "op.voiceMode";
export const VOICE_QUERY_PARAM = "v";

export const VOICE_QUERY_VALUES = {
  plain: "plain",
  technical: "tech",
} as const;

export function parseVoiceQueryParam(value: string | null | undefined): VoiceMode | null {
  if (value === VOICE_QUERY_VALUES.plain) return "plain";
  if (value === VOICE_QUERY_VALUES.technical) return "technical";
  return null;
}

export function parseStoredVoiceMode(value: string | null | undefined): VoiceMode | null {
  if (value === "plain" || value === "technical") return value;
  return null;
}

export function voiceModeToQueryValue(mode: VoiceMode): "plain" | "tech" {
  return VOICE_QUERY_VALUES[mode];
}

export function voiceModeLabel(mode: VoiceMode): "Plain language" | "Technical" {
  return mode === "plain" ? "Plain language" : "Technical";
}
