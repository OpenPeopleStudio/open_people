'use client'

import { useRef, useEffect, useState } from 'react'
import MessageBubble from '../../../components/admin/MessageBubble'
import MessageInput from '../../../components/admin/MessageInput'
import Button from '../../../components/ui/Button'
import PresenceIndicator from './PresenceIndicator'

interface Message {
  id: string
  content: string
  sender_type: 'customer' | 'admin'
  sender_id: string | null
  created_at: string
  encrypted?: boolean
  deleted_at?: string | null
  message_type?: 'text' | 'location'
  location?: { lat: number; lng: number; accuracy?: number } | null
  attachment_path?: string | null
  attachment_name?: string | null
}

interface ThreadParticipant {
  id: string
  name: string
  email?: string
  isOnline: boolean
  lastActiveAt: string | null
  hasEncryption?: boolean
}

interface ThreadViewProps {
  threadType: 'customer' | 'team'
  messages: Message[]
  participants: ThreadParticipant[]
  currentUserId: string
  isEncrypted?: boolean
  loading?: boolean
  sending?: boolean
  newMessage: string
  onMessageChange: (value: string) => void
  onSend: () => void
  onAttach?: (file: File) => void
  onOpenProfile?: () => void
  onDeleteMessage?: (messageId: string) => void
  onDownloadAttachment?: (message: any) => void | Promise<void>
  onBack?: () => void
}

export default function ThreadView({
  threadType,
  messages,
  participants,
  currentUserId,
  isEncrypted = false,
  loading = false,
  sending = false,
  newMessage,
  onMessageChange,
  onSend,
  onAttach,
  onOpenProfile,
  onDeleteMessage,
  onDownloadAttachment,
  onBack
}: ThreadViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showHeader, setShowHeader] = useState(true)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll direction detection
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollingDown = scrollTop > lastScrollTop.current
      const scrollingUp = scrollTop < lastScrollTop.current

      // Show header when scrolling up or at the top
      if (scrollingUp || scrollTop < 50) {
        setShowHeader(true)
      } 
      // Hide header when scrolling down
      else if (scrollingDown && scrollTop > 100) {
        setShowHeader(false)
      }

      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const getParticipant = (senderId: string | null) => {
    return participants.find(p => p.id === senderId)
  }

  const mainParticipant = participants[0]

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Thread Header */}
      <div className={`sticky top-0 z-10 px-4 md:px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] rounded-t-2xl md:rounded-t-3xl backdrop-blur-sm bg-[var(--bg-secondary)]/95 transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-sm font-semibold text-[var(--text-primary)] border border-[var(--border-primary)]">
                {mainParticipant?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <PresenceIndicator
                  isOnline={mainParticipant?.isOnline || false}
                  lastActiveAt={mainParticipant?.lastActiveAt || null}
                  size="sm"
                />
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] truncate">
                  {mainParticipant?.name || 'Unknown'}
                </h3>
                {isEncrypted && (
                  <svg className="w-4 h-4 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {mainParticipant?.email && threadType === 'customer' && (
                <p className="text-xs text-[var(--text-muted)] truncate">{mainParticipant.email}</p>
              )}
              {participants.length > 1 && (
                <p className="text-xs text-[var(--text-muted)]">
                  {participants.length} participants
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onOpenProfile && threadType === 'customer' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenProfile}
                className="hidden md:flex"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[var(--bg-primary)]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-[var(--text-muted)]">No messages yet</p>
              <p className="text-xs text-[var(--text-muted)]">Start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_type === 'admin' || msg.sender_id === currentUserId
              const participant = getParticipant(msg.sender_id)
              const senderName = isOwn ? 'You' : (participant?.name || 'Unknown')
              const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id

              return (
                <div key={msg.id} className="group relative">
                  <MessageBubble
                    content={msg.deleted_at ? '[Message deleted]' : msg.content}
                    isOwn={isOwn}
                    timestamp={msg.created_at}
                    isEncrypted={msg.encrypted}
                    senderName={senderName}
                    showAvatar={showAvatar}
                  />

                  {/* Location link */}
                  {!msg.deleted_at && msg.message_type === 'location' && msg.location && (
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mt-1`}>
                      <a
                        href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent-blue)] hover:underline"
                      >
                        📍 View on map
                      </a>
                    </div>
                  )}

                  {/* Attachment */}
                  {!msg.deleted_at && msg.attachment_path && onDownloadAttachment && (
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mt-2`}>
                      <button
                        onClick={() => onDownloadAttachment(msg)}
                        className={`group/attach flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                          isOwn 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isOwn ? 'bg-white/20' : 'bg-[var(--accent)]/10'
                        }`}>
                          <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className={`text-xs font-medium truncate max-w-[150px] ${
                            isOwn ? 'text-white' : 'text-[var(--text-primary)]'
                          }`}>
                            {msg.attachment_name || 'Attachment'}
                          </p>
                          <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                            Tap to download
                          </p>
                        </div>
                        <svg className={`w-4 h-4 transition-transform group-hover/attach:translate-y-0.5 ${
                          isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Delete button */}
                  {!msg.deleted_at && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="hidden md:block absolute top-0 right-0 -mt-1 -mr-1 bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--error)] border border-[var(--border-primary)] rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete message"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[var(--bg-secondary)]">
        <MessageInput
          value={newMessage}
          onChange={onMessageChange}
          onSend={onSend}
          onAttach={onAttach}
          disabled={sending}
          sending={sending}
          placeholder="xMessage"
        />
      </div>
    </div>
  )
}
