# Login Metrics

Owner: CTO

This doc defines what login metrics to track, the source of truth, and weekly reporting.

## Metrics to Track

- Total logins (weekly)
- Unique users (weekly)
- Active tenants with at least 1 login (weekly)
- Failed login rate (weekly)
- Password reset volume (weekly)
- SSO logins vs password logins (weekly)
- New user activations (weekly)

## Definitions

- Login: a successful authentication event that results in a session.
- Unique user: distinct user_id with ≥1 login in the reporting window.
- Active tenant: tenant_id with ≥1 login in the reporting window.
- Failed login rate: failed_auth / (failed_auth + successful_auth).
- Activation: first successful login within 7 days of user creation.

## Source of Truth

- Primary: app auth event logs (server-side).
- Secondary: analytics dashboard (if configured).
- Canonical storage: audit logs in Postgres.

## Weekly Reporting

- Owner: CTO (or delegate).
- Cadence: Mondays, 10am local.
- Format: 5-row summary + 3 highlights + 1 risk.

### Weekly Report Template

- Total logins:
- Unique users:
- Active tenants:
- Failed login rate:
- New user activations:

Highlights:
- 
- 
- 

Risk:
- 
