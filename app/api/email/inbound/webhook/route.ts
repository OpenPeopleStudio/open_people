import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import type { EmailAddress, EmailAttachmentMeta } from "@/types/email";
import { createResendClient } from "@/lib/email/resend";

/* ═══════════════════════════════════════════════════════════════════════════
   Inbound Email Webhook
   POST /api/email/inbound/webhook - Receive inbound emails
   
   This endpoint receives inbound email payloads from:
   - Resend inbound webhooks
   - Custom MX forwarder (if configured)
   
   Emails are parsed and stored in email_messages for managed accounts.
   ═══════════════════════════════════════════════════════════════════════════ */

// Webhook secret for verification (should be set in environment)
const INBOUND_WEBHOOK_SECRET = process.env.INBOUND_WEBHOOK_SECRET;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();
  
  console.log(`[Inbound Webhook ${requestId}] ═══════════════════════════════════════`);
  console.log(`[Inbound Webhook ${requestId}] Received request at ${timestamp}`);
  console.log(`[Inbound Webhook ${requestId}] Method: ${request.method}`);
  console.log(`[Inbound Webhook ${requestId}] URL: ${request.url}`);
  
  // Log all headers for debugging
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    // Redact sensitive values
    if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("auth")) {
      headers[key] = "[REDACTED]";
    } else {
      headers[key] = value;
    }
  });
  console.log(`[Inbound Webhook ${requestId}] Headers:`, JSON.stringify(headers, null, 2));
  
  try {
    // Verify webhook signature if configured
    const sharedSecretSignature = request.headers.get("x-webhook-signature");
    const svixSignature = request.headers.get("svix-signature");
    console.log(`[Inbound Webhook ${requestId}] Signatures:`, {
      x_webhook_signature: sharedSecretSignature ? "present" : "none",
      svix_signature: svixSignature ? "present" : "none",
    });
    
    // NOTE:
    // - `INBOUND_WEBHOOK_SECRET` is a simple shared-secret header intended for custom forwarders.
    // - Providers like Resend typically use Svix headers (svix-*) instead of x-webhook-signature.
    if (INBOUND_WEBHOOK_SECRET && !svixSignature) {
      const ok = sharedSecretSignature && sharedSecretSignature === INBOUND_WEBHOOK_SECRET;
      // For development, allow requests without signature
      if (!ok && process.env.NODE_ENV === "production") {
        console.log("[Inbound Webhook] Invalid/missing shared-secret signature, rejecting");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const contentType = request.headers.get("content-type") || "";
    console.log(`[Inbound Webhook ${requestId}] Content-Type: ${contentType}`);
    
    let emailData: InboundEmailData;

    // Handle different payload formats
    if (contentType.includes("application/json")) {
      // JSON payload (e.g., Resend inbound webhook via Svix)
      const payload = await request.text();

      // Verify Resend Svix signature if configured (recommended in production)
      if (RESEND_WEBHOOK_SECRET && svixSignature) {
        try {
          const resend = createResendClient();
          resend.webhooks.verify({
            payload,
            headers: {
              id: request.headers.get("svix-id") || "",
              timestamp: request.headers.get("svix-timestamp") || "",
              signature: svixSignature,
            },
            webhookSecret: RESEND_WEBHOOK_SECRET,
          });
        } catch (e) {
          console.error("[Inbound Webhook] Invalid Resend webhook signature:", e);
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
        }
      }

      const body = JSON.parse(payload);
      console.log(`[Inbound Webhook ${requestId}] JSON payload type: ${body.type || "unknown"}`);
      console.log(`[Inbound Webhook ${requestId}] JSON payload:`, JSON.stringify(body, null, 2).substring(0, 1000));
      emailData = parseJsonPayload(body);
    } else if (contentType.includes("multipart/form-data")) {
      // Form data payload (e.g., forwarded email)
      const formData = await request.formData();
      emailData = await parseFormDataPayload(formData);
    } else if (contentType.includes("message/rfc822") || contentType.includes("text/plain")) {
      // Raw email payload
      const rawEmail = await request.text();
      console.log(`[Inbound Webhook ${requestId}] Raw email (first 500 chars):`, rawEmail.substring(0, 500));
      emailData = await parseRawEmail(rawEmail);
    } else {
      console.log(`[Inbound Webhook ${requestId}] Unsupported content type: ${contentType}`);
      return NextResponse.json({ error: "Unsupported content type", requestId }, { status: 400 });
    }

    console.log(`[Inbound Webhook ${requestId}] Parsed email:`, { 
      from: emailData.from, 
      to: emailData.to, 
      subject: emailData.subject,
      messageId: emailData.messageId,
      resendEmailId: emailData.resendEmailId,
    });

    if (!emailData.to || !emailData.from) {
      console.log(`[Inbound Webhook ${requestId}] Missing required fields - from: ${emailData.from}, to: ${emailData.to}`);
      return NextResponse.json({ error: "Missing required fields", requestId }, { status: 400 });
    }

    // If this is a Resend receiving webhook, fetch full content (webhook payload omits html/text).
    // https://resend.com/docs/dashboard/receiving/get-email-content
    if (
      emailData.resendEmailId &&
      !emailData.html &&
      !emailData.text &&
      process.env.RESEND_API_KEY
    ) {
      try {
        const resend = createResendClient();
        const { data } = await resend.emails.receiving.get(emailData.resendEmailId);
        if (data) {
          emailData.text = (data as any).text || emailData.text;
          emailData.html = (data as any).html || emailData.html;
          emailData.rawHeaders = (data as any).headers || emailData.rawHeaders;
        }
      } catch (e) {
        console.error("[Inbound Webhook] Failed to fetch Resend received email content:", e);
        // Continue storing metadata-only message
      }
    }

    // Webhooks are unauthenticated requests, so we must use the admin client
    // to bypass RLS when looking up managed domains/accounts and inserting messages.
    let supabase: any;
    try {
      supabase = await createSupabaseAdmin();
    } catch (e) {
      console.error("[Inbound Webhook] Supabase admin client not available:", e);
      return NextResponse.json(
        { received: true, stored: false, error: "Server not configured for inbound ingestion" },
        { status: 500 }
      );
    }

    const toAddresses = normalizeAddressList(Array.isArray(emailData.to) ? emailData.to : [emailData.to]);
    console.log(`[Inbound Webhook ${requestId}] Normalized to addresses:`, toAddresses);

    if (toAddresses.length === 0) {
      console.log(`[Inbound Webhook ${requestId}] No valid recipient addresses found`);
      return NextResponse.json({ error: "Missing recipient address", requestId }, { status: 400 });
    }

    // Find the best matching managed domain / account
    let matchedManagedDomain: any | null = null;
    let matchedToAddress: string | null = null;

    for (const addr of toAddresses) {
      const at = addr.lastIndexOf("@");
      if (at === -1) continue;
      const domain = addr.slice(at + 1);
      console.log(`[Inbound Webhook ${requestId}] Checking domain: ${domain} for address: ${addr}`);

      const { data: managedDomain, error: managedDomainError } = await supabase
        .from("managed_email_domains")
        .select("*")
        .eq("domain", domain)
        .eq("status", "verified")
        .maybeSingle();

      if (managedDomainError) {
        console.error(`[Inbound Webhook ${requestId}] managed_email_domains lookup error:`, managedDomainError);
        continue;
      }

      console.log(`[Inbound Webhook ${requestId}] Domain lookup result for ${domain}:`, managedDomain ? "FOUND" : "NOT FOUND");

      if (managedDomain) {
        matchedManagedDomain = managedDomain;
        matchedToAddress = addr;
        console.log(`[Inbound Webhook ${requestId}] Matched managed domain:`, {
          id: managedDomain.id,
          domain: managedDomain.domain,
          tenant_id: managedDomain.tenant_id,
          account_id: managedDomain.account_id,
        });
        break;
      }
    }

    if (!matchedManagedDomain) {
      console.log(`[Inbound Webhook ${requestId}] No managed domain found, trying email_accounts fallback`);
      
      // Fallback: exact match on email_accounts.email_address (useful for single-address managed inboxes)
      for (const addr of toAddresses) {
        console.log(`[Inbound Webhook ${requestId}] Checking email_accounts for: ${addr}`);
        
        const { data: account, error: accountError } = await supabase
          .from("email_accounts")
          .select("*")
          .eq("email_address", addr)
          .eq("mode", "managed")
          .maybeSingle();

        if (accountError) {
          console.error(`[Inbound Webhook ${requestId}] email_accounts lookup error:`, accountError);
          continue;
        }

        if (account) {
          console.log(`[Inbound Webhook ${requestId}] Found managed account: ${account.id} (${account.name})`);
          await storeInboundMessage(supabase, account, emailData);
          console.log(`[Inbound Webhook ${requestId}] ✓ Email stored successfully via account match`);
          return NextResponse.json({ received: true, stored: true, matched: { type: "account", to: addr }, requestId });
        }
      }

      console.log(`[Inbound Webhook ${requestId}] ✗ No managed domain/account found for recipients:`, toAddresses);
      
      // Also check what domains DO exist for debugging
      const { data: allDomains } = await supabase
        .from("managed_email_domains")
        .select("domain, status, tenant_id");
      console.log(`[Inbound Webhook ${requestId}] Available managed domains in system:`, allDomains);
      
      // Return 200 to avoid retry loops, but report that we didn't store.
      return NextResponse.json({
        received: true,
        stored: false,
        reason: "No managed domain/account found for recipient(s)",
        to: toAddresses,
        requestId,
      });
    }

    // Domain matched: store to its linked account (if any), otherwise store at the tenant level
    const domainAccountId = matchedManagedDomain.account_id as string | null;

    if (domainAccountId) {
      const { data: account, error: accountError } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", domainAccountId)
        .maybeSingle();

      if (accountError) {
        console.error("[Inbound Webhook] linked account lookup error:", accountError);
        return NextResponse.json({ received: true, stored: false, error: "Account lookup failed" });
      }

        if (account) {
          await storeInboundMessage(
            supabase,
            account,
            emailData,
            matchedManagedDomain.tenant_id ?? undefined
          );
          console.log(`[Inbound Webhook ${requestId}] ✓ Email stored successfully via domain match (account: ${account.id})`);
          return NextResponse.json({
            received: true,
            stored: true,
            matched: { type: "domain", domain: matchedManagedDomain.domain, to: matchedToAddress },
            requestId,
          });
        }
      }

    if (!matchedManagedDomain.tenant_id) {
      console.warn("[Inbound Webhook] Managed domain has no tenant_id and no account_id:", matchedManagedDomain.domain);
      return NextResponse.json({
        received: true,
        stored: false,
        reason: "Managed domain is not associated with a tenant/account",
      });
    }

    await storeInboundMessageForTenant(supabase, matchedManagedDomain.tenant_id, emailData);
    console.log(`[Inbound Webhook ${requestId}] ✓ Email stored successfully via domain-tenant match`);
    return NextResponse.json({
      received: true,
      stored: true,
      matched: { type: "domain-tenant", domain: matchedManagedDomain.domain, to: matchedToAddress },
      requestId,
    });
  } catch (error) {
    console.error(`[Inbound Webhook ${requestId}] ✗ Error:`, error);
    // Return 200 to avoid retry loops
    return NextResponse.json({ 
      received: true, 
      stored: false, 
      error: "Processing error",
      requestId,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface InboundEmailData {
  resendEmailId?: string; // Resend "Receiving" email_id (for fetching full content)
  messageId?: string;
  from: string;
  fromName?: string;
  to: string | string[];
  cc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
  inReplyTo?: string;
  references?: string[];
  attachments?: EmailAttachmentMeta[];
  rawHeaders?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Payload Parsers
// ═══════════════════════════════════════════════════════════════════════════

function parseJsonPayload(body: any): InboundEmailData {
  // Resend inbound webhook format
  if (body.type === "email.received" && body.data) {
    const data = body.data;
    const fromParsed = parseAddressString(data.from);
    return {
      resendEmailId: data.email_id,
      messageId: data.message_id,
      from: fromParsed.email || (data.from?.address || data.from || ""),
      fromName: fromParsed.name || data.from?.name,
      to: (data.to || []).map((t: any) => (typeof t === "string" ? t : t.address || t.email || "")),
      cc: (data.cc || []).map((c: any) => (typeof c === "string" ? c : c.address || c.email || "")),
      subject: data.subject,
      // NOTE: Resend webhooks omit text/html; fetch via receiving API using email_id
      text: data.text,
      html: data.html,
      date: data.date ? new Date(data.date) : undefined,
      inReplyTo: data.in_reply_to,
      references: data.references,
      attachments: data.attachments?.map((a: any) => ({
        filename: a.filename || a.name,
        content_type: a.content_type || a.type,
        size: a.size,
      })),
    };
  }

  // Generic JSON format
  const fromParsed = parseAddressString(body.from);
  return {
    messageId: body.message_id || body.messageId,
    from: fromParsed.email || body.from?.address || body.from,
    fromName: fromParsed.name || body.from?.name || body.fromName,
    to: body.to,
    cc: Array.isArray(body.cc) ? body.cc : body.cc ? [body.cc] : undefined,
    subject: body.subject,
    text: body.text || body.body_text,
    html: body.html || body.body_html,
    date: body.date ? new Date(body.date) : undefined,
    inReplyTo: body.in_reply_to || body.inReplyTo,
    references: body.references,
    attachments: body.attachments,
  };
}

function parseAddressString(input: unknown): { email: string; name?: string } {
  const raw = (input || "").toString().trim();
  if (!raw) return { email: "" };

  // Matches: "Name <email@domain>"
  const m = raw.match(/^(.*?)<([^>]+)>$/);
  if (m) {
    const name = m[1].trim().replace(/^"|"$/g, "");
    const email = m[2].trim().toLowerCase();
    return { email, name: name || undefined };
  }

  // Best-effort extraction of an email within the string
  const em = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (em) return { email: em[0].toLowerCase() };

  return { email: raw.toLowerCase() };
}

function normalizeAddressList(values: Array<string | null | undefined>): string[] {
  return values
    .map((v) => parseAddressString(v).email)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

async function parseFormDataPayload(formData: FormData): Promise<InboundEmailData> {
  const rawEmail = formData.get("email") as string;
  if (rawEmail) {
    return parseRawEmail(rawEmail);
  }

  // Parse individual form fields
  return {
    messageId: formData.get("message_id") as string,
    from: formData.get("from") as string,
    fromName: formData.get("from_name") as string,
    to: formData.get("to") as string,
    cc: formData.get("cc")?.toString().split(",").filter(Boolean),
    subject: formData.get("subject") as string,
    text: formData.get("text") as string,
    html: formData.get("html") as string,
    inReplyTo: formData.get("in_reply_to") as string,
  };
}

async function parseRawEmail(rawEmail: string): Promise<InboundEmailData> {
  const parsed = await simpleParser(rawEmail);

  const getAddress = (addr: any): string => {
    if (!addr) return "";
    if (addr.value && addr.value[0]) return addr.value[0].address || "";
    if (typeof addr === "string") return addr;
    return addr.address || "";
  };

  const getAddresses = (addrs: any): string[] => {
    if (!addrs) return [];
    if (addrs.value) return addrs.value.map((a: any) => a.address || "");
    if (Array.isArray(addrs)) return addrs.map(getAddress);
    return [getAddress(addrs)];
  };

  return {
    messageId: parsed.messageId,
    from: getAddress(parsed.from),
    fromName: parsed.from?.value?.[0]?.name,
    to: getAddresses(parsed.to),
    cc: getAddresses(parsed.cc),
    subject: parsed.subject,
    text: parsed.text,
    html: parsed.html || undefined,
    date: parsed.date,
    inReplyTo: Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo[0] : parsed.inReplyTo,
    references: Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : undefined,
    attachments: parsed.attachments?.map((a) => ({
      filename: a.filename || "attachment",
      content_type: a.contentType,
      size: a.size,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Storage Functions
// ═══════════════════════════════════════════════════════════════════════════

async function storeInboundMessage(
  supabase: any,
  account: any,
  email: InboundEmailData,
  tenantIdOverride?: string
) {
  const tenantId: string | null = tenantIdOverride ?? account?.tenant_id ?? null;
  if (!tenantId) {
    console.error("[Inbound Webhook] Cannot store inbound message without tenant_id", {
      account_id: account?.id,
      managed_domain_tenant_id: tenantIdOverride,
    });
    throw new Error("Missing tenant_id for inbound message");
  }

  // Avoid duplicates on webhook retries
  if (email.messageId) {
    const { data: existing, error: existingError } = await supabase
      .from("email_messages")
      .select("id")
      .eq("account_id", account.id)
      .eq("direction", "inbound")
      .eq("message_id", email.messageId)
      .maybeSingle();

    if (existingError) {
      console.error("[Inbound Webhook] Duplicate-check error:", existingError);
    }

    if (existing) {
      console.log("[Inbound Webhook] Duplicate message ignored:", email.messageId);
      return;
    }
  }

  const toAddresses: EmailAddress[] = (Array.isArray(email.to) ? email.to : [email.to])
    .map((addr) => ({ email: addr }));

  const ccAddresses: EmailAddress[] = (email.cc || []).map((addr) => ({ email: addr }));

  const bodyPreview = (email.text || "").slice(0, 200).replace(/\s+/g, " ").trim();

  // Generate thread_id from references or in-reply-to
  const threadId = email.references?.[0] || email.inReplyTo || email.messageId;

  const { error } = await supabase.from("email_messages").insert({
    tenant_id: tenantId,
    account_id: account.id,
    message_id: email.messageId,
    provider_id: email.messageId, // For inbound, use message_id as provider_id
    thread_id: threadId,
    in_reply_to: email.inReplyTo,
    direction: "inbound",
    from_address: email.from,
    from_name: email.fromName,
    to_addresses: toAddresses,
    cc_addresses: ccAddresses,
    subject: email.subject,
    body_text: email.text,
    body_html: email.html,
    body_preview: bodyPreview,
    attachments: email.attachments || [],
    has_attachments: (email.attachments?.length || 0) > 0,
    status: "received",
    mailbox: "INBOX",
    is_read: false,
    is_starred: false,
    is_archived: false,
    is_deleted: false,
    is_spam: false,
    received_at: email.date?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    console.error("[Inbound Webhook] Failed to insert inbound message:", error);
    throw new Error("Failed to store inbound message");
  }
}

async function storeInboundMessageForTenant(
  supabase: any,
  tenantId: string,
  email: InboundEmailData
) {
  // Find the default managed account for this tenant, or create without account
  const { data: defaultAccount } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("mode", "managed")
    .eq("is_default", true)
    .maybeSingle();

  if (defaultAccount) {
    await storeInboundMessage(supabase, defaultAccount, email);
    return;
  }

  // No default account, store with tenant only (account_id will be null)
  // This requires updating the schema to allow null account_id
  const toAddresses: EmailAddress[] = (Array.isArray(email.to) ? email.to : [email.to])
    .map((addr) => ({ email: addr }));

  const ccAddresses: EmailAddress[] = (email.cc || []).map((addr) => ({ email: addr }));

  const bodyPreview = (email.text || "").slice(0, 200).replace(/\s+/g, " ").trim();

  const threadId = email.references?.[0] || email.inReplyTo || email.messageId;

  const { error } = await supabase.from("email_messages").insert({
    tenant_id: tenantId,
    account_id: null,
    message_id: email.messageId,
    provider_id: email.messageId,
    thread_id: threadId,
    in_reply_to: email.inReplyTo,
    direction: "inbound",
    from_address: email.from,
    from_name: email.fromName,
    to_addresses: toAddresses,
    cc_addresses: ccAddresses,
    subject: email.subject,
    body_text: email.text,
    body_html: email.html,
    body_preview: bodyPreview,
    attachments: email.attachments || [],
    has_attachments: (email.attachments?.length || 0) > 0,
    status: "received",
    mailbox: "INBOX",
    is_read: false,
    received_at: email.date?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    console.error("[Inbound Webhook] Failed to insert tenant-level inbound message:", error);
    throw new Error("Failed to store inbound message (tenant)");
  }
}

// Also handle GET for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    // Echo back challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ status: "ok", endpoint: "inbound email webhook" });
}
