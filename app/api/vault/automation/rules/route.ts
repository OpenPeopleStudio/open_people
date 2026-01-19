import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { validateRule } from "@/lib/vault/automation";
import type { VaultAutomationRule } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Automation Rules API
   
   TODO: Complete implementation for Phase 5
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/vault/automation/rules
 * List all automation rules for the vault
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json({ error: "Vault session required" }, { status: 401 });
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
    
    // Get rules
    const { data: rules, error: rulesError } = await supabase
      .from("vault_automation_rules")
      .select("*")
      .eq("vault_id", session.vault_id)
      .order("created_at", { ascending: false });
    
    if (rulesError) {
      console.error("Failed to fetch rules:", rulesError);
      return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
    }
    
    return NextResponse.json({ rules: rules || [] });
    
  } catch (error) {
    console.error("Rules fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/vault/automation/rules
 * Create a new automation rule
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json({ error: "Vault session required" }, { status: 401 });
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
    
    // Parse body
    const body = await request.json();
    const {
      name,
      description,
      email_from_pattern,
      email_from_exact,
      email_subject_pattern,
      email_subject_contains,
      attachment_types,
      attachment_name_pattern,
      min_attachment_size,
      max_attachment_size,
      target_folder_id,
      auto_approve,
      ai_classify,
      apply_tags,
      priority,
    } = body as Partial<VaultAutomationRule> & { name: string };
    
    // Validate
    const errors = validateRule({
      name,
      email_from_pattern,
      email_from_exact,
      email_subject_pattern,
      email_subject_contains,
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }
    
    // Create rule
    const { data: rule, error: createError } = await supabase
      .from("vault_automation_rules")
      .insert({
        vault_id: session.vault_id,
        name,
        description: description ?? null,
        email_from_pattern: email_from_pattern ?? null,
        email_from_exact: email_from_exact || null,
        email_subject_pattern: email_subject_pattern ?? null,
        email_subject_contains: email_subject_contains || null,
        attachment_types: attachment_types || [],
        attachment_name_pattern: attachment_name_pattern ?? null,
        min_attachment_size: min_attachment_size ?? null,
        max_attachment_size: max_attachment_size ?? null,
        target_folder_id,
        auto_approve: auto_approve || false,
        ai_classify: ai_classify ?? true,
        apply_tags: apply_tags || [],
        priority: priority ?? 0,
        is_active: true,
      })
      .select()
      .single();
    
    if (createError) {
      console.error("Failed to create rule:", createError);
      return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: session.vault_id,
        action: "rule_created",
        resource_type: "automation_rule",
        resource_id: rule.id,
        performed_by: user.id,
        success: true,
        metadata: { name },
      });
    
    return NextResponse.json({ rule });
    
  } catch (error) {
    console.error("Rule create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/vault/automation/rules
 * Update an existing rule
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json({ error: "Vault session required" }, { status: 401 });
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
    
    // Parse body
    const body = await request.json();
    const { rule_id, ...updates } = body;
    
    if (!rule_id) {
      return NextResponse.json({ error: "rule_id is required" }, { status: 400 });
    }
    
    // Update rule
    const { data: rule, error: updateError } = await supabase
      .from("vault_automation_rules")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rule_id)
      .eq("vault_id", session.vault_id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update rule:", updateError);
      return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
    }
    
    return NextResponse.json({ rule });
    
  } catch (error) {
    console.error("Rule update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/vault/automation/rules
 * Delete a rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json({ error: "Vault session required" }, { status: 401 });
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
    
    // Parse body
    const body = await request.json();
    const { rule_id } = body;
    
    if (!rule_id) {
      return NextResponse.json({ error: "rule_id is required" }, { status: 400 });
    }
    
    // Delete rule
    const { error: deleteError } = await supabase
      .from("vault_automation_rules")
      .delete()
      .eq("id", rule_id)
      .eq("vault_id", session.vault_id);
    
    if (deleteError) {
      console.error("Failed to delete rule:", deleteError);
      return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: session.vault_id,
        action: "rule_deleted",
        resource_type: "automation_rule",
        resource_id: rule_id,
        performed_by: user.id,
        success: true,
      });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Rule delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
