/**
 * Vault Encryption Tests
 * 
 * Tests for lib/vault/encryption.ts - server-side encryption utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  generateDEK,
  generateKeyId,
  generateSalt,
  createPasswordVerification,
  verifyPassword,
  wrapDEK,
  unwrapDEK,
  hashRecoveryCode,
  verifyRecoveryCode,
  generateRecoveryCodes,
  generateQRChallenge,
} from '@/lib/vault/encryption';

describe('Key Generation', () => {
  it('generates a valid DEK', async () => {
    const dek = await generateDEK();
    expect(dek).toBeDefined();
    expect(dek.length).toBe(44); // 32 bytes base64 encoded
  });
  
  it('generates unique DEKs', async () => {
    const dek1 = await generateDEK();
    const dek2 = await generateDEK();
    expect(dek1).not.toBe(dek2);
  });
  
  it('generates a valid key ID', () => {
    const keyId = generateKeyId();
    expect(keyId).toBeDefined();
    expect(keyId.length).toBeGreaterThan(0);
    // Should be a UUID format
    expect(keyId).toMatch(/^[0-9a-f-]+$/i);
  });
  
  it('generates a valid salt', () => {
    const salt = generateSalt();
    expect(salt).toBeDefined();
    expect(salt.length).toBe(24); // 16 bytes base64 encoded
  });
});

describe('Password Verification', () => {
  it('creates password verification hash', async () => {
    const password = 'test-password-123!';
    const verification = await createPasswordVerification(password);
    
    expect(verification).toHaveProperty('hash');
    expect(verification).toHaveProperty('salt');
    expect(verification.hash.length).toBeGreaterThan(0);
    expect(verification.salt.length).toBeGreaterThan(0);
  });
  
  it('verifies correct password', async () => {
    const password = 'correct-password-456!';
    const verification = await createPasswordVerification(password);
    
    const isValid = await verifyPassword(password, verification);
    expect(isValid).toBe(true);
  });
  
  it('rejects incorrect password', async () => {
    const password = 'correct-password-789!';
    const verification = await createPasswordVerification(password);
    
    const isValid = await verifyPassword('wrong-password', verification);
    expect(isValid).toBe(false);
  });
  
  it('different passwords produce different hashes', async () => {
    const v1 = await createPasswordVerification('password1');
    const v2 = await createPasswordVerification('password2');
    
    expect(v1.hash).not.toBe(v2.hash);
  });
});

describe('DEK Wrapping', () => {
  it('wraps and unwraps DEK correctly', async () => {
    const originalDEK = await generateDEK();
    const password = 'wrapping-password-123!';
    
    // Wrap the DEK
    const wrapped = await wrapDEK(originalDEK, password);
    
    expect(wrapped).toHaveProperty('encryptedDek');
    expect(wrapped).toHaveProperty('iv');
    expect(wrapped).toHaveProperty('salt');
    
    // Unwrap the DEK
    const unwrappedDEK = await unwrapDEK(wrapped, password);
    
    expect(unwrappedDEK).toBe(originalDEK);
  });
  
  it('fails to unwrap with wrong password', async () => {
    const originalDEK = await generateDEK();
    const wrapped = await wrapDEK(originalDEK, 'correct-password');
    
    await expect(unwrapDEK(wrapped, 'wrong-password')).rejects.toThrow();
  });
});

describe('Recovery Codes', () => {
  it('generates recovery codes', () => {
    const codes = generateRecoveryCodes(10);
    
    expect(codes).toHaveLength(10);
    codes.forEach(code => {
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
  });
  
  it('generates unique codes', () => {
    const codes = generateRecoveryCodes(10);
    const uniqueCodes = new Set(codes);
    
    expect(uniqueCodes.size).toBe(10);
  });
  
  it('hashes and verifies recovery code', () => {
    const codes = generateRecoveryCodes(1);
    const code = codes[0];
    
    const hash = hashRecoveryCode(code);
    expect(hash).toBeDefined();
    
    const isValid = verifyRecoveryCode(code, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = verifyRecoveryCode('XXXX-XXXX-XXXX', hash);
    expect(isInvalid).toBe(false);
  });
});

describe('QR Challenge', () => {
  it('generates QR challenge', () => {
    const challenge = generateQRChallenge();
    
    expect(challenge).toBeDefined();
    expect(challenge.length).toBeGreaterThan(20);
  });
  
  it('generates unique challenges', () => {
    const c1 = generateQRChallenge();
    const c2 = generateQRChallenge();
    
    expect(c1).not.toBe(c2);
  });
});
