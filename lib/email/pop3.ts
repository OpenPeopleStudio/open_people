/**
 * POP3 Email Adapter
 * 
 * Fetch emails via POP3 using node-pop3.
 */

import Pop3Command from "node-pop3";
import { simpleParser } from "mailparser";
import type { EmailAddress, EmailAttachmentMeta } from "@/types/email";
import type { ParsedEmailMessage } from "./imap";

export interface POP3Config {
  host: string;
  port: number;
  tls: boolean;
  user: string;
  password: string;
}

export interface POP3FetchOptions {
  limit?: number;
  deleteAfterFetch?: boolean;
}

export interface POP3FetchResult {
  success: boolean;
  messages: ParsedEmailMessage[];
  error?: string;
}

/**
 * Create a POP3 client
 */
function createPOP3Client(config: POP3Config): Pop3Command {
  return new Pop3Command({
    host: config.host,
    port: config.port,
    tls: config.tls,
    user: config.user,
    password: config.password,
    timeout: 30000,
  });
}

/**
 * Verify POP3 connection
 */
export async function verifyPOP3Connection(config: POP3Config): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createPOP3Client(config);
    await client.connect();
    await client.QUIT();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Fetch emails from POP3
 */
export async function fetchPOP3Emails(
  config: POP3Config,
  options: POP3FetchOptions = {}
): Promise<POP3FetchResult> {
  const messages: ParsedEmailMessage[] = [];
  
  try {
    const client = createPOP3Client(config);
    await client.connect();
    
    // Get list of messages
    const list = await client.LIST();
    const limit = options.limit || 50;
    const messageCount = Math.min(list.length, limit);
    
    // Fetch messages (newest first, POP3 lists oldest first)
    for (let i = list.length; i > list.length - messageCount && i > 0; i--) {
      try {
        const rawMessage = await client.RETR(i);
        const parsed = await simpleParser(rawMessage);
        
        const emailMessage = parseMailToPOP3Message(parsed, i.toString());
        messages.push(emailMessage);
        
        // Optionally delete after fetch
        if (options.deleteAfterFetch) {
          await client.DELE(i);
        }
      } catch (parseError) {
        console.error("Parse POP3 email error:", parseError);
      }
    }
    
    await client.QUIT();
    
    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error("POP3 fetch error:", error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

/**
 * Get message count
 */
export async function getPOP3MessageCount(config: POP3Config): Promise<number> {
  try {
    const client = createPOP3Client(config);
    await client.connect();
    const stat = await client.STAT();
    await client.QUIT();
    // STAT returns a string like "+OK 5 12345" where 5 is count and 12345 is size
    if (typeof stat === "string") {
      const match = stat.match(/\+OK\s+(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return (stat as { count?: number }).count || 0;
  } catch (error) {
    console.error("POP3 stat error:", error);
    return 0;
  }
}

/**
 * Parse mailparser output for POP3
 */
function parseMailToPOP3Message(
  parsed: any,
  messageNumber: string
): ParsedEmailMessage {
  const from = parseAddress(parsed.from);
  const to = parseAddresses(parsed.to);
  const cc = parsed.cc ? parseAddresses(parsed.cc) : undefined;
  const replyTo = parsed.replyTo ? parseAddress(parsed.replyTo) : undefined;
  
  const bodyText = parsed.text || "";
  const bodyPreview = bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
  
  const attachments: EmailAttachmentMeta[] = (parsed.attachments || []).map((att: any) => ({
    filename: att.filename || "attachment",
    content_type: att.contentType,
    size: att.size,
  }));
  
  let inReplyTo: string | undefined;
  if (parsed.inReplyTo) {
    inReplyTo = Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo[0] : parsed.inReplyTo;
  }
  
  return {
    uid: messageNumber,
    messageId: parsed.messageId,
    inReplyTo,
    from,
    to,
    cc,
    replyTo,
    subject: parsed.subject,
    bodyText,
    bodyHtml: parsed.html || undefined,
    bodyPreview,
    attachments,
    hasAttachments: attachments.length > 0,
    date: parsed.date,
    flags: [],
    mailbox: "INBOX",
  };
}

function parseAddress(addr: any): EmailAddress {
  if (!addr) return { email: "unknown@unknown.com" };
  
  if (addr.value && addr.value[0]) {
    return {
      email: addr.value[0].address || "",
      name: addr.value[0].name,
    };
  }
  
  return { email: addr.address || "", name: addr.name };
}

function parseAddresses(addrs: any): EmailAddress[] {
  if (!addrs) return [];
  
  if (addrs.value) {
    return addrs.value.map((a: any) => ({
      email: a.address || "",
      name: a.name,
    }));
  }
  
  if (Array.isArray(addrs)) {
    return addrs.map((a) => parseAddress(a));
  }
  
  return [parseAddress(addrs)];
}
