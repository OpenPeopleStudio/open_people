# Schema Catalog

JSON Schema definitions for all open_people content types. These schemas define the `content` field of an `.opkg` package based on its `content_type`.

## Envelope Schema

The outer `.opkg` envelope, shared by all content types.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/opkg-envelope.json",
  "title": "open_people Package Envelope",
  "type": "object",
  "required": ["open_people", "package_id", "created_at", "author", "content_hash", "content_type", "content", "metadata"],
  "properties": {
    "open_people": {
      "type": "integer",
      "const": 1,
      "description": "Spec version"
    },
    "package_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUIDv7 package identifier"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 creation timestamp"
    },
    "author": {
      "type": "object",
      "required": ["did", "signature"],
      "properties": {
        "did": {
          "type": "string",
          "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$",
          "description": "did:key: identifier of the author"
        },
        "signature": {
          "type": "string",
          "pattern": "^[0-9a-f]{128}$",
          "description": "Hex-encoded Ed25519 signature of content_hash"
        }
      }
    },
    "content_hash": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "description": "Hex-encoded SHA-256 of canonical JSON of content"
    },
    "content_type": {
      "type": "string",
      "enum": ["identity", "agent", "memory", "workspace", "credential", "bundle"]
    },
    "content": {
      "type": "object",
      "description": "Payload — schema determined by content_type"
    },
    "metadata": {
      "type": "object",
      "required": ["schema_version", "transmission_class", "compression"],
      "properties": {
        "schema_version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$",
          "description": "Semver version of the content type schema"
        },
        "transmission_class": {
          "type": "string",
          "enum": ["local", "network", "interplanetary"]
        },
        "compression": {
          "type": "string",
          "enum": ["none", "gzip", "zstd"]
        }
      }
    }
  }
}
```

---

## Identity Content Schema

Content for `content_type: "identity"`. See [01-identity.md](../spec/01-identity.md).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-identity.json",
  "title": "Identity Content",
  "type": "object",
  "required": ["id", "public_key", "created_at"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$",
      "description": "did:key: identifier"
    },
    "public_key": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "description": "Hex-encoded Ed25519 public key"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "display_name": {
      "type": "string",
      "maxLength": 100
    },
    "color": {
      "type": "string",
      "pattern": "^#[0-9a-fA-F]{6}$"
    },
    "avatar_hash": {
      "type": "string"
    },
    "bio": {
      "type": "string",
      "maxLength": 280
    },
    "urls": {
      "type": "array",
      "items": { "type": "string", "format": "uri" }
    },
    "rotation": {
      "type": "object",
      "properties": {
        "previous_did": { "type": "string" },
        "new_did": { "type": "string" },
        "rotated_at": { "type": "string", "format": "date-time" },
        "reason": { "type": "string" }
      }
    },
    "revocation": {
      "type": "object",
      "properties": {
        "did": { "type": "string" },
        "revoked_at": { "type": "string", "format": "date-time" },
        "reason": { "type": "string" }
      }
    },
    "extensions": {
      "type": "object",
      "description": "Namespaced extension data"
    }
  }
}
```

---

## Agent Content Schema

Content for `content_type: "agent"`. See [03-agent-portable.md](../spec/03-agent-portable.md).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-agent.json",
  "title": "Agent Content",
  "type": "object",
  "required": ["agent_did", "owner_did", "version", "profile"],
  "properties": {
    "agent_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "owner_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "version": {
      "type": "integer",
      "const": 1
    },
    "profile": {
      "type": "object",
      "required": ["name", "capabilities", "origin", "memory_format"],
      "properties": {
        "name": { "type": "string", "maxLength": 100 },
        "description": { "type": "string", "maxLength": 500 },
        "capabilities": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "origin": {
          "type": "object",
          "required": ["trigger", "born_at"],
          "properties": {
            "trigger": {
              "type": "string",
              "enum": ["user_created", "system_generated", "forked", "imported"]
            },
            "description": { "type": "string" },
            "born_at": { "type": "string", "format": "date-time" }
          }
        },
        "memory_format": {
          "type": "string",
          "enum": ["open_people_v1", "key_value", "custom"]
        },
        "avatar_hash": { "type": "string" }
      }
    },
    "model_preferences": {
      "type": "object",
      "properties": {
        "preferred_provider": { "type": "string" },
        "preferred_model": { "type": "string" },
        "fallback_models": {
          "type": "array",
          "items": { "type": "string" }
        },
        "temperature": { "type": "number", "minimum": 0, "maximum": 2 },
        "max_tokens": { "type": "integer", "minimum": 1 }
      }
    },
    "system_prompt_additions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "memory_refs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["package_id", "content_hash"],
        "properties": {
          "package_id": { "type": "string", "format": "uuid" },
          "content_hash": { "type": "string", "pattern": "^[0-9a-f]{64}$" }
        }
      }
    },
    "extensions": {
      "type": "object",
      "description": "Namespaced extension data"
    }
  }
}
```

---

## Memory Content Schema

Content for `content_type: "memory"`. See [02-data-package.md](../spec/02-data-package.md).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-memory.json",
  "title": "Memory Content",
  "type": "object",
  "required": ["owner_did", "format"],
  "properties": {
    "owner_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "format": {
      "type": "string",
      "enum": ["key_value", "reflections", "mixed"]
    },
    "entries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["key", "value", "recorded_at"],
        "properties": {
          "key": { "type": "string" },
          "value": {},
          "recorded_at": { "type": "string", "format": "date-time" }
        }
      }
    },
    "reflections": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["content", "reflected_at"],
        "properties": {
          "content": { "type": "string" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "source": { "type": "string" },
          "reflected_at": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
```

---

## Workspace Content Schema

Content for `content_type: "workspace"`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-workspace.json",
  "title": "Workspace Content",
  "type": "object",
  "required": ["owner_did", "name"],
  "properties": {
    "owner_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "name": {
      "type": "string",
      "maxLength": 100
    },
    "surfaces": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" },
              "w": { "type": "number" },
              "h": { "type": "number" }
            }
          },
          "config": { "type": "object" }
        }
      }
    },
    "preferences": {
      "type": "object"
    },
    "extensions": {
      "type": "object"
    }
  }
}
```

---

## Credential Content Schema

Content for `content_type: "credential"`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-credential.json",
  "title": "Credential Content",
  "type": "object",
  "required": ["subject_did", "issuer_did", "claim_type", "claim"],
  "properties": {
    "subject_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "issuer_did": {
      "type": "string",
      "pattern": "^did:key:z[1-9A-HJ-NP-Za-km-z]+$"
    },
    "claim_type": {
      "type": "string",
      "enum": ["membership", "certification", "attestation", "endorsement"]
    },
    "claim": {
      "type": "object"
    },
    "expires_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

---

## Bundle Content Schema

Content for `content_type: "bundle"`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openpeopleStudio.com/schemas/content-bundle.json",
  "title": "Bundle Content",
  "type": "object",
  "required": ["name", "packages"],
  "properties": {
    "name": {
      "type": "string",
      "maxLength": 200
    },
    "description": {
      "type": "string"
    },
    "packages": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["package_id", "content_type", "content_hash", "required"],
        "properties": {
          "package_id": { "type": "string", "format": "uuid" },
          "content_type": {
            "type": "string",
            "enum": ["identity", "agent", "memory", "workspace", "credential"]
          },
          "content_hash": { "type": "string", "pattern": "^[0-9a-f]{64}$" },
          "required": { "type": "boolean" }
        }
      }
    }
  }
}
```

---

## Examples

See the [examples/](../../examples/) directory for complete `.opkg` files that conform to these schemas:

- `minimal-identity.opkg` — Simplest valid identity package
- `agent-export.opkg` — Full agent with mars-hq extensions and memory reference
- `workspace-bundle.opkg` — Bundle containing agent + memory + workspace
