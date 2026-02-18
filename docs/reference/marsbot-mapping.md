# .marsbot to .opkg Migration Guide

## Overview

Mars HQ's `.marsbot` v1 export format is the direct precursor to the open_people `.opkg` agent format. This document maps every field from `.marsbot` to its `.opkg` equivalent.

The migration is lossless for all standard fields. Mars-HQ-specific fields (personality dimensions, guardrails, visual identity) move into the `mars-hq` extension namespace.

## .marsbot v1 Structure

```json
{
  "version": 1,
  "exportedAt": "<ISO 8601>",
  "agent": {
    "identity": {
      "name": "string",
      "color": "#hex",
      "expressiveState": "idle | busy | waiting | confused | satisfied"
    },
    "personality": {
      "verbosity": -1.0 to 1.0,
      "formality": -1.0 to 1.0,
      "carefulness": -1.0 to 1.0,
      "curiosity": -1.0 to 1.0,
      "tone": "encouraging | neutral | challenging | playful",
      "vibeWords": ["string"],
      "roleModel": "string (optional)"
    },
    "origin": {
      "trigger": "string",
      "need": "string",
      "bornAt": "<ISO 8601>"
    },
    "model": {
      "provider": "string",
      "model": "string",
      "temperature": 0.0 to 2.0,
      "maxTokens": number
    },
    "systemPromptAdditions": ["string"],
    "guardrails": {
      "blockedTopics": ["string"],
      "requireApprovalFor": ["string"],
      "maxTokensPerTurn": number
    }
  },
  "memory": {
    "reflections": [
      {
        "content": "string",
        "confidence": 0.0 to 1.0,
        "source": "string",
        "createdAt": "<ISO 8601>"
      }
    ],
    "keyValueStore": {
      "key": "value"
    }
  },
  "skills": ["string"]
}
```

## Field-by-Field Mapping

### Envelope

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `version: 1` | `open_people: 1` | Different version scheme. .opkg uses `open_people` as the spec version key. |
| `exportedAt` | `created_at` | Same ISO 8601 format. |
| (none) | `package_id` | **New in .opkg.** UUIDv7, generated at export time. |
| (none) | `author` | **New in .opkg.** DID + Ed25519 signature. .marsbot had no signing. |
| (none) | `content_hash` | **New in .opkg.** SHA-256 of canonical content. .marsbot had no integrity verification. |
| (none) | `content_type: "agent"` | **New in .opkg.** .marsbot was always an agent export; .opkg is polymorphic. |
| (none) | `metadata` | **New in .opkg.** Schema version, transmission class, compression. |

### Agent → Profile (Standard Core)

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `agent.identity.name` | `content.profile.name` | Direct mapping. |
| (none) | `content.profile.description` | **New in .opkg.** Optional one-sentence description. |
| (none) | `content.profile.capabilities` | **New in .opkg.** Infer from skills array if available. |
| `agent.origin.trigger` | `content.profile.origin.trigger` | Direct mapping. Enum values expanded: `user_created`, `system_generated`, `forked`, `imported`. |
| `agent.origin.need` | `content.profile.origin.description` | Renamed: `need` → `description`. |
| `agent.origin.bornAt` | `content.profile.origin.born_at` | Renamed: camelCase → snake_case. |
| (none) | `content.profile.memory_format` | **New in .opkg.** Set to `"open_people_v1"` when migrating. |
| (none) | `content.profile.avatar_hash` | **New in .opkg.** Optional. |

### Agent → Model Preferences

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `agent.model.provider` | `content.model_preferences.preferred_provider` | Direct mapping. |
| `agent.model.model` | `content.model_preferences.preferred_model` | Direct mapping. |
| `agent.model.temperature` | `content.model_preferences.temperature` | Direct mapping. |
| `agent.model.maxTokens` | `content.model_preferences.max_tokens` | Renamed: camelCase → snake_case. |
| (none) | `content.model_preferences.fallback_models` | **New in .opkg.** Optional. |

### Agent → System Prompt

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `agent.systemPromptAdditions` | `content.system_prompt_additions` | Direct mapping. camelCase → snake_case. |

### Agent → Extensions (mars-hq namespace)

These fields are mars-hq-specific and move into the `extensions.mars-hq` namespace:

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `agent.personality.verbosity` | `content.extensions.mars-hq.personality.verbosity` | Direct mapping. |
| `agent.personality.formality` | `content.extensions.mars-hq.personality.formality` | Direct mapping. |
| `agent.personality.carefulness` | `content.extensions.mars-hq.personality.carefulness` | Direct mapping. |
| `agent.personality.curiosity` | `content.extensions.mars-hq.personality.curiosity` | Direct mapping. |
| `agent.personality.tone` | `content.extensions.mars-hq.personality.tone` | Direct mapping. |
| `agent.personality.vibeWords` | `content.extensions.mars-hq.personality.vibe_words` | Renamed: camelCase → snake_case. |
| `agent.personality.roleModel` | `content.extensions.mars-hq.personality.role_model` | Renamed: camelCase → snake_case. |
| `agent.identity.color` | `content.extensions.mars-hq.identity.color` | Moved from top-level identity to extension. |
| `agent.identity.expressiveState` | `content.extensions.mars-hq.identity.expressive_state` | Moved + renamed. |
| `agent.guardrails.blockedTopics` | `content.extensions.mars-hq.guardrails.blocked_topics` | Moved + renamed. |
| `agent.guardrails.requireApprovalFor` | `content.extensions.mars-hq.guardrails.require_approval_for` | Moved + renamed. |
| `agent.guardrails.maxTokensPerTurn` | `content.extensions.mars-hq.guardrails.max_tokens_per_turn` | Moved + renamed. |

### Memory → Separate Package

In `.marsbot`, memory is embedded in the agent export. In `.opkg`, memory is a separate package linked via `memory_refs`.

| .marsbot Field | .opkg Memory Package Field | Notes |
|---|---|---|
| `memory.reflections` | `content.reflections` | Direct mapping. |
| `memory.reflections[].content` | `content.reflections[].content` | Direct mapping. |
| `memory.reflections[].confidence` | `content.reflections[].confidence` | Direct mapping. |
| `memory.reflections[].source` | `content.reflections[].source` | Direct mapping. |
| `memory.reflections[].createdAt` | `content.reflections[].reflected_at` | Renamed: `createdAt` → `reflected_at`. |
| `memory.keyValueStore` | `content.entries` | **Restructured.** Flat key-value object becomes array of `{key, value, recorded_at}` entries. |
| (none) | `content.owner_did` | **New.** DID of the agent this memory belongs to. |
| (none) | `content.format` | **New.** Set to `"mixed"` when both reflections and entries exist. |

### Skills

| .marsbot Field | .opkg Field | Notes |
|---|---|---|
| `skills` | `content.profile.capabilities` | Skills array maps to capabilities. Skill-specific configs are mars-hq extensions. |

### What's New in .opkg (No .marsbot Equivalent)

| .opkg Field | Purpose |
|---|---|
| `agent_did` | Agent has its own DID (keypair). In .marsbot, agents had UUIDs only. |
| `owner_did` | Explicit link to human owner via DID. |
| `content.profile.memory_format` | Declares memory format for interoperability. |
| `memory_refs` | Links to separate memory packages. |
| Signing + verification | Ed25519 signature on content hash. .marsbot had no verification. |
| Content addressing | SHA-256 content hash for integrity. .marsbot had none. |
| Transmission class | Advisory metadata for transport context. |
| Bundle support | Multiple packages grouped by reference. |

### What's Removed in .opkg (Intentionally Not Migrated)

| .marsbot Concept | Why Excluded |
|---|---|
| Agent UUID | Replaced by `agent_did`. UUIDs were system-local. |
| Progression / XP | System-specific. Never exported even in .marsbot (confirmed in export.ts). |
| Trust level | Trust re-earned on import. Not transferred. |
| Active sessions | Ephemeral. Not portable. |

## Migration Algorithm

```
function marsbot_to_opkg(marsbot, owner_keypair, agent_keypair):
  // 1. Create memory package (if memory exists)
  if marsbot.memory:
    memory_content = {
      owner_did: agent_keypair.did,
      format: determine_format(marsbot.memory),
      entries: flatten_kv_store(marsbot.memory.keyValueStore),
      reflections: map_reflections(marsbot.memory.reflections)
    }
    memory_pkg = create_opkg("memory", memory_content, owner_keypair)

  // 2. Create agent package
  agent_content = {
    agent_did: agent_keypair.did,
    owner_did: owner_keypair.did,
    version: 1,
    profile: {
      name: marsbot.agent.identity.name,
      capabilities: marsbot.skills || [],
      origin: {
        trigger: marsbot.agent.origin.trigger,
        description: marsbot.agent.origin.need,
        born_at: marsbot.agent.origin.bornAt
      },
      memory_format: "open_people_v1"
    },
    model_preferences: {
      preferred_provider: marsbot.agent.model.provider,
      preferred_model: marsbot.agent.model.model,
      temperature: marsbot.agent.model.temperature,
      max_tokens: marsbot.agent.model.maxTokens
    },
    system_prompt_additions: marsbot.agent.systemPromptAdditions,
    memory_refs: memory_pkg ? [{ package_id: memory_pkg.package_id, content_hash: memory_pkg.content_hash }] : [],
    extensions: {
      "mars-hq": {
        personality: snake_case(marsbot.agent.personality),
        guardrails: snake_case(marsbot.agent.guardrails),
        identity: {
          color: marsbot.agent.identity.color,
          expressive_state: marsbot.agent.identity.expressiveState
        }
      }
    }
  }
  agent_pkg = create_opkg("agent", agent_content, owner_keypair)

  // 3. Optionally bundle them
  bundle_content = {
    name: `${marsbot.agent.identity.name} Export`,
    packages: [agent_pkg.ref, memory_pkg?.ref].filter(Boolean)
  }
  bundle_pkg = create_opkg("bundle", bundle_content, owner_keypair)

  return { agent_pkg, memory_pkg, bundle_pkg }
```

## Reverse Migration (.opkg to .marsbot)

For backwards compatibility with mars-hq systems that still expect `.marsbot`:

1. Extract `content.profile` fields → `agent.identity`, `agent.origin`
2. Extract `content.extensions.mars-hq.personality` → `agent.personality`
3. Extract `content.extensions.mars-hq.guardrails` → `agent.guardrails`
4. Extract `content.extensions.mars-hq.identity` → `agent.identity.color`, `agent.identity.expressiveState`
5. Extract `content.model_preferences` → `agent.model`
6. Fetch and merge memory packages → `memory`
7. Set `version: 1`, `exportedAt` from `created_at`

Fields without a .marsbot equivalent (agent_did, owner_did, signatures) are dropped. The round-trip is lossy in the .opkg → .marsbot direction for these fields only.
