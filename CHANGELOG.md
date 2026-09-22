# Changelog

Run notes per `VERSION` stamp. **Trio:** VERSION + CHANGELOG.md + ACTIONS.

## 0.4.2 — 2026-09-22 — Digestability on visual slice 1

Plain layer leads; technical layer stays in Receipts. Same facts, easier to scan.

- `/costs` contested card is two equal columns: “starts ~1.8¢ in 2027” vs “averages ~7.4¢ over the life”, then the number. One line that they are different measurements. Annex D $ / CPI / unpublished bridge live in Receipts. Heritage 0.2¢ stays in section 01.
- `/tracker` board: plain-English row title, status chip, last verified, one source link. Material Terms / House / PDFs in Receipts.
- Dense blocks on `/` and `/costs` open with a one-breath takeaway; numbers after the sentence. ScaleAnchors stay paired. No invented industrial tariff.

## 0.4.1 — 2026-09-22 — Visual slice 1 (modern precision desk)

Public desk chrome: type + spacing + hairline surfaces. Not sci-fi.

- Sharper H1 hierarchy and mono facts (dates / ¢ / MW / status) on `/`, `/tracker`, `/costs`.
- `/costs` contested-rate strip: equal-weight Life-average / Start / Heritage cards. Start + heritage wire to existing desk facts (reported 1.8→11.5 path; heritage 0.2¢). Life-average is an empty sourced shell until a parallel copy PR lands a marker — no invented 7.4¢.
- `/tracker` living board: three columns (on paper / open / UNKNOWN), semantic status chips, sticky last-verified strip.
- Motion: hero fade 180ms only; nav is a solid hairline (no backdrop blur); SiteShell radial glow removed. `/compute` stays quarantined and quieter.

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
