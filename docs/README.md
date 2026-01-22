# OpenPeople.ai Documentation

Welcome to the comprehensive documentation for OpenPeople.ai, a multi-tenant SaaS platform for AI alignment and governance.

## 📖 Documentation Overview

This documentation is organized into several key sections to help you understand, develop, deploy, and maintain the OpenPeople.ai platform.

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

### 🚀 Quick Start
- **[Getting Started](../README.md)** - Platform overview, tech stack, and basic setup
- **[Company Docs](./company/README.md)** - Org structure, roles, and doc ownership
- **[Development Setup](./development/setup.md)** - Local development environment and contribution guidelines
- **[Deployment Guide](./deployment/overview.md)** - Production deployment and operations
- **[AI Playbook](./AI/PLAYBOOK.md)** - Agent and newcomer recipes
- **[Safety Guardrails](./SAFETY.md)** - High-risk areas and data handling rules
- **[Runbook](./RUNBOOK.md)** - Debug/ops quick reference

### 🏗️ Architecture & Design
- **[System Architecture](./architecture/overview.md)** - Platform architecture, data flows, and design decisions
- **[Database Schema](./architecture/database.md)** - Database design and migrations
- **[Security Architecture](./security/overview.md)** - Security model, authentication, and authorization

### 📋 Features & Specifications
- **[Feature Overview](./features/README.md)** - Complete feature specifications and roadmap
- **[AI Alignment & Governance](./features/ai-alignment-governance/)** - Core AI governance features
- **[Safety & Compliance](./features/safety-compliance/)** - Content moderation and compliance tools
- **[Monitoring & Observability](./features/monitoring-observability/)** - Analytics and monitoring capabilities
- **[Developer Experience](./features/developer-experience/)** - Developer tools and SDKs
- **[Business Intelligence](./features/business-intelligence/)** - Usage analytics and ROI tracking
- **[Integration Layer](./features/integration-layer/)** - Third-party integrations and webhooks

### 🔌 API Documentation
- **[API Overview](./api/overview.md)** - API design principles and authentication
- **[OpenAPI Spec](./api/openapi.md)** - Generated OpenAPI contract and usage
- **[Authentication](./api/core/auth.md)** - Supabase Auth usage for API routes
- **[Tenants](./api/core/tenants.md)** - Tenant management and domain status
- **[Onboarding](./api/core/onboarding.md)** - Tenant onboarding records and updates
- **[Profile](./api/core/profile.md)** - User profile and preferences
- **[AI Governance](./api/features/ai-governance.md)** - AI model registry and audit logs
- **[AI Workers](./api/features/ai-workers.md)** - AI Team hub, worker routes, Chief of Staff planning, budgets
- **[Ops Worker](./api/features/ops-worker.md)** - Decision → propose tasks → commit
- **[Chat](./api/features/chat.md)** - Conversations, messages, memories, and action routes
- **[Email](./api/features/email.md)** - Email accounts, inbox, templates, domains, sending
- **[Notes](./api/features/notes.md)** - Notes, templates, versions, and graph
- **[Notifications](./api/features/notifications.md)** - In-app, SMS, preferences, delivery logs
- **[Storage](./api/features/storage.md)** - Buckets, files, presigned upload/download
- **[Workflows](./api/features/workflows.md)** - Projects and tasks
- **[API Keys](./api/features/api-keys.md)** - Encrypted API keys (create/list/test/reveal)
- **[Vault](./api/features/vault.md)** - Encrypted vault (unlock/files/folders/AI analysis)

### 🛠️ Development Resources
- **[Contributing Guidelines](./development/contributing.md)** - How to contribute to the platform
- **[Testing Strategy](./development/testing.md)** - Testing approaches and guidelines (unit, integration, E2E)

### 🚢 Deployment & Operations
- **[Deployment Overview](./deployment/overview.md)** - Production deployment guide
- **[Infrastructure](./deployment/infrastructure.md)** - Infrastructure as code and cloud setup
- **[Monitoring](./deployment/monitoring.md)** - Production monitoring and alerting
- **[Backup & Recovery](./deployment/backup.md)** - Data backup and disaster recovery
- **[Scaling & Performance](./deployment/scaling.md)** - Performance optimization and scaling strategies

### 🔒 Security & Compliance
- **[Security Overview](./security/overview.md)** - Security principles and practices
- **[Compliance](./security/compliance.md)** - Regulatory compliance and certifications
- **[Privacy](./security/privacy.md)** - Data privacy and protection measures

### ❓ Support & Troubleshooting
- **[FAQ](./support/faq.md)** - Frequently asked questions
- **[Troubleshooting](./support/troubleshooting.md)** - Common issues and solutions

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

**Last Updated**: January 22, 2026
**Platform Version**: v0.1.0
