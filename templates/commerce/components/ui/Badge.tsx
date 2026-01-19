import { ReactNode } from 'react'

export type BadgeVariant = 'primary' | 'info' | 'time' | 'success' | 'neutral'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_15px_rgba(255,0,255,0.4)]',
  info: 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)] shadow-[0_0_15px_rgba(0,240,255,0.3)]',
  time: 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]',
  success: 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)] shadow-[0_0_15px_rgba(0,255,136,0.3)]',
  neutral: 'bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--glass-border)]',
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span 
      className={`inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Pre-configured badge types for common use cases
export function DropBadge() {
  return <Badge variant="primary">Drop</Badge>
}

export function NewBadge() {
  return <Badge variant="info">New</Badge>
}

export function EndingSoonBadge() {
  return <Badge variant="time">Ending Soon</Badge>
}

export function PriceDropBadge() {
  return <Badge variant="success">Price Drop</Badge>
}

export function LimitedBadge() {
  return <Badge variant="neutral">Limited</Badge>
}
