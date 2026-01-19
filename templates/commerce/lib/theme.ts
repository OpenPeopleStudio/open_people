import type { TenantThemeColors } from '@/types/tenant'

export function getThemeStyleVars(colors: TenantThemeColors | undefined) {
  if (!colors) return {}
  return {
    '--bg-primary': colors.bg_primary,
    '--bg-secondary': colors.bg_secondary,
    '--bg-tertiary': colors.bg_tertiary,
    '--bg-elevated': colors.bg_elevated,
    '--text-primary': colors.text_primary,
    '--text-secondary': colors.text_secondary,
    '--text-muted': colors.text_muted,
    '--accent': colors.accent,
    '--accent-hover': colors.accent_hover,
    '--accent-muted': colors.accent_muted,
    '--accent-blue': colors.accent_blue,
    '--accent-blue-hover': colors.accent_blue_hover,
    '--accent-amber': colors.accent_amber,
    '--accent-amber-hover': colors.accent_amber_hover,
    '--border-primary': colors.border_primary,
    '--border-secondary': colors.border_secondary,
    '--success': colors.success,
    '--warning': colors.warning,
    '--error': colors.error,
  } as React.CSSProperties
}
