# Slack/Teams Bots

> **Priority:** P3 - Low  
> **Category:** Integration Layer  
> **Status:** Planned

## Overview

AI-powered chat bots for Slack and Microsoft Teams, bringing governed AI assistance directly into workplace communication tools.

## Problem Statement

Users want AI where they work:
- Context switching to separate AI tools is friction
- AI in chat is uncontrolled without governance
- Teams miss AI collaboration opportunities
- Support teams need AI-assisted responses
- Meeting summaries need AI help

## User Stories

### As an End User
- I want to ask AI questions in Slack/Teams
- I want AI to help draft messages
- I want governed AI in my workflow

### As a Team Lead
- I want AI available to my team in chat
- I want governance controls applied
- I want usage visibility

### As an IT Administrator
- I want to control AI bot deployment
- I want to configure permissions
- I want to audit AI chat usage

### As a Support Agent
- I want AI to suggest responses
- I want AI to search knowledge base
- I want AI-assisted ticket handling

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Bot Platform                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Chat Platforms                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │      Slack      │  │  Microsoft      │           │   │
│  │  │                 │  │     Teams       │           │   │
│  │  └─────────────────┘  └─────────────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │     Bot     │  │ Conversation│  │ Governance  │         │
│  │   Handler   │  │   Manager   │  │   Layer     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Bot Features

| Feature | Description |
|---------|-------------|
| Direct Messages | Private AI conversations |
| Channel Mentions | @bot in channels |
| Slash Commands | /ai command interface |
| Message Actions | AI actions on messages |
| Scheduled Tasks | Recurring AI tasks |
| Workflows | Integrated in workflows |

## Database Schema

```sql
-- Chat Bots Schema

-- Bot installations
CREATE TABLE chat_bot_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Platform
    platform VARCHAR(50) NOT NULL, -- 'slack', 'teams'
    
    -- Installation details
    workspace_id VARCHAR(255) NOT NULL, -- Slack workspace or Teams tenant
    workspace_name VARCHAR(255),
    
    -- Credentials (encrypted)
    access_token_encrypted BYTEA NOT NULL,
    refresh_token_encrypted BYTEA,
    
    -- Bot info
    bot_id VARCHAR(255),
    bot_name VARCHAR(255),
    
    -- Permissions
    scopes JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    installed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(platform, workspace_id)
);

-- Bot configuration
CREATE TABLE chat_bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES chat_bot_installations(id) ON DELETE CASCADE,
    
    -- Features enabled
    dm_enabled BOOLEAN DEFAULT true,
    channel_mentions_enabled BOOLEAN DEFAULT true,
    slash_commands_enabled BOOLEAN DEFAULT true,
    message_actions_enabled BOOLEAN DEFAULT true,
    
    -- Default AI configuration
    default_model VARCHAR(255),
    default_prompt_id UUID,
    
    -- Restrictions
    allowed_channels JSONB, -- NULL = all, or list of channel IDs
    blocked_channels JSONB,
    allowed_users JSONB, -- NULL = all
    
    -- Behavior
    typing_indicator BOOLEAN DEFAULT true,
    response_in_thread BOOLEAN DEFAULT true,
    
    -- Governance
    apply_content_moderation BOOLEAN DEFAULT true,
    apply_pii_detection BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE chat_bot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES chat_bot_installations(id),
    
    -- Platform identifiers
    channel_id VARCHAR(255) NOT NULL,
    thread_ts VARCHAR(255), -- For threaded conversations
    
    -- User
    platform_user_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id), -- If linked
    
    -- Context
    channel_type VARCHAR(50), -- 'dm', 'public_channel', 'private_channel'
    
    -- Conversation state
    context JSONB, -- Conversation memory
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE chat_bot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_bot_conversations(id),
    
    -- Message details
    platform_message_id VARCHAR(255),
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    
    -- Content
    content TEXT NOT NULL,
    
    -- AI processing
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- 'received', 'processing', 'sent', 'failed'
    error_message TEXT,
    
    -- Timing
    received_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slash commands
CREATE TABLE chat_bot_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES chat_bot_installations(id),
    
    command VARCHAR(100) NOT NULL, -- '/ai', '/summarize', etc.
    description TEXT,
    
    -- Configuration
    handler_type VARCHAR(50) NOT NULL, -- 'ai_query', 'prompt', 'workflow'
    handler_config JSONB NOT NULL,
    
    -- Permissions
    allowed_channels JSONB,
    allowed_users JSONB,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot usage metrics
CREATE TABLE chat_bot_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES chat_bot_installations(id),
    
    -- Period
    date DATE NOT NULL,
    
    -- Volume
    total_messages INTEGER DEFAULT 0,
    inbound_messages INTEGER DEFAULT 0,
    outbound_messages INTEGER DEFAULT 0,
    
    -- Users
    unique_users INTEGER DEFAULT 0,
    
    -- Channels
    active_channels INTEGER DEFAULT 0,
    
    -- Commands
    slash_commands_used INTEGER DEFAULT 0,
    
    -- Quality
    success_rate DECIMAL(5,4),
    avg_response_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(installation_id, date)
);

-- Indexes
CREATE INDEX idx_chat_bot_installations_tenant ON chat_bot_installations(tenant_id);
CREATE INDEX idx_chat_bot_configs_installation ON chat_bot_configs(installation_id);
CREATE INDEX idx_chat_bot_conversations_installation ON chat_bot_conversations(installation_id);
CREATE INDEX idx_chat_bot_conversations_channel ON chat_bot_conversations(channel_id);
CREATE INDEX idx_chat_bot_messages_conversation ON chat_bot_messages(conversation_id);
CREATE INDEX idx_chat_bot_commands_installation ON chat_bot_commands(installation_id);
CREATE INDEX idx_chat_bot_metrics_installation ON chat_bot_metrics(installation_id, date DESC);
```

## API Endpoints

```
# Installations
GET    /api/bots/installations            # List installations
GET    /api/bots/installations/:id        # Get installation
DELETE /api/bots/installations/:id        # Remove installation

# OAuth flows
GET    /api/bots/slack/install            # Start Slack install
GET    /api/bots/slack/callback           # Slack OAuth callback
GET    /api/bots/teams/install            # Start Teams install
GET    /api/bots/teams/callback           # Teams OAuth callback

# Configuration
GET    /api/bots/installations/:id/config # Get config
PUT    /api/bots/installations/:id/config # Update config

# Commands
GET    /api/bots/installations/:id/commands # List commands
POST   /api/bots/installations/:id/commands # Add command
PUT    /api/bots/commands/:id             # Update command
DELETE /api/bots/commands/:id             # Delete command

# Platform webhooks
POST   /api/bots/slack/events             # Slack events
POST   /api/bots/slack/commands           # Slack slash commands
POST   /api/bots/teams/events             # Teams webhook

# Analytics
GET    /api/bots/installations/:id/metrics # Get metrics
GET    /api/bots/analytics                # Overall analytics
```

## UI Components

### Admin Dashboard Pages

1. **Bots Overview** (`/admin/bots`)
   - Installation list
   - Activity summary
   - Quick actions

2. **Install Bot** (`/admin/bots/install`)
   - Platform selection
   - Installation wizard
   - Permission review

3. **Bot Configuration** (`/admin/bots/:id/config`)
   - Feature toggles
   - Channel restrictions
   - AI configuration
   - Governance settings

4. **Commands** (`/admin/bots/:id/commands`)
   - Command list
   - Create command
   - Handler configuration

5. **Conversations** (`/admin/bots/:id/conversations`)
   - Recent conversations
   - Message viewer
   - User activity

6. **Analytics** (`/admin/bots/analytics`)
   - Usage trends
   - User engagement
   - Response quality

## Bot Interface

```
# Slack example
User: @AskAI What are our Q4 sales targets?

AskAI: Based on the FY2026 planning document, the Q4 sales targets are:
- North America: $12M
- EMEA: $8M
- APAC: $5M

Would you like more details on any region?

# Slash command
/ai summarize this thread

AskAI: Thread Summary:
The team discussed the new feature release timeline...
```

## Dependencies

- **Existing:** All AI and governance features
- **Related:** Knowledge Base
- **External:** Slack API, Microsoft Graph API

## Security Considerations

- OAuth token security
- Channel permission verification
- User identity mapping
- Data residency compliance
- Conversation encryption

## Success Metrics

| Metric | Target |
|--------|--------|
| Bot activation rate | > 50% of workspaces |
| Daily active users | > 20% of users |
| Response success rate | > 99% |
| User satisfaction | > 4.0/5 |

## Implementation Notes

### Phase 1: Basic Bot
- Slack installation
- DM conversations
- Basic commands

### Phase 2: Features
- Channel support
- Slash commands
- Teams support

### Phase 3: Advanced
- Message actions
- Workflows
- Knowledge base integration

### Phase 4: Enterprise
- Advanced permissions
- Custom commands
- Analytics
