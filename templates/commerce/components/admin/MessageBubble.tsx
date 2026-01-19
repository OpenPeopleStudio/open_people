'use client'

import { useState } from 'react'

interface MessageBubbleProps {
  content: string
  isOwn: boolean
  timestamp: string
  isEncrypted?: boolean
  senderName?: string
  showAvatar?: boolean
  messageId?: string
  onLike?: (messageId: string) => void
  isLiked?: boolean
}

export default function MessageBubble({
  content,
  isOwn,
  timestamp,
  isEncrypted,
  senderName,
  showAvatar = true,
  messageId,
  onLike,
  isLiked = false,
}: MessageBubbleProps) {
  const [showReaction, setShowReaction] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  // Safely handle invalid timestamps
  const time = timestamp && !isNaN(new Date(timestamp).getTime())
    ? new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : ''

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowReaction(true)
    }, 500) // 500ms long press
    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setShowReaction(true)
    }, 500)
    setLongPressTimer(timer)
  }

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleLike = () => {
    if (messageId && onLike) {
      onLike(messageId)
    }
    setShowReaction(false)
  }

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isOwn 
            ? 'bg-[#007AFF] text-white' 
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
        }`}>
          {senderName?.[0]?.toUpperCase() || (isOwn ? 'Y' : 'T')}
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col max-w-[75%] md:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for received messages) */}
        {!isOwn && senderName && (
          <div className="text-xs text-[var(--text-muted)] mb-1.5 px-3">
            {senderName}
          </div>
        )}

        {/* Bubble with speech tail */}
        <div className="relative">
          <div 
            className={`relative px-4 py-3 rounded-xl shadow-sm ${
              isOwn
                ? 'bg-[#007AFF] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Reaction popup */}
            {showReaction && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-full px-4 py-2 shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={handleLike}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  ❤️
                </button>
                <button
                  onClick={handleLike}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  👍
                </button>
                <button
                  onClick={handleLike}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  😂
                </button>
                <button
                  onClick={() => setShowReaction(false)}
                  className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Like indicator */}
            {isLiked && (
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                <span className="text-xs">❤️</span>
              </div>
            )}
            {/* Encryption indicator */}
            {isEncrypted && (
              <div className="flex items-center gap-1.5 mb-1.5 text-xs opacity-70">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Encrypted</span>
              </div>
            )}

            {/* Content */}
            <div className={`text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${
              content.startsWith('[') ? 'italic opacity-70' : ''
            }`}>
              {content}
            </div>

            {/* Timestamp */}
            {time && (
              <div className={`text-[11px] mt-1.5 ${
                isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
              }`}>
                {time}
              </div>
            )}
          </div>

          {/* Speech bubble tail */}
          <div 
            className={`absolute -bottom-[2px] w-3 h-3 overflow-hidden ${
              isOwn ? '-right-[6px]' : '-left-[6px]'
            }`}
          >
            <div 
              className={`absolute w-4 h-4 rounded-sm ${
                isOwn 
                  ? 'bg-[#007AFF] -left-2 rotate-45 origin-bottom-left' 
                  : 'bg-[var(--bg-secondary)] -right-2 -rotate-45 origin-bottom-right border-b border-r border-[var(--border-primary)]'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
