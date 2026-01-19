'use client'

import PresenceIndicator from './PresenceIndicator'

interface ConversationCardProps {
  id: string
  name: string
  email?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isSelected: boolean
  hasEncryption?: boolean
  isOnline?: boolean
  lastActiveAt?: string | null
  avatarUrl?: string
  conversationType: 'customer' | 'team' | 'direct' | 'group'
  onClick: () => void
}

export default function ConversationCard({
  id,
  name,
  email,
  lastMessage,
  timestamp,
  unreadCount,
  isSelected,
  hasEncryption = false,
  isOnline = false,
  lastActiveAt = null,
  avatarUrl,
  conversationType,
  onClick
}: ConversationCardProps) {
  // Safely handle timestamp
  const time = new Date(timestamp)
  const now = new Date()
  
  // Check if timestamp is valid
  const isValidDate = !isNaN(time.getTime())
  const isToday = isValidDate && now.toDateString() === time.toDateString()
  const isThisWeek = isValidDate && (now.getTime() - time.getTime()) < 7 * 24 * 60 * 60 * 1000

  let timeStr: string
  if (!isValidDate) {
    timeStr = ''
  } else if (isToday) {
    timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (isThisWeek) {
    timeStr = time.toLocaleDateString([], { weekday: 'short' })
  } else {
    timeStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 group ${
        isSelected
          ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
          : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar with presence indicator */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-primary)]">
              {initials}
            </div>
          )}
          {/* Presence dot */}
          <div className="absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator
              isOnline={isOnline}
              lastActiveAt={lastActiveAt}
              size="sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className={`font-semibold text-sm truncate ${
                unreadCount > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}>
                {name}
              </span>
              {hasEncryption && (
                <svg className="w-3 h-3 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{timeStr}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs truncate ${
              unreadCount > 0
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)]'
            }`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span className="flex-shrink-0 min-w-[16px] h-[16px] rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {/* Email for customers (desktop only) */}
          {email && conversationType === 'customer' && (
            <p className="hidden lg:block text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
              {email}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
