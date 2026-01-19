'use client'

import { useEffect, useMemo, useState } from 'react'
import Button from '../../../../components/ui/Button'
import Surface from '../../../../components/ui/Surface'

type UserSummary = {
  id: string
  email: string
  full_name: string | null
  role: string | null
}

type Thread = {
  id: string
  type: 'direct' | 'group'
  title: string | null
  created_at: string
  members: string[]
  last_message: { content: string; created_at: string; sender_id: string | null } | null
}

type ChatMessage = {
  id: string
  thread_id: string
  sender_id: string | null
  content: string
  created_at: string
}

export default function TeamChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [users, setUsers] = useState<UserSummary[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct')
  const [newChatTitle, setNewChatTitle] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadThreads = async () => {
    setLoadingThreads(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/team-chat/threads')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to load chats')
      }
      const data = await response.json()
      setThreads(data.threads || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats')
    } finally {
      setLoadingThreads(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/admin/team-chat/messages?threadId=${threadId}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to load messages')
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadUsers = async () => {
    const response = await fetch('/api/admin/messages/users')
    if (!response.ok) return
    const data = await response.json()
    const allUsers = (data.users || []) as UserSummary[]
    setUsers(allUsers.filter((user) => ['staff', 'admin', 'owner'].includes(user.role || '')))
  }

  useEffect(() => {
    loadThreads()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId)
    } else {
      setMessages([])
    }
  }, [selectedThreadId])

  const sendMessage = async () => {
    if (!selectedThreadId || !newMessage.trim()) return
    setSending(true)
    try {
      const response = await fetch('/api/admin/team-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThreadId, content: newMessage }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to send message')
      }
      const data = await response.json()
      setMessages((prev) => [...prev, data.message])
      setNewMessage('')
      loadThreads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const createChat = async () => {
    setError(null)
    const payload = {
      type: newChatType,
      title: newChatType === 'group' ? newChatTitle.trim() : undefined,
      memberIds: selectedMembers,
    }

    const response = await fetch('/api/admin/team-chat/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data?.error || 'Failed to create chat')
      return
    }

    const data = await response.json()
    setShowNewChat(false)
    setNewChatTitle('')
    setSelectedMembers([])
    setNewChatType('direct')
    await loadThreads()
    if (data.thread?.id) {
      setSelectedThreadId(data.thread.id)
    }
  }

  const userById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]))
  }, [users])

  const displayName = (userId: string) => {
    const user = userById.get(userId)
    return user?.full_name || user?.email || 'Unknown'
  }

  const filteredUsers = users.filter((user) => {
    if (!userSearch.trim()) return true
    const q = userSearch.trim().toLowerCase()
    return (
      user.email.toLowerCase().includes(q) ||
      (user.full_name || '').toLowerCase().includes(q)
    )
  })

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Chat</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Internal staff conversations.</p>
        </div>
        <Button onClick={() => setShowNewChat(true)} size="sm">
          New chat
        </Button>
      </div>

      {error && (
        <Surface padding="sm" className="border border-[var(--error)]/30 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </Surface>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface padding="md" className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Chats</h2>
            <Button variant="ghost" size="sm" onClick={loadThreads} disabled={loadingThreads}>
              Refresh
            </Button>
          </div>
          {loadingThreads ? (
            <p className="text-xs text-[var(--text-muted)]">Loading chats…</p>
          ) : threads.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No chats yet.</p>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => {
                const isSelected = selectedThreadId === thread.id
                const memberNames = thread.members.map(displayName)
                const label = thread.type === 'group'
                  ? thread.title || 'Group chat'
                  : memberNames.filter(Boolean).join(', ')
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left border border-[var(--border-primary)] rounded-lg p-3 transition-colors ${
                      isSelected ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                      {thread.last_message?.content || 'No messages yet'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </Surface>

        <Surface padding="md" className="lg:col-span-2 flex flex-col min-h-[540px]">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
              Select a chat to start.
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--border-primary)] pb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {selectedThread.type === 'group'
                    ? selectedThread.title || 'Group chat'
                    : selectedThread.members.map(displayName).join(', ')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {selectedThread.members.length} members
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-4">
                {loadingMessages ? (
                  <p className="text-xs text-[var(--text-muted)]">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="text-sm text-[var(--text-primary)]">
                      <span className="font-medium">{msg.sender_id ? displayName(msg.sender_id) : 'Unknown'}:</span>
                      {' '}
                      {msg.content}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-[var(--border-primary)] pt-3">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </Surface>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">New team chat</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Chat with staff and admins.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={newChatType === 'direct' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setNewChatType('direct')}
                >
                  Direct
                </Button>
                <Button
                  variant={newChatType === 'group' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setNewChatType('group')}
                >
                  Group
                </Button>
              </div>

              {newChatType === 'group' && (
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Group name</label>
                  <input
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    className="mt-2 w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[var(--text-muted)]">Members</label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search staff..."
                  className="mt-2 w-full"
                />
                <div className="mt-3 max-h-56 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => {
                    const checked = selectedMembers.includes(user.id)
                    return (
                      <label key={user.id} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <input
                          type={newChatType === 'direct' ? 'radio' : 'checkbox'}
                          name="chat-member"
                          checked={checked}
                          onChange={() => {
                            if (newChatType === 'direct') {
                              setSelectedMembers([user.id])
                            } else if (checked) {
                              setSelectedMembers(selectedMembers.filter((id) => id !== user.id))
                            } else {
                              setSelectedMembers([...selectedMembers, user.id])
                            }
                          }}
                        />
                        <span>{user.full_name || user.email}</span>
                        <span className="text-xs text-[var(--text-muted)]">({user.role})</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setShowNewChat(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createChat} className="flex-1">
                Create chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
