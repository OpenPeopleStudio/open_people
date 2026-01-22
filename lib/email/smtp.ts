/**
 * SMTP Email Adapter
 * 
 * Send emails via SMTP using nodemailer.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { ComposeEmailRequest } from "@/types/email";

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  fromName?: string;
}

export interface SMTPSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Create an SMTP transporter
 */
export function createSMTPTransporter(config: SMTPConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    // Connection timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 30000,
  });
}

/**
 * Verify SMTP connection
 */
export async function verifySMTPConnection(config: SMTPConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createSMTPTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Send an email via SMTP
 */
export async function sendSMTPEmail(
  config: SMTPConfig,
  request: ComposeEmailRequest
): Promise<SMTPSendResult> {
  try {
    const transporter = createSMTPTransporter(config);
    
    // Prepare recipients
    const to = Array.isArray(request.to) ? request.to.join(", ") : request.to;
    const cc = request.cc?.join(", ");
    const bcc = request.bcc?.join(", ");
    
    // Prepare attachments
    const attachments = request.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
      contentType: att.content_type,
    }));
    
    // Build the email
    const mailOptions: nodemailer.SendMailOptions = {
      from: config.fromName 
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to,
      cc,
      bcc,
      subject: request.subject,
      html: request.body_html,
      text: request.body_text,
      replyTo: request.reply_to,
      inReplyTo: request.in_reply_to,
      references: request.in_reply_to ? [request.in_reply_to] : undefined,
      attachments,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("SMTP send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Send failed",
    };
  }
}

/**
 * Parse email addresses from a string
 */
export function parseEmailAddresses(input: string): { email: string; name?: string }[] {
  const results: { email: string; name?: string }[] = [];
  
  // Simple regex to match "Name <email>" or just "email"
  const regex = /(?:"?([^"<]*)"?\s*)?<?([^<>\s,]+@[^<>\s,]+)>?/g;
  let match;
  
  while ((match = regex.exec(input)) !== null) {
    const name = match[1]?.trim();
    const email = match[2]?.trim();
    if (email) {
      results.push(name ? { email, name } : { email });
    }
  }
  
  return results;
}

/**
 * Format email addresses for display
 */
export function formatEmailAddress(address: { email: string; name?: string }): string {
  if (address.name) {
    return `"${address.name}" <${address.email}>`;
  }
  return address.email;
}
