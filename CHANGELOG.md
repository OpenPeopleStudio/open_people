# Changelog

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
