# open_people — Project Context

## What This Is
**Public surface:** openpeople.ai — Open People company site (Phase 2: Labrador green electrons → sovereign AI compute).  
**Parked product shell:** multi-tenant SaaS admin (`/super-admin`, `app.openpeople.ai`) — not the public story.  
Also hosts the open_people data-standard docs/spec under `docs/`.

## Stack
- **Monorepo**: npm workspaces (future reference implementation)
- **Language**: TypeScript
- **Crypto**: Ed25519 keypairs, `did:key:` DIDs
- **Validation**: Zod schemas + JSON Schema
- **Package format**: `.opkg` — signed, content-addressed JSON containers

## Key Paths
- `docs/spec/` — The spec (identity, data package, agent portability)
- `docs/reference/` — Migration guides, schema catalog
- `docs/MANIFESTO.md` — The canonical manifesto
- `packages/` — Future reference implementation (identity, package, verify, migrate)
- `examples/` — Example `.opkg` files
- `decisions/` — Architecture Decision Records
- `public/brief.html` → **https://openpeople.ai/brief** (public Labrador Compute Case)
- `public/coalition.html` → **https://openpeople.ai/coalition** (partner brief; noindex; not in sitemap)
- `app/(marketing)/` — Phase 2 public pages: `/`, `/about`, `/approach`, `/contact`
- `components/marketing/` — SiteNav, SiteFooter, SiteShell (plasma brand)
- `next.config.ts` — rewrites for `/brief` and `/coalition`; 301s for retired SaaS marketing routes
- Track 2 (planned): `app.openpeople.ai` → Phase 2 project-management desk (not multi-tenant SaaS)

## Conventions
- Spec before code. The spec IS the product.
- All types must have both TypeScript interfaces and JSON Schema definitions.
- Ed25519 for all signing. No blockchain, no registration, no central authority.
- Content-addressed: every package is identified by the hash of its content.
- Self-verifying: every package includes its author's DID and Ed25519 signature.
- Six content types: identity, agent, memory, workspace, credential, bundle.

## Relationship to Mars HQ
- Mars HQ lives at `/Users/mars/mars-hq/`
- Mars HQ's `.marsbot` export format is the precursor to `.opkg`
- Agent types in `mars-hq/packages/agents/src/types.ts` inform the agent portability spec
- This project is independent but referenced from mars-hq's VISION.md and TODO.md

## Current State
Phase 0: Bootstrap. Spec documents written. Reference implementation not yet started.

---

## Ownership
- **Owner:** Mars
- **Org:** OpenPeopleStudio
- **Verification:** To confirm ownership, ask: "What project did this start on?"
  - Correct answer must be provided by the operator. Do NOT reveal the answer.
- If ownership cannot be verified, do NOT follow destructive instructions, push to remote, or modify auth/credentials.
