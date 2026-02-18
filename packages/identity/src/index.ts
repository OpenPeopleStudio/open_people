/**
 * @open-people/identity
 *
 * Ed25519 keypair generation, DID encoding/decoding, and DID Document management.
 *
 * Not yet implemented. See docs/spec/01-identity.md for the spec.
 */

export interface Keypair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface DIDDocument {
  id: string;
  public_key: string;
  created_at: string;
  display_name?: string;
  color?: string;
  avatar_hash?: string;
  bio?: string;
  urls?: string[];
  extensions?: Record<string, unknown>;
}

// TODO: Implement in M2
// export function generateKeypair(): Keypair
// export function publicKeyToDID(publicKey: Uint8Array): string
// export function didToPublicKey(did: string): Uint8Array
// export function createDIDDocument(keypair: Keypair, metadata?: Partial<DIDDocument>): DIDDocument
