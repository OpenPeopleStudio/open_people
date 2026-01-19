'use client'

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  initializeIdentityKeys,
  generateFingerprint,
  generateShortFingerprint,
  exportKeysForBackup,
  importKeysFromBackup,
  type StoredKeyPair,
} from '@/lib/crypto/e2e'
import { getActiveKeyPair } from '@/lib/crypto/indexedDB'

interface EncryptionContextType {
  isInitialized: boolean
  isInitializing: boolean
  hasKeys: boolean
  needsBackup: boolean
  fingerprint: string | null
  shortFingerprint: string | null
  error: string | null
  backupKeys: (password: string) => Promise<string>
  createRecoveryBackup: () => Promise<{ code: string; backup: string }>
  restoreKeys: (backupData: string, password: string) => Promise<void>
  dismissBackupReminder: () => void
}

const EncryptionContext = createContext<EncryptionContextType | null>(null)

export function useEncryption(): EncryptionContextType {
  const context = useContext(EncryptionContext)
  // Return safe defaults if no provider (for pages that don't need encryption)
  if (!context) {
    return {
      isInitialized: false,
      isInitializing: false,
      hasKeys: false,
      needsBackup: false,
      fingerprint: null,
      shortFingerprint: null,
      error: null,
      backupKeys: async () => { throw new Error('Encryption not available') },
      createRecoveryBackup: async () => { throw new Error('Encryption not available') },
      restoreKeys: async () => { throw new Error('Encryption not available') },
      dismissBackupReminder: () => {},
    }
  }
  return context
}

interface EncryptionProviderProps {
  children: ReactNode
}

export default function EncryptionProvider({ children }: EncryptionProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [hasKeys, setHasKeys] = useState(false)
  const [needsBackup, setNeedsBackup] = useState(false)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [shortFingerprint, setShortFingerprint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null)

  const generateRecoveryCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length])
    return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}`
  }

  // Initialize encryption on mount if user is authenticated
  useEffect(() => {
    const initEncryption = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsInitialized(true)
          return
        }

        setIsInitializing(true)

        // Check if we already have keys in IndexedDB
        const existingKeys = await getActiveKeyPair()
        
        let keys: StoredKeyPair
        let isNewKeys = false

        if (existingKeys) {
          keys = existingKeys
        } else {
          // Generate new keys
          keys = await initializeIdentityKeys()
          isNewKeys = true
        }

        setKeyPair(keys)
        setHasKeys(true)

        // Generate fingerprints
        const fp = await generateFingerprint(keys.publicKey)
        const sfp = await generateShortFingerprint(keys.publicKey)
        setFingerprint(fp)
        setShortFingerprint(sfp)

        // Check if public key needs to be synced to server
        const { data: profile } = await supabase
          .from('709_profiles')
          .select('public_key')
          .eq('id', user.id)
          .single()

        if (profile?.public_key !== keys.publicKey) {
          await supabase
            .from('709_profiles')
            .update({
              public_key: keys.publicKey,
              public_key_updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        }

        // Check if user should be reminded to backup keys
        // (new keys or no backup recorded)
        if (isNewKeys) {
          const backupDismissed = localStorage.getItem('e2e_backup_dismissed')
          if (!backupDismissed) {
            setNeedsBackup(true)
          }
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Encryption initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize encryption')
        setIsInitialized(true)
      } finally {
        setIsInitializing(false)
      }
    }

    initEncryption()

    // Re-initialize when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        initEncryption()
      } else if (event === 'SIGNED_OUT') {
        setHasKeys(false)
        setFingerprint(null)
        setShortFingerprint(null)
        setKeyPair(null)
        setNeedsBackup(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const backupKeys = useCallback(async (password: string): Promise<string> => {
    if (!keyPair) {
      throw new Error('No keys to backup')
    }
    const backup = await exportKeysForBackup(password, keyPair)
    localStorage.setItem('e2e_backup_created', new Date().toISOString())
    localStorage.setItem('709e2e:lastBackupAt', new Date().toISOString())
    setNeedsBackup(false)
    return backup
  }, [keyPair])

  const createRecoveryBackup = useCallback(async (): Promise<{ code: string; backup: string }> => {
    if (!keyPair) {
      throw new Error('No keys to backup')
    }
    const code = generateRecoveryCode()
    const backup = await exportKeysForBackup(code, keyPair)
    localStorage.setItem('e2e_backup_created', new Date().toISOString())
    localStorage.setItem('709e2e:lastBackupAt', new Date().toISOString())
    setNeedsBackup(false)
    return { code, backup }
  }, [keyPair])

  const restoreKeys = useCallback(async (backupData: string, password: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Must be logged in to restore keys')
    }

    const restored = await importKeysFromBackup(backupData, password)
    setKeyPair(restored)
    setHasKeys(true)

    // Update fingerprints
    const fp = await generateFingerprint(restored.publicKey)
    const sfp = await generateShortFingerprint(restored.publicKey)
    setFingerprint(fp)
    setShortFingerprint(sfp)

    // Sync to server
    await supabase
      .from('709_profiles')
      .update({
        public_key: restored.publicKey,
        public_key_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    setNeedsBackup(false)
  }, [])

  const dismissBackupReminder = useCallback(() => {
    localStorage.setItem('e2e_backup_dismissed', new Date().toISOString())
    setNeedsBackup(false)
  }, [])

  return (
    <EncryptionContext.Provider
      value={{
        isInitialized,
        isInitializing,
        hasKeys,
        needsBackup,
        fingerprint,
        shortFingerprint,
        error,
        backupKeys,
        createRecoveryBackup,
        restoreKeys,
        dismissBackupReminder,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  )
}
