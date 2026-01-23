# Release Checklist

Owner: CTO
Maintainer: Coder

Use this checklist before any production release.

## Quality Gates

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run doctor`

## Tenant Safety

- [ ] Tenant scoping verified for all reads/writes
- [ ] No PII logged (spot check logs)
- [ ] Mr Robot sign-off for auth/API/data changes

## Operational Readiness

- [ ] Migrations applied with rollback notes
- [ ] Feature flags configured (if any)
- [ ] Observability alerts set (if new risk area)

## Verification

- [ ] Admin flows tested in `mars.localhost:3000/admin`
- [ ] Critical API routes smoke-tested
