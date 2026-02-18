# 001: JSON Envelope for .opkg Format

## Context
The `.opkg` data package needs a serialization format. The two main candidates were JSON (text-based, human-readable) and a binary format (CBOR, MessagePack, or Protobuf).

## Decision
Use JSON as the envelope format for `.opkg` packages.

## Reasoning
- **Human-readable**: A package you can `cat` and understand beats a package that's 30% smaller. Debuggability matters more than size for a standard trying to gain adoption.
- **Web-native**: Every language and platform has JSON support. No special parsers or code generation needed.
- **Extensible**: Adding fields to JSON doesn't break existing parsers (they ignore unknown keys).
- **Content compression**: The `metadata.compression` field allows content to be compressed (gzip, zstd) when size matters, giving us the best of both worlds.
- **Binary blobs**: Large binary data (images, model weights) is referenced by content hash, not embedded inline. This sidesteps JSON's base64 overhead problem.
- **Canonical serialization**: We define canonical JSON as sorted keys + no whitespace + UTF-8 NFC normalization. This is well-understood and implementable in every language.

See DEBATES.md "JSON vs binary for .opkg format" for the full deliberation.
