# open_people Vision

## What are we building?
A portable data standard for human identity, AI agents, and memory — packages that any system can create, read, verify, and transmit without central authority.

## Who is it for?
Developers building AI-augmented tools, and eventually anyone who wants to own their digital presence rather than renting it from platforms.

## What does done look like?
- Any system can generate a valid open_people identity (Ed25519 keypair + DID) without registration
- Any system can create, sign, verify, and parse `.opkg` data packages
- AI agents can be exported from one system and imported into another with no data loss
- Memory, preferences, and workspace configs travel with the human, not the platform
- The standard is documented well enough that a developer can implement it from the spec alone

## What are we NOT building?
- A blockchain or distributed ledger
- A social network or identity provider
- A marketplace for agents or data
- A product — this is a standard; Mars HQ is the first product that implements it
- A trust system — trust is re-earned on import, never exported

## Vision Status
| Vision Goal | Status | What's Delivering It |
|---|---|---|
| Identity spec (DID + Ed25519) | Done | docs/spec/01-identity.md |
| Data package format (.opkg) | Done | docs/spec/02-data-package.md |
| Agent portability spec | Done | docs/spec/03-agent-portable.md |
| .marsbot migration guide | Done | docs/reference/marsbot-mapping.md |
| Schema catalog (all JSON Schemas) | Done | docs/reference/schema-catalog.md |
| Example .opkg files | Done | examples/ |
| Reference implementation: identity | Not Started | packages/identity/ |
| Reference implementation: package | Not Started | packages/package/ |
| Reference implementation: verify | Not Started | packages/verify/ |
| Reference implementation: migrate | Not Started | packages/migrate/ |
| Mars HQ integration (.marsbot -> .opkg) | Not Started | mars-hq bridge |
| Federation / cross-system transmission | Not Started | — |
