# OpenPeople.ai

AI-powered commerce infrastructure for ambitious retail brands.

Built on the [open-people](https://github.com/OpenPeopleStudio/open-people) identity standard — every customer, agent, and storefront gets a portable, cryptographically verifiable identity.

---

## What it is

OpenPeople.ai is a multi-tenant platform that gives retail brands AI capabilities without giving up ownership of their data.

**Core platform**
- Multi-tenant storefronts with isolated data and custom domains
- Encrypted vault — zero-knowledge file storage per tenant
- AI assistant with persistent memory and context
- Knowledge base, notes, and workflow management

**AI operations layer**
- Cost analytics — token usage, budgets, optimization
- Drift detection — automated baseline comparison when model behavior shifts
- Quality scoring — evaluate AI output across configurable dimensions
- HITL queues — human review for high-risk decisions
- Policy engine — rule-based content controls with preview tooling

**Infrastructure add-ons**
- Storage (Cloudflare R2) — zero-egress, CDN-backed
- Email (Resend) — transactional with domain management
- Notifications (Twilio) — SMS, in-app, push

## Stack

Next.js 16 · Supabase · Cloudflare R2 · Resend · Tailwind · Vercel

## Identity

Customer and agent identity is built on the [open-people spec](https://github.com/OpenPeopleStudio/open-people) — Ed25519 keypairs, `did:key:` DIDs, and signed portable data packages. Data belongs to the person, not the platform.

---

[openpeople.ai](https://openpeople.ai) · [marsbot.dev](https://marsbot.dev)
