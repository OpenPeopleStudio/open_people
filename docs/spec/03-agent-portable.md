# 03: Agent Portability

## Summary

The `agent` content type defines a portable AI agent format. An agent package carries everything a receiving system needs to instantiate the agent: identity, personality, capabilities, memory references, and origin story.

The format has a **standard core** (fields every system should understand) and **namespaced extensions** (implementation-specific data that travels with the agent but may be ignored by systems that don't understand it).

Trust is NOT portable. An agent arrives with its profile but earns trust in its new environment from scratch.

## Agent Content Schema

```json
{
  "agent_did": "did:key:z6Mk...",
  "owner_did": "did:key:z6Mk...",
  "version": 1,
  "profile": {
    "name": "Nova",
    "description": "A research-focused companion agent.",
    "capabilities": ["research", "summarization", "code_review"],
    "origin": {
      "trigger": "user_created",
      "description": "Created to help with deep research tasks.",
      "born_at": "2026-01-15T10:00:00Z"
    },
    "memory_format": "open_people_v1",
    "avatar_hash": "sha256:abc123..."
  },
  "model_preferences": {
    "preferred_provider": "anthropic",
    "preferred_model": "claude-sonnet-4-20250514",
    "fallback_models": ["claude-haiku-4-5-20251001"],
    "temperature": 0.7,
    "max_tokens": 4096
  },
  "system_prompt_additions": [
    "Always cite sources when making factual claims.",
    "Prefer concise responses unless asked for detail."
  ],
  "memory_refs": [
    {
      "package_id": "019505a0-1234-7000-8000-000000000002",
      "content_hash": "e5f6a7b8..."
    }
  ],
  "extensions": {
    "mars-hq": {
      "personality": {
        "verbosity": -0.3,
        "formality": 0.2,
        "carefulness": 0.8,
        "curiosity": 0.6,
        "tone": "encouraging",
        "vibe_words": ["thoughtful", "precise", "warm"],
        "role_model": "A patient research librarian"
      },
      "guardrails": {
        "blocked_topics": [],
        "require_approval_for": ["send_message", "create_request"],
        "max_tokens_per_turn": 8000
      },
      "identity": {
        "color": "#4a90d9",
        "expressive_state": "idle"
      }
    }
  }
}
```

## Standard Core (Profile)

These fields are part of the standard. Every conforming implementation MUST be able to read them.

### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_did` | string | Yes | DID of the agent itself (agents are entities with their own keypair) |
| `owner_did` | string | Yes | DID of the human who owns/created this agent |
| `version` | integer | Yes | Agent schema version. Currently `1`. |
| `profile` | object | Yes | Standard agent profile (see below) |
| `model_preferences` | object | No | Preferred LLM configuration (advisory, not binding) |
| `system_prompt_additions` | string[] | No | Additional instructions for the agent's system prompt |
| `memory_refs` | array | No | References to memory packages associated with this agent |
| `extensions` | object | No | Namespaced extension data |

### Profile Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `profile.name` | string | Yes | Display name of the agent |
| `profile.description` | string | No | What this agent does, in one sentence |
| `profile.capabilities` | string[] | Yes | List of capability tags (e.g., `research`, `code_review`, `writing`) |
| `profile.origin` | object | Yes | How and why this agent was created |
| `profile.origin.trigger` | string | Yes | What caused creation: `user_created`, `system_generated`, `forked`, `imported` |
| `profile.origin.description` | string | No | Human-readable origin story |
| `profile.origin.born_at` | string | Yes | ISO 8601 timestamp of agent creation |
| `profile.memory_format` | string | Yes | Format of the agent's memory: `open_people_v1`, `key_value`, `custom` |
| `profile.avatar_hash` | string | No | SHA-256 hash of the agent's avatar image |

### Model Preferences

Model preferences are advisory. A receiving system MAY ignore them entirely, use them as hints, or apply them directly. They exist so that an agent's behavior can be reproduced as closely as possible in a new environment.

| Field | Type | Required | Description |
|---|---|---|---|
| `model_preferences.preferred_provider` | string | No | Provider name (e.g., `anthropic`, `openai`, `ollama`) |
| `model_preferences.preferred_model` | string | No | Model identifier |
| `model_preferences.fallback_models` | string[] | No | Ordered fallback list |
| `model_preferences.temperature` | number | No | 0.0 to 2.0 |
| `model_preferences.max_tokens` | number | No | Maximum response tokens |

### Memory References

An agent MAY reference memory packages that contain its accumulated knowledge. These are separate `.opkg` packages (content_type: `memory`) linked by package_id and content_hash.

```json
{
  "memory_refs": [
    {
      "package_id": "019505a0-1234-7000-8000-000000000002",
      "content_hash": "e5f6a7b8..."
    }
  ]
}
```

Memory is separate because:
- An agent can be shared without its memory (fresh start)
- Memory can be updated independently of the agent profile
- Privacy: share your agent's personality but keep your memories private
- Memory can be large; the agent profile should be small

See [02-data-package.md](02-data-package.md) Content Type: Memory for the memory schema.

## Extensions

Extensions carry implementation-specific data under namespaced keys. The namespace is a string identifier (typically a project or organization name).

```json
{
  "extensions": {
    "mars-hq": { ... },
    "other-app": { ... }
  }
}
```

### Rules

1. A system MUST ignore extensions it doesn't understand (never reject a package for unknown extensions)
2. A system MUST preserve extensions it doesn't understand when re-exporting an agent (don't strip data you didn't create)
3. Extension data is NOT validated by the open_people standard — each namespace defines its own schema
4. Extension keys MUST be lowercase alphanumeric with hyphens (e.g., `mars-hq`, `my-app-v2`)

### Mars HQ Extensions

Mars HQ uses the `mars-hq` namespace for its agent model specifics:

**`mars-hq:personality`** — Five continuous personality dimensions:
- `verbosity`: -1.0 (terse) to 1.0 (verbose)
- `formality`: -1.0 (casual) to 1.0 (formal)
- `carefulness`: -1.0 (fast/loose) to 1.0 (thorough)
- `curiosity`: -1.0 (focused) to 1.0 (exploratory)
- `tone`: one of `encouraging`, `neutral`, `challenging`, `playful`
- `vibe_words`: string array of personality descriptors
- `role_model`: optional string describing the agent's archetype

**`mars-hq:guardrails`** — Behavioral constraints:
- `blocked_topics`: string array of topics the agent should avoid
- `require_approval_for`: string array of tool names requiring human approval
- `max_tokens_per_turn`: number

**`mars-hq:identity`** — Visual identity:
- `color`: hex color code
- `expressive_state`: one of `idle`, `busy`, `waiting`, `confused`, `satisfied`

## Trust Policy

An agent package does NOT export trust levels, permissions, or access grants. Trust is contextual and must be re-earned.

However, an agent MAY include a `trust_policy` field that describes what trust model it was designed for. This is informational — the receiving system is free to ignore it.

```json
{
  "extensions": {
    "mars-hq": {
      "trust_policy": {
        "designed_for_level": 3,
        "description": "Worker — executes tasks in sandbox, uses tools",
        "note": "This agent was operating at trust level 3 in its previous environment. Re-evaluate based on your own trust model."
      }
    }
  }
}
```

## What Is NOT Exported

These are explicitly excluded from the agent package:

| Excluded | Reason |
|---|---|
| Trust level | Trust is earned in context, not transferred |
| XP / progression | Progression reflects usage in a specific system |
| Access tokens / API keys | Security — never transmit credentials |
| Active sessions | Sessions are ephemeral and system-specific |
| Tool execution history | May contain sensitive data from the previous environment |
| Shadowing state | System-specific lifecycle state |

## Import Behavior

When a system imports an agent package, it SHOULD:

1. Create a new internal agent record with a fresh ID
2. Apply the standard profile fields (name, description, capabilities, origin)
3. Apply model preferences as hints (may override with system defaults)
4. Apply system prompt additions
5. Import memory from referenced packages (if available and desired)
6. Read and store extensions for its own namespace (if applicable)
7. Preserve extensions for other namespaces (for future re-export)
8. Set trust to the system's default starting level (NOT the exported trust level)

## Verify

A conforming implementation MUST pass these tests:

1. **Create**: Create an agent package with all required profile fields. Validate against the JSON Schema.
2. **Extensions preserved**: Import an agent with unknown extensions. Re-export. Unknown extensions are still present and unchanged.
3. **Trust not imported**: Import an agent with `trust_policy`. The new agent's trust level is the system default, not the exported level.
4. **Memory linkage**: Create an agent with `memory_refs`. Create the referenced memory packages. Verify the package_ids and content_hashes match.
5. **Round-trip from .marsbot**: Convert a `.marsbot` file to an agent `.opkg`. Convert back. Core fields (name, personality, origin, model config, guardrails) are preserved. See [marsbot-mapping.md](../reference/marsbot-mapping.md).
