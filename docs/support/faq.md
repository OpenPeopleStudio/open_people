# Frequently Asked Questions

This document answers common questions about the OpenPeople.ai platform, organized by category.

## Table of Contents

- [General Questions](#general-questions)
- [Getting Started](#getting-started)
- [Account & Authentication](#account--authentication)
- [Multi-Tenancy](#multi-tenancy)
- [Platform Features](#platform-features)
- [Billing & Pricing](#billing--pricing)
- [Security & Privacy](#security--privacy)
- [Technical Questions](#technical-questions)
- [API & Integration](#api--integration)

---

## General Questions

### What is OpenPeople.ai?

OpenPeople.ai is a multi-tenant SaaS platform for AI alignment and governance. It provides organizations with tools to manage AI models, ensure compliance, monitor AI systems, and implement safety guardrails.

### Who is OpenPeople.ai for?

- **Enterprise teams** managing multiple AI models and applications
- **AI/ML teams** needing governance and compliance tools
- **Compliance officers** ensuring AI systems meet regulations
- **Developers** building AI-powered applications with safety requirements

### What makes OpenPeople.ai different?

- **Multi-tenant architecture**: Each organization gets isolated data and configuration
- **Comprehensive governance**: From model registry to bias monitoring
- **Developer-friendly**: APIs, SDKs, and integrations with existing tools
- **Compliance-ready**: Built-in support for GDPR, AI regulations, and audit trails

---

## Getting Started

### How do I create an account?

1. Visit [openpeople.ai](https://openpeople.ai)
2. Click "Get Started" or "Sign Up"
3. Enter your email and create a password
4. Verify your email address
5. Complete your organization setup

### How do I invite team members?

1. Navigate to **Settings → Team**
2. Click **Invite Member**
3. Enter their email address
4. Select their role (Admin, Member, etc.)
5. They'll receive an invitation email

### What roles are available?

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing management |
| **Admin** | Configuration, user management |
| **Member** | Standard feature access |
| **Customer** | Limited, customer-facing features |

### How do I set up my first AI model?

1. Go to **AI Models → Registry**
2. Click **Add Model**
3. Enter model details (name, provider, endpoint)
4. Configure safety settings
5. Test the connection
6. Enable the model

---

## Account & Authentication

### How do I reset my password?

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset link
5. Create a new password

### Can I use social login (Google, GitHub)?

Yes, OpenPeople.ai supports:
- Google OAuth
- GitHub OAuth
- Magic link (passwordless)

Configure in **Settings → Security → Authentication Methods**.

### How do I enable two-factor authentication?

Two-factor authentication is on our roadmap. Currently, we recommend:
- Using a strong, unique password
- Enabling social login with 2FA on the identity provider
- Monitoring login activity in **Settings → Security → Sessions**

### Can I have multiple organizations?

Currently, each user account belongs to one organization. For managing multiple organizations:
- Create separate accounts for each organization
- Contact support for enterprise multi-org solutions

### How do I delete my account?

1. Go to **Settings → Account → Delete Account**
2. Confirm your password
3. Acknowledge data deletion
4. Click **Delete Account**

Your data will be deleted within 30 days per our retention policy.

---

## Multi-Tenancy

### What is multi-tenancy?

Multi-tenancy means multiple organizations (tenants) share the same platform infrastructure while keeping their data completely separate. Each tenant has:
- Isolated database records
- Separate configuration
- Independent user management
- Custom domain options

### Is my data isolated from other tenants?

Yes. We use Row-Level Security (RLS) at the database level, ensuring:
- Queries automatically filter to your tenant's data
- No code path can accidentally access other tenants' data
- Database policies are enforced regardless of application logic

### Can I use my own domain?

Yes! You can configure custom domains:

1. Go to **Settings → Domains**
2. Add your custom domain (e.g., `ai.yourcompany.com`)
3. Add the DNS records we provide
4. Wait for verification (usually < 24 hours)
5. Your domain is now active

### How do subdomains work?

By default, your tenant is accessible at `{your-slug}.openpeople.ai`. You can also add custom domains that point to your tenant.

---

## Platform Features

### What AI governance features are included?

| Feature | Description |
|---------|-------------|
| **AI Model Registry** | Central catalog of all AI models |
| **Prompt Management** | Version control for prompts |
| **Audit Logs** | Complete activity tracking |
| **Bias Monitoring** | Fairness metrics and alerts |
| **Content Moderation** | Safety filters and guardrails |
| **Cost Analytics** | AI usage and spending tracking |

### Can I integrate with my existing AI providers?

Yes, we support:
- OpenAI (GPT-4, etc.)
- Anthropic (Claude)
- Azure OpenAI
- AWS Bedrock
- Custom endpoints

### Do you support custom AI models?

Yes. You can register any AI model accessible via API:
1. Add the model to the registry
2. Configure the endpoint and authentication
3. Set up monitoring and safety rules
4. Use through our unified API

### How does bias monitoring work?

Our bias monitoring system:
1. Analyzes AI model outputs for demographic disparities
2. Tracks fairness metrics over time
3. Alerts when bias thresholds are exceeded
4. Provides recommendations for mitigation

### What compliance frameworks do you support?

- **GDPR** - Data protection and privacy
- **CCPA** - California privacy rights
- **EU AI Act** - AI-specific regulations (roadmap)
- **SOC 2** - Security controls (certification in progress)

---

## Billing & Pricing

### What pricing plans are available?

| Plan | Best For | Key Features |
|------|----------|--------------|
| **Starter** | Small teams | Basic governance, 3 users |
| **Pro** | Growing teams | Full features, 10 users |
| **Enterprise** | Large organizations | Custom limits, SSO, support |

Visit [openpeople.ai/pricing](https://openpeople.ai/pricing) for current pricing.

### How does billing work?

- Billed monthly or annually (annual saves 20%)
- Usage-based add-ons (AI calls, storage) billed monthly
- Payment via credit card or invoice (Enterprise)

### Can I change plans?

Yes, you can upgrade or downgrade anytime:
1. Go to **Settings → Billing → Plan**
2. Select new plan
3. Confirm changes
4. Changes take effect immediately (prorated)

### Is there a free trial?

Yes, all new accounts get a 14-day free trial of the Pro plan with full features. No credit card required to start.

### How do I cancel my subscription?

1. Go to **Settings → Billing**
2. Click **Cancel Subscription**
3. Confirm cancellation
4. Your access continues until the end of the billing period

---

## Security & Privacy

### How is my data protected?

| Layer | Protection |
|-------|------------|
| **Transit** | TLS 1.3 encryption |
| **Rest** | AES-256 encryption |
| **Access** | Role-based access control |
| **Database** | Row-level security |
| **Audit** | Complete activity logging |

### Where is my data stored?

- **Database**: Supabase (AWS infrastructure, US region)
- **Files**: Cloudflare R2 (global edge)
- **Backups**: Encrypted, retained per policy

Enterprise customers can request specific regions.

### Do you have SOC 2 certification?

SOC 2 Type II certification is in progress, targeted for Q3 2026. We currently follow SOC 2 controls and can provide our security documentation upon request.

### How do you handle data subject requests (GDPR)?

We provide tools for GDPR compliance:
- **Data Access**: Export all your data
- **Data Deletion**: Delete account and data
- **Data Portability**: Export in standard formats

Process requests in **Settings → Privacy** or email privacy@openpeople.ai.

### Can you sign a DPA (Data Processing Agreement)?

Yes, we provide DPAs for Pro and Enterprise customers. Contact legal@openpeople.ai to request a DPA.

---

## Technical Questions

### What technology stack do you use?

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Backend** | Next.js API Routes, Vercel |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Storage** | Cloudflare R2 |
| **Email** | Resend |

### Do you have an API?

Yes! Full REST API available:
- **Documentation**: [docs/api/overview.md](../api/overview.md)
- **Authentication**: API keys or JWT tokens
- **Rate Limits**: Varies by plan (see docs)

### Do you have SDKs?

We provide SDKs for:
- JavaScript/TypeScript (npm)
- Python (pip)
- REST API for other languages

### Can I self-host OpenPeople.ai?

Currently, OpenPeople.ai is available as a managed SaaS only. Self-hosted options may be available for Enterprise customers in the future.

### What uptime SLA do you offer?

| Plan | SLA |
|------|-----|
| Starter | Best effort |
| Pro | 99.9% uptime |
| Enterprise | 99.99% uptime |

Check [status.openpeople.ai](https://status.openpeople.ai) for current status.

---

## API & Integration

### How do I get an API key?

1. Go to **Settings → API Keys**
2. Click **Create API Key**
3. Name your key and set permissions
4. Copy and securely store the key (shown once)

### What's the API rate limit?

| Plan | Rate Limit |
|------|------------|
| Starter | 100 requests/minute |
| Pro | 1,000 requests/minute |
| Enterprise | Custom |

### Can I integrate with Slack?

Yes! We offer Slack integration for:
- Alerts and notifications
- Approval workflows
- Status updates

Configure in **Settings → Integrations → Slack**.

### Do you support webhooks?

Yes, configure webhooks to receive real-time events:
1. Go to **Settings → Webhooks**
2. Add endpoint URL
3. Select events to receive
4. Verify with test event

### Can I use OpenPeople.ai with my CI/CD pipeline?

Yes, common integrations include:
- **GitHub Actions**: Use our action or API
- **GitLab CI**: API integration
- **Jenkins**: REST API calls

See our [Integration documentation](../api/integrations/) for examples.

---

## Still Have Questions?

### Contact Support

- **Email**: support@openpeople.ai
- **Response Time**: < 24 hours (< 4 hours for Pro/Enterprise)

### Community Resources

- **Documentation**: [docs.openpeople.ai](https://docs.openpeople.ai)
- **GitHub Discussions**: [github.com/OpenPeopleStudio/open_people/discussions](https://github.com/OpenPeopleStudio/open_people/discussions)
- **Status Page**: [status.openpeople.ai](https://status.openpeople.ai)

### Feature Requests

Have an idea? We'd love to hear it!
1. Check existing requests in GitHub Discussions
2. If new, create a discussion with the "feature request" tag
3. Vote on features you want to see

---

## Related Documentation

- [Troubleshooting Guide](./troubleshooting.md)
- [Getting Started](../development/setup.md)
- [API Overview](../api/overview.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
