# open_people Debates

## JSON vs binary for .opkg format
**Status: RESOLVED → JSON (see decisions/001-json-envelope.md)**

**For JSON:**
- Human-readable and debuggable — you can open a package in any text editor
- Web-native — no special parsers needed in browsers or Node.js
- Content inside can still be compressed (gzip, zstd) when size matters
- Lower barrier to adoption — every language has JSON support
- Easier to version and extend — add fields without breaking parsers

**Against JSON:**
- Larger on disk/wire than binary formats like CBOR, MessagePack, or Protobuf
- Canonical serialization is tricky (key ordering, whitespace, Unicode normalization)
- Not ideal for large binary blobs (base64 encoding inflates size ~33%)
- Slower to parse than binary at scale

**Verdict:** JSON envelope with optional content compression. The standard is about portability and adoption, not performance. A package you can `cat` and understand beats a package that's 30% smaller. Binary blobs (images, model weights) are content-addressed and referenced by hash, not embedded inline.

---

## Custom DID method (did:op:) vs existing (did:key:)
**Status: RESOLVED → did:key: (see decisions/002-did-key-method.md)**

**For did:op: (custom method):**
- Could encode open_people-specific metadata in the DID itself
- Full control over the resolution spec
- Brand recognition — `did:op:` immediately signals open_people

**Against did:op::**
- Requires registering a new DID method with W3C
- Every implementer needs an open_people-specific DID resolver
- Reinventing what did:key: already solves
- Adds adoption friction — existing DID tooling won't understand it

**For did:key: (W3C standard):**
- Already a W3C standard — no registration needed
- Widely supported by existing DID libraries (did-jwt, did-resolver, etc.)
- Self-contained — the public key IS the DID, no resolution service needed
- Same approach used by Nostr, AT Protocol, and others
- Interoperable — an open_people DID works in any did:key:-aware system

**Against did:key::**
- No open_people-specific metadata in the DID itself (use DID Document instead)
- Locked to the multicodec encoding format
- DID strings are long and not human-readable

**Verdict:** did:key: is the right choice. We don't need a custom method. The DID Document carries any metadata we need. Interoperability > branding.

---

## How much of mars-hq's agent model becomes standard vs stays mars-hq-specific
**Status: LEANING standard core + namespaced extensions**

**For standardizing most of the agent model:**
- More portable — agents move between systems with full fidelity
- Reduces implementation burden — one format to rule them all
- Mars HQ's agent model is already well-thought-out (personality dimensions, origin, guardrails)

**Against standardizing most of it:**
- Other systems may model agents very differently (no personality dimensions, different guardrail formats)
- Locks the standard to mars-hq's current design — hard to change later
- Overly prescriptive standards get ignored

**For minimal standard + extensions:**
- Core profile covers universal concepts (name, capabilities, memory format, origin)
- Namespaced extensions let mars-hq keep its personality dimensions without forcing them on others
- Easier to adopt — implement the core, ignore extensions you don't understand
- Follows the pattern of successful standards (HTML, HTTP headers, JSON-LD)

**Against minimal standard + extensions:**
- Extensions that aren't standard won't be portable
- Risk of fragmentation — every system defines its own extensions
- Mars-hq-specific personality data might get lost when importing into other systems

**Verdict (leaning):** Standard core profile (name, capabilities, memory_format, origin) + namespaced extensions (`mars-hq:personality`, `mars-hq:guardrails`). Other systems define their own extensions. The core is portable; the rest is best-effort.

---

## Memory embedded in agent package vs shipped separately
**Status: LEANING separate packages, linked via bundle**

**For embedded memory:**
- One file = one agent, complete and self-contained
- Simpler mental model — download the agent, you have everything
- No broken references — memory is always present

**Against embedded memory:**
- Memory can be huge (thousands of reflections, key-value pairs)
- You might want to ship an agent without its memory (fresh start)
- Memory might be updated independently of the agent profile
- Privacy — you might share your agent config but not your memories

**For separate packages (linked via bundle):**
- Agent and memory are both .opkg packages with their own content_hash and signature
- A bundle ties them together when you want the full picture
- Selective sharing — send just the agent, or agent + memory, or agent + memory + workspace
- Memory can be versioned independently
- Follows the content-addressed philosophy — each piece is independently verifiable

**Against separate packages:**
- More complex — now you need bundles to represent a "complete agent"
- Broken references possible if memory package is missing
- Harder for simple use cases (just want to export/import one thing)

**Verdict (leaning):** Separate packages. Memory is `content_type: "memory"`, agent is `content_type: "agent"`. Bundle them with `content_type: "bundle"` when you want the complete picture. The agent package has an optional `memory_refs` field that lists memory package IDs it expects.

---

## Governance: open_people as subset of mars-hq vs independent project
**Status: RESOLVED → independent project**

**For keeping it inside mars-hq:**
- Simpler repo management — one place for everything
- Mars HQ is the only implementation right now — why separate?
- Easier to keep types in sync between standard and implementation
- Less overhead maintaining two repos

**Against keeping it inside mars-hq:**
- The standard should outlive any single product
- Other projects can't depend on the standard without pulling in all of mars-hq
- Conflates the spec (stable, versioned) with the product (rapidly changing)
- Makes it look like a mars-hq-specific format, not an open standard

**For independent project:**
- Clean separation of concerns — the spec is the spec, the product is the product
- Other implementations can reference the standard without knowing mars-hq exists
- Versioning is independent — spec v1.0 doesn't need to wait for mars-hq v1.0
- Signals openness — this belongs to everyone, not just one project
- Mars HQ references the standard; the standard doesn't reference Mars HQ

**Against independent project:**
- Two repos to maintain
- Type definitions may drift between standard and implementation
- More coordination overhead when making changes

**Verdict:** Independent project. The standard lives at `/Users/mars/open-people/`. Mars HQ references it. The standard doesn't reference Mars HQ except in the migration guide (which is specifically about Mars HQ's legacy format). Type drift is mitigated by the `packages/migrate/` bridge package.
