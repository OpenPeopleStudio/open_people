'use client'

interface PresenceIndicatorProps {
  isOnline: boolean
  lastActiveAt: string | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PresenceIndicator({
  isOnline,
  lastActiveAt,
  showLabel = false,
  size = 'md'
}: PresenceIndicatorProps) {
  const formatLastSeen = (timestamp: string | null): string => {
    if (!timestamp) return 'Never active'

    const now = new Date()
    const lastActive = new Date(timestamp)
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return lastActive.toLocaleDateString()
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  }

  const dotSize = sizeClasses[size]

  if (!showLabel) {
    return (
      <span
        className={`${dotSize} rounded-full ${
          isOnline
            ? 'bg-[var(--success)] shadow-[0_0_8px_rgba(34,197,94,0.5)]'
            : 'bg-[var(--text-muted)]'
        } flex-shrink-0`}
        title={isOnline ? 'Online' : `Last seen ${formatLastSeen(lastActiveAt)}`}
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${dotSize} rounded-full ${
          isOnline
            ? 'bg-[var(--success)] shadow-[0_0_8px_rgba(34,197,94,0.5)]'
            : 'bg-[var(--text-muted)]'
        } flex-shrink-0`}
      />
      <span className="text-xs text-[var(--text-muted)]">
        {isOnline ? 'Online now' : `Last seen ${formatLastSeen(lastActiveAt)}`}
      </span>
    </div>
  )
}
