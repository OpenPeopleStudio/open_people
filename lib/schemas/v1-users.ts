import { z } from "zod";

export const userUpdateSchema = z
  .object({
    role: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.role || data.status), {
    message: "role or status required",
  });

export const userInviteSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  full_name: z.string().min(1).optional(),
  tenant_id: z.string().min(1).optional(),
});

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
export type UserInviteSchema = z.infer<typeof userInviteSchema>;
