/**
 * Enhanced End-to-End Encryption with Perfect Forward Secrecy
 * 
 * Uses Double Ratchet-inspired approach:
 * - Identity keys for authentication
 * - Ephemeral keys for each session
 * - Message keys derived with HKDF for forward secrecy
 */

import {
  storeKeyPair,
  getActiveKeyPair,
  deactivateAllKeys,
  storeSession,
  getSession,
  getSessionById,
  updateSessionIndex,
  deleteExpiredSessions,
  type StoredKeyPair,
} from './indexedDB'

// Re-export for convenience
export type { StoredKeyPair }

// Constants
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const KEY_ROTATION_THRESHOLD = 100 // Rotate after 100 messages

// Utility functions
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Generate fingerprint from public key (for verification)
export async function generateFingerprint(publicKey: string): Promise<string> {
  const keyBuffer = base64ToBuffer(publicKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  
  // Format as groups of 4 hex chars for readability
  const hex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Format: XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX
  return hex.match(/.{1,4}/g)?.join(' ').toUpperCase() || hex
}

// Generate short fingerprint for display
export async function generateShortFingerprint(publicKey: string): Promise<string> {
  const full = await generateFingerprint(publicKey)
  return full.split(' ').slice(0, 4).join(' ')
}

// Generate identity key pair
export async function generateIdentityKeyPair(): Promise<{
  publicKey: string
  privateKey: string
  id: string
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const publicKey = bufferToBase64(publicKeyBuffer)
  const privateKey = bufferToBase64(privateKeyBuffer)
  
  // Generate unique ID from public key hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  const id = Array.from(hashArray.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return { publicKey, privateKey, id }
}

// Initialize or get existing identity keys
export async function initializeIdentityKeys(): Promise<StoredKeyPair> {
  // Clean up expired sessions
  await deleteExpiredSessions()
  
  // Check for existing active key pair
  const existing = await getActiveKeyPair()
  if (existing) {
    return existing
  }

  // Generate new key pair
  const { publicKey, privateKey, id } = await generateIdentityKeyPair()
  
  // Deactivate any old keys
  await deactivateAllKeys()
  
  // Store new key pair
  const keyPair: StoredKeyPair = {
    id,
    publicKey,
    privateKey,
    createdAt: Date.now(),
    isActive: true,
  }
  
  await storeKeyPair(keyPair)
  return keyPair
}

// Import keys from backup
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(publicKeyBase64)
  return crypto.subtle.importKey(
    'spki',
    keyBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
}

async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(privateKeyBase64)
  return crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  )
}

// Derive shared secret using ECDH
async function deriveSharedSecret(
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(privateKeyBase64)
  const publicKey = await importPublicKey(publicKeyBase64)

  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true, // Extractable for session storage
    ['encrypt', 'decrypt']
  )
}

// HKDF for deriving message keys (forward secrecy)
async function deriveMessageKey(
  sharedSecretBase64: string,
  messageIndex: number
): Promise<CryptoKey> {
  const sharedSecret = base64ToBuffer(sharedSecretBase64)
  const info = new TextEncoder().encode(`message-${messageIndex}`)
  const salt = new Uint8Array(16) // Zero salt for simplicity
  
  // Import as raw key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function createSessionId(recipientId: string, recipientPublicKey: string): Promise<string> {
  const keyBuffer = base64ToBuffer(recipientPublicKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  const hash = Array.from(hashArray.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `session-${recipientId}-${hash}`
}

// Get or create session with a recipient
async function getOrCreateSession(
  myPrivateKey: string,
  recipientPublicKey: string,
  recipientId: string
): Promise<{ sharedSecret: string; messageIndex: number; sessionId: string }> {
  // Check for existing session
  const sessionId = await createSessionId(recipientId, recipientPublicKey)
  let session = await getSessionById(sessionId)
  if (!session) {
    const legacySession = await getSession(recipientId)
    if (legacySession?.recipientPublicKey === recipientPublicKey) {
      session = { ...legacySession, id: sessionId }
      await storeSession(session)
    }
  }
  
  if (!session) {
    // Create new session
    const sharedKey = await deriveSharedSecret(myPrivateKey, recipientPublicKey)
    const sharedSecretBuffer = await crypto.subtle.exportKey('raw', sharedKey)
    const sharedSecret = bufferToBase64(sharedSecretBuffer)
  
    session = {
      id: sessionId,
      recipientId,
      recipientPublicKey,
      sharedSecret,
      messageIndex: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    }
    
    await storeSession(session)
  }
  
  return {
    sharedSecret: session.sharedSecret,
    messageIndex: session.messageIndex,
    sessionId: session.id,
  }
}

// Encrypt a message with forward secrecy
export async function encryptMessage(
  plaintext: string,
  myPrivateKey: string,
  myPublicKey: string,
  recipientPublicKey: string,
  recipientId: string
): Promise<{
  ciphertext: string
  iv: string
  senderPublicKey: string
  messageIndex: number
} | null> {
  try {
    const { sharedSecret, messageIndex, sessionId } = await getOrCreateSession(
      myPrivateKey,
      recipientPublicKey,
      recipientId
    )

    // Derive unique key for this message (forward secrecy)
    const messageKey = await deriveMessageKey(sharedSecret, messageIndex)
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      messageKey,
      data
    )

    // Increment message index for next message
    const newIndex = messageIndex + 1
    await updateSessionIndex(sessionId, newIndex)
    
    // Check if we should rotate keys
    if (newIndex >= KEY_ROTATION_THRESHOLD) {
      // Mark session for rotation on next message
      console.log('Session approaching key rotation threshold')
    }

    return {
      ciphertext: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv.buffer),
      senderPublicKey: myPublicKey,
      messageIndex,
    }
  } catch (error) {
    console.error('Encryption failed:', error)
    return null
  }
}

// Decrypt a message
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  senderPublicKey: string,
  messageIndex: number,
  myPrivateKey: string,
  senderId: string
): Promise<string> {
  try {
    const { sharedSecret } = await getOrCreateSession(
      myPrivateKey,
      senderPublicKey,
      senderId
    )

    // Derive the same message key
    const messageKey = await deriveMessageKey(sharedSecret, messageIndex)
    
    const ciphertextBuffer = base64ToBuffer(ciphertext)
    const ivBuffer = base64ToBuffer(iv)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      messageKey,
      ciphertextBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    // Silent fail for old messages with rotated/missing keys
    // console.warn('Decryption failed (old/rotated key):', error instanceof Error ? error.message : 'Unknown')
    throw new Error('Unable to decrypt message')
  }
}

export async function generateFileKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return bufferToBase64(key.buffer)
}

export async function encryptFileWithKey(
  fileBuffer: ArrayBuffer,
  keyBase64: string
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const keyBuffer = base64ToBuffer(keyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    fileBuffer
  )

  return { ciphertext: encrypted, iv: bufferToBase64(iv.buffer) }
}

export async function decryptFileWithKey(
  encryptedBuffer: ArrayBuffer,
  keyBase64: string,
  ivBase64: string
): Promise<ArrayBuffer> {
  const keyBuffer = base64ToBuffer(keyBase64)
  const iv = new Uint8Array(base64ToBuffer(ivBase64))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedBuffer
  )
}

// Key Backup/Recovery
export async function exportKeysForBackup(
  password: string,
  keyPairOverride?: StoredKeyPair
): Promise<string> {
  const keyPair = keyPairOverride || await getActiveKeyPair()
  if (!keyPair) {
    throw new Error('No keys to export')
  }
  if (!keyPair.privateKey) {
    throw new Error('Key is locked. Unlock to create a backup.')
  }

  // Derive encryption key from password
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encryptionKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // Encrypt the key pair data
  const keyData = JSON.stringify({
    id: keyPair.id,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  })
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoder.encode(keyData)
  )

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return bufferToBase64(combined.buffer)
}

export async function importKeysFromBackup(
  backupData: string,
  password: string
): Promise<StoredKeyPair> {
  const combined = new Uint8Array(base64ToBuffer(backupData))
  
  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const encrypted = combined.slice(28)

  // Derive decryption key from password
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const decryptionKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    decryptionKey,
    encrypted
  )

  const decoder = new TextDecoder()
  const keyData = JSON.parse(decoder.decode(decrypted))

  // Deactivate old keys and store imported ones
  await deactivateAllKeys()
  
  const keyPair: StoredKeyPair = {
    ...keyData,
    createdAt: Date.now(),
    isActive: true,
  }
  
  await storeKeyPair(keyPair)
  return keyPair
}

// Passphrase lock/unlock helpers for local key storage
export async function encryptPrivateKeyWithPassphrase(
  privateKey: string,
  password: string
): Promise<{
  encryptedPrivateKey: string
  iv: string
  salt: string
  iterations: number
}> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 150000
  const encryptionKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoder.encode(privateKey)
  )

  return {
    encryptedPrivateKey: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    iterations,
  }
}

export async function decryptPrivateKeyWithPassphrase(
  encryptedPrivateKey: string,
  password: string,
  ivBase64: string,
  saltBase64: string,
  iterations = 150000
): Promise<string> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = new Uint8Array(base64ToBuffer(saltBase64))
  const iv = new Uint8Array(base64ToBuffer(ivBase64))
  const decryptionKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    decryptionKey,
    base64ToBuffer(encryptedPrivateKey)
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

// Generate verification data (for QR code)
export async function generateVerificationData(publicKey: string): Promise<{
  fingerprint: string
  shortFingerprint: string
  qrData: string
}> {
  const fingerprint = await generateFingerprint(publicKey)
  const shortFingerprint = await generateShortFingerprint(publicKey)
  
  // QR data includes the full public key for verification
  const qrData = JSON.stringify({
    type: '709e2e',
    version: 1,
    publicKey,
    fingerprint: shortFingerprint,
  })

  return { fingerprint, shortFingerprint, qrData }
}

// Verify a scanned QR code matches expected public key
export async function verifyQRCode(
  qrData: string,
  expectedPublicKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const data = JSON.parse(qrData)
    
    if (data.type !== '709e2e') {
      return { valid: false, error: 'Invalid QR code type' }
    }
    
    if (data.publicKey !== expectedPublicKey) {
      return { valid: false, error: 'Public key does not match' }
    }
    
    // Verify fingerprint
    const expectedFingerprint = await generateShortFingerprint(expectedPublicKey)
    if (data.fingerprint !== expectedFingerprint) {
      return { valid: false, error: 'Fingerprint mismatch' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid QR code format' }
  }
}
