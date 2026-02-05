# Data Security Bible

This document defines non-negotiable rules for any agent or developer working
in this repo. The intent is to prevent accidental or unauthorized data egress,
especially through unexpected external API connections.

If a task conflicts with these rules, stop and request explicit, written
approval from a repo owner.

## Core Principles

- Assume all customer and internal data is sensitive.
- Only allow data to flow to systems explicitly approved in this repo.
- Prefer local processing or redacted data over any external transmission.
- Least privilege: only access what is required for the task.

## Allowed External Connections (Explicit Only)

Agents must only connect to external services that are explicitly documented in
the codebase or approved in writing by a repo owner. If a connection target is
not listed, it is forbidden.

Required checks before any external connection:

- Verify the target is documented in `docs/security/overview.md` or a service
  specific doc under `docs/`.
- Confirm the route is controlled by approved config (env vars in
  `docs/development/setup.md` or deployment docs).
- Confirm the data classification permits the transfer (see
  `docs/security/privacy.md`).

## Prohibited Actions

- Do not add new API endpoints or integrations that call external services
  without explicit written approval.
- Do not introduce any code that sends data to third-party analytics, logging,
  or monitoring services unless already approved in docs.
- Do not change base URLs, endpoints, or webhook destinations without approval.
- Do not add SDKs or clients that auto-connect to external services on import
  or initialization.
- Do not bypass or disable authentication, encryption, or audit logging.

## Data Handling Rules

- Never include secrets, tokens, or user data in logs.
- Always redact or hash identifiers before storing or emitting analytics events.
- Treat email contents and attachments as high sensitivity.
- Avoid persisting data in temporary files unless required and documented.

## Approval Workflow for New Integrations

Any new external connection must include:

- A written justification (business purpose, data types, retention).
- A security review note in `docs/security/overview.md`.
- An update to threat model or privacy docs if applicable.
- Tests or safeguards that enforce allowed endpoints.

## Agent-Specific Rules

- Do not run unapproved scripts that can trigger network requests.
- Do not add background jobs or cron tasks that call external services.
- Do not store production data locally, even for debugging.
- If unsure, stop and ask for explicit approval.

## Enforceable Guardrails (Recommended)

When possible, implement or maintain these guardrails:

- Allowlist external domains in server-side request helpers.
- Centralize outbound HTTP clients with audit logging.
- Add static checks to CI for new outbound URLs.
- Include runtime checks that fail closed on unknown endpoints.

## Security Contacts

If a task requires an exception, request approval from the repo owner or the
security lead listed in `docs/security/overview.md`.
