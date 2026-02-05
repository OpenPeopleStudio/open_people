/**
 * IMAP Email Adapter
 * 
 * Fetch and sync emails via IMAP using imapflow.
 */

import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";
import type { EmailAddress, EmailAttachmentMeta } from "@/types/email";

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface IMAPFetchOptions {
  mailbox?: string;
  limit?: number;
  since?: Date;
  sinceUID?: string;
  markSeen?: boolean;
  /** If true, fetch all emails including already-read ones. Default is false (unread only). */
  includeRead?: boolean;
}

export interface IMAPFetchResult {
  success: boolean;
  messages: ParsedEmailMessage[];
  lastUID?: string;
  error?: string;
}

export interface ParsedEmailMessage {
  uid: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  bodyPreview?: string;
  attachments: EmailAttachmentMeta[];
  hasAttachments: boolean;
  date?: Date;
  flags: string[];
  mailbox: string;
  rawHeaders?: Record<string, string>;
}

/**
 * Create an IMAP client
 */
export function createIMAPClient(config: IMAPConfig): ImapFlow {
  return new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    logger: false,
  });
}

/**
 * Verify IMAP connection
 */
export async function verifyIMAPConnection(config: IMAPConfig): Promise<{ success: boolean; error?: string }> {
  const client = createIMAPClient(config);
  
  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * List available mailboxes
 */
export async function listMailboxes(config: IMAPConfig): Promise<{ name: string; path: string; specialUse?: string }[]> {
  const client = createIMAPClient(config);
  
  try {
    await client.connect();
    const mailboxes = await client.list();
    await client.logout();
    
    return mailboxes.map((mb) => ({
      name: mb.name,
      path: mb.path,
      ...(mb.specialUse ? { specialUse: mb.specialUse } : {}),
    }));
  } catch (error) {
    console.error("List mailboxes error:", error);
    throw error;
  }
}

/**
 * Fetch emails from IMAP
 */
export async function fetchIMAPEmails(
  config: IMAPConfig,
  options: IMAPFetchOptions = {}
): Promise<IMAPFetchResult> {
  const client = createIMAPClient(config);
  const messages: ParsedEmailMessage[] = [];
  let lastUID: string | undefined;
  let connected = false;
  
  try {
    await client.connect();
    connected = true;
    
    const mailbox = options.mailbox || "INBOX";
    const lock = await client.getMailboxLock(mailbox);
    
    try {
      // Build search query
      // By default, only fetch unread emails. Set includeRead: true to fetch all.
      let searchQuery: Record<string, unknown> = options.includeRead ? {} : { seen: false };
      
      if (options.since) {
        searchQuery = { ...searchQuery, since: options.since };
      }
      
      if (options.sinceUID) {
        // Combine sinceUID with other search criteria instead of replacing
        searchQuery = { ...searchQuery, uid: `${options.sinceUID}:*` };
      }
      
      // Fetch messages
      const limit = options.limit || 50;
      let count = 0;
      
      for await (const message of client.fetch(searchQuery, {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
      })) {
        if (count >= limit) break;
        
        try {
          // Parse the email
          if (!message.source) continue;
          const parsed = await simpleParser(message.source);
          const emailMessage = parseMailToMessage(parsed, message.uid.toString(), mailbox, message.flags || new Set());
          messages.push(emailMessage);
          lastUID = message.uid.toString();
          
          // Mark as seen if requested
          if (options.markSeen) {
            await client.messageFlagsAdd(message.uid.toString(), ["\\Seen"], { uid: true });
          }
        } catch (parseError) {
          console.error("Parse email error:", parseError);
        }
        
        count++;
      }
    } finally {
      lock.release();
    }
    
    return {
      success: true,
      messages,
      ...(lastUID ? { lastUID } : {}),
    };
  } catch (error) {
    console.error("IMAP fetch error:", error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  } finally {
    if (connected) {
      try {
        await client.logout();
      } catch (logoutError) {
        console.error("IMAP logout error:", logoutError);
      }
    }
  }
}

/**
 * Fetch a single email by UID
 */
export async function fetchIMAPEmailByUID(
  config: IMAPConfig,
  uid: string,
  mailbox: string = "INBOX"
): Promise<ParsedEmailMessage | null> {
  const client = createIMAPClient(config);
  let connected = false;
  
  try {
    await client.connect();
    connected = true;
    const lock = await client.getMailboxLock(mailbox);
    
    try {
      for await (const message of client.fetch(uid, {
        envelope: true,
        source: true,
        uid: true,
        flags: true,
      }, { uid: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        return parseMailToMessage(parsed, uid, mailbox, message.flags || new Set());
      }
    } finally {
      lock.release();
    }
    
    return null;
  } catch (error) {
    console.error("IMAP fetch by UID error:", error);
    return null;
  } finally {
    if (connected) {
      try {
        await client.logout();
      } catch (logoutError) {
        console.error("IMAP logout error:", logoutError);
      }
    }
  }
}

/**
 * Mark messages as read
 */
export async function markIMAPMessagesRead(
  config: IMAPConfig,
  uids: string[],
  mailbox: string = "INBOX"
): Promise<boolean> {
  const client = createIMAPClient(config);
  let connected = false;
  
  try {
    await client.connect();
    connected = true;
    const lock = await client.getMailboxLock(mailbox);
    
    try {
      for (const uid of uids) {
        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
      }
    } finally {
      lock.release();
    }
    
    return true;
  } catch (error) {
    console.error("Mark read error:", error);
    return false;
  } finally {
    if (connected) {
      try {
        await client.logout();
      } catch (logoutError) {
        console.error("IMAP logout error:", logoutError);
      }
    }
  }
}

/**
 * Move messages to a different mailbox
 */
export async function moveIMAPMessages(
  config: IMAPConfig,
  uids: string[],
  fromMailbox: string,
  toMailbox: string
): Promise<boolean> {
  const client = createIMAPClient(config);
  
  try {
    await client.connect();
    const lock = await client.getMailboxLock(fromMailbox);
    
    try {
      await client.messageMove(uids.join(","), toMailbox, { uid: true });
    } finally {
      lock.release();
    }
    
    await client.logout();
    return true;
  } catch (error) {
    console.error("Move messages error:", error);
    return false;
  }
}

/**
 * Delete messages (move to Trash)
 */
export async function deleteIMAPMessages(
  config: IMAPConfig,
  uids: string[],
  mailbox: string = "INBOX"
): Promise<boolean> {
  const client = createIMAPClient(config);
  
  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);
    
    try {
      // Add deleted flag and expunge
      for (const uid of uids) {
        await client.messageFlagsAdd(uid, ["\\Deleted"], { uid: true });
      }
      await client.messageDelete(uids.join(","), { uid: true });
    } finally {
      lock.release();
    }
    
    await client.logout();
    return true;
  } catch (error) {
    console.error("Delete messages error:", error);
    return false;
  }
}

/**
 * Parse mailparser output to our message format
 */
function parseMailToMessage(
  parsed: ParsedMail,
  uid: string,
  mailbox: string,
  flags: Set<string>
): ParsedEmailMessage {
  // Parse addresses
  const from = parseAddress(parsed.from);
  const to = parseAddresses(parsed.to);
  const cc = parsed.cc ? parseAddresses(parsed.cc) : undefined;
  const bcc = parsed.bcc ? parseAddresses(parsed.bcc) : undefined;
  const replyTo = parsed.replyTo ? parseAddress(parsed.replyTo) : undefined;
  
  // Extract body preview
  const bodyText = parsed.text || "";
  const bodyPreview = bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
  
  // Parse attachments
  const attachments: EmailAttachmentMeta[] = (parsed.attachments || []).map((att) => {
    const meta: EmailAttachmentMeta = {
      filename: att.filename || "attachment",
    };
    if (att.contentType) {
      meta.content_type = att.contentType;
    }
    if (att.size !== undefined) {
      meta.size = att.size;
    }
    return meta;
  });
  
  // Parse references for threading
  let inReplyTo: string | undefined;
  let references: string[] | undefined;
  
  if (parsed.inReplyTo) {
    inReplyTo = Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo[0] : parsed.inReplyTo;
  }
  
  if (parsed.references) {
    references = Array.isArray(parsed.references) ? parsed.references : [parsed.references];
  }
  
  const emailMessage: ParsedEmailMessage = {
    uid,
    from,
    to,
    bodyText,
    bodyPreview,
    attachments,
    hasAttachments: attachments.length > 0,
    flags: Array.from(flags),
    mailbox,
    ...(parsed.messageId ? { messageId: parsed.messageId } : {}),
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(references ? { references } : {}),
    ...(cc && cc.length > 0 ? { cc } : {}),
    ...(bcc && bcc.length > 0 ? { bcc } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(parsed.subject ? { subject: parsed.subject } : {}),
    ...(parsed.html ? { bodyHtml: parsed.html } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
  };

  return emailMessage;
}

/**
 * Parse a single address
 */
type AddressValue = { address?: string | undefined; name?: string | undefined };
type AddressLike =
  | { value?: AddressValue[]; address?: string | undefined; name?: string | undefined }
  | AddressValue
  | string
  | null
  | undefined;

function parseAddress(addr: AddressLike): EmailAddress {
  if (!addr) return { email: "unknown@unknown.com" };
  
  if (typeof addr === "object" && addr && "value" in addr) {
    const value = (addr as { value?: AddressValue[] }).value;
    if (!value || !value[0]) return { email: "unknown@unknown.com" };
    const name = value[0].name;
    return name
      ? { email: value[0].address || "", name }
      : { email: value[0].address || "" };
  }
  
  if (typeof addr === "string") {
    return { email: addr };
  }
  
  if (typeof addr === "object" && addr) {
    const name = (addr as AddressValue).name;
    return name
      ? { email: (addr as AddressValue).address || "", name }
      : { email: (addr as AddressValue).address || "" };
  }

  return { email: "unknown@unknown.com" };
}

/**
 * Parse multiple addresses
 */
function parseAddresses(addrs: AddressLike | AddressLike[]): EmailAddress[] {
  if (!addrs) return [];
  
  if (typeof addrs === "object" && addrs && "value" in addrs) {
    const value = (addrs as { value?: AddressValue[] }).value || [];
    return value.map((a) => {
      const name = a.name;
      return name ? { email: a.address || "", name } : { email: a.address || "" };
    });
  }
  
  if (Array.isArray(addrs)) {
    return addrs.map((a) => parseAddress(a));
  }
  
  return [parseAddress(addrs)];
}
