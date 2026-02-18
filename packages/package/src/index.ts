/**
 * @open-people/package
 *
 * Build, parse, and validate .opkg data packages.
 * Handles canonical JSON serialization, content hashing, and envelope construction.
 *
 * Not yet implemented. See docs/spec/02-data-package.md for the spec.
 */

export type ContentType = 'identity' | 'agent' | 'memory' | 'workspace' | 'credential' | 'bundle';
export type TransmissionClass = 'local' | 'network' | 'interplanetary';
export type Compression = 'none' | 'gzip' | 'zstd';

export interface PackageEnvelope {
  open_people: 1;
  package_id: string;
  created_at: string;
  author: {
    did: string;
    signature: string;
  };
  content_hash: string;
  content_type: ContentType;
  content: Record<string, unknown>;
  metadata: {
    schema_version: string;
    transmission_class: TransmissionClass;
    compression: Compression;
  };
}

// TODO: Implement in M2
// export function canonicalize(obj: unknown): string
// export function contentHash(content: Record<string, unknown>): string
// export function createPackage(opts: CreatePackageOptions): PackageEnvelope
// export function parsePackage(json: string): PackageEnvelope
// export function validatePackage(pkg: PackageEnvelope): ValidationResult
