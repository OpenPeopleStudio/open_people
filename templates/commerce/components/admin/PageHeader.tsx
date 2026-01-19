'use client'

import { ReactNode } from 'react'
import Button from '../../../components/ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }>
}

export default function PageHeader({ title, subtitle, actions, stats }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-4 sm:p-6 hover:border-[var(--border-glow)] transition-all duration-300"
            >
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                {stat.label}
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] bg-clip-text text-transparent">
                  {stat.value}
                </div>
                {stat.trend && stat.trendValue && (
                  <div className={`text-xs font-semibold flex items-center gap-1 pb-1 ${
                    stat.trend === 'up' ? 'text-[var(--success)]' :
                    stat.trend === 'down' ? 'text-[var(--error)]' :
                    'text-[var(--text-muted)]'
                  }`}>
                    {stat.trend === 'up' && '↗'}
                    {stat.trend === 'down' && '↘'}
                    {stat.trend === 'neutral' && '→'}
                    <span>{stat.trendValue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
