import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/inbox
   List files in the automation inbox awaiting review
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Vault session required" },
        { status: 401 }
      );
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    
    // Get inbox items with file details
    const { data: items, error: itemsError } = await supabase
      .from("vault_inbox")
      .select(`
        *,
        file:vault_files(
          id,
          filename,
          content_type,
          size_bytes,
          ai_category,
          ai_summary,
          ai_tags,
          created_at
        ),
        rule:vault_automation_rules(
          id,
          name,
          email_from,
          email_subject
        )
      `)
      .eq("vault_id", session.vault_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (itemsError) {
      console.error("Failed to fetch inbox:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch inbox" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ items: items || [] });
    
  } catch (error) {
    console.error("Inbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/vault/inbox
   Approve or reject an inbox item
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Vault session required" },
        { status: 401 }
      );
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { item_id, action, target_folder_id } = body;
    
    if (!item_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "item_id and action (approve/reject) are required" },
        { status: 400 }
      );
    }
    
    // Get inbox item
    const { data: item, error: itemError } = await supabase
      .from("vault_inbox")
      .select("*, file:vault_files(*)")
      .eq("id", item_id)
      .eq("vault_id", session.vault_id)
      .single();
    
    if (itemError || !item) {
      return NextResponse.json(
        { error: "Inbox item not found" },
        { status: 404 }
      );
    }
    
    if (action === "approve") {
      // Update inbox item
      await supabase
        .from("vault_inbox")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", item_id);
      
      // Move file to target folder if specified
      if (target_folder_id || item.suggested_folder_id) {
        await supabase
          .from("vault_files")
          .update({
            folder_id: target_folder_id || item.suggested_folder_id,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.file_id);
      } else {
        // Just activate the file
        await supabase
          .from("vault_files")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.file_id);
      }
      
      // Log action
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: session.vault_id,
          action: "inbox_approved",
          resource_type: "file",
          resource_id: item.file_id,
          performed_by: user.id,
          success: true,
          metadata: {
            source: item.source_type,
            rule_id: item.rule_id,
          },
        });
      
    } else {
      // Reject - mark file as deleted
      await supabase
        .from("vault_inbox")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", item_id);
      
      await supabase
        .from("vault_files")
        .update({
          status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.file_id);
      
      // Log action
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: session.vault_id,
          action: "inbox_rejected",
          resource_type: "file",
          resource_id: item.file_id,
          performed_by: user.id,
          success: true,
        });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Inbox action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
