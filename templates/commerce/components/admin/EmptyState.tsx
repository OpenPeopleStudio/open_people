'use client'

import { ReactNode } from 'react'
import Button from '../../../components/ui/Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
      {icon && (
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg md:text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm md:text-base text-[var(--text-muted)] text-center max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
