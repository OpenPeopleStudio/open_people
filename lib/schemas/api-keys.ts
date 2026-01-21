import { z } from "zod";

const environmentSchema = z.enum(["development", "staging", "production"]);
const scopeSchema = z.enum(["super_admin", "tenant", "project"]);

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  provider: z.string().trim().min(1, "Provider is required"),
  key: z.string().trim().min(1, "Key is required"),
  description: z.string().trim().optional(),
  environment: environmentSchema.default("development"),
  scope: scopeSchema.default("super_admin"),
  project_name: z.string().trim().optional(),
  tags: z.array(z.string().trim()).default([]),
  expires_at: z.string().trim().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    environment: environmentSchema.optional(),
    project_name: z.string().trim().optional(),
    tags: z.array(z.string().trim()).optional(),
    expires_at: z.string().trim().nullable().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
