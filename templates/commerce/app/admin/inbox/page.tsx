'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import { usePresence } from '@/hooks/usePresence'
import { useTenant } from '@/context/TenantContext'
import InboxSidebar from '../../../components/inbox/InboxSidebar'
import ConversationCard from '../../../components/inbox/ConversationCard'
import ThreadView from '../../../components/inbox/ThreadView'
import CustomerProfilePanel from '../../../components/inbox/CustomerProfilePanel'
import ComposeModal from '../../../components/inbox/ComposeModal'
import EncryptionSettings from '../../../components/EncryptionSettings'
import KeyBackup from '../../../components/KeyBackup'
import EncryptionLockScreen from '../../../components/EncryptionLockScreen'
import Button from '../../../components/ui/Button'
import { generateFileKey, encryptFileWithKey, decryptFileWithKey } from '@/lib/crypto/e2e'

interface DecryptedMessage {
  id: string
  content: string
  sender_type: 'customer' | 'admin'
  sender_id: string | null
  customer_id: string
  created_at: string
  read?: boolean
  encrypted?: boolean
  deleted_at?: string | null
  deleted_by?: string | null
  deleted_for_both?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  decryptedContent?: string
  message_type?: 'text' | 'location'
  location?: { lat: number; lng: number; accuracy?: number } | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
  attachment_key?: string | null
  attachment_key_iv?: string | null
  attachment_key_sender_public_key?: string | null
  attachment_key_message_index?: number | null
}

type MessageRow = Omit<DecryptedMessage, 'iv' | 'sender_public_key' | 'message_index'> & {
  iv: string | null
  sender_public_key: string | null
  message_index: number | null
}

interface Conversation {
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

interface TeamThread {
  id: string
  type: 'direct' | 'group'
  title: string | null
  members: string[]
  lastMessage: string | null
  lastMessageAt: string
}

interface UserSummary {
  id: string
  email: string
  full_name: string | null
  role: string | null
  created_at?: string
}

type TeamChatMessage = {
  id: string
  content: string
  created_at: string
  sender_id: string | null
}

type TeamChatMessagesResponse = {
  messages?: TeamChatMessage[]
}

type AdminMessageInsert = {
  tenant_id: string
  customer_id: string
  content: string
  sender_type: 'admin'
  read: boolean
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
}

export default function InboxPage() {
  const { id: tenantId } = useTenant()
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [inboxError, setInboxError] = useState<string | null>(null)
  
  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [teamThreads, setTeamThreads] = useState<TeamThread[]>([])
  
  // Selected conversation
  const [selectedType, setSelectedType] = useState<'customer' | 'team' | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // UI state
  const [showCompose, setShowCompose] = useState(false)
  const [showCustomerProfile, setShowCustomerProfile] = useState(false)
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showNewMessageDropdown, setShowNewMessageDropdown] = useState(false)
  
  // Message input
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  // Users for compose modal
  const [users, setUsers] = useState<UserSummary[]>([])
  
  // Encryption
  const {
    isInitialized,
    publicKey,
    encrypt,
    decrypt,
    decryptMessages,
    getRecipientPublicKey,
    backupKeys,
    restoreKeys,
    keyPairs,
    isLocked,
    lockKeys,
    unlockKeys,
    rotateKeys,
    resetSessions,
    updateDeviceLabel
  } = useE2EEncryption(adminId)
  
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  
  // Get all user IDs for presence tracking
  const allUserIds = [
    ...conversations.map(c => c.customerId),
    ...teamThreads.flatMap(t => t.members),
    ...users.map(u => u.id)
  ].filter((id, index, self) => self.indexOf(id) === index)
  
  const { presenceData, getPresence } = usePresence(allUserIds)

  // Get admin ID
  useEffect(() => {
    const getAdminId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setAdminId(user.id)
          setAuthReady(true)
        }
      } catch (error) {
        console.error('Auth error:', error)
      }
    }
    getAdminId()
  }, [])

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!tenantId || tenantId === 'default' || !authReady) return
    
    try {
      setInboxError(null)
      // Load customer conversations
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('customer_id, content, created_at, read, sender_type, encrypted, deleted_at')
        .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
        .order('created_at', { ascending: false })

      if (messagesError) {
        console.error('Failed to load inbox messages:', messagesError)
        setConversations([])
        setTeamThreads([])
        setInboxError(messagesError.message || 'Failed to load conversations')
        return
      }

      if (messagesData) {
        const customerMap = new Map<string, { messages: typeof messagesData; unread: number }>()
        
        messagesData.forEach(msg => {
          if (!customerMap.has(msg.customer_id)) {
            customerMap.set(msg.customer_id, { messages: [], unread: 0 })
          }
          const entry = customerMap.get(msg.customer_id)!
          entry.messages.push(msg)
          if (!msg.read && msg.sender_type === 'customer') {
            entry.unread++
          }
        })

        // Get user info
        const response = await fetch('/api/admin/messages/users')
        const userData = (await response.json()) as { users?: UserSummary[] }
        const usersMap = new Map<string, UserSummary>((userData.users || []).map((u) => [u.id, u]))

        // Get profiles for encryption status
        const customerIds = Array.from(customerMap.keys())
        const { data: profiles, error: profilesError } = await supabase
          .from('709_profiles')
          .select('id, public_key, is_online, last_active_at')
          .in('id', customerIds)
          .eq('tenant_id', tenantId)

        if (profilesError) {
          console.error('Failed to load inbox profiles:', profilesError)
          setInboxError(profilesError.message || 'Failed to load customer profiles')
        }

        const convos: Conversation[] = []
        customerMap.forEach((data, customerId) => {
          const user = usersMap.get(customerId)
          const profile = profiles?.find(p => p.id === customerId)
          const lastMsg = data.messages[0]
          
          convos.push({
            id: customerId,
            customerId,
            name: user?.full_name || user?.email || 'Unknown',
            email: user?.email || '',
            lastMessage: lastMsg.deleted_at
              ? '[Deleted]'
              : lastMsg.encrypted
                ? 'Secure message'
                : lastMsg.content,
            lastMessageAt: lastMsg.created_at,
            unreadCount: data.unread,
            hasEncryption: !!profile?.public_key,
            isOnline: profile?.is_online || false,
            lastActiveAt: profile?.last_active_at || null
          })
        })

        convos.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return dateB - dateA
        })
        
        setConversations(convos)
      }

      // Load team threads
      const threadsResponse = await fetch('/api/admin/team-chat/threads')
      if (threadsResponse.ok) {
        const threadsData = await threadsResponse.json()
        setTeamThreads(threadsData.threads || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      setInboxError(error instanceof Error ? error.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [tenantId, authReady])

  // Load messages for selected conversation
  const loadMessages = useCallback(async (id: string, type: 'customer' | 'team') => {
    if (!tenantId || tenantId === 'default' || !adminId) return
    
    setLoadingMessages(true)
    
    try {
      if (type === 'customer') {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('customer_id', id)
          .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Failed to load conversation messages:', error)
          setInboxError(error.message || 'Failed to load messages')
          setMessages([])
          return
        }

        if (data && isInitialized) {
          const rows = (data ?? []) as unknown as MessageRow[]
          const decryptInput = rows.map((r) => ({
            id: r.id,
            content: r.content,
            encrypted: r.encrypted,
            iv: r.iv ?? undefined,
            sender_public_key: r.sender_public_key ?? undefined,
            message_index: r.message_index ?? undefined,
            sender_type: r.sender_type,
            customer_id: r.customer_id,
          }))
          const decrypted = await decryptMessages(
            decryptInput,
            (msg) => msg.sender_type === 'customer' ? msg.customer_id : adminId
          )
          
          setMessages(decrypted.map(msg => ({
            ...msg,
            content: msg.decryptedContent || msg.content,
            sender_id: msg.sender_type === 'customer' ? msg.customer_id : adminId
          })) as DecryptedMessage[])
        } else if (data) {
          const rows = (data ?? []) as unknown as MessageRow[]
          setMessages(rows.map(r => ({
            ...r,
            content: r.encrypted ? 'Secure message' : r.content,
            iv: r.iv ?? undefined,
            sender_public_key: r.sender_public_key ?? undefined,
            message_index: r.message_index ?? undefined,
            sender_id: r.sender_type === 'customer' ? r.customer_id : adminId
          })) as DecryptedMessage[])
        }

        // Mark as read
        const { error: markReadError } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('customer_id', id)
          .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
          .eq('sender_type', 'customer')
          .eq('read', false)
        
        if (markReadError) {
          console.error('Failed to mark messages read:', markReadError)
        }

        // Update unread count
        setConversations(prev =>
          prev.map(c => (c.customerId === id ? { ...c, unreadCount: 0 } : c))
        )
      } else {
        const response = await fetch(`/api/admin/team-chat/messages?threadId=${id}`)
        if (response.ok) {
          const data = (await response.json()) as TeamChatMessagesResponse
          setMessages((data.messages || []).map((msg) => ({
            ...msg,
            customer_id: '', // Team messages don't have customer context
            content: msg.content,
            sender_type: 'admin',
            sender_id: msg.sender_id
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      setInboxError(error instanceof Error ? error.message : 'Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }, [tenantId, adminId, isInitialized, decryptMessages])

  // Load users for compose modal
  const loadUsers = useCallback(async () => {
    const response = await fetch('/api/admin/messages/users')
    if (response.ok) {
      const data = (await response.json()) as { users?: UserSummary[] }
      setUsers(data.users || [])
    }
  }, [])

  useEffect(() => {
    if (adminId && authReady) {
      loadConversations()
      loadUsers()
    }
  }, [adminId, authReady, loadConversations, loadUsers])

  useEffect(() => {
    if (selectedId && selectedType) {
      loadMessages(selectedId, selectedType)
    }
  }, [selectedId, selectedType, loadMessages])

  // Realtime subscriptions
  useEffect(() => {
    if (!tenantId || !authReady) return

    const channel = supabase
      .channel('inbox-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadConversations()
        if (selectedId && selectedType === 'customer') {
          loadMessages(selectedId, 'customer')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, authReady, selectedId, selectedType, loadConversations, loadMessages])

  const handleSelectConversation = (id: string, type: 'customer' | 'team') => {
    setSelectedId(id)
    setSelectedType(type)
    setShowMobileSidebar(false) // Close sidebar on mobile when selecting conversation
    if (type === 'customer') {
      setShowCustomerProfile(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedId || !selectedType || !tenantId || !adminId) return

    setSending(true)

    try {
      if (selectedType === 'customer') {
        let messageData: AdminMessageInsert = {
          tenant_id: tenantId,
          customer_id: selectedId,
          content: newMessage.trim(),
          sender_type: 'admin',
          read: false
        }

        if (isInitialized) {
          const recipientKey = await getRecipientPublicKey(selectedId)
          if (recipientKey) {
            const encrypted = await encrypt(newMessage.trim(), selectedId)
            if (encrypted) {
              messageData = {
                ...messageData,
                content: encrypted.content,
                encrypted: true,
                iv: encrypted.iv,
                sender_public_key: encrypted.senderPublicKey,
                message_index: encrypted.messageIndex
              }
            }
          }
        }

        const { data, error } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single()

        if (!error && data) {
          setMessages(prev => [...prev, {
            ...data,
            content: newMessage.trim(),
            sender_id: adminId
          }])
          setNewMessage('')
        }
      } else {
        const response = await fetch('/api/admin/team-chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: selectedId, content: newMessage.trim() })
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, {
            ...data.message,
            customer_id: '', // Team messages don't have customer context
            content: data.message.content,
            sender_type: 'admin',
            sender_id: data.message.sender_id
          }])
          setNewMessage('')
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleStartConversation = async (
    recipientIds: string[],
    message: string,
    isGroup: boolean,
    groupTitle?: string
  ) => {
    // Implementation would create new conversation/thread
    console.log('Start conversation:', { recipientIds, message, isGroup, groupTitle })
  }

  const handleDeleteMessage = async (messageId: string) => {
    const response = await fetch('/api/messages/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    })

    if (response.ok) {
      // Update message to show as deleted (soft delete)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, deleted_at: new Date().toISOString(), content: '' }
            : msg
        )
      )
    }
  }

  const handleAttach = async (file: File) => {
    if (!selectedId || !selectedType || !tenantId || !adminId) {
      alert('Please select a conversation first')
      return
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 10MB.')
      return
    }

    setSending(true)

    try {
      // Read file into ArrayBuffer
      const fileBuffer = await file.arrayBuffer()
      
      // Generate a unique file key for encryption
      const fileKey = await generateFileKey()
      
      // Encrypt the file
      const { ciphertext: encryptedFile, iv: fileIv } = await encryptFileWithKey(fileBuffer, fileKey)
      
      // Generate unique storage path
      const timestamp = Date.now()
      const randomId = crypto.randomUUID()
      const extension = file.name.split('.').pop() || 'bin'
      const storagePath = `attachments/${tenantId}/${selectedId}/${timestamp}-${randomId}.enc`
      
      // Upload encrypted file to storage
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(storagePath, new Blob([encryptedFile]), {
          contentType: 'application/octet-stream',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload file. Please try again.')
        setSending(false)
        return
      }

      // Prepare message data
      let messageData: {
        tenant_id: string
        customer_id: string
        content: string
        sender_type: 'admin'
        read: boolean
        attachment_path: string
        attachment_name: string
        attachment_type: string
        attachment_size: number
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
        attachment_key?: string
        attachment_key_iv?: string
        attachment_key_sender_public_key?: string
        attachment_key_message_index?: number
      } = {
        tenant_id: tenantId,
        customer_id: selectedId,
        content: `📎 ${file.name}`,
        sender_type: 'admin',
        read: false,
        attachment_path: storagePath,
        attachment_name: file.name,
        attachment_type: file.type || 'application/octet-stream',
        attachment_size: file.size
      }

      // If encryption is available, encrypt the file key for the recipient
      if (isInitialized && selectedType === 'customer') {
        const recipientKey = await getRecipientPublicKey(selectedId)
        if (recipientKey) {
          // Encrypt the file key using the same E2E encryption as messages
          // This ensures only the recipient can decrypt the file
          const encryptedFileKey = await encrypt(`${fileKey}:${fileIv}`, selectedId)
          
          if (encryptedFileKey) {
            messageData = {
              ...messageData,
              encrypted: true,
              attachment_key: encryptedFileKey.content,
              attachment_key_iv: encryptedFileKey.iv,
              attachment_key_sender_public_key: encryptedFileKey.senderPublicKey,
              attachment_key_message_index: encryptedFileKey.messageIndex
            }
          }
        }
      }

      // Insert message with attachment metadata
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (!error && data) {
        setMessages(prev => [...prev, {
          ...data,
          content: `📎 ${file.name}`,
          sender_id: adminId
        }])
      } else {
        // Clean up uploaded file if message insert fails
        await supabase.storage
          .from('message-attachments')
          .remove([storagePath])
        throw new Error('Failed to save message')
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error)
      alert('Failed to send attachment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleDownloadAttachment = async (message: DecryptedMessage) => {
    if (!message.attachment_path) return

    try {
      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('message-attachments')
        .download(message.attachment_path)

      if (downloadError || !fileData) {
        throw new Error('Failed to download file')
      }

      const encryptedBuffer = await fileData.arrayBuffer()
      let decryptedBuffer: ArrayBuffer

      // Check if the attachment is encrypted
      if (message.attachment_key && message.attachment_key_iv && message.attachment_key_sender_public_key) {
        // Decrypt the file key first
        const decryptedKeyData = await decrypt(
          {
            id: message.id,
            content: message.attachment_key,
            encrypted: true,
            iv: message.attachment_key_iv,
            sender_public_key: message.attachment_key_sender_public_key,
            message_index: message.attachment_key_message_index || 0,
            sender_type: message.sender_type,
            customer_id: message.customer_id
          },
          message.sender_type === 'admin' ? (message.sender_id || '') : message.customer_id
        )

        // Parse the decrypted key data (format: "fileKey:fileIv")
        const [fileKey, fileIv] = decryptedKeyData.split(':')
        
        if (!fileKey || !fileIv) {
          throw new Error('Invalid encrypted file key format')
        }

        // Decrypt the file
        decryptedBuffer = await decryptFileWithKey(encryptedBuffer, fileKey, fileIv)
      } else {
        // File is not encrypted (legacy or unencrypted conversation)
        decryptedBuffer = encryptedBuffer
      }

      // Create blob and trigger download
      const blob = new Blob([decryptedBuffer], { 
        type: message.attachment_type || 'application/octet-stream' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = message.attachment_name || 'attachment'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download attachment:', error)
      alert('Failed to download attachment. The file may be encrypted with a different key.')
    }
  }

  // Get selected conversation participants
  const selectedConversation = selectedType === 'customer'
    ? conversations.find(c => c.customerId === selectedId)
    : null

  const selectedThread = selectedType === 'team'
    ? teamThreads.find(t => t.id === selectedId)
    : null

  const participants = selectedConversation
    ? [{
        id: selectedConversation.customerId,
        name: selectedConversation.name,
        email: selectedConversation.email,
        isOnline: selectedConversation.isOnline,
        lastActiveAt: selectedConversation.lastActiveAt,
        hasEncryption: selectedConversation.hasEncryption
      }]
    : selectedThread
      ? selectedThread.members.map(memberId => {
          const user = users.find(u => u.id === memberId)
          const presence = getPresence(memberId)
          return {
            id: memberId,
            name: user?.full_name || user?.email || 'Unknown',
            email: user?.email,
            isOnline: presence.isOnline,
            lastActiveAt: presence.lastActiveAt
          }
        })
      : []

  const teamMembers = users
    .filter(u => ['staff', 'admin', 'owner'].includes(u.role || ''))
    .map(u => {
      const presence = getPresence(u.id)
      return {
        id: u.id,
        name: u.full_name || u.email,
        email: u.email,
        role: u.role || 'staff',
        isOnline: presence.isOnline,
        lastActiveAt: presence.lastActiveAt
      }
    })

  // Show loading state
  if (!authReady) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[var(--text-muted)]">Loading inbox...</p>
        </div>
      </div>
    )
  }

  // Show lock screen if encryption is locked
  if (isLocked) {
    return (
      <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-[var(--bg-primary)]">
        <EncryptionLockScreen
          onUnlock={unlockKeys}
          error={null}
        />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-primary)]">
      {showCompose ? (
        /* Compose View - Full Page */
        <div className="h-full flex flex-col">
          {/* Header with back button */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <button
              onClick={() => setShowCompose(false)}
              className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-tertiary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">New Conversation</h1>
              <p className="text-sm text-[var(--text-muted)]">Start a direct message or group chat</p>
            </div>
          </div>

          {/* Compose Content */}
          <ComposeModal
            isOpen={true}
            onClose={() => setShowCompose(false)}
            users={users}
            onStartConversation={handleStartConversation}
            isFullPage={true}
            presenceData={presenceData}
          />
        </div>
      ) : !selectedId ? (
        /* Inbox List View */
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Inbox</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnreadOnly(prev => !prev)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  showUnreadOnly
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Unread
              </button>
              
              {/* New Message Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setShowNewMessageDropdown(!showNewMessageDropdown)}
                  variant="secondary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                
                {showNewMessageDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNewMessageDropdown(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl z-20 overflow-hidden">
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setShowNewMessageDropdown(false)
                            setShowCompose(true)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                        >
                          <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">Encrypted Message</div>
                            <div className="text-xs text-[var(--text-muted)]">Secure in-app messaging</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowNewMessageDropdown(false)
                            // TODO: Open SMS compose with custom phone number input
                            alert('SMS to any number: Coming in next update. For now, select a customer and use their profile panel.')
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                        >
                          <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">Text (SMS)</div>
                            <div className="text-xs text-[var(--text-muted)]">Send via Twilio</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowNewMessageDropdown(false)
                            // TODO: Open Email compose with custom email input
                            alert('Email to any address: Coming in next update. For now, select a customer and use their profile panel.')
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                        >
                          <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">Email</div>
                            <div className="text-xs text-[var(--text-muted)]">Send via Resend</div>
                          </div>
                        </button>
                        
                        <div className="my-1 border-t border-[var(--border-primary)]" />
                        
                        {/* Group Messages - Coming Soon */}
                        <div
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md opacity-60 cursor-not-allowed"
                        >
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-[var(--text-secondary)]">Group Message</div>
                            <div className="text-xs text-[var(--text-muted)]">Coming soon</div>
                          </div>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400">
                            Soon
                          </span>
                        </div>
                      </div>
                      
                      <div className="px-3 py-2 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-primary)]">
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                          💡 <strong>Tip:</strong> SMS & Email require selecting a customer first
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {(tenantId === 'default' || inboxError) && (
            <div className="border-b border-[var(--border-primary)] bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--warning)]">
                Inbox error
              </p>
              <p className="mt-1">
                {tenantId === 'default'
                  ? 'Tenant was not resolved (tenant id is "default"). This will cause message queries to fail or return empty.'
                  : inboxError}
              </p>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-[var(--text-muted)]">Loading conversations...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <svg className="w-16 h-16 text-[var(--text-muted)] opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No messages yet</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Start a conversation with a customer or team member
                </p>
                <Button onClick={() => setShowCompose(true)}>
                  New Message
                </Button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-4 space-y-2">
                {(showUnreadOnly ? conversations.filter(c => c.unreadCount > 0) : conversations).map(convo => (
                  <ConversationCard
                    key={convo.id}
                    id={convo.id}
                    name={convo.name}
                    email={convo.email}
                    lastMessage={convo.lastMessage}
                    timestamp={convo.lastMessageAt}
                    unreadCount={convo.unreadCount}
                    isSelected={false}
                    hasEncryption={convo.hasEncryption}
                    isOnline={convo.isOnline}
                    lastActiveAt={convo.lastActiveAt}
                    conversationType="customer"
                    onClick={() => handleSelectConversation(convo.customerId, 'customer')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Chat View */
        <div className="h-full flex">
          {/* Main Thread */}
          <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${
            showCustomerProfile ? 'mr-0 lg:mr-96' : ''
          }`}>
            {inboxError && (
              <div className="border-b border-[var(--border-primary)] bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                <p className="font-medium text-[var(--warning)]">Inbox error</p>
                <p className="mt-1">{inboxError}</p>
              </div>
            )}

            {/* Thread View */}
            <ThreadView
              threadType={selectedType!}
              messages={messages}
              participants={participants}
              currentUserId={adminId || ''}
              isEncrypted={selectedConversation?.hasEncryption}
              loading={loadingMessages}
              sending={sending}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSend={handleSendMessage}
              onAttach={handleAttach}
              onOpenProfile={selectedType === 'customer' ? () => setShowCustomerProfile(true) : undefined}
              onDeleteMessage={handleDeleteMessage}
              onDownloadAttachment={handleDownloadAttachment}
              onBack={() => {
                setSelectedId(null)
                setSelectedType(null)
                setShowCustomerProfile(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Customer Profile Panel */}
      {selectedType === 'customer' && selectedId && (
        <CustomerProfilePanel
          customerId={selectedId}
          isOpen={showCustomerProfile}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}

      {/* Encryption Settings */}
      {showEncryptionSettings && (
        <EncryptionSettings
          isOpen={showEncryptionSettings}
          onClose={() => setShowEncryptionSettings(false)}
          keyPairs={keyPairs}
          isLocked={isLocked}
          onLock={lockKeys}
          onUnlock={unlockKeys}
          onRotate={rotateKeys}
          onResetSessions={resetSessions}
          onUpdateDeviceLabel={updateDeviceLabel}
          lastBackupAt={lastBackupAt}
        />
      )}

      {/* Key Backup */}
      {showKeyBackup && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          lastBackupAt={lastBackupAt}
          onClose={() => setShowKeyBackup(false)}
        />
      )}
    </div>
  )
}
