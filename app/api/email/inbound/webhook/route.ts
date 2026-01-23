import { NextRequest, NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import type { EmailAttachmentMeta } from "@/types/email";
import { createResendClient } from "@/lib/email/resend";
import { emailWorkspace } from "@/lib/email/workspace";

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
  
  try {
    // Verify webhook signature if configured
    const sharedSecretSignature = request.headers.get("x-webhook-signature");
    const svixSignature = request.headers.get("svix-signature");
    console.log(`[Inbound Webhook ${requestId}] Signatures present`);
    
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
      console.log(`[Inbound Webhook ${requestId}] JSON payload parsed`);
      emailData = parseJsonPayload(body);
    } else if (contentType.includes("multipart/form-data")) {
      // Form data payload (e.g., forwarded email)
      const formData = await request.formData();
      emailData = await parseFormDataPayload(formData);
    } else if (contentType.includes("message/rfc822") || contentType.includes("text/plain")) {
      // Raw email payload
      const rawEmail = await request.text();
      emailData = await parseRawEmail(rawEmail);
    } else {
      console.log(`[Inbound Webhook ${requestId}] Unsupported content type: ${contentType}`);
      return NextResponse.json({ error: "Unsupported content type", requestId }, { status: 400 });
    }

    console.log(`[Inbound Webhook ${requestId}] Parsed email summary`);

    const normalizedFrom = parseAddressString(emailData.from).email;
    const normalizedTo = normalizeAddressList(
      Array.isArray(emailData.to) ? emailData.to : [emailData.to]
    );

    if (!normalizedFrom || normalizedTo.length === 0) {
      console.log(`[Inbound Webhook ${requestId}] Missing required fields`);
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
          const received = data as ResendReceivedEmail;
          if (received.text) {
            emailData.text = received.text;
          }
          if (received.html) {
            emailData.html = received.html;
          }
          if (received.headers) {
            emailData.rawHeaders = received.headers;
          }
        }
      } catch (e) {
        console.error("[Inbound Webhook] Failed to fetch Resend received email content:", e);
        // Continue storing metadata-only message
      }
    }

    // Convert emailData to the format expected by EmailWorkspaceService
    const webhookPayload = {
      type: contentType.includes("application/json") ? "email.received" : "email.raw",
      data: {
        ...(emailData.resendEmailId ? { email_id: emailData.resendEmailId } : {}),
        ...(emailData.messageId ? { message_id: emailData.messageId } : {}),
        from: emailData.fromName ? `${emailData.fromName} <${emailData.from}>` : emailData.from,
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        ...(emailData.cc && emailData.cc.length > 0 ? { cc: emailData.cc } : {}),
        ...(emailData.subject ? { subject: emailData.subject } : {}),
        ...(emailData.text ? { text: emailData.text } : {}),
        ...(emailData.html ? { html: emailData.html } : {}),
        created_at: emailData.date?.toISOString() || new Date().toISOString(),
        ...(emailData.attachments && emailData.attachments.length > 0
          ? { attachments: emailData.attachments }
          : {}),
        ...(emailData.inReplyTo ? { in_reply_to: emailData.inReplyTo } : {}),
        ...(emailData.references && emailData.references.length > 0
          ? { references: emailData.references }
          : {}),
      },
    };

    // Get webhook secret from environment (could be per-tenant in the future)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || process.env.INBOUND_WEBHOOK_SECRET || "";

    // Process with EmailWorkspaceService
    const result = await emailWorkspace.processInboundWebhook(
      webhookPayload,
      request.headers.get("svix-signature") || request.headers.get("x-webhook-signature") || "",
      webhookSecret
    );

    if (result.success) {
      console.log(`[Inbound Webhook ${requestId}] ✓ Email processed successfully`);
      return NextResponse.json({
        received: true,
        stored: true,
        threadId: result.threadId,
        messageId: result.messageId,
        requestId,
      });
    } else {
      console.log(`[Inbound Webhook ${requestId}] ✗ Email processing failed`);
      return NextResponse.json({
        received: true,
        stored: false,
        error: result.error,
        requestId,
      }, { status: 400 });
    }
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

type ResendReceivedEmail = {
  text?: string;
  html?: string;
  headers?: Record<string, string>;
};

type ResendWebhookAddress = string | { address?: string; email?: string; name?: string };

type ResendWebhookAttachment = {
  filename?: string;
  name?: string;
  content_type?: string;
  type?: string;
  size?: number;
};

type ResendWebhookData = {
  email_id?: string;
  message_id?: string;
  from?: ResendWebhookAddress;
  to?: ResendWebhookAddress[];
  cc?: ResendWebhookAddress[];
  subject?: string;
  text?: string;
  html?: string;
  date?: string;
  in_reply_to?: string;
  references?: string[];
  attachments?: ResendWebhookAttachment[];
};

type ResendWebhookPayload = {
  type?: string;
  data?: ResendWebhookData;
};

type AddressValue = { address?: string | undefined; name?: string | undefined };
type AddressLike =
  | { value?: AddressValue[]; address?: string | undefined; name?: string | undefined }
  | AddressValue
  | string
  | null
  | undefined;

// ═══════════════════════════════════════════════════════════════════════════
// Payload Parsers
// ═══════════════════════════════════════════════════════════════════════════

function parseJsonPayload(body: unknown): InboundEmailData {
  // Resend inbound webhook format
  const payload = (typeof body === "object" && body !== null) ? (body as ResendWebhookPayload) : null;
  if (payload?.type === "email.received" && payload.data) {
    const data = payload.data;
    const fromParsed = parseAddressString(data.from);
    const toList = (data.to || [])
      .map((t) => (typeof t === "string" ? t : t.address || t.email || ""))
      .filter(Boolean);
    const ccList = (data.cc || [])
      .map((c) => (typeof c === "string" ? c : c.address || c.email || ""))
      .filter(Boolean);
    const attachments = data.attachments?.map((a) => {
      const meta: EmailAttachmentMeta = {
        filename: a.filename || a.name || "attachment",
      };
      const contentType = a.content_type || a.type;
      if (contentType) {
        meta.content_type = contentType;
      }
      if (a.size !== undefined) {
        meta.size = a.size;
      }
      return meta;
    });

    const fromValue = data.from;
    const fallbackFrom =
      typeof fromValue === "string"
        ? fromValue
        : fromValue?.address || fromValue?.email || "";

    const parsed: InboundEmailData = {
      ...(data.email_id ? { resendEmailId: data.email_id } : {}),
      ...(data.message_id ? { messageId: data.message_id } : {}),
      from: fromParsed.email || fallbackFrom,
      to: toList,
    };
    const fromName =
      fromParsed.name ||
      (typeof fromValue === "object" && fromValue ? fromValue.name : undefined);
    if (fromName) {
      parsed.fromName = fromName;
    }
    if (ccList.length > 0) {
      parsed.cc = ccList;
    }
    if (data.subject) {
      parsed.subject = data.subject;
    }
    if (data.text) {
      parsed.text = data.text;
    }
    if (data.html) {
      parsed.html = data.html;
    }
    if (data.date) {
      parsed.date = new Date(data.date);
    }
    if (data.in_reply_to) {
      parsed.inReplyTo = data.in_reply_to;
    }
    if (data.references) {
      parsed.references = data.references;
    }
    if (attachments?.length) {
      parsed.attachments = attachments;
    }
    return parsed;
  }

  // Generic JSON format
  const genericBody =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const fromParsed = parseAddressString(genericBody.from);
  const fromRecord =
    typeof genericBody.from === "object" && genericBody.from !== null
      ? (genericBody.from as Record<string, unknown>)
      : null;
  const fromFallback =
    fromRecord && typeof fromRecord.address === "string"
      ? fromRecord.address
      : typeof genericBody.from === "string"
        ? genericBody.from
        : "";
  const toValue = genericBody.to;
  const to = Array.isArray(toValue)
    ? toValue
        .map((value) => (typeof value === "string" ? value : parseAddressString(value).email))
        .filter(Boolean)
    : typeof toValue === "string"
      ? toValue
      : parseAddressString(toValue).email;

  const generic: InboundEmailData = {
    ...(genericBody.message_id || genericBody.messageId
      ? { messageId: (genericBody.message_id || genericBody.messageId) as string }
      : {}),
    from: fromParsed.email || fromFallback,
    to,
  };
  const fromName =
    fromParsed.name ||
    (fromRecord && typeof fromRecord.name === "string" ? fromRecord.name : undefined) ||
    (typeof genericBody.fromName === "string" ? genericBody.fromName : undefined);
  if (fromName) {
    generic.fromName = fromName;
  }
  const ccValue = genericBody.cc;
  const cc = Array.isArray(ccValue)
    ? ccValue
        .map((value) => (typeof value === "string" ? value : parseAddressString(value).email))
        .filter(Boolean)
    : ccValue
      ? [typeof ccValue === "string" ? ccValue : parseAddressString(ccValue).email].filter(Boolean)
      : [];
  if (cc.length > 0) {
    generic.cc = cc;
  }
  if (typeof genericBody.subject === "string") {
    generic.subject = genericBody.subject;
  }
  const text =
    typeof genericBody.text === "string"
      ? genericBody.text
      : typeof genericBody.body_text === "string"
        ? genericBody.body_text
        : undefined;
  if (text) {
    generic.text = text;
  }
  const html =
    typeof genericBody.html === "string"
      ? genericBody.html
      : typeof genericBody.body_html === "string"
        ? genericBody.body_html
        : undefined;
  if (html) {
    generic.html = html;
  }
  if (typeof genericBody.date === "string") {
    generic.date = new Date(genericBody.date);
  }
  const inReplyTo =
    typeof genericBody.in_reply_to === "string"
      ? genericBody.in_reply_to
      : typeof genericBody.inReplyTo === "string"
        ? genericBody.inReplyTo
        : undefined;
  if (inReplyTo) {
    generic.inReplyTo = inReplyTo;
  }
  if (Array.isArray(genericBody.references)) {
    generic.references = genericBody.references as string[];
  }
  if (Array.isArray(genericBody.attachments)) {
    generic.attachments = genericBody.attachments as EmailAttachmentMeta[];
  }
  return generic;
}

function parseAddressString(input: unknown): { email: string; name?: string } {
  const raw = (input || "").toString().trim();
  if (!raw) return { email: "" };

  // Matches: "Name <email@domain>"
  const m = raw.match(/^(.*?)<([^>]+)>$/);
  if (m) {
    const name = m[1].trim().replace(/^"|"$/g, "");
    const email = m[2].trim().toLowerCase();
    return name ? { email, name } : { email };
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
  const messageId = formData.get("message_id")?.toString();
  const from = formData.get("from")?.toString() || "";
  const fromName = formData.get("from_name")?.toString();
  const to = formData.get("to")?.toString() || "";
  const cc = formData.get("cc")?.toString().split(",").filter(Boolean) || [];
  const subject = formData.get("subject")?.toString();
  const text = formData.get("text")?.toString();
  const html = formData.get("html")?.toString();
  const inReplyTo = formData.get("in_reply_to")?.toString();

  const parsed: InboundEmailData = {
    from,
    to,
    ...(messageId ? { messageId } : {}),
  };
  if (fromName) {
    parsed.fromName = fromName;
  }
  if (cc.length > 0) {
    parsed.cc = cc;
  }
  if (subject) {
    parsed.subject = subject;
  }
  if (text) {
    parsed.text = text;
  }
  if (html) {
    parsed.html = html;
  }
  if (inReplyTo) {
    parsed.inReplyTo = inReplyTo;
  }
  return parsed;
}

async function parseRawEmail(rawEmail: string): Promise<InboundEmailData> {
  const parsed = await simpleParser(rawEmail);

  const getAddress = (addr: AddressLike): string => {
    if (!addr) return "";
    if (typeof addr === "object" && addr && "value" in addr) {
      const value = (addr as { value?: AddressValue[] }).value;
      if (value && value[0]) return value[0].address || "";
    }
    if (typeof addr === "string") return addr;
    if (typeof addr === "object" && addr && "address" in addr) {
      return (addr as AddressValue).address || "";
    }
    return "";
  };

  const getAddresses = (addrs: AddressLike | AddressLike[]): string[] => {
    if (!addrs) return [];
    if (typeof addrs === "object" && addrs && "value" in addrs) {
      const value = (addrs as { value?: AddressValue[] }).value;
      if (value) return value.map((a) => a.address || "");
    }
    if (Array.isArray(addrs)) return addrs.map(getAddress);
    return [getAddress(addrs)];
  };

  const rawTo = getAddresses(parsed.to);
  const rawCc = getAddresses(parsed.cc);
  const rawRefs = Array.isArray(parsed.references)
    ? parsed.references
    : parsed.references
      ? [parsed.references]
      : [];
  const attachments = parsed.attachments?.map((a) => ({
    filename: a.filename || "attachment",
    content_type: a.contentType,
    size: a.size,
  }));

  const parsedEmail: InboundEmailData = {
    from: getAddress(parsed.from),
    to: rawTo,
    ...(parsed.messageId ? { messageId: parsed.messageId } : {}),
  };
  if (parsed.from?.value?.[0]?.name) {
    parsedEmail.fromName = parsed.from.value[0].name;
  }
  if (rawCc.length > 0) {
    parsedEmail.cc = rawCc;
  }
  if (parsed.subject) {
    parsedEmail.subject = parsed.subject;
  }
  if (parsed.text) {
    parsedEmail.text = parsed.text;
  }
  if (parsed.html) {
    parsedEmail.html = parsed.html;
  }
  if (parsed.date) {
    parsedEmail.date = parsed.date;
  }
  const inReplyTo = Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo[0] : parsed.inReplyTo;
  if (inReplyTo) {
    parsedEmail.inReplyTo = inReplyTo;
  }
  if (rawRefs.length > 0) {
    parsedEmail.references = rawRefs;
  }
  if (attachments?.length) {
    parsedEmail.attachments = attachments;
  }
  return parsedEmail;
}

// ═══════════════════════════════════════════════════════════════════════════
// Storage Functions
// ═══════════════════════════════════════════════════════════════════════════

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
