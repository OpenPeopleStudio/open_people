# Remote Work Partner Roadmap (2026 H1)

Owner: Sam (CTO)  
Date: 2026-01-22  
Audience: CEO, CTO, Coder

## Purpose
Define a commercialization path for remote-work partnerships that aligns with the integration roadmap and enterprise readiness.

## North Star
Ship the enterprise remote-work stack: identity + chat hubs + meeting capture, with governance and audit trails as the differentiator.

## Roadmap Summary

### 1) Identity & Directory (Enterprise Gate)
**Targets:** Okta (primary), Google Workspace (secondary), Azure AD/Entra (follow-up)  
**Why now:** Unlocks enterprise procurement and co-sell credibility.  
**Repo fit:** `docs/features/integration-layer/02-sso-directory.md` + `docs/company/partner-brief-sso-scim-lighthouse.md`  
**Milestones:**
- Decide lighthouse target by 2026-01-29.
- Implement tenant-scoped SAML/OIDC + SCIM draft model.
- Validate audit trail fields for compliance.

### 2) Chat Hubs (Daily Remote Surface)
**Targets:** Slack + Microsoft Teams  
**Why now:** Highest daily touchpoint; distribution via marketplaces.  
**Repo fit:** `docs/features/integration-layer/03-chat-bots.md`  
**Milestones:**
- MVP: governed AI chat + notifications + knowledge lookup.
- Add slash commands + workflow triggers.
- Expand to meeting summary prompts.

### 3) Meetings (Async Capture)
**Targets:** Zoom + Google Meet  
**Why now:** Remote teams need meeting-to-task workflows.  
**Repo fit:** Slack/Teams bot scope + ops worker meeting ingestion.  
**Milestones:**
- Ingest meeting notes and summarize into workflows.
- Auto-create decisions and tasks.

### 4) Work Management (Execution System)
**Targets:** Jira + Linear + Asana  
**Why now:** Connect AI ops to real execution.  
**Repo fit:** Ops worker + webhooks/integration layer.  
**Milestones:**
- Bi-directional sync for tasks + status.
- Governance rules for automated updates.

### 5) Knowledge Systems (Async Context)
**Targets:** Notion + Confluence + Google Drive  
**Why now:** Remote teams depend on centralized knowledge.  
**Repo fit:** Knowledge base + RAG + policy engine.  
**Milestones:**
- Connector ingestion + permissions mapping.
- Policy-governed retrieval and citations.

## Commercial Positioning
- **Enterprise-ready remote AI ops** with tenant isolation, audit trails, and policy gating.
- **Marketplaces + co-sell** for distribution (Slack/Teams, Okta/Google).
- **Premium packaging** for identity + governance as add-ons.

## Dependencies & Constraints
- **Security approval required** before any new external connections (see `docs/security/data-security-bible.md`).
- **Tenant isolation** remains non-negotiable for all integrations.
- **Audit logging** required for SSO/SCIM and bot activity.

## Next Actions (CTO/Coder)
1) Confirm lighthouse IdP target and pilot customers (by 2026-01-29).
2) Scope Slack/Teams MVP spec and sequencing with identity work.
3) Draft security review checklist for new integration endpoints.
