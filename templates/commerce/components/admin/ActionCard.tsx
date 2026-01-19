'use client'

import { ReactNode } from 'react'

interface ActionCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  badge?: string
  badgeColor?: 'success' | 'warning' | 'error' | 'info'
}

export default function ActionCard({
  title,
  description,
  icon,
  onClick,
  badge,
  badgeColor = 'info',
}: ActionCardProps) {
  const badgeColors = {
    success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
    error: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20',
    info: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
  }

  return (
    <div
      onClick={onClick}
      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl md:rounded-2xl p-5 md:p-6 text-left transition-all hover:border-[var(--accent)]/50 hover:shadow-lg active:scale-95 group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)]/20 transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm md:text-base">
              {title}
            </h3>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeColors[badgeColor]}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-[var(--text-muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
