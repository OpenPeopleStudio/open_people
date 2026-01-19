'use client'

import { useState } from 'react'
import ConversationCard from './ConversationCard'
import Button from '../../../components/ui/Button'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isOnline: boolean
  lastActiveAt: string | null
}

interface CustomerConversation {
  id: string
  customerId: string
  name: string
  email: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  hasEncryption: boolean
  isOnline: boolean
  lastActiveAt: string | null
}

interface ThreadConversation {
  id: string
  type: 'direct' | 'group'
  title: string | null
  members: string[]
  lastMessage: string | null
  lastMessageAt: string
  isOnline?: boolean
  lastActiveAt?: string | null
}

interface InboxSidebarProps {
  teamMembers: TeamMember[]
  customerConversations: CustomerConversation[]
  teamThreads: ThreadConversation[]
  selectedId: string | null
  onSelectConversation: (id: string, type: 'customer' | 'team') => void
  onCompose: () => void
  showUnreadOnly?: boolean
  onToggleUnreadOnly?: () => void
}

export default function InboxSidebar({
  teamMembers,
  customerConversations,
  teamThreads,
  selectedId,
  onSelectConversation,
  onCompose,
  showUnreadOnly = false,
  onToggleUnreadOnly
}: InboxSidebarProps) {
  const [activeSection, setActiveSection] = useState<'all' | 'team' | 'customers'>('all')

  // Calculate unread counts
  const totalUnreadCustomers = customerConversations.reduce((sum, c) => sum + c.unreadCount, 0)
  const hasTeamUnread = teamThreads.some(t => t.lastMessage) // Simplified - would need actual unread logic

  const filteredCustomers = showUnreadOnly 
    ? customerConversations.filter(c => c.unreadCount > 0)
    : customerConversations

  return (
    <div className="hidden md:flex md:w-64 lg:w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex-col h-full">
      {/* Compose Button */}
      <div className="p-3 border-b border-[var(--border-primary)]">
        <Button
          onClick={onCompose}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Compose
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="px-3 py-2 border-b border-[var(--border-primary)]">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSection('all')}
            className={`flex-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeSection === 'all'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveSection('team')}
            className={`flex-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeSection === 'team'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveSection('customers')}
            className={`relative flex-1 px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeSection === 'customers'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Customers
            {totalUnreadCustomers > 0 && (
              <span className="ml-1 px-1 py-0.5 text-[10px] font-bold bg-[var(--accent)] text-white rounded-full">
                {totalUnreadCustomers}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Unread Filter */}
      {(activeSection === 'all' || activeSection === 'customers') && onToggleUnreadOnly && (
        <div className="px-3 py-2 border-b border-[var(--border-primary)]">
          <button
            onClick={onToggleUnreadOnly}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              showUnreadOnly
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Unread only
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Team Chat Section */}
        {(activeSection === 'all' || activeSection === 'team') && (
          <div className="p-2">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Chat
              </h3>
              {hasTeamUnread && activeSection === 'all' && (
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></span>
              )}
            </div>
            <div className="space-y-1">
              {teamThreads.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] px-2 py-2">No team chats yet</p>
              ) : (
                teamThreads.map(thread => (
                  <ConversationCard
                    key={thread.id}
                    id={thread.id}
                    name={thread.title || thread.members.join(', ')}
                    lastMessage={thread.lastMessage || 'No messages yet'}
                    timestamp={thread.lastMessageAt}
                    unreadCount={0}
                    isSelected={selectedId === thread.id}
                    isOnline={thread.isOnline}
                    lastActiveAt={thread.lastActiveAt}
                    conversationType={thread.type === 'group' ? 'group' : 'direct'}
                    onClick={() => onSelectConversation(thread.id, 'team')}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Customers Section */}
        {(activeSection === 'all' || activeSection === 'customers') && (
          <div className="p-2">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Customers
              </h3>
              {totalUnreadCustomers > 0 && (
                <span className="text-[10px] font-semibold text-[var(--accent)]">
                  {totalUnreadCustomers}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] px-2 py-2">
                  {showUnreadOnly ? 'No unread messages' : 'No customer conversations'}
                </p>
              ) : (
                filteredCustomers.map(convo => (
                  <ConversationCard
                    key={convo.id}
                    id={convo.id}
                    name={convo.name}
                    email={convo.email}
                    lastMessage={convo.lastMessage}
                    timestamp={convo.lastMessageAt}
                    unreadCount={convo.unreadCount}
                    isSelected={selectedId === convo.customerId}
                    hasEncryption={convo.hasEncryption}
                    isOnline={convo.isOnline}
                    lastActiveAt={convo.lastActiveAt}
                    conversationType="customer"
                    onClick={() => onSelectConversation(convo.customerId, 'customer')}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--border-primary)]">
        <div className="text-[10px] text-[var(--text-muted)] px-2">
          <div className="flex items-center justify-between">
            <span>Team online</span>
            <span className="font-semibold text-[var(--text-secondary)]">
              {teamMembers.filter(m => m.isOnline).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
