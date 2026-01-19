'use client'

import { ReactNode } from 'react'

interface MessagesLayoutProps {
  conversationList: ReactNode
  messageThread: ReactNode
  header: ReactNode
  hasSelectedConversation: boolean
  onBack?: () => void
}

export default function MessagesLayout({
  conversationList,
  messageThread,
  header,
  hasSelectedConversation,
  onBack,
}: MessagesLayoutProps) {
  return (
    <div className="flex flex-col h-screen md:h-auto">
      {/* Header - mobile only */}
      <div className="md:hidden sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        {header}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list - email-style on desktop, hidden when conversation selected on mobile */}
        <div className={`${
          hasSelectedConversation ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-96 lg:w-[400px] border-r border-[var(--border-primary)] bg-[var(--bg-primary)]`}>
          {/* Header - desktop only */}
          <div className="hidden md:block sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
            {header}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversationList}
          </div>
        </div>

        {/* Message thread - full screen on mobile, right panel on desktop */}
        <div className={`${
          hasSelectedConversation ? 'flex' : 'hidden md:flex'
        } flex-col flex-1 bg-[var(--bg-primary)]`}>
          {/* Mobile back button header */}
          {hasSelectedConversation && onBack && (
            <div className="md:hidden sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-4 py-3 flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            </div>
          )}

          {/* Message thread */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {messageThread}
          </div>
        </div>
      </div>
    </div>
  )
}
