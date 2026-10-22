# Changelog

Run notes per `VERSION` stamp. **Trio:** VERSION + CHANGELOG.md + ACTIONS.

## 0.5.11 — 2026-10-22 — /ask skips Gateway OpenAI BYOK

Production chat streamed then failed: AI Gateway 403 `byok_requires_paid_credits` on `openai/gpt-4.1-mini`. OIDC was fine; knowledge file loaded. If `OPENAI_API_KEY` is already on the project, `/ask` calls OpenAI directly. Otherwise Gateway still uses OIDC but routes through Azure system credentials, not team OpenAI BYOK. `ASK_ADMIN_TOKEN` remains Tom-only.

## 0.5.10 — 2026-10-22 — /ask accepts Vercel OIDC on production

`POST /api/ask` no longer 503s on Vercel when `AI_GATEWAY_API_KEY` is unset. Gateway auth is OIDC (`VERCEL_OIDC_TOKEN` or the runtime `x-vercel-oidc-token` header, or `VERCEL=1`). `ASK_ADMIN_TOKEN` remains Tom-only for the follow-ups poll API.

## 0.5.9 — 2026-10-22 — /ask QR Q&A (first slice)

Public `/ask` for the preliminary proposal (QR dest). Desk style. Chat via Vercel AI SDK + AI Gateway, answers only from `content/ask/proposal-knowledge.md` (placeholder). Follow-up form stores in private Supabase `ask_followups` (RLS on, service-role only). Admin poll: `GET/POST /api/ask/followups` behind `ASK_ADMIN_TOKEN`. No Resend on this path. Public copy still says we'll find out and email you. Rate limit + honeypot. No visitor auth, no analytics. `/letter` untouched.

## 0.5.8 — 2026-10-22 — Coalition leftovers: Open People leads

`/brief` already said Open People leads (0.5.7). Remaining catalyst / “not a deal seat” / “partners own any steel” copy was on `/coalition` (noindex) and its OG card. Replaced with a short proponent line: Open People leads the proposed Labrador campus, partnering with NL Hydro, Indigenous nations (consent first), and capital. Still proposed / in feasibility. `/letter` untouched. Merged as PR #17.

## 0.5.7 — 2026-10-22 — Open People leads the proposed campus

Tom: Open People is the proponent. `/brief`, `/compute`, `/about` (plus home/approach/footer/engage meta) no longer say catalyst, leftover optionality, or “wrong page”. 500 MW Labrador campus + research campus, proposed / in feasibility. Mines are a real constraint. No dollar figures, funding asks, or named customers. `/letter` untouched. Same PR, no merge.

## 0.5.6 — 2026-10-22 — Public vision thesis (first slice)

`/vision` is the public thesis, not the four-sentence-only page. Dual (Plain / Technical). Proposed 500 MW Labrador campus, in feasibility. Research campus in the spirit of Perimeter and Banff. Near-term: feasibility on costs and impact. No funding ask, no dollar figures, no named customers. `/letter` untouched. Home, brief, compute, about left for later slices.

## 0.5.5 — 2026-10-14 — Desk facts pass: tracker, costs, brief

Sourced update from 22 Sep–14 Oct 2026 on `/tracker`, `/costs`, and `/brief`. Hogan-calm, cite-honest. `DESK_VERIFIED` is 2026-10-14. No new claims.

- **Tracker:** material terms will not be reopened (Williams; ~17–18 agreements still in draft); 31 Dec target is soft and can run to the DCIA Term of 31 Mar 2027 (Saltwire/Telegram, 9 Oct, outlet+date — no loadable URL); PQ minority 5 Oct; St-Pierre Plamondon met Fréchette 13 Oct, Churchill Falls raised, no decision; cabinet 21 Oct; National Assembly 17 Nov; PUB 8 Oct technical conference cancelled (outlet+date); Labrador West 735 kV / 1,500 MW ceiling, FEED Dec 2026, construction contracts expected Q1 2028; NECEC in-service 16 Jan 2026 and held back 24–26 Jan; CHPE commercial May 2026 then outage; Gull Island still not filed with IAAC; Innu unresolved.
- **Costs:** 17 Aug package (2,350 MW, 150% sell-to-HQ option, 985 MW transmission, $49B 2026 NPV, $3.5B NPV federal support, 15% rebate after DAs); $8B wind capital cost estimate, developer unnamed; rebate may slip to April (VOCM, 13 Oct); HQ Rate CD $32.704/kW-month + 8.710¢/kWh; US 10% energy duty with ISO-NE pass-through; Goose Bay up to $8B, first contract $187M.
- **Brief:** gaps stay UNKNOWN — domestic load undefined; 3-year recall is testimony, not signed text; no NL data-centre rate or firm-MW value. Mines competing for the same MW: Iron Bear nearly a third of CF expansions; Kami with Nippon Steel and Sojitz.

## 0.5.4 — 2026-09-22 — Share cards: instrument, not poster

Tom rejected the soft brochure OG (2px hairline, equal-weight serif, empty void). Home card is a denser instrument: 8px plasma chassis, grotesque dominant line, mono plasma secondary, abstract gate ticks, locked copy. Copy-pass 1 living-desk `og:description` and Dual plain stay as on main.

- Locked: `OPEN PEOPLE · CHURCHILL RIVER DESK` / `Keep the power here.` / `Watch the gates.` / `OPEN PEOPLE · NL` / `OPENPEOPLE.AI`
- Compute stays quiet steel: `A compute plan,` / `not a campus landing.`
- `lib/og/image.tsx` and `lib/og/svg.ts` share `lib/og/layout.ts`. Regenerated `public/og-image.png` + `public/twitter-image.png` (1200×630).

## 0.5.3 — 2026-09-22 — Copy pass 1: meta + Dual plain

Home share copy and Dual lede. Hogan: “What matters is what we keep” — never “The fight is.” OG card art slots already locked (kicker / Keep the power here. / Watch the gates.). Compute stays quiet steel.

## 0.5.2 — 2026-09-22 — Put og:image back in the HTML

Partial `openGraph` objects were wiping Next’s file-based `opengraph-image.tsx` injection. Root metadata and `deskMetadata()` now set `openGraph.images` / `twitter.images` to `/og-image.png` (resolved via `metadataBase` to www). Art unchanged.

## 0.5.1 — 2026-09-22 — Desk v2 Open Graph / Twitter previews

Share cards match the live Churchill River desk instead of empty PNGs and leftover “horizon desk” OG copy.

- Real **1200×630** `public/og-image.png` / `twitter-image.png` (void + plasma hairline, “Keep the power here.”). Same ImageResponse layout as the `opengraph-image.tsx` routes, so they cannot ship as 0-byte placeholders. SVG twin at `public/og-image.svg`.
- Next.js `opengraph-image.tsx` / `twitter-image.tsx` (ImageResponse) on home, tracker, costs, industries, engage, brief, coalition, compute — compute stays quieter.
- Root `og:title` / `twitter:title` now match the live tab title. Child routes set their own OG so they no longer inherit the root card.
- `metadataBase` / sitemap / robots use `www.openpeople.ai` (apex 307s; crawlers that skip redirects were fetching empty images).
- No invented ¢/MW on the image.

## 0.5.0 — 2026-09-22 — Desk v2: instrument, guided depth, verified data

Public site rebuilt as a precision instrument. Same doctrine, same facts, one design system, three reading depths, seven SVG instruments, every number bound to a sourced object.

- **Data (verified 22 Sep):** every figure re-checked against the DCIA and IRC PDFs, NL Hydro July 2026 schedule, P.U. 17(2026), HQ, AESO, BC and CER. Fixes: IRC MOU path is 3.8¢ over **2025–2041**; 31 Mar 2027 sits in DCIA **§6.3(a)**, with HQ Gull Island exclusivity during the Term; Labrador West FEED target Dec 2026; wind $400k/MW HQ payment condition; SaltWire guess replaced with a loadable mirror; CER URL fixed. New tracker rows: *return to the House without a promised vote*, *Québec Innu consent*. Innu, Québec and House rows carry 15–21 Sep reporting.
- **Design system v2** (`app/(marketing)/desk.css`): void + plasma (plain layer) + steel (technical layer), Newsreader / Inter / JetBrains Mono self-hosted, hairline shell with a left rail and mobile strip, dashed chips for UNKNOWN, print stylesheet. Google Fonts link and noise overlay removed from the public surface.
- **Guided depth:** Plain · Guided · Technical (`?v=plain|guided|tech`). `Unfold` keeps the plain sentence on screen and unfolds the technical block under it, highlighting the figure it backs. `Term` explains 33 pieces of jargon inline. `Figure` shows provenance on tap; UNKNOWN renders as a dashed *not published* slot. Polite one-per-card nudges (switchable). *Walk me through it* on home, tracker and costs.
- **Instruments:** Gate Clock with live day counters; Unknown Board; Price Ladder (seven families, labelled, not merged); Flow Bars; Corridor Schematic; Annex B Ramp; Default Path. Pure SVG, no chart library.
- **Pages:** home, tracker, costs, industries, engage (seven checks with live status, print for your MHA), compute (quiet, no clock), letter, about, approach, contact on one shell. `/brief` and `/coalition` ported from static HTML to the app router with figures bound to `lib/desk`.
- Internal jargon removed from public copy.

## 0.4.2 — 2026-09-22 — Visual slice 1 + digestability (on landed 1.8 vs 7.4)

Plain layer leads; technical layer stays in Receipts. Same facts as 0.4.1, easier to scan.

- `/costs` contested card is two equal columns: “starts ~1.8¢ in 2027” vs “averages ~7.4¢ over the life”, then the number. One line that they are different measurements. Annex D $ / CPI / unpublished bridge live in Receipts. Heritage 0.2¢ stays in section 01.
- `/tracker` board: plain-English row title, status chip, last verified, one source link. Material Terms / House / PDFs in Receipts.
- Dense blocks on `/` and `/costs` open with a one-breath takeaway; numbers after the sentence. ScaleAnchors stay paired.

## 0.4.1 — 2026-09-22 — Contested 7.4 vs Annex D 1.8 on /costs

Hogan-calm polish: two public HQ-export ¢ stories stay labeled, not merged. Innu tracker matches the contact gap.

- `/costs`: contested-communications card — two equal claims: **starts about 1.8¢/kWh in 2027** vs **averages about 7.4¢/kWh over ~50 years** (CP24 corrected graph, 17 Aug 2026; prior MOU ~5.9¢). One plain sentence: different measurements, not a contradiction to mash. Technical: citations, dates, document names — Annex D is target **$ + CPI**; Annex D → voter industrial ¢: **UNKNOWN**. Heritage 0.2¢ labeled heritage; LAB-IND-1 stays a formula.
- `/tracker`: Innu Nation urged a no vote; partnership remains open; Premier-contact gap (VOCM 21 Sep: Grand Chief says he has yet to contact them).

## 0.4.0 — 2026-09-22 — Horizon desk IA (first slice)

Public site reads as a Churchill River / Labrador power **information desk**, not a data-centre pitch.

- Nav: Brief · Tracker · Industries · Costs · Engage · Letter. Voice toggle stays. Compute plan is footer-only (never primary CTA). `/data-centre` redirects to `/compute`.
- New `/tracker` living board (DCIA, House 21–18, binding window, QC gate, Gull Island MW range, CF upgrades, Labrador West, unnamed Wind SPE, Innu gap, transparency gaps). Last-verified dates + primary PDFs.
- New `/industries` mining-first cards (Labrador West load/corridor sourced). Compute is a short secondary line.
- New `/costs`: heritage 0.2¢/kWh lore → DCIA Material Terms structure (CPI, synthetic export options) → published Labrador markers. Rate 1.1L domestic **3.154¢/kWh** (NLH current-rates page + Jul 2026 schedule). LAB-IND-1 shown as demand + RFIRM formula, not a collapsed ¢. Island Industrial labeled Island-vs-Labrador. Schedule-era 2015 industrial PDF labeled historical. MOU ¢ schedules not presented as locked PPAs. UNKNOWN labelled.
- New `/compute` quarantine. Home / brief / coalition heroes scrubbed of campus openers.
- Open People remains constituent/catalyst only — not a DCIA party.

## 0.3.1 — 2026-09-22 — Voice lock + /engage tools

Tighten mining-first / constituent voice across the public surface. Deepen `/engage`. Coalition no longer reads as an offtake/build plan.

- `/coalition`: lead with keeping firm power in NL (mines, towns, Indigenous, infra). Strip present offtake / FID / reserved-DC claims. `/engage` primary CTA; partner mailto secondary. Honesty list includes unnamed Wind SPE.
- `/engage`: contract-ask checklist; seventh open item (Wind SPE unnamed); copy-message is the reliable form path; fourth MHA template on Innu Nation; native share / copy link.
- Home secondary CTA and `/brief` title stay “public evidence brief” / “Labrador power & industry case” — compute is not the opener. Letter post-vote note: 21–18 = endorsement, not PPAs.

## 0.3.0 — 2026-09-22 — Post–House-vote DCIA + public engage path

Public site matches the 17 September 2026 House endorsement of the Churchill Falls / Gull Island DCIA **framework** (21–18; not binding PPAs).

- Home, `/brief`, `/coalition`, letter, approach, about: next gates are Québec **5 Oct**, binding targets **~31 Dec 2026**, DCIA term to **31 Mar 2027**. House sitting is no longer “set for Sep 14”.
- Lead with **firm in-province power** for NL industry (mining first). Compute is a named use / optionality, not a reserved block and not a DCIA seat.
- New public page **`/engage`**: what is still open, confirmed September–November doors, mailto form to tom@openpeople.ai, copy-paste MHA starters. Sitemap + nav/footer CTAs.

## 0.2.0 — 2026-08-25 — Churchill Falls Aug 17 agreement

Public site now matches the announced (not yet binding) Churchill Falls / Gull Island agreement.

- Homepage, `/brief`, and `/coalition`: the window is **binding agreements by March 31, 2027**, not an unsigned 2024 MOU.
- Facts bound to the Aug 17 Gov NL release (2,350 MW retained, +400 MW wind, $49B NPV / $273B nominal, 985 MW transmission, Labrador West funded) and NL Hydro price path as reported (1.8¢ in 2027 → 11.5¢ by 2041).
- Thesis held: compute is still not a named industrial use. No cheerleading.

## 0.1.0 — 2026-08-12 — Versioning workflow

**Adopt Mars-style release metadata** for `open-people-site`:

- Root `VERSION` + `CHANGELOG.md` + `ACTIONS` (move together on every green demo slice)
- Gate: `scripts/check-versioning.sh` (or `REPO_ROOT=… ~/scripts/check-versioning.sh`)
- Go-forward only — no history backfill before this stamp



All notable changes to OpenPeople.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial public release preparation
- Multi-tenant SaaS platform foundation
- AI alignment and governance features
- Comprehensive documentation scaffolding
- Development setup and contribution guidelines
- **Monitoring & Observability System**
  - Structured logging with Pino and correlation IDs
  - Sentry error tracking integration
  - Performance monitoring and metrics collection
  - Security alerting system with configurable rules
  - Audit log viewer UI for compliance
  - Health check endpoints with system metrics
  - Email worker monitoring capabilities
- **Centralized Authentication & Authorization**
  - Unified auth middleware replacing scattered auth code
  - Role-based access control (RBAC) with permission hierarchy
  - Multi-tenant access control and isolation
  - Resource ownership validation
- Easy-to-use middleware decorators for API routes
- Email Workspace v1 reliability improvements
  - Per-message triage queueing (no double-queueing)
  - AI queue metadata-only tracking and idempotent upserts
  - Draft + attachment fetch performance metrics and alerts
  - Super-admin email read-path safeguards (tenant scoped)

### Changed

- Migrated to Next.js 16 App Router
- Updated supabase integration patterns
- Enhanced TypeScript coverage across codebase
- Email Workspace processing favors async workers over webhook inline work

### Fixed

- Various bug fixes and performance improvements
- Reduced webhook latency risk by moving heavy email AI work off the inbound path

### Upgrade Notes (Email Workspace v1)

- Ensure the jobs worker is running in each environment: `npm run jobs:worker` (registers `JobType.EMAIL_TRIAGE`).
- Verify migrations applied: `supabase/migrations/20260120800000_email_workspace_schema.sql` (email tables + `email_ai_queue`) and `supabase/migrations/20260120900000_job_queue_system.sql` (job queue).
- Validate inbox and message-detail p95 alerts after deploy (see `docs/RUNBOOK.md`).
- Confirm AI suggestion reads remain admin-only and tenant-scoped.

## [0.1.0] - 2026-01-18

### Added

- **Core Platform Features**
  - Multi-tenant architecture with isolated data
  - Super admin console for platform management
  - Self-service tenant signup and onboarding
  - Custom domain support for white-labeling

- **Product Add-ons**
  - **Cloud Storage**: Zero-egress file storage via Cloudflare R2
  - **Email Service**: Transactional email via Resend with templates
  - **Experiments**: A/B testing and feature flags framework
  - **Notifications**: SMS and in-app notifications via Twilio

- **AI Governance Foundation**
  - AI model registry system
  - Basic audit logging framework
  - Tenant and user management
  - API key management

- **Technical Infrastructure**
  - Next.js 16 with App Router
  - supabase for database and real-time features
  - Tailwind CSS for styling
  - Comprehensive TypeScript coverage
  - Vercel deployment configuration

- **Documentation**
  - Complete feature specifications in `/docs/features/`
  - API documentation scaffolding
  - Development setup guides
  - Contribution guidelines

### Changed

- Initial platform architecture established
- Database schema designed for multi-tenancy
- Authentication flow implemented

### Deprecated

- N/A (initial release)

### Removed

- N/A (initial release)

### Fixed

- N/A (initial release)

### Security

- Basic authentication and authorization implemented
- Multi-tenant data isolation enforced
- API key security measures in place

## [0.0.1] - 2025-12-01

### Added

- Project initialization
- Basic Next.js setup with TypeScript
- Supabase project configuration
- Initial directory structure
- Development environment setup

### Changed

- Repository created and configured

---

## Version Numbering

OpenPeople.ai follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Release Types

- **Major Releases**: Significant new features, breaking changes
- **Minor Releases**: New features, enhancements (backwards compatible)
- **Patch Releases**: Bug fixes, security updates, documentation
- **Pre-releases**: Alpha, beta, release candidates for testing

## Release Cadence

- **Major Releases**: Quarterly (Q1, Q4)
- **Minor Releases**: Monthly
- **Patch Releases**: As needed (weekly/bi-weekly)
- **Pre-releases**: As features are ready

## Release Process

### Pre-release Checklist

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Migration guides written (for breaking changes)
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified

### Release Steps

1. **Branch Creation**: Create release branch from `main`
2. **Version Bump**: Update version in `package.json`
3. **Changelog Update**: Document all changes since last release
4. **Testing**: Run full test suite and manual QA
5. **Tag Creation**: Create Git tag with version number
6. **Deployment**: Deploy to staging environment
7. **Final Verification**: Test critical paths in staging
8. **Production Deployment**: Merge to `main` and deploy
9. **Announcement**: Update release notes and notify stakeholders

## Upcoming Releases

### v0.2.0 (Target: February 2026)

- AI audit logging implementation
- Content moderation pipeline
- Basic AI model registry UI
- Enhanced tenant management

### v0.3.0 (Target: March 2026)

- Safety and compliance features
- Bias detection monitoring
- PII detection and redaction
- Human-in-the-loop workflows

### v0.4.0 (Target: April 2026)

- Advanced AI governance features
- Performance monitoring dashboards
- Cost analytics and reporting
- Integration APIs

### v1.0.0 (Target: Q2 2026)

- Production-ready AI alignment platform
- Complete feature set implementation
- Enterprise security and compliance
- Multi-cloud deployment support

## Support Policy

- **Current Version**: Full support and security updates
- **Previous Version**: Security updates only (3 months)
- **Older Versions**: No support (upgrade recommended)

## Breaking Changes Policy

Breaking changes will be:

- Clearly documented in release notes
- Announced 30 days in advance for major releases
- Accompanied by migration guides
- Tested for backwards compatibility where possible

---

_This changelog is maintained by the OpenPeople.ai team. For the latest updates, see [GitHub Releases](https://github.com/OpenPeopleStudio/open_people/releases)._

Last updated: January 18, 2026\*
