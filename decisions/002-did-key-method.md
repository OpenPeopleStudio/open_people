# 002: Use did:key: as DID Method

## Context
open_people identities need a decentralized identifier (DID) format. Options were creating a custom `did:op:` method or using the existing W3C `did:key:` standard.

## Decision
Use `did:key:` with Ed25519 public keys.

## Reasoning
- **No registration needed**: `did:key:` is self-certifying — the public key IS the identifier. No registry, no blockchain, no resolution service.
- **W3C standard**: Already specified, already implemented in many libraries (did-jwt, did-resolver, veramo, etc.).
- **Interoperable**: An open_people DID works in any system that understands `did:key:`. This includes the AT Protocol (Bluesky), Nostr ecosystem tools, and verifiable credential systems.
- **Metadata goes in the DID Document**: We don't need to encode open_people-specific data in the DID string itself. The DID Document (which lives inside the identity `.opkg` package) carries display name, color, avatar hash, and any other metadata.
- **Adoption over branding**: `did:op:` would require every implementer to build a custom resolver. `did:key:` works out of the box.

See DEBATES.md "Custom DID method (did:op:) vs existing (did:key:)" for the full deliberation.
