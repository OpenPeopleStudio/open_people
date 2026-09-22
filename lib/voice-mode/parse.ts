/**
 * Reading depth. Three positions, one rule: the plain sentence never leaves
 * the screen; the technical layer arrives underneath it.
 *
 *  plain     — one-breath takeaway + the figure; technical folded
 *  guided    — plain + a teaser line of the technical block; terms explained
 *  technical — everything unfolded; citations inline
 *
 * `?v=plain|guided|tech` is shareable. Storage key is unchanged from v1.
 */
export const VOICE_MODES = ["plain", "guided", "technical"] as const;
export type VoiceMode = (typeof VOICE_MODES)[number];

export const DEFAULT_VOICE_MODE: VoiceMode = "plain";
export const VOICE_STORAGE_KEY = "op.voiceMode";
export const VOICE_QUERY_PARAM = "v";

export const VOICE_QUERY_VALUES = {
  plain: "plain",
  guided: "guided",
  technical: "tech",
} as const;

export function parseVoiceQueryParam(value: string | null | undefined): VoiceMode | null {
  if (value === VOICE_QUERY_VALUES.plain) return "plain";
  if (value === VOICE_QUERY_VALUES.guided) return "guided";
  if (value === VOICE_QUERY_VALUES.technical) return "technical";
  return null;
}

export function parseStoredVoiceMode(value: string | null | undefined): VoiceMode | null {
  if (value === "plain" || value === "guided" || value === "technical") return value;
  return null;
}

export function voiceModeToQueryValue(mode: VoiceMode): "plain" | "guided" | "tech" {
  return VOICE_QUERY_VALUES[mode];
}

export function voiceModeLabel(mode: VoiceMode): "Plain language" | "Guided" | "Technical" {
  if (mode === "plain") return "Plain language";
  if (mode === "guided") return "Guided";
  return "Technical";
}

/** Short label for the segmented control. */
export function voiceModeShortLabel(mode: VoiceMode): "Plain" | "Guided" | "Technical" {
  if (mode === "plain") return "Plain";
  if (mode === "guided") return "Guided";
  return "Technical";
}
