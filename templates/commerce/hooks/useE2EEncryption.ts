'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  initializeIdentityKeys,
  encryptMessage,
  decryptMessage,
  generateFingerprint,
  generateShortFingerprint,
  generateVerificationData,
  exportKeysForBackup,
  importKeysFromBackup,
  encryptPrivateKeyWithPassphrase,
  decryptPrivateKeyWithPassphrase,
  type StoredKeyPair,
} from '@/lib/crypto/e2e'
import {
  getAllKeyPairs,
  updateKeyPair,
  clearSessions,
} from '@/lib/crypto/indexedDB'

interface EncryptedMessage {
  id: string
  content: string
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  sender_type: 'customer' | 'admin'
  customer_id: string
}

interface DecryptedMessage extends EncryptedMessage {
  decryptedContent?: string
  decryptionError?: string
}

export function useE2EEncryption(userId: string | null) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null)
  const [keyPairs, setKeyPairs] = useState<StoredKeyPair[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [shortFingerprint, setShortFingerprint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateRecoveryCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length])
    return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}`
  }

  const refreshKeyPairs = useCallback(async () => {
    const allKeys = await getAllKeyPairs()
    setKeyPairs(allKeys)
    return allKeys
  }, [])

  // Initialize keys and sync public key to server
  useEffect(() => {
    if (!userId) return

    const init = async () => {
      try {
        setIsInitializing(true)
        setError(null)
        const keys = await initializeIdentityKeys()
        const hydratedKeys = keys.deviceLabel
          ? keys
          : { ...keys, deviceLabel: 'This device' }
        if (!keys.deviceLabel) {
          await updateKeyPair(keys.id, { deviceLabel: 'This device' })
        }
        setKeyPair(hydratedKeys)
        const locked = !keys.privateKey && !!keys.encryptedPrivateKey
        setIsLocked(locked)
        await refreshKeyPairs()
        
        // Generate fingerprints
        const fp = await generateFingerprint(keys.publicKey)
        const sfp = await generateShortFingerprint(keys.publicKey)
        setFingerprint(fp)
        setShortFingerprint(sfp)

        // Sync public key to server if changed
        const { data: profile } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('id', userId)
          .single()

        if (profile?.public_key !== keys.publicKey) {
          await supabase
            .from('profiles')
            .update({ 
              public_key: keys.publicKey,
              public_key_updated_at: new Date().toISOString()
            })
            .eq('id', userId)
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('E2E initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize encryption')
      } finally {
        setIsInitializing(false)
      }
    }

    init()
  }, [userId, refreshKeyPairs])

  // Get recipient's public key
  const getRecipientPublicKey = useCallback(async (
    recipientId: string
  ): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('public_key')
      .eq('id', recipientId)
      .single()

    return data?.public_key || null
  }, [])

  // Encrypt a message for a recipient
  const encrypt = useCallback(async (
    plaintext: string,
    recipientId: string
  ): Promise<{
    content: string
    iv: string
    senderPublicKey: string
    messageIndex: number
  } | null> => {
    if (!keyPair) {
      return null
    }
    if (!keyPair.privateKey) {
      return null
    }

    const recipientPublicKey = await getRecipientPublicKey(recipientId)
    if (!recipientPublicKey) {
      // Recipient doesn't have E2EE set up - return null to send unencrypted
      return null
    }

    let encrypted
    try {
      encrypted = await encryptMessage(
        plaintext,
        keyPair.privateKey,
        keyPair.publicKey,
        recipientPublicKey,
        recipientId
      )
    } catch (err) {
      console.error('Encryption failed:', err)
      return null
    }

    if (!encrypted) {
      return null
    }

    await updateKeyPair(keyPair.id, { lastUsedAt: Date.now() })
    const updatedPairs = await refreshKeyPairs()
    const updatedActive = updatedPairs.find(pair => pair.id === keyPair.id)
    if (updatedActive) {
      setKeyPair(prev => prev ? { ...prev, lastUsedAt: updatedActive.lastUsedAt } : prev)
    }

    return {
      content: encrypted.ciphertext,
      iv: encrypted.iv,
      senderPublicKey: encrypted.senderPublicKey,
      messageIndex: encrypted.messageIndex,
    }
  }, [keyPair, getRecipientPublicKey, refreshKeyPairs])

  // Decrypt a single message
  const decrypt = useCallback(async (
    message: EncryptedMessage,
    senderId: string
  ): Promise<string> => {
    if (!message.encrypted || !message.iv || !message.sender_public_key) {
      return message.content // Not encrypted, return as-is
    }

    const allKeys = keyPair ? [keyPair, ...keyPairs.filter(k => k.id !== keyPair.id)] : keyPairs
    const usableKeys = allKeys.filter(k => !!k.privateKey)

    if (usableKeys.length === 0) {
      throw new Error('Decryption keys not initialized or locked')
    }

    let lastError: Error | null = null
    for (const candidate of usableKeys) {
      try {
        const decrypted = await decryptMessage(
          message.content,
          message.iv,
          message.sender_public_key,
          message.message_index || 0,
          candidate.privateKey as string,
          senderId
        )
        await updateKeyPair(candidate.id, { lastUsedAt: Date.now() })
        return decrypted
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Decryption failed')
      }
    }

    throw lastError || new Error('Unable to decrypt message')
  }, [keyPair, keyPairs])

  // Decrypt multiple messages
  const decryptMessages = useCallback(async <T extends EncryptedMessage>(
    messages: T[],
    getSenderId: (msg: T) => string
  ): Promise<Array<T & DecryptedMessage>> => {
    return Promise.all(
      messages.map(async (msg) => {
        if (!msg.encrypted) {
          return { ...msg, decryptedContent: msg.content }
        }

        try {
          const senderId = getSenderId(msg)
          const decryptedContent = await decrypt(msg, senderId)
          return { ...msg, decryptedContent }
        } catch (err) {
          return { 
            ...msg, 
            decryptedContent: '[Unable to decrypt]',
            decryptionError: err instanceof Error ? err.message : 'Decryption failed'
          }
        }
      })
    )
  }, [decrypt])

  // Backup keys (encrypted with password)
  const backupKeys = useCallback(async (password: string): Promise<string> => {
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('No keys to backup')
    }
    const backup = await exportKeysForBackup(password, keyPair)
    localStorage.setItem('709e2e:lastBackupAt', new Date().toISOString())
    return backup
  }, [keyPair])

  const createRecoveryBackup = useCallback(async (): Promise<{ code: string; backup: string }> => {
    if (!keyPair || !keyPair.privateKey) {
      throw new Error('Keys are not ready for backup')
    }
    const code = generateRecoveryCode()
    const backup = await exportKeysForBackup(code, keyPair)
    localStorage.setItem('709e2e:lastBackupAt', new Date().toISOString())
    return { code, backup }
  }, [keyPair])

  // Restore keys from backup
  const restoreKeys = useCallback(async (
    backupData: string,
    password: string
  ): Promise<void> => {
    const restored = await importKeysFromBackup(backupData, password)
    setKeyPair(restored)
    setIsLocked(false)
    await refreshKeyPairs()
    
    // Update fingerprints
    const fp = await generateFingerprint(restored.publicKey)
    const sfp = await generateShortFingerprint(restored.publicKey)
    setFingerprint(fp)
    setShortFingerprint(sfp)

    // Sync to server
    if (userId) {
      await supabase
        .from('profiles')
        .update({ 
          public_key: restored.publicKey,
          public_key_updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }
  }, [userId, refreshKeyPairs])

  const lockKeys = useCallback(async (password: string) => {
    if (!keyPair?.privateKey) {
      throw new Error('No unlocked keys to lock')
    }
    const encrypted = await encryptPrivateKeyWithPassphrase(keyPair.privateKey, password)
    await updateKeyPair(keyPair.id, {
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      encryptedPrivateKeyIv: encrypted.iv,
      encryptedPrivateKeySalt: encrypted.salt,
      encryptedPrivateKeyIterations: encrypted.iterations,
      privateKey: undefined,
    })
    setKeyPair({
      ...keyPair,
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      encryptedPrivateKeyIv: encrypted.iv,
      encryptedPrivateKeySalt: encrypted.salt,
      encryptedPrivateKeyIterations: encrypted.iterations,
      privateKey: undefined,
    })
    setIsLocked(true)
    await refreshKeyPairs()
  }, [keyPair, refreshKeyPairs])

  const unlockKeys = useCallback(async (password: string) => {
    if (!keyPair?.encryptedPrivateKey || !keyPair.encryptedPrivateKeyIv || !keyPair.encryptedPrivateKeySalt) {
      throw new Error('No locked keys found')
    }
    const privateKey = await decryptPrivateKeyWithPassphrase(
      keyPair.encryptedPrivateKey,
      password,
      keyPair.encryptedPrivateKeyIv,
      keyPair.encryptedPrivateKeySalt,
      keyPair.encryptedPrivateKeyIterations
    )
    setKeyPair({ ...keyPair, privateKey })
    setIsLocked(false)
    await updateKeyPair(keyPair.id, { lastUsedAt: Date.now() })
  }, [keyPair])

  const rotateKeys = useCallback(async (deviceLabel?: string) => {
    if (!userId) {
      throw new Error('User not available')
    }
    const newKeys = await initializeIdentityKeys()
    const updated = {
      ...newKeys,
      deviceLabel: deviceLabel || keyPair?.deviceLabel || 'This device',
      lastUsedAt: Date.now(),
    }
    await updateKeyPair(updated.id, {
      deviceLabel: updated.deviceLabel,
      lastUsedAt: updated.lastUsedAt,
    })

    setKeyPair(updated)
    setIsLocked(false)
    await clearSessions()
    await refreshKeyPairs()

    const fp = await generateFingerprint(updated.publicKey)
    const sfp = await generateShortFingerprint(updated.publicKey)
    setFingerprint(fp)
    setShortFingerprint(sfp)

    await supabase
      .from('profiles')
      .update({
        public_key: updated.publicKey,
        public_key_updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }, [keyPair?.deviceLabel, refreshKeyPairs, userId])

  const updateDeviceLabel = useCallback(async (label: string) => {
    if (!keyPair) return
    await updateKeyPair(keyPair.id, { deviceLabel: label })
    setKeyPair({ ...keyPair, deviceLabel: label })
    await refreshKeyPairs()
  }, [keyPair, refreshKeyPairs])

  const resetSessions = useCallback(async () => {
    await clearSessions()
  }, [])

  // Get verification data for QR code
  const getVerificationData = useCallback(async () => {
    if (!keyPair) {
      throw new Error('Keys not initialized')
    }
    return generateVerificationData(keyPair.publicKey)
  }, [keyPair])

  // Verify another user's key
  const verifyUserKey = useCallback(async (
    userId: string
  ): Promise<{ fingerprint: string; shortFingerprint: string } | null> => {
    const publicKey = await getRecipientPublicKey(userId)
    if (!publicKey) return null

    const fp = await generateFingerprint(publicKey)
    const sfp = await generateShortFingerprint(publicKey)
    return { fingerprint: fp, shortFingerprint: sfp }
  }, [getRecipientPublicKey])

  return {
    isInitialized,
    isInitializing,
    publicKey: keyPair?.publicKey || null,
    keyPairs,
    isLocked,
    fingerprint,
    shortFingerprint,
    error,
    encrypt,
    decrypt,
    decryptMessages,
    getRecipientPublicKey,
    backupKeys,
    createRecoveryBackup,
    restoreKeys,
    lockKeys,
    unlockKeys,
    rotateKeys,
    resetSessions,
    updateDeviceLabel,
    refreshKeyPairs,
    getVerificationData,
    verifyUserKey,
  }
}
