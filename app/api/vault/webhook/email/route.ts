import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Email Webhook
   
   Receives incoming email notifications from Cloudflare Email Worker.
   
   TODO: Complete implementation for Phase 5
   
   Expected payload from worker:
   {
     vault_id: string,
     message_id: string,
     from: string,
     subject: string,
     received_at: string,
     attachments: [
       {
         filename: string,
         content_type: string,
         size_bytes: number,
         r2_key: string,        // Worker uploads encrypted attachment to R2
         encryption_iv: string, // IV used by worker
       }
     ]
   }
   ═══════════════════════════════════════════════════════════════════════════ */

const WEBHOOK_SECRET = process.env.VAULT_WEBHOOK_SECRET;

function computeFallbackContentHash(
  r2Key: string,
  messageId: string,
  filename: string
): string {
  const seed = `${r2Key}:${messageId}:${filename}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * POST /api/vault/webhook/email
 * Process incoming email from Cloudflare Worker
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    
    if (!WEBHOOK_SECRET) {
      console.error("VAULT_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    
    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    
    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Invalid webhook signature length");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    // Check timestamp to prevent replay attacks (5 minute window)
    const timestampMs = parseInt(timestamp, 10);
    if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Timestamp expired" }, { status: 401 });
    }
    
    // Parse payload
    const payload = JSON.parse(body);
    const { vault_id, message_id, from, subject, received_at, attachments } = payload;
    
    if (!vault_id || !attachments || attachments.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const attachmentsMissingHash = new Set<number>();
    attachments.forEach((attachment: { content_hash?: string }, index: number) => {
      if (!attachment?.content_hash) {
        attachmentsMissingHash.add(index);
      }
    });
    
    const supabase = await createSupabaseAdmin();
    
    // Verify vault exists
    const { data: vault, error: vaultError } = await supabase
      .from("vault_spaces")
      .select("id, owner_id")
      .eq("id", vault_id)
      .single();
    
    if (vaultError || !vault) {
      console.error("Vault not found:", vault_id);
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }
    
    // Get active encryption key for the vault
    const { data: encryptionKey } = await supabase
      .from("vault_encryption_keys")
      .select("id")
      .eq("vault_id", vault_id)
      .eq("is_active", true)
      .single();
    
    if (!encryptionKey) {
      console.error("No encryption key for vault:", vault_id);
      return NextResponse.json({ error: "Vault not properly configured" }, { status: 500 });
    }
    
    // Get matching automation rules
    const { data: rules } = await supabase
      .from("vault_automation_rules")
      .select("*")
      .eq("vault_id", vault_id)
      .eq("is_active", true);
    
    // Find best matching rule
    let matchedRule = null;
    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (rule.email_from && from.toLowerCase().includes(rule.email_from.toLowerCase())) {
          matchedRule = rule;
          break;
        }
        if (rule.email_subject && subject.toLowerCase().includes(rule.email_subject.toLowerCase())) {
          matchedRule = rule;
          break;
        }
      }
    }
    
    // Process each attachment
    const createdFiles: string[] = [];
    
    for (const attachment of attachments) {
      const contentHash =
        attachment.content_hash ||
        computeFallbackContentHash(
          attachment.r2_key,
          message_id,
          attachment.filename
        );
      const hasHashError = !attachment.content_hash;
      const shouldAutoApprove = matchedRule?.auto_approve && !hasHashError;

      // Create file record
      const { data: file, error: fileError } = await supabase
        .from("vault_files")
        .insert({
          vault_id,
          folder_id: matchedRule?.target_folder_id || null,
          filename: attachment.filename,
          r2_key: attachment.r2_key,
          encryption_key_id: encryptionKey.id,
          encryption_iv: attachment.encryption_iv,
          size_bytes: attachment.size_bytes,
          content_hash: contentHash,
          content_type: attachment.content_type,
          source_type: "email",
          source_metadata: {
            message_id,
            email_from: from,
            email_subject: subject,
            received_at,
            content_hash_error: hasHashError ? "missing_content_hash" : null,
          },
          status: shouldAutoApprove ? "active" : "pending",
          ...(hasHashError
            ? { error_message: "Missing content_hash from email worker payload." }
            : {}),
        })
        .select()
        .single();
      
      if (fileError) {
        console.error("Failed to create file:", fileError);
        continue;
      }
      
      createdFiles.push(file.id);
      
      // Create inbox item if not auto-approved
      if (!shouldAutoApprove) {
        await supabase
          .from("vault_inbox")
          .insert({
            vault_id,
            file_id: file.id,
            source_type: "email",
            source_email_from: from,
            source_email_subject: subject,
            source_email_date: received_at,
            rule_id: matchedRule?.id || null,
            suggested_folder_id: matchedRule?.target_folder_id || null,
            status: "pending",
          });
      }
      
      // Queue AI analysis
      // TODO: Trigger async analysis
    }
    
    // Log the ingestion
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id,
        action: "email_ingested",
        performed_by: "system",
        success: true,
        metadata: {
          message_id,
          from,
          subject,
          attachments_count: attachments.length,
          files_created: createdFiles.length,
          auto_approved: matchedRule?.auto_approve || false,
          rule_id: matchedRule?.id || null,
          missing_content_hash_count: attachmentsMissingHash.size,
        },
      });
    
    return NextResponse.json({
      success: true,
      files_created: createdFiles.length,
      auto_approved: matchedRule?.auto_approve || false,
    });
    
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
