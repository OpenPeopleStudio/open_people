import { z } from "zod";

export const tenantCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  tier: z.string().nullable().optional(),
  status: z.string().optional(),
  settings: z.record(z.unknown()).nullable().optional(),
});

export const tenantUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    tier: z.string().nullable().optional(),
    status: z.string().optional(),
    settings: z.record(z.unknown()).nullable().optional(),
  })
  .refine((data) => Boolean(data.name || data.tier || data.status || data.settings), {
    message: "At least one field must be provided",
  });

export type TenantCreateSchema = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateSchema = z.infer<typeof tenantUpdateSchema>;
