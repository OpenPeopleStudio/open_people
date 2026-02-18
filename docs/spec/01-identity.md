# 01: Identity

## Summary

An open_people identity is an Ed25519 keypair. Generate a keypair, you exist. No registration, no blockchain, no central authority.

The public key becomes a `did:key:` Decentralized Identifier (DID). The DID Document describes the identity with optional metadata. The private key is held by the owner and never appears in any package.

## Keypair Generation

An open_people identity starts with an Ed25519 keypair:

- **Private key**: 32 bytes, generated from a cryptographically secure random source
- **Public key**: 32 bytes, derived from the private key

```
private_key = crypto.randomBytes(32)
public_key  = ed25519.getPublicKey(private_key)
```

The private key MUST be stored securely by the owner. It is used to sign packages and prove identity. It MUST NOT appear in any `.opkg` package, DID Document, or transmission.

## DID Format

The public key is encoded as a `did:key:` identifier following the [W3C did:key Method](https://w3c-ccg.github.io/did-method-key/) specification:

```
did:key:z6Mk<base58btc-encoded-ed25519-public-key>
```

### Encoding Steps

1. Start with the raw 32-byte Ed25519 public key
2. Prepend the multicodec prefix for Ed25519: `0xed01` (2 bytes)
3. Encode the resulting 34 bytes using base58btc
4. Prepend the multibase prefix `z` (indicating base58btc)
5. Prepend `did:key:`

### Example

```
Raw public key (hex): 3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29
Multicodec prefix:    ed01
Combined (hex):       ed013b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29
Base58btc:            6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
DID:                  did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

## DID Document

The DID Document is the `content` of an `identity` type `.opkg` package. It describes the identity owner.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | The `did:key:` identifier |
| `public_key` | string | Hex-encoded Ed25519 public key |
| `created_at` | string | ISO 8601 timestamp of keypair generation |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `display_name` | string | Human-readable name chosen by the owner |
| `color` | string | Hex color code for visual representation (e.g., `#4a90d9`) |
| `avatar_hash` | string | SHA-256 hash of the owner's avatar image (image stored externally) |
| `bio` | string | Short self-description (max 280 characters) |
| `urls` | string[] | List of URLs associated with the identity (website, social, etc.) |
| `extensions` | object | Namespaced extension data (see below) |

### Extensions

The `extensions` field carries implementation-specific metadata. Each key is a namespace (reverse domain or project name), and the value is an arbitrary JSON object.

```json
{
  "extensions": {
    "mars-hq": {
      "trust_level": 3,
      "preferred_model": "claude-sonnet-4-20250514"
    }
  }
}
```

Extensions are advisory. A system that doesn't understand an extension MUST ignore it, not reject the package.

### Full Example

```json
{
  "id": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "public_key": "3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29",
  "created_at": "2026-02-18T12:00:00Z",
  "display_name": "Mars",
  "color": "#e74c3c",
  "bio": "Building the bridge between Earth and everywhere else.",
  "urls": ["https://openpeopleStudio.com"],
  "extensions": {}
}
```

## Identity Lifecycle

### Creation
Generate a keypair. Encode the public key as a DID. Create a DID Document. Sign it as an `.opkg` package. Done.

### Rotation
Key rotation is supported by creating a new identity package signed by the old key, with a `rotation` field:

```json
{
  "rotation": {
    "previous_did": "did:key:z6Mk...<old>",
    "new_did": "did:key:z6Mk...<new>",
    "rotated_at": "2026-06-01T00:00:00Z",
    "reason": "scheduled rotation"
  }
}
```

The rotation package MUST be signed by the **old** private key. This proves the old identity authorized the transition. Systems that receive this package should update their records to associate the old DID's data with the new DID.

### Revocation
An identity can be revoked by publishing a signed revocation package:

```json
{
  "revocation": {
    "did": "did:key:z6Mk...",
    "revoked_at": "2026-06-01T00:00:00Z",
    "reason": "key compromise"
  }
}
```

The revocation package MUST be signed by the private key being revoked. After revocation, systems SHOULD NOT accept new packages signed by this key.

## Security Considerations

1. **Private key storage**: The private key is the identity. Loss means loss of identity. Compromise means impersonation. Implementers SHOULD support encrypted key storage and backup mechanisms.
2. **No key escrow**: There is no "forgot password" flow. This is by design. Centralized recovery mechanisms are centralized control.
3. **Key derivation**: Implementers MAY derive Ed25519 keys from a BIP-39 mnemonic seed phrase to enable human-memorable backup. This is an implementation choice, not part of the standard.
4. **Multiple identities**: A person MAY have multiple identities. The standard places no limit and makes no assumption about one-person-one-identity.

## Verify

A conforming implementation MUST pass these tests:

1. **Generate**: Generate an Ed25519 keypair. The public key is 32 bytes. The private key is 32 bytes.
2. **Encode DID**: Encode the public key as `did:key:`. The result starts with `did:key:z6Mk`.
3. **Decode DID**: Decode a `did:key:` string back to a 32-byte public key. It matches the original.
4. **Round-trip**: Generate → encode → decode → compare. Public keys match.
5. **Sign and verify**: Sign arbitrary data with the private key. Verify the signature with the public key from the decoded DID. Verification succeeds.
6. **DID Document**: Create a DID Document with required fields. Validate it against the JSON Schema. It passes.
