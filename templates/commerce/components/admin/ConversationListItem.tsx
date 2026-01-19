'use client'

interface ConversationListItemProps {
  name: string
  email: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isSelected: boolean
  hasEncryption: boolean
  onClick: () => void
}

export default function ConversationListItem({
  name,
  email,
  lastMessage,
  timestamp,
  unreadCount,
  isSelected,
  hasEncryption,
  onClick,
}: ConversationListItemProps) {
  const time = new Date(timestamp)
  const isToday = new Date().toDateString() === time.toDateString()
  const timeStr = isToday 
    ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : time.toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 transition-colors border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] ${
        isSelected ? 'bg-[var(--bg-tertiary)] md:bg-[var(--bg-secondary)]' : ''
      } active:bg-[var(--bg-tertiary)]`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 md:w-10 md:h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
          {name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="font-medium text-sm text-[var(--text-primary)] truncate">
              {name || email}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {hasEncryption && (
                <svg className="w-3 h-3 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-[var(--text-muted)]">{timeStr}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${
              unreadCount > 0 
                ? 'text-[var(--text-primary)] font-medium' 
                : 'text-[var(--text-muted)]'
            }`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Email (desktop only) */}
          <div className="hidden md:block text-xs text-[var(--text-muted)] mt-1 truncate">
            {email}
          </div>
        </div>
      </div>
    </button>
  )
}
