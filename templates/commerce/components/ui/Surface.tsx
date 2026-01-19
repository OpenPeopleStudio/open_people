import type { HTMLAttributes } from 'react'

type SurfaceVariant = 'default' | 'elevated' | 'outline'
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg'

const variants: Record<SurfaceVariant, string> = {
  default: 'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-[var(--radius-2xl)] transition-all duration-300 hover:border-[var(--border-glow)] hover:shadow-[0_0_20px_rgba(255,0,255,0.2)]',
  elevated: 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft)] transition-all duration-300',
  outline: 'border border-[var(--glass-border)] rounded-[var(--radius-2xl)] transition-all duration-300 hover:border-[var(--border-glow)]',
}

const padding: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant
  padding?: SurfacePadding
}

export default function Surface({
  variant = 'default',
  padding: pad = 'md',
  className = '',
  ...props
}: SurfaceProps) {
  const classes = [variants[variant], padding[pad], className]
    .filter(Boolean)
    .join(' ')

  return <div {...props} className={classes} />
}
