import twilio from "twilio";
import type { SendNotificationResponse } from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Twilio SMS Client
   Send SMS notifications via Twilio
   ═══════════════════════════════════════════════════════════════════════════ */

// Platform-level Twilio credentials (fallback)
const PLATFORM_TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const PLATFORM_TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const PLATFORM_TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || "";

export type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

// Create Twilio client with tenant or platform credentials
export function createTwilioClient(
  credentials?: TwilioCredentials | null
): twilio.Twilio {
  const sid = credentials?.accountSid || PLATFORM_TWILIO_SID;
  const token = credentials?.authToken || PLATFORM_TWILIO_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials not configured");
  }

  return twilio(sid, token);
}

// Get the from number to use
export function getFromNumber(credentials?: TwilioCredentials | null): string {
  return credentials?.fromNumber || PLATFORM_TWILIO_FROM;
}

// Send SMS via Twilio
export async function sendSMS(
  to: string,
  body: string,
  credentials?: TwilioCredentials | null
): Promise<SendNotificationResponse> {
  try {
    const client = createTwilioClient(credentials);
    const from = getFromNumber(credentials);

    if (!from) {
      return {
        success: false,
        error: "No from number configured",
      };
    }

    // Normalize phone number
    const normalizedTo = normalizePhoneNumber(to);

    const message = await client.messages.create({
      to: normalizedTo,
      from,
      body,
    });

    return {
      success: true,
      providerId: message.sid,
    };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// Normalize phone number to E.164 format
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If starts with country code, ensure + prefix
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If 10 digits (US), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already has +, return as-is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Default: add + prefix
  return `+${digits}`;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Basic E.164 validation: + followed by 10-15 digits
  return /^\+[1-9]\d{9,14}$/.test(normalized);
}

// Parse Twilio webhook status
export function parseTwilioStatus(
  status: string
): "queued" | "sent" | "delivered" | "failed" {
  switch (status.toLowerCase()) {
    case "queued":
    case "accepted":
      return "queued";
    case "sending":
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "undelivered":
    case "failed":
      return "failed";
    default:
      return "sent";
  }
}

// Get message status from Twilio
export async function getMessageStatus(
  messageSid: string,
  credentials?: TwilioCredentials | null
): Promise<{ status: string; errorCode?: number; errorMessage?: string }> {
  try {
    const client = createTwilioClient(credentials);
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      errorCode: message.errorCode || undefined,
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error) {
    console.error("Get message status error:", error);
    return { status: "unknown" };
  }
}
