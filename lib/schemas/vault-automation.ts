import { z } from "zod";

const optionalString = z.string().min(1).optional();
const nullableString = z.string().min(1).nullable().optional();

export const vaultAutomationRuleBaseSchema = z.object({
  name: optionalString,
  description: nullableString,
  email_from_pattern: nullableString,
  email_from_exact: nullableString,
  email_subject_pattern: nullableString,
  email_subject_contains: nullableString,
  attachment_types: z.array(z.string()).nullable().optional(),
  attachment_name_pattern: nullableString,
  min_attachment_size: z.number().int().nullable().optional(),
  max_attachment_size: z.number().int().nullable().optional(),
  target_folder_id: nullableString,
  auto_approve: z.boolean().optional(),
  ai_classify: z.boolean().optional(),
  apply_tags: z.array(z.string()).nullable().optional(),
  priority: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const vaultAutomationRuleCreateSchema = vaultAutomationRuleBaseSchema.extend({
  name: z.string().min(1),
});

export const vaultAutomationRuleUpdateSchema = vaultAutomationRuleBaseSchema.extend({
  rule_id: z.string().min(1),
});

export const vaultAutomationRuleDeleteSchema = z.object({
  rule_id: z.string().min(1),
});

export type VaultAutomationRuleCreate = z.infer<typeof vaultAutomationRuleCreateSchema>;
export type VaultAutomationRuleUpdate = z.infer<typeof vaultAutomationRuleUpdateSchema>;
export type VaultAutomationRuleDelete = z.infer<typeof vaultAutomationRuleDeleteSchema>;
