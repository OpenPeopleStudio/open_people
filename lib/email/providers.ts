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
  EmailProvider,
  ComposeEmailRequest,
  EmailMessage,
  EmailDirection,
  ManagedEmailDomain,
} from "@/types/email";
import { sendEmail as sendResendEmail } from "./resend";
import { sendSMTPEmail, verifySMTPConnection, type SMTPConfig } from "./smtp";
import {
  fetchIMAPEmails,
  verifyIMAPConnection,
  type IMAPConfig,
  type IMAPFetchOptions,
  type ParsedEmailMessage,
} from "./imap";
import {
  fetchPOP3Emails,
  verifyPOP3Connection,
  type POP3Config,
  type POP3FetchOptions,
} from "./pop3";
import { decryptCredential } from "./encryption";

type EmailAccountConfig = {
  provider?: string | null;
  mode?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | null;
  smtp_user?: string | null;
  smtp_password_encrypted?: string | null;
  smtp_password_iv?: string | null;
  imap_host?: string | null;
  imap_port?: number | null;
  imap_secure?: boolean | null;
  imap_user?: string | null;
  imap_password_encrypted?: string | null;
  imap_password_iv?: string | null;
  pop3_host?: string | null;
  pop3_port?: number | null;
  pop3_secure?: boolean | null;
  pop3_user?: string | null;
  pop3_password_encrypted?: string | null;
  pop3_password_iv?: string | null;
  email_address?: string | null;
  name?: string | null;
  resend_domain?: string | null;
};

function isManagedAccountConfig(account: EmailAccountConfig): boolean {
  return account.mode === "managed" || account.provider === "managed";
}

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
export function getSMTPConfig(account: EmailAccountConfig): SMTPConfig | null {
  if (!account.smtp_host || !account.smtp_user || !account.email_address) return null;
  
  let password = "";
  if (account.smtp_password_encrypted && account.smtp_password_iv) {
    password = decryptCredential({
      encrypted: account.smtp_password_encrypted,
      iv: account.smtp_password_iv,
    });
  }
  
  const config: SMTPConfig = {
    host: account.smtp_host,
    port: account.smtp_port || 587,
    secure: account.smtp_secure ?? true,
    user: account.smtp_user,
    password,
    fromAddress: account.email_address,
  };
  if (account.name) {
    config.fromName = account.name;
  }
  return config;
}

/**
 * Get IMAP config from account
 */
export function getIMAPConfig(account: EmailAccountConfig): IMAPConfig | null {
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
export function getPOP3Config(account: EmailAccountConfig): POP3Config | null {
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
  account: EmailAccountConfig,
  tenantId: string | null,
  tenantSlug: string,
  request: ComposeEmailRequest,
  managedDomain?: ManagedEmailDomain | null
): Promise<SendResult> {
  const provider = account.provider as EmailProvider;
  
  // Handle managed mode - use Resend with the verified custom domain
  if (isManagedAccountConfig(account) || provider === "managed") {
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
      const response: SendResult = { success: result.success };
      if (result.messageId) {
        response.messageId = result.messageId;
        response.providerId = result.messageId;
      }
      if (result.error) {
        response.error = result.error;
      }
      return response;
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
      let fromAddress = account.email_address ?? "";
      if (!fromAddress.includes("@")) {
        // email_address is just a domain, construct a proper email
        fromAddress = `noreply@${account.resend_domain}`;
      }
      
      // Use existing Resend integration
      const to = Array.isArray(request.to) ? request.to : [request.to];
      const resendRequest: ComposeEmailRequest = {
        ...request,
        to,
      };

      const resendPayload = {
        to,
        subject: resendRequest.subject,
        ...(resendRequest.body_html ? { html: resendRequest.body_html } : {}),
        ...(resendRequest.body_text ? { text: resendRequest.body_text } : {}),
        ...(resendRequest.reply_to ? { replyTo: resendRequest.reply_to } : {}),
        ...(resendRequest.cc && resendRequest.cc.length > 0
          ? { cc: resendRequest.cc }
          : {}),
        ...(resendRequest.bcc && resendRequest.bcc.length > 0
          ? { bcc: resendRequest.bcc }
          : {}),
        from: fromAddress, // Use account's email address
      };

      const result = await sendResendEmail(
        tenantId,
        tenantSlug,
        resendPayload,
        null,
        account.resend_domain
      );
      const response: SendResult = { success: result.success };
      if (result.emailId) {
        response.messageId = result.emailId;
      }
      if (result.resendId) {
        response.providerId = result.resendId;
      }
      if (result.error) {
        response.error = result.error;
      }
      return response;
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
  account: EmailAccountConfig,
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
  const resendPayload = {
    to,
    subject: request.subject,
    ...(request.body_html ? { html: request.body_html } : {}),
    ...(request.body_text ? { text: request.body_text } : {}),
    ...(request.reply_to ? { replyTo: request.reply_to } : {}),
    ...(request.cc && request.cc.length > 0 ? { cc: request.cc } : {}),
    ...(request.bcc && request.bcc.length > 0 ? { bcc: request.bcc } : {}),
  };

  const result = await sendResendEmail(
    tenantId,
    tenantSlug,
    resendPayload,
    null,
    domain
  );
  
  const response: SendResult = { success: result.success };
  if (result.emailId) {
    response.messageId = result.emailId;
  }
  if (result.resendId) {
    response.providerId = result.resendId;
  }
  if (result.error) {
    response.error = result.error;
  }
  return response;
}

/**
 * Fetch emails from inbox
 */
export async function fetchInboxEmails(
  account: EmailAccountConfig,
  options: { limit?: number; since?: Date; sinceUID?: string; mailbox?: string; includeRead?: boolean } = {}
): Promise<FetchResult> {
  const provider = account.provider as EmailProvider;
  
  // For managed accounts, inbox is populated via webhooks (not fetch)
  if (isManagedAccountConfig(account) || provider === "managed") {
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
      const imapOptions: IMAPFetchOptions = {
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
        ...(options.since ? { since: options.since } : {}),
        ...(options.sinceUID ? { sinceUID: options.sinceUID } : {}),
        ...(options.mailbox ? { mailbox: options.mailbox } : {}),
        ...(options.includeRead !== undefined ? { includeRead: options.includeRead } : {}),
      };
      return await fetchIMAPEmails(imapConfig, imapOptions);
    }
    
    case "pop3": {
      const pop3Config = getPOP3Config(account);
      if (!pop3Config) {
        return { success: false, messages: [], error: "POP3 not configured" };
      }
      const pop3Options: POP3FetchOptions = {
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
      };
      return await fetchPOP3Emails(pop3Config, pop3Options);
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
  account: EmailAccountConfig,
  managedDomain?: ManagedEmailDomain | null
): Promise<ConnectionTestResult> {
  const provider = account.provider as EmailProvider;
  const result: ConnectionTestResult = { success: true };
  
  // Test managed account - check domain verification status
  if (isManagedAccountConfig(account) || provider === "managed") {
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
  const payload: Partial<EmailMessage> = {
    tenant_id: tenantId,
    account_id: accountId,
    provider_id: parsed.uid,
    direction,
    from_address: parsed.from.email,
    to_addresses: parsed.to,
    attachments: parsed.attachments,
    has_attachments: parsed.hasAttachments,
    status: direction === "inbound" ? "received" : "sent",
    mailbox: parsed.mailbox,
    is_read: parsed.flags.includes("\\Seen"),
    is_starred: parsed.flags.includes("\\Flagged"),
    is_deleted: parsed.flags.includes("\\Deleted"),
  };

  if (parsed.messageId) {
    payload.message_id = parsed.messageId;
  }

  const threadId = parsed.references?.[0] || parsed.inReplyTo || parsed.messageId;
  if (threadId) {
    payload.thread_id = threadId;
  }

  if (parsed.inReplyTo) {
    payload.in_reply_to = parsed.inReplyTo;
  }

  if (parsed.from.name) {
    payload.from_name = parsed.from.name;
  }

  if (parsed.cc && parsed.cc.length > 0) {
    payload.cc_addresses = parsed.cc;
  }

  if (parsed.replyTo?.email) {
    payload.reply_to = parsed.replyTo.email;
  }

  if (parsed.subject) {
    payload.subject = parsed.subject;
  }

  if (parsed.bodyText !== undefined) {
    payload.body_text = parsed.bodyText;
  }

  if (parsed.bodyHtml) {
    payload.body_html = parsed.bodyHtml;
  }

  if (parsed.bodyPreview !== undefined) {
    payload.body_preview = parsed.bodyPreview;
  }

  if (parsed.date) {
    payload.received_at = parsed.date.toISOString();
    if (direction === "outbound") {
      payload.sent_at = parsed.date.toISOString();
    }
  }

  return payload;
}
