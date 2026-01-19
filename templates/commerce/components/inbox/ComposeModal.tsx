'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import PresenceIndicator from './PresenceIndicator'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string | null
}

interface PresenceData {
  [userId: string]: {
    isOnline: boolean
    lastActiveAt: string | null
  }
}

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  users: User[]
  onStartConversation: (recipientIds: string[], message: string, isGroup: boolean, groupTitle?: string) => Promise<void>
  isFullPage?: boolean
  presenceData?: PresenceData
  initialMode?: 'encrypted' | 'sms' | 'email'
}

export default function ComposeModal({
  isOpen,
  onClose,
  users,
  onStartConversation,
  isFullPage = false,
  presenceData = {},
  initialMode = 'encrypted'
}: ComposeModalProps) {
  const [messageMode, setMessageMode] = useState<'encrypted' | 'sms' | 'email'>(initialMode)
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // For custom recipients (SMS/Email)
  const [customRecipient, setCustomRecipient] = useState('')
  const [emailSubject, setEmailSubject] = useState('')

  const handleSubmit = async () => {
    if (selectedUsers.length === 0 || !message.trim()) {
      setError('Please select recipients and enter a message')
      return
    }

    if (conversationType === 'group' && !groupTitle.trim()) {
      setError('Please enter a group title')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onStartConversation(
        selectedUsers,
        message.trim(),
        conversationType === 'group',
        conversationType === 'group' ? groupTitle.trim() : undefined
      )
      
      // Reset and close
      setSelectedUsers([])
      setMessage('')
      setGroupTitle('')
      setSearch('')
      setConversationType('direct')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    if (conversationType === 'direct') {
      setSelectedUsers([userId])
    } else {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    }
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId))
  }

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name || '').toLowerCase().includes(searchLower)
    )
  })

  const selectedUserObjects = users.filter(u => selectedUsers.includes(u.id))

  if (!isOpen) return null

  // Full page mode (no modal wrapper)
  if (isFullPage) {
    return (
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        {/* Content */}
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Conversation Type
            </label>
            <div className="inline-flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg">
              <button
                onClick={() => {
                  setConversationType('direct')
                  if (selectedUsers.length > 1) {
                    setSelectedUsers([selectedUsers[0]])
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  conversationType === 'direct'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Direct
              </button>
              <button
                onClick={() => setConversationType('group')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  conversationType === 'group'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Group
              </button>
            </div>
          </div>

          {/* Group Title */}
          {conversationType === 'group' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Group Name
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g., Team Discussion, Sales Group..."
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Recipients Section */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {conversationType === 'direct' ? 'Recipient' : `Recipients ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Selected Users Chips */}
            {selectedUserObjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                {selectedUserObjects.map(user => (
                  <div
                    key={user.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-xs font-semibold text-[var(--text-primary)]">
                      {(user.full_name || user.email)?.[0]?.toUpperCase()}
                    </span>
                    <span className="font-medium text-[var(--text-primary)] max-w-[150px] truncate">
                      {user.full_name || user.email}
                    </span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* User List */}
            <div className="max-h-72 overflow-y-auto space-y-1 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-secondary)]">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-[var(--text-muted)]">No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user.id)
                  const presence = presenceData[user.id]
                  const isOnline = presence?.isOnline || false
                  const lastActiveAt = presence?.lastActiveAt || null
                  
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[var(--accent)]/5 border-l-2 border-[var(--accent)]'
                          : 'hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <input
                        type={conversationType === 'direct' ? 'radio' : 'checkbox'}
                        name="recipient"
                        checked={isSelected}
                        onChange={() => toggleUser(user.id)}
                        className="flex-shrink-0 w-4 h-4 text-[var(--accent)] border-[var(--border-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0"
                      />
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-sm font-semibold text-[var(--text-primary)]">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <PresenceIndicator
                            isOnline={isOnline}
                            lastActiveAt={lastActiveAt}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {user.full_name || user.email}
                          </p>
                          {user.role && (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded flex-shrink-0">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.email && user.full_name && (
                            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                          )}
                          {!isOnline && lastActiveAt && (
                            <PresenceIndicator
                              isOnline={false}
                              lastActiveAt={lastActiveAt}
                              showLabel={true}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-[var(--error)] flex-1">{error}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[var(--border-primary)]">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || selectedUsers.length === 0 || !message.trim()}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Modal mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">New Conversation</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {conversationType === 'direct' ? 'Send a direct message' : 'Start a group chat'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-tertiary)]"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Conversation Type
            </label>
            <div className="inline-flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg">
              <button
                onClick={() => {
                  setConversationType('direct')
                  if (selectedUsers.length > 1) {
                    setSelectedUsers([selectedUsers[0]])
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  conversationType === 'direct'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Direct
              </button>
              <button
                onClick={() => setConversationType('group')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  conversationType === 'group'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Group
              </button>
            </div>
          </div>

          {/* Group Title */}
          {conversationType === 'group' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Group Name
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g., Team Discussion, Sales Group..."
                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Recipients Section */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {conversationType === 'direct' ? 'Recipient' : `Recipients ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Selected Users Chips */}
            {selectedUserObjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                {selectedUserObjects.map(user => (
                  <div
                    key={user.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-xs font-semibold text-[var(--text-primary)]">
                      {(user.full_name || user.email)?.[0]?.toUpperCase()}
                    </span>
                    <span className="font-medium text-[var(--text-primary)] max-w-[150px] truncate">
                      {user.full_name || user.email}
                    </span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* User List */}
            <div className="max-h-56 overflow-y-auto space-y-1 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-tertiary)]">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-[var(--text-muted)]">No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user.id)
                  const presence = presenceData[user.id]
                  const isOnline = presence?.isOnline || false
                  const lastActiveAt = presence?.lastActiveAt || null
                  
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[var(--accent)]/5 border-l-2 border-[var(--accent)]'
                          : 'hover:bg-[var(--bg-primary)]'
                      }`}
                    >
                      <input
                        type={conversationType === 'direct' ? 'radio' : 'checkbox'}
                        name="recipient"
                        checked={isSelected}
                        onChange={() => toggleUser(user.id)}
                        className="flex-shrink-0 w-4 h-4 text-[var(--accent)] border-[var(--border-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0"
                      />
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-sm font-semibold text-[var(--text-primary)]">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <PresenceIndicator
                            isOnline={isOnline}
                            lastActiveAt={lastActiveAt}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {user.full_name || user.email}
                          </p>
                          {user.role && (
                            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-primary)] text-[var(--text-muted)] rounded flex-shrink-0">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.email && user.full_name && (
                            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                          )}
                          {!isOnline && lastActiveAt && (
                            <PresenceIndicator
                              isOnline={false}
                              lastActiveAt={lastActiveAt}
                              showLabel={true}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-[var(--error)] flex-1">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={loading || selectedUsers.length === 0 || !message.trim()}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

