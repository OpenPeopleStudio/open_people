'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import KeyVerification from '../../../components/KeyVerification'
import KeyBackup from '../../../components/KeyBackup'
import EncryptionSettings from '../../../components/EncryptionSettings'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'
import { generateFileKey, encryptFileWithKey, decryptFileWithKey } from '@/lib/crypto/e2e'
import { useTenant } from '@/context/TenantContext'

interface Conversation {
  customer_id: string
  customer_email: string
  customer_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
  has_encryption: boolean
  has_purchase: boolean
}

interface Message {
  id: string
  customer_id: string
  content: string
  sender_type: 'customer' | 'admin'
  created_at: string
  read: boolean
  message_type?: 'text' | 'location'
  location?: {
    lat: number
    lng: number
    accuracy?: number
    recordedAt: string
  } | null
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  deleted_at?: string | null
  deleted_for_both?: boolean
  expires_at?: string | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
  attachment_key?: string | null
  attachment_key_iv?: string | null
  attachment_key_sender_public_key?: string | null
  attachment_key_message_index?: number | null
}

interface DecryptedMessage extends Message {
  decryptedContent: string
}

interface UserSummary {
  id: string
  email: string
  full_name: string | null
  role: string | null
}

export default function AdminMessagesPage() {
  const { id: tenantId, featureFlags } = useTenant()
  const eligibleOrderStatuses = ['pending', 'paid', 'fulfilled', 'shipped']
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [sendNotice, setSendNotice] = useState<string | null>(null)
  const [recoveryData, setRecoveryData] = useState<{ code: string; backup: string } | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [showAdvancedActions, setShowAdvancedActions] = useState(false)
  const [retentionEnabled, setRetentionEnabled] = useState(false)
  const [retentionDays, setRetentionDays] = useState(90)
  const [showRetentionSettings, setShowRetentionSettings] = useState(false)
  const [showKeyVerification, setShowKeyVerification] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [verifyCustomer, setVerifyCustomer] = useState<{
    id: string
    name: string
    fingerprint: string
    shortFingerprint: string
  } | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [directoryUsers, setDirectoryUsers] = useState<UserSummary[]>([])
  const [directorySearch, setDirectorySearch] = useState('')
  const [newRecipient, setNewRecipient] = useState<string | null>(null)
  const [newMessageText, setNewMessageText] = useState('')
  const [newMessageError, setNewMessageError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedCustomerVerified, setSelectedCustomerVerified] = useState(false)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const {
    isInitialized,
    isInitializing,
    fingerprint,
    shortFingerprint,
    publicKey,
    error: e2eError,
    encrypt,
    decrypt,
    decryptMessages,
    getRecipientPublicKey,
    backupKeys,
    createRecoveryBackup,
    restoreKeys,
    verifyUserKey,
    error: encryptionError,
    keyPairs,
    isLocked,
    lockKeys,
    unlockKeys,
    rotateKeys,
    resetSessions,
    updateDeviceLabel,
  } = useE2EEncryption(adminId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
    }
  }, [])

  useEffect(() => {
    if (!showKeyBackup && typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
    }
  }, [showKeyBackup])

  // Get admin user ID
  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminId(user.id)
      }
    }
    getAdminId()
  }, [])

  const loadConversations = useCallback(async () => {
    // Get all unique customer conversations with their latest message
    let messagesQuery = supabase
      .from('messages')
      .select('customer_id, content, created_at, read, sender_type, encrypted, deleted_at')
      .order('created_at', { ascending: false })

    if (tenantId) {
      messagesQuery = messagesQuery.eq('tenant_id', tenantId)
    }

    const { data: messagesData } = await messagesQuery

    if (!messagesData) {
      setLoading(false)
      return
    }

    // Group by customer
    const customerMap = new Map<string, {
      messages: typeof messagesData,
      unread: number
    }>()

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

    // Get customer info via API (auth.admin.listUsers requires server-side)
    const customerIds = Array.from(customerMap.keys())
    let users: { id: string; email: string; full_name: string | null }[] = []
    try {
      const response = await fetch('/api/admin/messages/users')
      if (response.ok) {
        const data = await response.json()
        users = data.users || []
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }

    let ordersQuery = supabase
      .from('orders')
      .select('customer_id, status')
      .in('customer_id', customerIds)

    if (tenantId) {
      ordersQuery = ordersQuery.eq('tenant_id', tenantId)
    }

    const { data: orders } = await ordersQuery

    const buyersByCustomer = new Map<string, boolean>()
    for (const order of orders || []) {
      if (eligibleOrderStatuses.includes(order.status)) {
        buyersByCustomer.set(order.customer_id, true)
      }
    }

    // Get encryption status from profiles
    let profilesQuery = supabase
      .from('profiles')
      .select('id, public_key')
      .in('id', customerIds)

    if (tenantId) {
      profilesQuery = profilesQuery.eq('tenant_id', tenantId)
    }

    const { data: profiles } = await profilesQuery
    
    const convos: Conversation[] = []
    customerMap.forEach((data, customerId) => {
      const user = users.find(u => u.id === customerId)
      const profile = profiles?.find(p => p.id === customerId)
      const lastMsg = data.messages[0]
      convos.push({
        customer_id: customerId,
        customer_email: user?.email || 'Unknown',
        customer_name: user?.full_name || null,
        last_message: lastMsg.deleted_at
          ? '[Message deleted]'
          : lastMsg.encrypted
            ? 'Secure message'
            : lastMsg.content,
        last_message_at: lastMsg.created_at,
        unread_count: data.unread,
        has_encryption: !!profile?.public_key,
        has_purchase: buyersByCustomer.get(customerId) ?? false,
      })
    })

    // Sort by last message
    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    
    setConversations(convos)
    setLoading(false)
  }, [tenantId])

  const loadDirectoryUsers = useCallback(async () => {
    const response = await fetch('/api/admin/messages/users')
    if (!response.ok) return
    const data = await response.json()
    setDirectoryUsers(data.users || [])
  }, [])

  const loadMessages = useCallback(async (customerId: string) => {
    let messagesQuery = supabase
      .from('messages')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    if (tenantId) {
      messagesQuery = messagesQuery.eq('tenant_id', tenantId)
    }

    const { data } = await messagesQuery

    if (!data) {
      setMessages([])
      return
    }

    const deletedMessages = data
      .filter(msg => msg.deleted_at)
      .map(msg => ({ ...msg, decryptedContent: '[Message deleted]' }))

    if (isInitialized) {
      const activeMessages = data.filter(msg => !msg.deleted_at)
      const decrypted = await decryptMessages(
        activeMessages,
        (msg) => msg.sender_type === 'customer' ? msg.customer_id : adminId!
      )
      
      // Parse location data for location messages
      const processed = decrypted.map(msg => {
        if (msg.message_type === 'location' && msg.decryptedContent && msg.decryptedContent !== 'Secure message') {
          try {
            const locationData = JSON.parse(msg.decryptedContent)
            return {
              ...msg,
              location: locationData,
              decryptedContent: `📍 Shared location${locationData.accuracy ? ` (±${Math.round(locationData.accuracy)}m)` : ''}`
            }
          } catch {
            return msg
          }
        }
        return msg
      })
      
      const combined = [...(deletedMessages as DecryptedMessage[]), ...(processed as DecryptedMessage[])]
      combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(combined)
    } else {
      // Not initialized yet, show encrypted indicator
      const unencrypted = data.filter(msg => !msg.deleted_at).map(msg => ({
        ...msg,
        decryptedContent: msg.encrypted ? 'Secure message' : msg.content
      }))
      const combined = [...(deletedMessages as DecryptedMessage[]), ...(unencrypted as DecryptedMessage[])]
      combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(combined)
    }

    // Mark as read
    let markReadQuery = supabase
      .from('messages')
      .update({ read: true })
      .eq('customer_id', customerId)
      .eq('sender_type', 'customer')
      .eq('read', false)

    if (tenantId) {
      markReadQuery = markReadQuery.eq('tenant_id', tenantId)
    }

    await markReadQuery

    // Update conversation unread count
    setConversations(prev => prev.map(c => 
      c.customer_id === customerId ? { ...c, unread_count: 0 } : c
    ))
  }, [isInitialized, decryptMessages, adminId, tenantId])

  const loadRetentionSettings = useCallback(async (customerId: string) => {
    const response = await fetch(`/api/messages/retention?customerId=${customerId}`)
    if (response.ok) {
      const data = await response.json()
      setRetentionEnabled(Boolean(data.retention_enabled))
      setRetentionDays(data.retention_days || 90)
      if (data.retention_enabled && data.retention_days) {
        await fetch('/api/messages/purge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, days: data.retention_days })
        })
      }
    } else {
      setRetentionEnabled(false)
      setRetentionDays(90)
    }
  }, [])

  // Re-decrypt when encryption is initialized
  useEffect(() => {
    if (!isInitialized || !selectedCustomer) return
    const needsRetry = messages.some(m =>
      m.encrypted && (m.decryptedContent === 'Secure message' || m.decryptedContent === '[Unable to decrypt]')
    )
    if (needsRetry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedCustomer)
    }
  }, [isInitialized, selectedCustomer, messages, loadMessages])

  useEffect(() => {
    // Initial data fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (showNewMessage) {
      loadDirectoryUsers()
    }
  }, [showNewMessage, loadDirectoryUsers])

  useEffect(() => {
    if (selectedCustomer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedCustomer)
      loadRetentionSettings(selectedCustomer)
    }
  }, [selectedCustomer, loadMessages, loadRetentionSettings])

  useEffect(() => {
    if (selectedCustomer && typeof window !== 'undefined') {
      setSelectedCustomerVerified(
        localStorage.getItem(`709e2e:verified:${selectedCustomer}`) === 'true'
      )
    }
  }, [selectedCustomer])

  // Realtime updates for usability: new messages appear without refresh.
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { customer_id?: string } | null
          loadConversations()
          if (selectedCustomer && msg?.customer_id === selectedCustomer) {
            loadMessages(selectedCustomer)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadConversations, loadMessages, selectedCustomer])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedCustomer) return

    setSending(true)
    setAttachmentError(null)
    setSendNotice(null)
    const plaintext = newMessage.trim()
    let didEncrypt = false

    try {
      if (!tenantId) {
        setSending(false)
        setAttachmentError('Tenant not resolved')
        return
      }
      if (attachmentFile && !(selectedConvo?.has_encryption && isInitialized)) {
        setAttachmentError('Attachments require secure chat to be ready.')
        setSending(false)
        return
      }

      // Try to encrypt the message
      let messageData: {
        tenant_id: string
        customer_id: string
        content: string
        sender_type: 'admin'
        read: boolean
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
        expires_at?: string | null
        attachment_path?: string | null
        attachment_name?: string | null
        attachment_type?: string | null
        attachment_size?: number | null
        attachment_key?: string | null
        attachment_key_iv?: string | null
        attachment_key_sender_public_key?: string | null
        attachment_key_message_index?: number | null
      } = {
        tenant_id: tenantId,
        customer_id: selectedCustomer,
        content: plaintext,
        sender_type: 'admin',
        read: false,
      }

      if (retentionEnabled && retentionDays) {
        messageData.expires_at = new Date(
          Date.now() + retentionDays * 24 * 60 * 60 * 1000
        ).toISOString()
      }

      // Attempt encryption if E2EE is initialized
      if (isInitialized) {
        const recipientPublicKey = await getRecipientPublicKey(selectedCustomer)
        if (recipientPublicKey) {
          const encrypted = await encrypt(plaintext, selectedCustomer)
          if (encrypted) {
            messageData = {
              ...messageData,
              content: encrypted.content,
              encrypted: true,
              iv: encrypted.iv,
              sender_public_key: encrypted.senderPublicKey,
              message_index: encrypted.messageIndex,
            }
            didEncrypt = true
          }
        }
      }

      if (attachmentFile) {
        const recipientPublicKey = await getRecipientPublicKey(selectedCustomer)
        if (!recipientPublicKey) {
          setAttachmentError('Attachments require secure chat with the customer.')
          setSending(false)
          return
        }
        const attachmentData = await uploadEncryptedAttachment(attachmentFile)
        messageData = { ...messageData, ...attachmentData }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (!error && data) {
        // Add to local state with decrypted content
        setMessages(prev => [...prev, { 
          ...data, 
          decryptedContent: plaintext 
        }])
        setNewMessage('')
        setAttachmentFile(null)
        
        // Update conversation
        setConversations(prev => prev.map(c => 
          c.customer_id === selectedCustomer 
            ? { ...c, last_message: data.encrypted ? 'Secure message' : plaintext, last_message_at: data.created_at }
            : c
        ))
        if (!didEncrypt) {
          setSendNotice('Sent standard')
          setTimeout(() => setSendNotice(null), 4000)
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      if (attachmentFile) {
        setAttachmentError('Failed to send attachment.')
      }
    }

    setSending(false)
  }

  const startNewConversation = async () => {
    if (!newRecipient || !newMessageText.trim()) return
    setNewMessageError(null)

    try {
      if (!tenantId) {
        setNewMessageError('Tenant not resolved')
        return
      }

      let messageData: {
        tenant_id: string
        customer_id: string
        content: string
        sender_type: 'admin'
        read: boolean
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
      } = {
        tenant_id: tenantId,
        customer_id: newRecipient,
        content: newMessageText.trim(),
        sender_type: 'admin',
        read: false,
      }

      if (isInitialized) {
        const recipientPublicKey = await getRecipientPublicKey(newRecipient)
        if (recipientPublicKey) {
          const encrypted = await encrypt(newMessageText.trim(), newRecipient)
          if (encrypted) {
            messageData = {
              ...messageData,
              content: encrypted.content,
              encrypted: true,
              iv: encrypted.iv,
              sender_public_key: encrypted.senderPublicKey,
              message_index: encrypted.messageIndex,
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error || !data) {
        throw error || new Error('Failed to start conversation')
      }

      setShowNewMessage(false)
      setNewMessageText('')
      await loadConversations()
      setSelectedCustomer(newRecipient)
      setNewRecipient(null)
    } catch (err) {
      setNewMessageError(err instanceof Error ? err.message : 'Failed to start conversation')
    }
  }

  const sanitizeFilename = (name: string) =>
    name.replace(/[^a-zA-Z0-9.\-_]/g, '_')

  const uploadEncryptedAttachment = async (file: File) => {
    if (!selectedCustomer || !adminId) {
      throw new Error('Missing recipient')
    }

    const fileKey = await generateFileKey()
    const fileBuffer = await file.arrayBuffer()
    const encrypted = await encryptFileWithKey(fileBuffer, fileKey)
    const keyPayload = JSON.stringify({ key: fileKey, iv: encrypted.iv })

    const encryptedKey = await encrypt(keyPayload, selectedCustomer)
    if (!encryptedKey) {
      throw new Error('Unable to encrypt attachment key')
    }

    const blob = new Blob([encrypted.ciphertext], { type: 'application/octet-stream' })
    const formData = new FormData()
    formData.append('file', blob, `encrypted-${sanitizeFilename(file.name)}`)
    formData.append('filename', file.name)
    formData.append('customerId', selectedCustomer)

    const response = await fetch('/api/messages/attachment-upload', {
      method: 'POST',
      body: formData,
    })

    const uploadPayload = await response.json()
    if (!response.ok) {
      throw new Error(uploadPayload?.error || 'Failed to upload attachment')
    }

    const path = uploadPayload.path as string

    return {
      attachment_path: path,
      attachment_name: file.name,
      attachment_type: file.type,
      attachment_size: file.size,
      attachment_key: encryptedKey.content,
      attachment_key_iv: encryptedKey.iv,
      attachment_key_sender_public_key: encryptedKey.senderPublicKey,
      attachment_key_message_index: encryptedKey.messageIndex,
    }
  }

  const handleCreateRecovery = async () => {
    setRecoveryError(null)
    try {
      const data = await createRecoveryBackup()
      setRecoveryData(data)
      setLastBackupAt(new Date().toISOString())
      setShowRecoveryModal(true)
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Unable to create recovery code')
      setShowRecoveryModal(true)
    }
  }

  const handleCopyRecoveryCode = async () => {
    if (!recoveryData?.code) return
    try {
      await navigator.clipboard.writeText(recoveryData.code)
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Failed to copy recovery code')
    }
  }

  const handleDownloadRecoveryFile = () => {
    if (!recoveryData) return
    const contents = `Recovery code: ${recoveryData.code}\n\nBackup:\n${recoveryData.backup}\n`
    const blob = new Blob([contents], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '709exclusive-recovery.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAttachment = async (msg: DecryptedMessage) => {
    if (!msg.attachment_path || !msg.attachment_key || !msg.attachment_key_iv || !msg.attachment_key_sender_public_key) {
      return
    }
    if (!selectedCustomer || !adminId) return
    try {
      const keyPayload = await decrypt(
        {
          id: msg.id,
          content: msg.attachment_key,
          iv: msg.attachment_key_iv,
          sender_public_key: msg.attachment_key_sender_public_key,
          message_index: msg.attachment_key_message_index || 0,
          encrypted: true,
          sender_type: msg.sender_type,
          customer_id: msg.customer_id,
        },
        msg.sender_type === 'customer' ? msg.customer_id : adminId
      )

      const { key, iv } = JSON.parse(keyPayload) as { key: string; iv: string }

      const urlResponse = await fetch('/api/messages/attachment-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id })
      })

      if (!urlResponse.ok) return
      const { signedUrl } = await urlResponse.json()
      const fileResponse = await fetch(signedUrl)
      const encryptedBuffer = await fileResponse.arrayBuffer()
      const decryptedBuffer = await decryptFileWithKey(encryptedBuffer, key, iv)

      const blob = new Blob([decryptedBuffer], { type: msg.attachment_type || 'application/octet-stream' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = msg.attachment_name || 'attachment'
      link.click()
      URL.revokeObjectURL(downloadUrl)
    } catch {
      setAttachmentError('Unable to decrypt attachment.')
    }
  }

  const updateRetention = async (enabled: boolean, days: number) => {
    if (!selectedCustomer) return
    const response = await fetch('/api/messages/retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selectedCustomer, enabled, days })
    })

    if (response.ok) {
      setRetentionEnabled(enabled)
      setRetentionDays(days)
      if (enabled) {
        await fetch('/api/messages/purge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: selectedCustomer, days })
        })
      }
    }
  }

  const purgeOldMessages = async () => {
    if (!selectedCustomer || !retentionEnabled) return
    await fetch('/api/messages/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selectedCustomer, days: retentionDays })
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    const response = await fetch('/api/messages/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    })

    if (response.ok) {
      const now = new Date().toISOString()
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, deleted_at: now, decryptedContent: '[Message deleted]' }
          : msg
      ))
      setConversations(prev => prev.map(c =>
        c.customer_id === selectedCustomer
          ? { ...c, last_message: '[Message deleted]' }
          : c
      ))
    }
  }

  const markCustomerVerified = () => {
    if (!selectedCustomer || typeof window === 'undefined') return
    localStorage.setItem(`709e2e:verified:${selectedCustomer}`, 'true')
    setSelectedCustomerVerified(true)
  }

  const resetCustomerVerified = () => {
    if (!selectedCustomer || typeof window === 'undefined') return
    localStorage.removeItem(`709e2e:verified:${selectedCustomer}`)
    setSelectedCustomerVerified(false)
  }

  const handleVerifyCustomer = async (customerId: string, customerName: string) => {
    const keyInfo = await verifyUserKey(customerId)
    if (keyInfo) {
      setVerifyCustomer({
        id: customerId,
        name: customerName,
        fingerprint: keyInfo.fingerprint,
        shortFingerprint: keyInfo.shortFingerprint,
      })
      setShowKeyVerification(true)
    }
  }

  const selectedConvo = conversations.find(c => c.customer_id === selectedCustomer)
  const filteredConversations = conversations.filter((c) => {
    if (showUnreadOnly && c.unread_count === 0) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      c.customer_email.toLowerCase().includes(q) ||
      (c.customer_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
        
        {/* E2EE Status & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isInitialized ? (
            <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[var(--success)]/10 text-[var(--success)] text-xs sm:text-sm rounded-full">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure
            </span>
          ) : encryptionError ? (
            <span className="text-xs sm:text-sm text-[var(--warning)]">
              Secure chat unavailable
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">
              {isInitializing ? 'Securing your chat...' : 'Securing your chat...'}
            </span>
          )}

          <Button
            onClick={() => setShowEncryptionSettings(true)}
            variant="ghost"
            size="sm"
          >
            Security
          </Button>
          <Button
            onClick={handleCreateRecovery}
            variant="secondary"
            size="sm"
            disabled={!isInitialized || isLocked}
            className="hidden sm:inline-flex"
          >
            Save recovery code
          </Button>
          <Button
            onClick={() => setShowNewMessage(true)}
            variant="secondary"
            size="sm"
          >
            New message
          </Button>
          <Button
            onClick={() => setShowAdvancedActions((prev) => !prev)}
            variant="ghost"
            size="sm"
          >
            Advanced
          </Button>
        </div>
      </div>

      {showAdvancedActions && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => setShowKeyVerification(true)}
            variant="ghost"
            size="sm"
          >
            Verify contact
          </Button>
          <Button
            onClick={() => setShowKeyBackup(true)}
            variant="ghost"
            size="sm"
          >
            Manual backup
          </Button>
        </div>
      )}

      <Surface padding="md" className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-primary)] font-medium">Secure support inbox</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Messages are protected on this device. Save a recovery code to keep access if you switch browsers.
            </p>
            {isLocked && (
              <p className="text-xs text-[var(--warning)] mt-2">
                Unlock security to save a recovery code.
              </p>
            )}
          </div>
        </div>
      </Surface>

      {selectedCustomer && (
        <Surface padding="md" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Message retention</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {retentionEnabled
                  ? `Messages expire after ${retentionDays} days for this customer.`
                  : 'Retention is off for this customer.'}
              </p>
            </div>
            <div className="flex gap-2">
              {retentionEnabled && (
                <Button variant="ghost" size="sm" onClick={purgeOldMessages}>
                  Purge now
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowRetentionSettings(v => !v)}>
                {showRetentionSettings ? 'Close' : 'Configure'}
              </Button>
            </div>
          </div>

          {showRetentionSettings && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={retentionEnabled}
                  onChange={(e) => updateRetention(e.target.checked, retentionDays)}
                />
                <span>Enable retention</span>
              </label>
              <select
                value={retentionDays}
                onChange={(e) => updateRetention(retentionEnabled, parseInt(e.target.value, 10))}
                disabled={!retentionEnabled}
                className="min-w-[120px]"
              >
                {[30, 90, 180].map((days) => (
                  <option key={days} value={days}>{days} days</option>
                ))}
              </select>
            </div>
          )}
        </Surface>
      )}

      {encryptionError && (
        <div className="mb-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg text-sm text-[var(--text-secondary)]">
          Secure chat is unavailable on this device. Messages will send standard. {encryptionError}
        </div>
      )}

      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden"
        style={{ height: 'calc(100vh - 200px)', minHeight: '560px' }}
      >
        <div className="flex h-full flex-col md:flex-row">
          {/* Conversations List */}
          <div
            className={[
              'w-full md:w-80 md:border-r border-[var(--border-primary)] flex flex-col',
              selectedCustomer ? 'hidden md:flex' : 'flex',
            ].join(' ')}
          >
            <div className="p-4 border-b border-[var(--border-primary)] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-[var(--text-primary)]">Inbox</h2>
                <button
                  type="button"
                  onClick={() => setShowUnreadOnly((v) => !v)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    showUnreadOnly
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Unread
                </button>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-full"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-[var(--text-muted)]">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-muted)]">No messages yet</div>
              ) : (
                filteredConversations.map(convo => (
                  <button
                    key={convo.customer_id}
                    onClick={() => setSelectedCustomer(convo.customer_id)}
                    className={`w-full p-4 text-left border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                      selectedCustomer === convo.customer_id ? 'bg-[var(--bg-tertiary)]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {convo.customer_name || convo.customer_email}
                          </p>
                          {convo.has_encryption && (
                            <svg className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            convo.has_purchase
                              ? 'bg-[var(--success)]/15 text-[var(--success)]'
                              : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                          }`}>
                            {convo.has_purchase ? 'Buyer' : 'Window shopper'}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate mt-1">
                          {convo.last_message}
                        </p>
                      </div>
                      {convo.unread_count > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-[var(--accent)] text-white text-xs font-bold rounded-full px-1.5">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {new Date(convo.last_message_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={['flex-1 flex flex-col', selectedCustomer ? 'flex' : 'hidden md:flex'].join(' ')}>
            {selectedCustomer ? (
              <>
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="md:hidden p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0"
                      aria-label="Back to inbox"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {selectedConvo?.customer_name || selectedConvo?.customer_email}
                      </p>
                      {selectedConvo?.customer_name && (
                        <p className="text-sm text-[var(--text-muted)] truncate">{selectedConvo.customer_email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedConvo && (
                        <span className={`hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          selectedConvo.has_purchase
                            ? 'bg-[var(--success)]/15 text-[var(--success)]'
                            : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                        }`}>
                          {selectedConvo.has_purchase ? 'Buyer' : 'Window shopper'}
                        </span>
                      )}
                      {selectedConvo?.has_encryption && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleVerifyCustomer(
                              selectedCustomer,
                              selectedConvo?.customer_name || selectedConvo?.customer_email || 'Customer'
                            )}
                            className="text-xs sm:text-sm text-[var(--success)] hover:underline flex items-center gap-1"
                            title="Verify key"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Verify key</span>
                          </button>
                          {selectedCustomerVerified && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] font-medium rounded-full bg-[var(--success)]/20 text-[var(--success)]">
                              Verified
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {sendNotice && (
                  <p className="px-4 pb-2 text-xs text-[var(--text-muted)]">{sendNotice}</p>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`group relative max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl ${
                          msg.sender_type === 'admin'
                            ? 'bg-[var(--accent)] text-white rounded-br-md'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.decryptedContent || msg.content}</p>
                        {msg.message_type === 'location' && msg.location && !msg.deleted_at && (
                          <a
                            href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 block text-xs underline ${
                              msg.sender_type === 'admin'
                                ? 'text-white/80 hover:text-white'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            📍 View on map ({msg.location.lat.toFixed(5)}, {msg.location.lng.toFixed(5)})
                            {msg.location.accuracy && ` ±${Math.round(msg.location.accuracy)}m`}
                          </a>
                        )}
                        {msg.attachment_path && !msg.deleted_at && (
                          <button
                            onClick={() => handleDownloadAttachment(msg)}
                            className={`mt-2 text-xs underline ${
                              msg.sender_type === 'admin'
                                ? 'text-white/80 hover:text-white'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            📎 {msg.attachment_name || 'Attachment'}
                          </button>
                        )}
                        <div className={`flex items-center gap-1 text-[10px] mt-1 ${
                          msg.sender_type === 'admin' ? 'text-white/60' : 'text-[var(--text-muted)]'
                        }`}>
                          {msg.encrypted && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {!msg.deleted_at && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)] rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete message"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[var(--border-primary)]">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setAttachmentFile(file || null)
                      setAttachmentError(null)
                    }}
                  />
                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 min-w-0 space-y-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 resize-none w-full text-sm sm:text-base"
                        rows={2}
                        disabled={sending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
                          }
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        <button
                          type="button"
                          onClick={() => attachmentInputRef.current?.click()}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Attach file
                        </button>
                        {attachmentFile && (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate max-w-[120px] sm:max-w-none">{attachmentFile.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachmentFile(null)}
                              className="text-[var(--text-muted)] hover:text-[var(--error)] flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      {attachmentError && (
                        <p className="text-xs text-[var(--error)]">{attachmentError}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary px-4 sm:px-6 flex-shrink-0"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[var(--text-muted)]">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Verification Modal */}
      {showKeyVerification && (
        <KeyVerification
          myFingerprint={fingerprint}
          myShortFingerprint={shortFingerprint}
          myPublicKey={publicKey}
          theirFingerprint={verifyCustomer?.fingerprint}
          theirShortFingerprint={verifyCustomer?.shortFingerprint}
          theirName={verifyCustomer?.name}
          isVerified={selectedCustomerVerified}
          onVerify={markCustomerVerified}
          onResetVerification={resetCustomerVerified}
          isInitialized={isInitialized}
          error={e2eError}
          onClose={() => {
            setShowKeyVerification(false)
            setVerifyCustomer(null)
          }}
        />
      )}

      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recovery code</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Save this code to restore secure chat if you switch devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false)
                  setRecoveryData(null)
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            {recoveryData ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-sm text-[var(--text-primary)]">
                  {recoveryData.code}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopyRecoveryCode}>
                    Copy code
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownloadRecoveryFile}>
                    Download backup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-[var(--text-muted)]">
                Unable to create a recovery code right now.
              </div>
            )}

            {recoveryError && (
              <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                <p className="text-sm text-[var(--error)]">{recoveryError}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRecoveryModal(false)
                  setRecoveryData(null)
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Key Backup Modal */}
      {showKeyBackup && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          lastBackupAt={lastBackupAt}
          onClose={() => setShowKeyBackup(false)}
        />
      )}

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

      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Start a new conversation</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Message staff or customers.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewMessage(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)]">Recipient</label>
                <input
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="mt-2 w-full"
                />
                <div className="mt-3 max-h-56 overflow-y-auto space-y-2">
                  {directoryUsers
                    .filter((user) => {
                      const q = directorySearch.trim().toLowerCase()
                      if (!q) return true
                      return (
                        user.email.toLowerCase().includes(q) ||
                        (user.full_name || '').toLowerCase().includes(q)
                      )
                    })
                    .map((user) => (
                      <label key={user.id} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <input
                          type="radio"
                          name="new-recipient"
                          checked={newRecipient === user.id}
                          onChange={() => setNewRecipient(user.id)}
                        />
                        <span>{user.full_name || user.email}</span>
                        {user.role && (
                          <span className="text-xs text-[var(--text-muted)]">({user.role})</span>
                        )}
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)]">Message</label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={3}
                  className="mt-2 w-full"
                />
              </div>

              {newMessageError && (
                <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                  <p className="text-sm text-[var(--error)]">{newMessageError}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setShowNewMessage(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={startNewConversation} className="flex-1">
                Send message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}