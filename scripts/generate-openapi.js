#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const pkg = require(path.join(__dirname, "..", "package.json"));

const spec = {
  openapi: "3.1.0",
  info: {
    title: "OpenPeople API",
    version: pkg.version || "0.1.0",
    description:
      "Unofficial OpenAPI surface for critical endpoints. This file is generated and should stay in sync with route schemas.",
  },
  servers: [
    { url: "https://app.openpeople.ai", description: "Production" },
    { url: "http://localhost:3000", description: "Local" },
  ],
  components: {
    securitySchemes: {
      GatewayKeyAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "op_sk_*",
        description: "Gateway API key header: Authorization: Bearer op_sk_...",
      },
      ServiceTokenAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "op_srv_*",
        description: "Service token header: Authorization: Bearer op_srv_...",
      },
      UserAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "jwt",
        description: "User session JWT (via Supabase) for dashboard clients",
      },
      VaultTokenAuth: {
        type: "apiKey",
        in: "header",
        name: "x-vault-token",
        description: "Quick-upload token header (long-lived device token)",
      },
    },
    responses: {
      Unauthorized: {
        description: "Authentication required or invalid credentials",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
    schemas: {
      ChatMessage: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["system", "user", "assistant"] },
          content: { type: "string", maxLength: 6000 },
        },
      },
      ChatCompletionRequest: {
        type: "object",
        required: ["model", "messages"],
        properties: {
          model: { type: "string" },
          messages: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: { $ref: "#/components/schemas/ChatMessage" },
          },
          temperature: { type: "number", minimum: 0, maximum: 2 },
          max_tokens: { type: "integer", minimum: 1, maximum: 4096 },
          top_p: { type: "number", minimum: 0, maximum: 1 },
          frequency_penalty: { type: "number", minimum: -2, maximum: 2 },
          presence_penalty: { type: "number", minimum: -2, maximum: 2 },
          stop: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          stream: { type: "boolean" },
          user: { type: "string", maxLength: 128 },
        },
      },
      ChatCompletionChoice: {
        type: "object",
        required: ["index", "message", "finish_reason"],
        properties: {
          index: { type: "integer" },
          message: { $ref: "#/components/schemas/ChatMessage" },
          finish_reason: { type: "string" },
        },
      },
      ChatCompletionResponse: {
        type: "object",
        required: ["id", "object", "created", "model", "choices"],
        properties: {
          id: { type: "string" },
          object: { type: "string" },
          created: { type: "integer" },
          model: { type: "string" },
          choices: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatCompletionChoice" },
          },
          usage: {
            type: "object",
            properties: {
              prompt_tokens: { type: "integer" },
              completion_tokens: { type: "integer" },
              total_tokens: { type: "integer" },
            },
          },
        },
      },
      Tenant: {
        type: "object",
        required: ["id", "name", "slug", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          status: { type: "string", enum: ["active", "inactive", "suspended"] },
          tier: { type: "string", enum: ["free", "pro", "enterprise"], nullable: true },
          settings: { type: "object", additionalProperties: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      TenantCreateRequest: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          tier: { type: "string" },
          settings: { type: "object", additionalProperties: true },
        },
      },
      TenantUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          status: { type: "string" },
          tier: { type: "string" },
          settings: { type: "object", additionalProperties: true },
        },
      },
      User: {
        type: "object",
        required: ["id", "email", "role", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          full_name: { type: "string" },
          role: { type: "string", enum: ["owner", "admin", "member", "viewer", "super_admin"] },
          status: { type: "string", enum: ["active", "disabled", "invited"] },
          tenant_id: { type: "string", format: "uuid" },
          mfa_enabled: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      UserInviteRequest: {
        type: "object",
        required: ["email", "role", "tenant_id"],
        properties: {
          email: { type: "string", format: "email" },
          full_name: { type: "string" },
          role: { type: "string" },
          tenant_id: { type: "string", format: "uuid" },
        },
      },
      UserUpdateRequest: {
        type: "object",
        properties: {
          role: { type: "string" },
          status: { type: "string" },
        },
      },
      Device: {
        type: "object",
        required: ["id", "name", "platform"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          platform: { type: "string" },
          tenant_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          last_ip: { type: "string" },
          last_user_agent: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      DeviceRegisterRequest: {
        type: "object",
        required: ["name", "platform"],
        properties: {
          name: { type: "string" },
          platform: { type: "string" },
          fingerprint: { type: "string" },
        },
      },
      VaultFolder: {
        type: "object",
        required: ["id", "name", "path"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          path: { type: "string" },
          parent_id: { type: "string", format: "uuid", nullable: true },
        },
      },
      VaultFile: {
        type: "object",
        required: ["id", "filename", "size_bytes", "content_type", "vault_id"],
        properties: {
          id: { type: "string", format: "uuid" },
          vault_id: { type: "string", format: "uuid" },
          folder_id: { type: "string", format: "uuid", nullable: true },
          filename: { type: "string" },
          size_bytes: { type: "integer" },
          content_type: { type: "string" },
          ai_summary: { type: "string", nullable: true },
          ai_tags: { type: "array", items: { type: "string" }, nullable: true },
          ai_category: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["pending", "active", "archived", "deleted"] },
        },
      },
      VaultUploadInitRequest: {
        type: "object",
        required: ["filename", "content_type", "size_bytes"],
        properties: {
          filename: { type: "string" },
          content_type: { type: "string" },
          size_bytes: { type: "integer" },
          folder_id: { type: "string", format: "uuid" },
          checksum: { type: "string" },
        },
      },
      SignedUrlResponse: {
        type: "object",
        required: ["file_id", "upload_url"],
        properties: {
          file_id: { type: "string", format: "uuid" },
          upload_url: { type: "string", format: "uri" },
          expires_at: { type: "string", format: "date-time" },
        },
      },
      UploadToken: {
        type: "object",
        required: ["id", "token_prefix"],
        properties: {
          id: { type: "string", format: "uuid" },
          token_prefix: { type: "string" },
          allowed_types: { type: "array", items: { type: "string" } },
          max_file_size_mb: { type: "integer" },
          expires_at: { type: "string", format: "date-time", nullable: true },
          is_active: { type: "boolean" },
        },
      },
      UploadTokenCreateRequest: {
        type: "object",
        required: ["name", "vault_id"],
        properties: {
          name: { type: "string" },
          vault_id: { type: "string", format: "uuid" },
          allowed_types: { type: "array", items: { type: "string" } },
          max_file_size_mb: { type: "integer" },
          expires_at: { type: "string", format: "date-time" },
          auto_approve: { type: "boolean" },
        },
      },
      SearchRequest: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string" },
          folder_id: { type: "string", format: "uuid" },
          tags: { type: "array", items: { type: "string" } },
          content_types: { type: "array", items: { type: "string" } },
        },
      },
      SearchResult: {
        type: "object",
        properties: {
          file: { $ref: "#/components/schemas/VaultFile" },
          score: { type: "number" },
          snippet: { type: "string" },
        },
      },
      QuickUploadResponse: {
        type: "object",
        required: ["success", "file_id", "filename", "size_bytes"],
        properties: {
          success: { type: "boolean" },
          file_id: { type: "string", format: "uuid" },
          filename: { type: "string" },
          size_bytes: { type: "integer" },
          ai_summary: { type: "string" },
          ai_category: { type: "string" },
          ai_tags: { type: "array", items: { type: "string" } },
          suggested_folder: { type: "string" },
          auto_approved: { type: "boolean" },
          duration_ms: { type: "integer" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
              type: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/chat/completions": {
      post: {
        summary: "Unified AI gateway (OpenAI compatible)",
        security: [{ GatewayKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatCompletionRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Chat completion response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatCompletionResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/v1/tenants": {
      get: {
        summary: "List tenants (super-admin/service token)",
        security: [{ ServiceTokenAuth: [] }],
        responses: {
          200: {
            description: "Tenant list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Tenant" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create tenant",
        security: [{ ServiceTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TenantCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Tenant created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Tenant" },
              },
            },
          },
        },
      },
    },
    "/api/v1/tenants/{tenant_id}": {
      get: {
        summary: "Get tenant",
        security: [{ ServiceTokenAuth: [] }, { UserAuth: [] }],
        parameters: [
          { name: "tenant_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Tenant",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Tenant" } } },
          },
        },
      },
      put: {
        summary: "Update tenant",
        security: [{ ServiceTokenAuth: [] }],
        parameters: [
          { name: "tenant_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TenantUpdateRequest" } },
          },
        },
        responses: {
          200: {
            description: "Updated tenant",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Tenant" } } },
          },
        },
      },
    },
    "/api/v1/users": {
      get: {
        summary: "List users (tenant scoped)",
        security: [{ UserAuth: [] }],
        responses: {
          200: {
            description: "Users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Invite user",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserInviteRequest" } } },
        },
        responses: {
          201: {
            description: "User invited",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
        },
      },
    },
    "/api/v1/users/{user_id}": {
      patch: {
        summary: "Update user role/status",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserUpdateRequest" } } },
        },
        responses: {
          200: { description: "Updated user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
        },
      },
    },
    "/api/v1/devices": {
      get: {
        summary: "List devices",
        security: [{ UserAuth: [] }],
        responses: {
          200: {
            description: "Devices",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Device" } } } },
          },
        },
      },
      post: {
        summary: "Register device",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceRegisterRequest" } } },
        },
        responses: {
          201: {
            description: "Device registered",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Device" } } },
          },
        },
      },
    },
    "/api/v1/devices/{device_id}/tokens": {
      post: {
        summary: "Mint short-lived device token",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "device_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          201: {
            description: "Token created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    expires_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Revoke all device tokens",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "device_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 204: { description: "Revoked" } },
      },
    },
    "/api/v1/vault/files": {
      get: {
        summary: "List vault files",
        security: [{ UserAuth: [] }],
        responses: {
          200: {
            description: "Files",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/VaultFile" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Request signed upload URL",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/VaultUploadInitRequest" } },
          },
        },
        responses: {
          201: {
            description: "Signed URL returned",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SignedUrlResponse" } } },
          },
        },
      },
    },
    "/api/v1/vault/files/{file_id}": {
      get: {
        summary: "Get file metadata",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "file_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "File metadata", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultFile" } } } },
        },
      },
      delete: {
        summary: "Delete file (soft delete)",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "file_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/v1/vault/files/{file_id}/download": {
      get: {
        summary: "Get signed download URL",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "file_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Signed URL", content: { "application/json": { schema: { $ref: "#/components/schemas/SignedUrlResponse" } } } },
        },
      },
    },
    "/api/v1/vault/files/{file_id}/analyze": {
      post: {
        summary: "Trigger AI analysis",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "file_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 202: { description: "Analysis started" } },
      },
    },
    "/api/v1/vault/files/{file_id}/analysis": {
      get: {
        summary: "Get AI analysis results",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "file_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Analysis payload", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultFile" } } } },
        },
      },
    },
    "/api/v1/vault/folders": {
      get: {
        summary: "List folders",
        security: [{ UserAuth: [] }],
        responses: {
          200: { description: "Folders", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/VaultFolder" } } } } },
        },
      },
      post: {
        summary: "Create folder",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string" }, parent_id: { type: "string", format: "uuid" } },
              },
            },
          },
        },
        responses: {
          201: { description: "Folder created", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultFolder" } } } },
        },
      },
    },
    "/api/v1/vault/folders/{folder_id}": {
      patch: {
        summary: "Update folder (rename/move)",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "folder_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, parent_id: { type: "string", format: "uuid" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Folder updated", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultFolder" } } } },
        },
      },
      delete: {
        summary: "Delete folder",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "folder_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/v1/vault/upload-tokens": {
      get: {
        summary: "List upload tokens",
        security: [{ UserAuth: [] }],
        responses: {
          200: { description: "Tokens", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UploadToken" } } } } },
        },
      },
      post: {
        summary: "Create upload token",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UploadTokenCreateRequest" } } },
        },
        responses: {
          201: { description: "Token created", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadToken" } } } },
        },
      },
    },
    "/api/v1/vault/upload-tokens/{token_id}": {
      patch: {
        summary: "Update upload token (rotate/disable)",
        security: [{ UserAuth: [] }],
        parameters: [
          { name: "token_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  is_active: { type: "boolean" },
                  expires_at: { type: "string", format: "date-time" },
                  max_file_size_mb: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Token updated", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadToken" } } } },
        },
      },
    },
    "/api/v1/vault/search": {
      post: {
        summary: "Search vault",
        security: [{ UserAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SearchRequest" } } },
        },
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: { type: "array", items: { $ref: "#/components/schemas/SearchResult" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/vault/quick-upload": {
      post: {
        summary: "Upload an encrypted file to the Vault via token",
        security: [{ VaultTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Upload accepted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QuickUploadResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
  },
};

const outputPath = path.join(__dirname, "..", "docs", "api", "openapi.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`OpenAPI spec written to ${outputPath}`);
