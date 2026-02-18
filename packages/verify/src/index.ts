/**
 * @open-people/verify
 *
 * Sign .opkg packages with Ed25519 and verify signatures.
 * Handles content hash verification and signature validation.
 *
 * Not yet implemented. See docs/spec/02-data-package.md (Signing section) for the spec.
 */

export interface SignResult {
  signature: string;
  content_hash: string;
}

export interface VerifyResult {
  valid: boolean;
  integrity: boolean;
  authenticity: boolean;
  error?: string;
}

// TODO: Implement in M2
// export function signPackage(content: Record<string, unknown>, privateKey: Uint8Array): SignResult
// export function verifyPackage(pkg: PackageEnvelope): VerifyResult
