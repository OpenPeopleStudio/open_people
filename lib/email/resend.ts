import { Resend } from "resend";
import type {
  SendEmailRequest,
  SendEmailResponse,
  EmailTemplate,
} from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Resend Email Client
   Modern email API with great deliverability
   ═══════════════════════════════════════════════════════════════════════════ */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const DEFAULT_FROM_NAME = process.env.DEFAULT_FROM_NAME || "OpenPeople";

// Create Resend client
export function createResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(RESEND_API_KEY);
}

// Interpolate template variables
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Get default sender for a tenant
export function getDefaultSender(
  tenantSlug: string,
  customDomain?: string
): string {
  if (customDomain) {
    return `${tenantSlug}@${customDomain}`;
  }
  return `${tenantSlug}@openpeople.ai`;
}

// Send an email
export async function sendEmail(
  tenantId: string | null,
  tenantSlug: string,
  request: SendEmailRequest,
  template?: EmailTemplate | null,
  customDomain?: string
): Promise<SendEmailResponse> {
  try {
    void tenantId;
    const resend = createResendClient();

    // Determine sender
    const fromEmail = request.from || getDefaultSender(tenantSlug, customDomain);
    const fromAddress = `${DEFAULT_FROM_NAME} <${fromEmail}>`;

    // Prepare email content
    let subject = request.subject;
    let html = request.html;
    let text = request.text;

    // If using a template, interpolate variables
    if (template && request.templateVariables) {
      subject = interpolateTemplate(template.subject, request.templateVariables);
      html = interpolateTemplate(template.html_body, request.templateVariables);
      if (template.text_body) {
        text = interpolateTemplate(template.text_body, request.templateVariables);
      }
    }

    // Ensure we have content
    if (!html && !text) {
      return {
        success: false,
        error: "Email must have either HTML or text content",
      };
    }

    // Prepare recipients
    const to = Array.isArray(request.to) ? request.to : [request.to];

    // Send via Resend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPayload: any = {
      from: fromAddress,
      to,
      subject,
      cc: request.cc,
      bcc: request.bcc,
      replyTo: request.replyTo,
      tags: request.tags
        ? Object.entries(request.tags).map(([name, value]) => ({ name, value }))
        : undefined,
    };

    // Add content (html or text)
    if (html) {
      emailPayload.html = html;
    }
    if (text) {
      emailPayload.text = text;
    }

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data?.id
      ? { success: true, emailId: data.id, resendId: data.id }
      : { success: true };
  } catch (error) {
    console.error("Send email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send a batch of emails
export async function sendBatchEmails(
  tenantId: string | null,
  tenantSlug: string,
  requests: SendEmailRequest[],
  customDomain?: string
): Promise<{ success: number; failed: number; results: SendEmailResponse[] }> {
  const results: SendEmailResponse[] = [];
  let success = 0;
  let failed = 0;

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((req) => sendEmail(tenantId, tenantSlug, req, null, customDomain))
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    // Small delay between batches
    if (i + batchSize < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { success, failed, results };
}

// Verify a domain with Resend
export async function verifyDomain(domain: string): Promise<{
  success: boolean;
  domainId?: string;
  dnsRecords?: { type: string; name: string; value: string }[];
  error?: string;
}> {
  try {
    const resend = createResendClient();

    const { data, error } = await resend.domains.create({
      name: domain,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Extract DNS records from response with purpose mapping
    const dnsRecords = data?.records?.map((record) => {
      // Map Resend record names to purposes
      let purpose = "verification";
      const name = record.name.toLowerCase();
      if (name.includes("_domainkey")) {
        purpose = "dkim";
      } else if (name.includes("_dmarc")) {
        purpose = "verification";
      } else if (record.type === "MX") {
        purpose = "mx";
      } else if (record.type === "TXT" && record.value?.includes("spf")) {
        purpose = "spf";
      } else if (name.includes("bounce") || name.includes("mail")) {
        purpose = "return-path";
      }

      return {
        type: record.type,
        name: record.name,
        value: record.value,
        priority: record.priority,
        purpose,
      };
    }) || [];

    return {
      success: true,
      domainId: data?.id,
      dnsRecords: dnsRecords,
    };
  } catch (error) {
    console.error("Verify domain error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check domain verification status
export async function checkDomainStatus(domainId: string): Promise<{
  verified: boolean;
  status: string;
  records?: { type: string; name: string; value: string; status: string }[];
}> {
  try {
    const resend = createResendClient();

    const { data, error } = await resend.domains.get(domainId);

    if (error) {
      return {
        verified: false,
        status: "error",
      };
    }

    const records = data?.records?.map((record) => ({
      type: record.type,
      name: record.name,
      value: record.value,
      status: record.status,
    }));

    return {
      verified: data?.status === "verified",
      status: data?.status || "unknown",
      records,
    };
  } catch (error) {
    console.error("Check domain status error:", error);
    return {
      verified: false,
      status: "error",
    };
  }
}

// Delete a domain from Resend
export async function deleteDomain(domainId: string): Promise<boolean> {
  try {
    const resend = createResendClient();
    await resend.domains.remove(domainId);
    return true;
  } catch (error) {
    console.error("Delete domain error:", error);
    return false;
  }
}

// Get email delivery status (for webhook processing)
export function parseWebhookEvent(payload: unknown): {
  type: string;
  emailId: string;
  timestamp: string;
  data: Record<string, unknown>;
} | null {
  try {
    const event = payload as {
      type: string;
      data: { email_id: string; created_at: string; [key: string]: unknown };
    };

    if (!event.type || !event.data?.email_id) {
      return null;
    }

    return {
      type: event.type,
      emailId: event.data.email_id,
      timestamp: event.data.created_at,
      data: event.data,
    };
  } catch {
    return null;
  }
}

// Map Resend webhook event type to our status
export function mapWebhookEventToStatus(
  eventType: string
): "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | null {
  const mapping: Record<string, "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained"> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };
  return mapping[eventType] || null;
}
