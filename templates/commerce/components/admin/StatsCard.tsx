'use client'

import { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  subtitle?: string
  onClick?: () => void
}

export default function StatsCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  subtitle,
  onClick,
}: StatsCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-[var(--border-glow)] hover:shadow-[0_0_20px_rgba(255,0,255,0.2)] active:scale-98' : 'hover:border-[var(--border-glow)]'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </div>
        {icon && (
          <div className="text-[var(--neon-cyan)] opacity-60">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 mb-1">
        <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] bg-clip-text text-transparent">
          {value}
        </div>
        {trend && trendValue && (
          <div className={`text-sm flex items-center gap-1 font-semibold pb-1 ${
            trend === 'up' ? 'text-[var(--success)]' :
            trend === 'down' ? 'text-[var(--error)]' :
            'text-[var(--text-muted)]'
          }`}>
            {trend === 'up' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {trendValue}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
          {subtitle}
        </div>
      )}
    </Component>
  )
}
