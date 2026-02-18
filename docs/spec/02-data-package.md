# 02: Data Package (.opkg)

## Summary

The `.opkg` (Open People Package) is the atomic unit of open_people data. It is a signed, content-addressed JSON container that holds identity, agent, memory, workspace, credential, or bundle data.

Every package is:
- **Self-describing**: The envelope says what's inside, who made it, and how to verify it.
- **Self-verifying**: The content hash proves integrity. The signature proves authorship.
- **Content-addressed**: The package is identified by the SHA-256 hash of its content.

## Envelope Format

```json
{
  "open_people": 1,
  "package_id": "<UUIDv7>",
  "created_at": "<ISO 8601>",
  "author": {
    "did": "did:key:<public-key>",
    "signature": "<hex-encoded Ed25519 signature of content_hash>"
  },
  "content_hash": "<hex-encoded SHA-256 of canonical JSON of content>",
  "content_type": "identity | agent | memory | workspace | credential | bundle",
  "content": { },
  "metadata": {
    "schema_version": "1.0.0",
    "transmission_class": "local | network | interplanetary",
    "compression": "none | gzip | zstd"
  }
}
```

## Field Reference

### Envelope Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `open_people` | integer | Yes | Spec version. Currently `1`. Increments only on breaking changes. |
| `package_id` | string | Yes | UUIDv7. Time-ordered, globally unique. |
| `created_at` | string | Yes | ISO 8601 timestamp with timezone. When the package was created. |
| `author` | object | Yes | Identity of the package creator. |
| `author.did` | string | Yes | `did:key:` identifier of the author. |
| `author.signature` | string | Yes | Hex-encoded Ed25519 signature of the `content_hash` string, signed with the author's private key. |
| `content_hash` | string | Yes | Hex-encoded SHA-256 hash of the canonical JSON serialization of `content`. |
| `content_type` | string | Yes | One of: `identity`, `agent`, `memory`, `workspace`, `credential`, `bundle`. |
| `content` | object | Yes | The payload. Schema determined by `content_type`. |
| `metadata` | object | Yes | Package metadata. |
| `metadata.schema_version` | string | Yes | Semver version of the content type schema. |
| `metadata.transmission_class` | string | Yes | Expected travel distance: `local`, `network`, or `interplanetary`. |
| `metadata.compression` | string | Yes | Content compression: `none`, `gzip`, or `zstd`. |

### Content Types

| Type | Description | Content Schema |
|---|---|---|
| `identity` | DID Document — who the author is | See [01-identity.md](01-identity.md) |
| `agent` | Portable AI agent definition | See [03-agent-portable.md](03-agent-portable.md) |
| `memory` | Key-value store and/or reflections | See Memory below |
| `workspace` | Configuration, layouts, preferences | See Workspace below |
| `credential` | Verifiable claims about the identity | See Credential below |
| `bundle` | References to other packages | See Bundle below |

## Canonical JSON

To produce a deterministic hash, content MUST be serialized as canonical JSON:

1. **Key ordering**: All object keys sorted lexicographically (Unicode code point order), recursively
2. **No whitespace**: No spaces, tabs, or newlines between tokens
3. **Unicode normalization**: All strings in NFC form
4. **Number format**: No leading zeros, no trailing zeros after decimal, no positive sign, `-0` becomes `0`
5. **No duplicate keys**: If present, last value wins (but conforming producers MUST NOT emit duplicates)

### Example

Input:
```json
{ "name": "Mars", "age": 30, "active": true }
```

Canonical:
```
{"active":true,"age":30,"name":"Mars"}
```

## Signing

### Producing a Signature

1. Serialize `content` as canonical JSON → `canonical_content`
2. Compute SHA-256 of `canonical_content` → `content_hash` (hex-encoded)
3. Sign the UTF-8 bytes of the `content_hash` hex string with the author's Ed25519 private key → `signature` (hex-encoded)

```
canonical_content = canonicalize(package.content)
content_hash      = sha256(canonical_content).hex()
signature         = ed25519.sign(content_hash.utf8_bytes(), private_key).hex()
```

### Verifying a Signature

1. Extract the public key from `author.did` (decode the `did:key:` identifier)
2. Serialize `content` as canonical JSON → `canonical_content`
3. Compute SHA-256 of `canonical_content` → `computed_hash` (hex-encoded)
4. Verify `computed_hash` equals `content_hash` (integrity check)
5. Verify the Ed25519 signature of `content_hash` using the public key (authenticity check)

```
public_key    = decode_did_key(package.author.did)
canonical     = canonicalize(package.content)
computed_hash = sha256(canonical).hex()
assert computed_hash == package.content_hash       // integrity
assert ed25519.verify(package.author.signature, package.content_hash.utf8_bytes(), public_key)  // authenticity
```

If either check fails, the package MUST be rejected.

## Content Type: Memory

A memory package holds an agent's or human's accumulated knowledge.

```json
{
  "owner_did": "did:key:z6Mk...",
  "format": "key_value | reflections | mixed",
  "entries": [
    {
      "key": "user.preferred_language",
      "value": "en",
      "recorded_at": "2026-02-15T10:00:00Z"
    }
  ],
  "reflections": [
    {
      "content": "User prefers concise responses over detailed explanations.",
      "confidence": 0.85,
      "source": "interaction_pattern",
      "reflected_at": "2026-02-16T14:30:00Z"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `owner_did` | string | Yes | DID of the entity this memory belongs to |
| `format` | string | Yes | `key_value`, `reflections`, or `mixed` |
| `entries` | array | No | Key-value memory entries |
| `reflections` | array | No | Higher-order observations and learned patterns |
| `entries[].key` | string | Yes | Dot-notation key path |
| `entries[].value` | any | Yes | The stored value |
| `entries[].recorded_at` | string | Yes | ISO 8601 timestamp |
| `reflections[].content` | string | Yes | The reflection text |
| `reflections[].confidence` | number | No | 0.0 to 1.0 confidence score |
| `reflections[].source` | string | No | How this reflection was derived |
| `reflections[].reflected_at` | string | Yes | ISO 8601 timestamp |

## Content Type: Workspace

A workspace package captures configuration, layout, and preferences.

```json
{
  "owner_did": "did:key:z6Mk...",
  "name": "Main Workspace",
  "surfaces": [
    {
      "id": "chat-panel",
      "type": "chat",
      "position": { "x": 0, "y": 0, "w": 400, "h": 600 },
      "config": {}
    }
  ],
  "preferences": {
    "theme": "dark",
    "default_model": "claude-sonnet-4-20250514",
    "locale": "en-US"
  },
  "extensions": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `owner_did` | string | Yes | DID of the workspace owner |
| `name` | string | Yes | Human-readable workspace name |
| `surfaces` | array | No | UI surface configurations |
| `preferences` | object | No | User preferences (key-value) |
| `extensions` | object | No | Namespaced extension data |

## Content Type: Credential

A credential is a verifiable claim about an identity, signed by a third party.

```json
{
  "subject_did": "did:key:z6Mk...<subject>",
  "issuer_did": "did:key:z6Mk...<issuer>",
  "claim_type": "membership | certification | attestation | endorsement",
  "claim": {
    "organization": "OpenPeopleStudio",
    "role": "contributor",
    "granted_at": "2026-01-15T00:00:00Z"
  },
  "expires_at": "2027-01-15T00:00:00Z"
}
```

Credential packages MUST be signed by the **issuer** (the `author.did` in the envelope matches `issuer_did`). The subject is the entity the claim is about.

| Field | Type | Required | Description |
|---|---|---|---|
| `subject_did` | string | Yes | DID of the entity the credential is about |
| `issuer_did` | string | Yes | DID of the entity issuing the credential |
| `claim_type` | string | Yes | Category of claim |
| `claim` | object | Yes | The claim data (schema varies by claim_type) |
| `expires_at` | string | No | ISO 8601 expiration timestamp |

## Content Type: Bundle

A bundle groups multiple packages by reference.

```json
{
  "name": "Full Agent Export",
  "description": "Agent with memory and workspace",
  "packages": [
    {
      "package_id": "019505a0-1234-7000-8000-000000000001",
      "content_type": "agent",
      "content_hash": "a1b2c3d4...",
      "required": true
    },
    {
      "package_id": "019505a0-1234-7000-8000-000000000002",
      "content_type": "memory",
      "content_hash": "e5f6a7b8...",
      "required": false
    },
    {
      "package_id": "019505a0-1234-7000-8000-000000000003",
      "content_type": "workspace",
      "content_hash": "c9d0e1f2...",
      "required": false
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Human-readable bundle name |
| `description` | string | No | What's in the bundle and why |
| `packages` | array | Yes | References to constituent packages |
| `packages[].package_id` | string | Yes | UUIDv7 of the referenced package |
| `packages[].content_type` | string | Yes | Content type of the referenced package |
| `packages[].content_hash` | string | Yes | Expected content hash (for verification) |
| `packages[].required` | boolean | Yes | Whether the bundle is incomplete without this package |

A bundle does NOT embed other packages — it references them. The packages may be transmitted together (e.g., in a zip file or a directory) or fetched separately. A system receiving a bundle SHOULD verify that each referenced package's content_hash matches.

## Transmission Classes

| Class | Description | Constraints |
|---|---|---|
| `local` | Same device or local network | No size limits. Uncompressed is fine. |
| `network` | Over the internet | Size-conscious. Compression recommended for large content. |
| `interplanetary` | Across space (high latency, possible loss) | Maximally compressed. Self-contained (no external references). Bundle all dependencies. |

The transmission class is advisory. It tells the receiving system what conditions the sender expected. A system MAY re-classify a package for onward transmission.

## File Extension

`.opkg` files are UTF-8 encoded JSON. The file extension is a convention, not a requirement. Systems MUST identify open_people packages by the presence of the `"open_people"` key in the root object, not by file extension.

## Verify

A conforming implementation MUST pass these tests:

1. **Create**: Create a package with valid envelope fields. All required fields are present.
2. **Canonical hash**: Serialize content as canonical JSON, hash it. The hash matches `content_hash`.
3. **Sign**: Sign the content_hash with an Ed25519 private key. The signature is 64 bytes (128 hex chars).
4. **Verify signature**: Verify the signature using the public key from `author.did`. Verification succeeds.
5. **Tamper detection**: Modify one byte of `content`. Recompute hash. It no longer matches `content_hash`. Signature verification fails.
6. **Round-trip**: Create → serialize to JSON → parse → verify. All checks pass.
7. **Content type validation**: Create one package of each content type. Validate against the JSON Schema for that type. All pass.
