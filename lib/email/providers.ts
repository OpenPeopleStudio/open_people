/**
 * Unified Email Provider
 * 
 * Provides a unified interface for sending and receiving emails
 * across different protocols (SMTP, IMAP, POP3, Resend, Managed).
 * 
 * Managed mode: DNS-only setup where we handle send/receive via our infrastructure.
 * Users only need to add DNS records (DKIM/SPF/MX) - no SMTP/IMAP credentials.
 */

import type {
  EmailAccount,
  EmailProvider,
  ComposeEmailRequest,
  EmailMessage,
  EmailDirection,
  ManagedEmailDomain,
} from "@/types/email";
import { isManagedAccount } from "@/types/email";
import { sendEmail as sendResendEmail } from "./resend";
import { sendSMTPEmail, verifySMTPConnection, type SMTPConfig } from "./smtp";
import { fetchIMAPEmails, verifyIMAPConnection, type IMAPConfig, type ParsedEmailMessage } from "./imap";
import { fetchPOP3Emails, verifyPOP3Connection, type POP3Config } from "./pop3";
import { decryptCredential } from "./encryption";

export interface SendResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  error?: string;
}

export interface FetchResult {
  success: boolean;
  messages: ParsedEmailMessage[];
  lastUID?: string;
  error?: string;
}

/**
 * Get SMTP config from account
 */
export function getSMTPConfig(account: any): SMTPConfig | null {
  if (!account.smtp_host || !account.smtp_user) return null;
  
  let password = "";
  if (account.smtp_password_encrypted && account.smtp_password_iv) {
    password = decryptCredential({
      encrypted: account.smtp_password_encrypted,
      iv: account.smtp_password_iv,
    });
  }
  
  return {
    host: account.smtp_host,
    port: account.smtp_port || 587,
    secure: account.smtp_secure ?? true,
    user: account.smtp_user,
    password,
    fromAddress: account.email_address,
    fromName: account.name,
  };
}

/**
 * Get IMAP config from account
 */
export function getIMAPConfig(account: any): IMAPConfig | null {
  if (!account.imap_host || !account.imap_user) return null;
  
  let password = "";
  if (account.imap_password_encrypted && account.imap_password_iv) {
    password = decryptCredential({
      encrypted: account.imap_password_encrypted,
      iv: account.imap_password_iv,
    });
  }
  
  return {
    host: account.imap_host,
    port: account.imap_port || 993,
    secure: account.imap_secure ?? true,
    user: account.imap_user,
    password,
  };
}

/**
 * Get POP3 config from account
 */
export function getPOP3Config(account: any): POP3Config | null {
  if (!account.pop3_host || !account.pop3_user) return null;
  
  let password = "";
  if (account.pop3_password_encrypted && account.pop3_password_iv) {
    password = decryptCredential({
      encrypted: account.pop3_password_encrypted,
      iv: account.pop3_password_iv,
    });
  }
  
  return {
    host: account.pop3_host,
    port: account.pop3_port || 995,
    tls: account.pop3_secure ?? true,
    user: account.pop3_user,
    password,
  };
}

/**
 * Send an email using the appropriate provider
 */
export async function sendEmailWithProvider(
  account: any,
  tenantId: string | null,
  tenantSlug: string,
  request: ComposeEmailRequest,
  managedDomain?: ManagedEmailDomain | null
): Promise<SendResult> {
  const provider = account.provider as EmailProvider;
  
  // Handle managed mode - use Resend with the verified custom domain
  if (isManagedAccount(account) || provider === "managed") {
    return sendManagedEmail(account, tenantId, tenantSlug, request, managedDomain);
  }
  
  switch (provider) {
    case "smtp":
    case "smtp_imap": {
      const smtpConfig = getSMTPConfig(account);
      if (!smtpConfig) {
        return { success: false, error: "SMTP not configured" };
      }
      const result = await sendSMTPEmail(smtpConfig, request);
      return {
        success: result.success,
        messageId: result.messageId,
        providerId: result.messageId,
        error: result.error,
      };
    }
    
    case "resend": {
      // Resend accounts must have a verified domain configured
      if (!account.resend_domain) {
        return { 
          success: false, 
          error: "No domain configured for this Resend account. Please edit the account and set a verified domain." 
        };
      }
      
      // Determine the from address
      // If email_address contains @, use it directly; otherwise construct from domain
      let fromAddress = account.email_address;
      if (!fromAddress.includes("@")) {
        // email_address is just a domain, construct a proper email
        fromAddress = `noreply@${account.resend_domain}`;
      }
      
      // Use existing Resend integration
      const to = Array.isArray(request.to) ? request.to : [request.to];
      const result = await sendResendEmail(
        tenantId,
        tenantSlug,
        {
          to,
          subject: request.subject,
          html: request.body_html,
          text: request.body_text,
          replyTo: request.reply_to,
          cc: request.cc,
          bcc: request.bcc,
          from: fromAddress, // Use account's email address
        },
        null,
        account.resend_domain
      );
      return {
        success: result.success,
        messageId: result.emailId,
        providerId: result.resendId,
        error: result.error,
      };
    }
    
    default:
      return { success: false, error: `Unsupported provider: ${provider}` };
  }
}

/**
 * Send email via managed mode (DNS-only setup)
 * Uses Resend as the underlying provider with the verified custom domain
 */
async function sendManagedEmail(
  account: any,
  tenantId: string | null,
  tenantSlug: string,
  request: ComposeEmailRequest,
  managedDomain?: ManagedEmailDomain | null
): Promise<SendResult> {
  // For managed accounts, we use Resend with the custom domain
  // The domain must be verified before sending
  const domain = managedDomain?.domain || account.resend_domain;
  
  if (!domain) {
    return { 
      success: false, 
      error: "No domain configured for managed account. Please add DNS records and verify your domain." 
    };
  }
  
  if (managedDomain && managedDomain.status !== "verified") {
    return {
      success: false,
      error: `Domain ${domain} is not verified. Current status: ${managedDomain.status}. Please verify your DNS records.`,
    };
  }
  
  const to = Array.isArray(request.to) ? request.to : [request.to];
  
  // Send via Resend with the custom domain
  const result = await sendResendEmail(
    tenantId,
    tenantSlug,
    {
      to,
      subject: request.subject,
      html: request.body_html,
      text: request.body_text,
      replyTo: request.reply_to,
      cc: request.cc,
      bcc: request.bcc,
    },
    null,
    domain
  );
  
  return {
    success: result.success,
    messageId: result.emailId,
    providerId: result.resendId,
    error: result.error,
  };
}

/**
 * Fetch emails from inbox
 */
export async function fetchInboxEmails(
  account: any,
  options: { limit?: number; since?: Date; sinceUID?: string; mailbox?: string; includeRead?: boolean } = {}
): Promise<FetchResult> {
  const provider = account.provider as EmailProvider;
  
  // For managed accounts, inbox is populated via webhooks (not fetch)
  if (isManagedAccount(account) || provider === "managed") {
    // Return empty - managed accounts receive emails via inbound webhook
    return { 
      success: true, 
      messages: [],
      // Note: Managed accounts receive emails via webhook, not polling
    };
  }
  
  switch (provider) {
    case "imap":
    case "smtp_imap": {
      const imapConfig = getIMAPConfig(account);
      if (!imapConfig) {
        return { success: false, messages: [], error: "IMAP not configured" };
      }
      return await fetchIMAPEmails(imapConfig, {
        limit: options.limit,
        since: options.since,
        sinceUID: options.sinceUID,
        mailbox: options.mailbox,
        includeRead: options.includeRead,
      });
    }
    
    case "pop3": {
      const pop3Config = getPOP3Config(account);
      if (!pop3Config) {
        return { success: false, messages: [], error: "POP3 not configured" };
      }
      return await fetchPOP3Emails(pop3Config, {
        limit: options.limit,
      });
    }
    
    case "resend":
      // Resend doesn't support inbox - it's send-only
      return { success: true, messages: [] };
    
    default:
      return { success: false, messages: [], error: `Unsupported provider: ${provider}` };
  }
}

export interface ConnectionTestResult {
  success: boolean;
  smtpOk?: boolean;
  imapOk?: boolean;
  pop3Ok?: boolean;
  managedOk?: boolean;
  domainVerified?: boolean;
  error?: string;
}

/**
 * Test connection for an account
 */
export async function testAccountConnection(
  account: any,
  managedDomain?: ManagedEmailDomain | null
): Promise<ConnectionTestResult> {
  const provider = account.provider as EmailProvider;
  const result: ConnectionTestResult = { success: true };
  
  // Test managed account - check domain verification status
  if (isManagedAccount(account) || provider === "managed") {
    if (!managedDomain) {
      result.success = false;
      result.managedOk = false;
      result.error = "No domain configured for managed account";
      return result;
    }
    
    result.domainVerified = managedDomain.status === "verified";
    result.managedOk = result.domainVerified;
    
    if (!result.domainVerified) {
      result.success = false;
      result.error = `Domain not verified. Status: ${managedDomain.status}. Please add the required DNS records.`;
    }
    
    return result;
  }
  
  // Test SMTP if configured
  if (provider === "smtp" || provider === "smtp_imap") {
    const smtpConfig = getSMTPConfig(account);
    if (smtpConfig) {
      const smtpResult = await verifySMTPConnection(smtpConfig);
      result.smtpOk = smtpResult.success;
      if (!smtpResult.success) {
        result.success = false;
        result.error = `SMTP: ${smtpResult.error}`;
      }
    }
  }
  
  // Test IMAP if configured
  if (provider === "imap" || provider === "smtp_imap") {
    const imapConfig = getIMAPConfig(account);
    if (imapConfig) {
      const imapResult = await verifyIMAPConnection(imapConfig);
      result.imapOk = imapResult.success;
      if (!imapResult.success) {
        result.success = false;
        result.error = result.error 
          ? `${result.error}; IMAP: ${imapResult.error}`
          : `IMAP: ${imapResult.error}`;
      }
    }
  }
  
  // Test POP3 if configured
  if (provider === "pop3") {
    const pop3Config = getPOP3Config(account);
    if (pop3Config) {
      const pop3Result = await verifyPOP3Connection(pop3Config);
      result.pop3Ok = pop3Result.success;
      if (!pop3Result.success) {
        result.success = false;
        result.error = `POP3: ${pop3Result.error}`;
      }
    }
  }
  
  return result;
}

/**
 * Convert parsed email message to database format
 */
export function parsedMessageToDbFormat(
  parsed: ParsedEmailMessage,
  accountId: string,
  tenantId: string,
  direction: EmailDirection = "inbound"
): Partial<EmailMessage> {
  return {
    tenant_id: tenantId,
    account_id: accountId,
    message_id: parsed.messageId,
    provider_id: parsed.uid,
    thread_id: parsed.references?.[0] || parsed.inReplyTo || parsed.messageId,
    in_reply_to: parsed.inReplyTo,
    direction,
    from_address: parsed.from.email,
    from_name: parsed.from.name,
    to_addresses: parsed.to,
    cc_addresses: parsed.cc,
    reply_to: parsed.replyTo?.email,
    subject: parsed.subject,
    body_text: parsed.bodyText,
    body_html: parsed.bodyHtml,
    body_preview: parsed.bodyPreview,
    attachments: parsed.attachments,
    has_attachments: parsed.hasAttachments,
    status: direction === "inbound" ? "received" : "sent",
    mailbox: parsed.mailbox,
    is_read: parsed.flags.includes("\\Seen"),
    is_starred: parsed.flags.includes("\\Flagged"),
    is_deleted: parsed.flags.includes("\\Deleted"),
    received_at: parsed.date?.toISOString(),
    sent_at: direction === "outbound" ? parsed.date?.toISOString() : undefined,
  };
}
