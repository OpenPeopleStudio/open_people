# open_people Spec

## Reading Order

1. **[01-identity.md](01-identity.md)** — How identity works. Ed25519 keypairs, `did:key:` DIDs, DID Documents. Start here.
2. **[02-data-package.md](02-data-package.md)** — The `.opkg` format. How data is packaged, signed, and verified.
3. **[03-agent-portable.md](03-agent-portable.md)** — How AI agents are made portable. The `agent` content type and extension system.

## Design Principles

1. **Self-sovereign**: Generate a keypair, you exist. No registration, no approval, no blockchain.
2. **Self-verifying**: Every package includes the author's DID and a cryptographic signature. Any system can verify authenticity without contacting a third party.
3. **Content-addressed**: Every package is identified by the SHA-256 hash of its canonical content. If the content changes, the hash changes. Immutability by design.
4. **Human-readable**: JSON envelope. You can `cat` a package and understand it.
5. **Minimal core, extensible surface**: The standard defines the minimum. Namespaced extensions carry implementation-specific data without polluting the core.
6. **Trust is not portable**: An agent's trust level, permissions, and access are earned in context. They are never exported. A receiving system decides what to trust.

## Glossary

| Term | Definition |
|---|---|
| **DID** | Decentralized Identifier. A globally unique ID that doesn't require a central registry. open_people uses `did:key:`. |
| **did:key:** | A W3C DID method where the public key is encoded directly in the identifier string. Self-certifying — no resolution service needed. |
| **Ed25519** | An elliptic curve digital signature algorithm. Fast, compact (32-byte keys), widely supported. Used for all signing in open_people. |
| **.opkg** | Open People Package. The atomic unit of open_people data. A signed, content-addressed JSON container. |
| **content_hash** | SHA-256 hash of the canonical JSON serialization of a package's `content` field. Used for integrity verification and content addressing. |
| **content_type** | One of six types: `identity`, `agent`, `memory`, `workspace`, `credential`, `bundle`. Determines the schema of the `content` field. |
| **canonical JSON** | Deterministic JSON serialization: keys sorted lexicographically, no whitespace, UTF-8 NFC normalization. Ensures the same content always produces the same hash. |
| **bundle** | A package whose content is a list of references to other packages. Used to group related packages (e.g., agent + memory + workspace). |
| **transmission_class** | How far a package is expected to travel: `local` (same device), `network` (across the internet), `interplanetary` (across space, tolerant of latency and loss). |
| **multibase** | A self-describing base encoding format. Used in `did:key:` to encode the public key. The `z` prefix indicates base58btc encoding. |
| **multicodec** | A self-describing codec identifier. `0xed` indicates Ed25519 public key. Prepended to the key bytes before multibase encoding. |

## Versioning

The spec uses a single integer version in the package envelope: `"open_people": 1`. This number increments only on breaking changes. Non-breaking additions (new optional fields, new content types) do not increment the version.

The `metadata.schema_version` field (semver) tracks the schema version for the specific content type, allowing content schemas to evolve independently of the envelope format.
