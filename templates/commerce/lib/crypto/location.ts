/**
 * Location-specific E2E encryption
 * 
 * Encrypts lat/lng coordinates for staff location tracking
 * Uses the same E2E encryption system as messages
 */

import {
  encryptMessage,
  decryptMessage,
  initializeIdentityKeys,
  type StoredKeyPair,
} from './e2e'

export type EncryptedLocation = {
  ciphertext: string
  iv: string
  senderPublicKey: string
  messageIndex: number
}

export type LocationData = {
  lat: number
  lng: number
  accuracy?: number | null
  recordedAt?: string
}

/**
 * Encrypt location coordinates
 */
export async function encryptLocation(
  lat: number,
  lng: number,
  accuracy: number | null,
  recordedAt: string,
  myPrivateKey: string,
  myPublicKey: string,
  recipientPublicKey: string,
  recipientId: string
): Promise<EncryptedLocation | null> {
  try {
    const locationData: LocationData = {
      lat,
      lng,
      accuracy,
      recordedAt,
    }
    
    const plaintext = JSON.stringify(locationData)
    
    const encrypted = await encryptMessage(
      plaintext,
      myPrivateKey,
      myPublicKey,
      recipientPublicKey,
      recipientId
    )
    
    if (!encrypted) {
      console.error('Failed to encrypt location')
      return null
    }
    
    return encrypted
  } catch (error) {
    console.error('Location encryption error:', error)
    return null
  }
}

/**
 * Decrypt location coordinates
 */
export async function decryptLocation(
  encryptedLocation: EncryptedLocation,
  myPrivateKey: string,
  senderId: string
): Promise<LocationData | null> {
  try {
    const decrypted = await decryptMessage(
      encryptedLocation.ciphertext,
      encryptedLocation.iv,
      encryptedLocation.senderPublicKey,
      encryptedLocation.messageIndex,
      myPrivateKey,
      senderId
    )
    
    const locationData: LocationData = JSON.parse(decrypted)
    return locationData
  } catch (error) {
    console.error('Location decryption error:', error)
    return null
  }
}

/**
 * Batch decrypt multiple locations
 * Returns decrypted locations with null for failed decryptions
 */
export async function decryptLocationBatch(
  encryptedLocations: Array<{
    encrypted_location: EncryptedLocation
    user_id: string
    latitude: number
    longitude: number
    accuracy_m: number | null
    recorded_at: string
  }>,
  myPrivateKey: string
): Promise<Array<{
  user_id: string
  lat: number
  lng: number
  accuracy_m: number | null
  recorded_at: string
  encrypted: boolean
}>> {
  const results = await Promise.all(
    encryptedLocations.map(async (location) => {
      // Try to decrypt
      const decrypted = await decryptLocation(
        location.encrypted_location,
        myPrivateKey,
        location.user_id
      )
      
      if (decrypted) {
        return {
          user_id: location.user_id,
          lat: decrypted.lat,
          lng: decrypted.lng,
          accuracy_m: decrypted.accuracy ?? null,
          recorded_at: decrypted.recordedAt ?? location.recorded_at,
          encrypted: true,
        }
      }
      
      // Fallback to plaintext
      return {
        user_id: location.user_id,
        lat: location.latitude,
        lng: location.longitude,
        accuracy_m: location.accuracy_m,
        recorded_at: location.recorded_at,
        encrypted: false,
      }
    })
  )
  
  return results
}

/**
 * Get or initialize encryption keys for location sharing
 */
export async function getLocationEncryptionKeys(): Promise<StoredKeyPair | null> {
  try {
    return await initializeIdentityKeys()
  } catch (error) {
    console.error('Failed to initialize location encryption keys:', error)
    return null
  }
}
