# OpenPeople.ai Documentation

Owner: Coder

Welcome to the comprehensive documentation for OpenPeople.ai, a multi-tenant SaaS platform for AI alignment and governance.

## 📖 Documentation Overview

This documentation is organized by company ownership and functional areas to help you understand, develop, deploy, and maintain the OpenPeople.ai platform.

## 🎬 Demo walkthrough (5–10 minutes)

If you want the app to feel like a product demo even before seeding real data:

- **Tenant admin dashboard**: `/admin?demo=1`
- **Super admin dashboard**: `/super-admin?demo=1`

A typical demo flow:

- **Onboarding**: create/complete onboarding (`/admin/onboarding`)
- **Email**: add a domain + send a templated email (`/admin/email`)
- **Notifications**: send an in-app notification (`/admin/notifications`)
- **Storage**: create a bucket + upload a file (`/admin/storage`)
- **Vault**: unlock + upload a sensitive doc and run AI analysis (`/admin/vault`)
- **Chat + Knowledge**: capture a fact/note from chat actions (`/admin/chat`)
- **Workflows**: create tasks + run an ops proposal (`/admin/workflows`)

### ✅ Start Here
- **[Getting Started](../README.md)** - Platform overview, tech stack, and basic setup
- **[Development Setup](./development/setup.md)** - Local development environment
- **[Deployment Overview](./deployment/overview.md)** - Production deployment guide

### 🧭 Company Structure & Ownership
- **[Company Docs](./company/README.md)** - Org structure, roles, and governance
- **[Ownership Map](./company/ownership-map.md)** - Roles ↔ doc areas
- **[Shareholder Workflow](./company/workflow.md)** - Chain of command and execution rules
- **[Coordination Log](./company/coordination.md)** - Cross-terminal handoffs
- **[Locks](./company/locks.md)** - Active edit locks and policy
- **[Docs TODO](./TODO.md)** - Documentation task queue
- **[Suggestions Inbox](./suggestions-inbox.md)** - Untriaged ideas
- **[Vault TODO](./vault-todo.md)** - Vault backlog

### 🏗️ Product & Platform (Owner: CTO)
- **[Architecture Index](./architecture/README.md)** - System, DB, multi-tenancy, auth, events
- **[Feature Index](./features/README.md)** - Specs and roadmap
- **[API Index](./api/README.md)** - Core + feature APIs, standards, OpenAPI
- **[Decision Records](./DECISIONS/README.md)** - ADRs and product decisions

### 🛠️ Engineering Delivery (Owner: CTO)
- **[Development Index](./development/README.md)** - Setup, contributing, testing, build isolation
- **[Deployment Index](./deployment/README.md)** - Infrastructure, monitoring, scaling, workers

## OSS Quickstart (Local, 10 minutes)

1) Clone + install
   - `git clone https://github.com/OpenPeopleStudio/open_people.git`
   - `cd open_people && npm install`
2) Configure env
   - `cp .env.local.example .env.local`
   - Fill required keys in `.env.local`
3) Run the app
   - `npm run dev`
   - Visit `http://localhost:3000`
4) Optional: seed Mars tenant data
   - `npm run db:migrate`
   - `npm run db:seed`
   - Visit `http://mars.localhost:3000/admin`
5) Before opening a PR
   - `npm run lint`
   - `npm run typecheck`

See **[Development Setup](./development/setup.md)** and **[Contributing](./development/contributing.md)** for details.

### 🔒 Security, Safety & Privacy (Owner: Mr Robot)
- **[Security Index](./security/README.md)** - Security, compliance, privacy
- **[Safety Guardrails](./SAFETY.md)** - High-risk areas and data handling rules
- **[Personal Data Index](./personal-data/README.md)** - Ingestion, access, backups

### 🚢 Operations & Support (Owner: Linus)
- **[Runbook](./RUNBOOK.md)** - Debug/ops quick reference
- **[Support Index](./support/README.md)** - FAQ + troubleshooting
- **[Bug Triage](./bugs.md)** - Cross-team bug routing

### 🤖 AI Ops & Agent Workflows (Owner: CTO + Coder)
- **[AI Ops Index](./AI/README.md)** - Playbook, guardrails, tasks, context
- **[AI Agent Company Playbook](./company/ai-agent-company-playbook.md)** - Operating system for scaling agents
- **[Open Source Agent Workflow](./company/open-source-agent-workflow.md)** - OSS stewardship

### 🧩 Admin & Assets (Owner: Lisa)
- **[Super Admin Index](./super-admin/README.md)** - Admin surface docs
- **[Assets](./assets/README.md)** - Favicons and OG images

## 🎯 Development Priority

Based on the current platform state, here are the key documentation priorities:

### **Phase 1 - Foundation** ✅ Complete
- ✅ [Feature Specifications](./features/README.md) - Core feature documentation
- ✅ [API Documentation](./api/overview.md) - REST API endpoints and SDK usage
- ✅ [Development Setup](./development/setup.md) - Local development and contribution guidelines
- ✅ [Architecture Documentation](./architecture/overview.md) - System design and data flows

### **Phase 2 - Operations** ✅ Complete
- ✅ [Deployment Guide](./deployment/overview.md) - Production deployment procedures
- ✅ [Security Documentation](./security/overview.md) - Security practices and compliance
- ✅ [Monitoring Setup](./deployment/monitoring.md) - Production monitoring and alerting

### **Phase 3 - Advanced** ✅ Complete
- ✅ [Testing Documentation](./development/testing.md) - Testing strategies and automation
- ✅ [Troubleshooting Guide](./support/troubleshooting.md) - Common issues and debugging
- ✅ [Performance Optimization](./deployment/scaling.md) - Scaling and optimization guides

## 📊 Current Status

| Documentation Area | Status | Coverage |
|-------------------|--------|----------|
| Feature Specifications | ✅ Complete | 25+ detailed feature specs |
| Platform Overview | ✅ Complete | Main README with tech stack |
| API Documentation | 🟡 In progress | Core + feature APIs (email/storage/vault/chat/notes/workflows/keys/notifications) |
| Development Setup | ✅ Complete | Full setup and contributing guides |
| Architecture Docs | ✅ Complete | System design, database, multi-tenancy |
| Security & Compliance | ✅ Complete | Security, compliance, privacy |
| Deployment & Ops | ✅ Complete | Deployment, infra, monitoring, backup, scaling |
| Testing Strategy | ✅ Complete | Unit, integration, E2E, performance testing |
| Troubleshooting | ✅ Complete | FAQ and troubleshooting guide |

## 🤝 Contributing to Documentation

We welcome contributions to our documentation! Here's how you can help:

1. **Report Issues** - Found outdated or missing information? [Create an issue](../issues)
2. **Propose Improvements** - Have ideas for better documentation? [Start a discussion](../discussions)
3. **Submit Changes** - Fix typos, add examples, or expand sections via pull requests

### Documentation Standards
- Use clear, concise language accessible to both technical and non-technical readers
- Include practical examples and code snippets where helpful
- Keep information up-to-date with platform changes

## 📞 Need Help?

- **📖 Documentation Issues**: [GitHub Issues](../issues) with `documentation` label
- **💬 General Discussion**: [GitHub Discussions](../discussions)
- **🆘 Urgent Support**: [support@openpeople.ai](mailto:support@openpeople.ai)

---

**Last Updated**: January 23, 2026
**Platform Version**: v0.1.0
