import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { emailWorkspace } from "./workspace";

/* ═══════════════════════════════════════════════════════════════════════════
   OAuth Email Providers
   Gmail (Google) and Outlook (Microsoft) OAuth integration
   ═══════════════════════════════════════════════════════════════════════════ */

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

export class EmailOAuthService {
  private supabase = createSupabaseAdmin();

  /**
   * Gmail OAuth Integration
   */
  async syncGmailAccount(accountId: string): Promise<{ success: boolean; synced?: number; error?: string }> {
    console.log(`[OAuth] Starting Gmail sync for account: ${accountId}`);

    try {
      const account = await this.getAccountWithTokens(accountId);

      if (!account || account.provider !== "gmail") {
        return { success: false, error: "Invalid Gmail account" };
      }

      // Check if tokens are still valid
      if (this.isTokenExpired(account.oauth_expires_at)) {
        const refreshed = await this.refreshGmailTokens(account);
        if (!refreshed) {
          return { success: false, error: "Failed to refresh Gmail tokens" };
        }
      }

      const synced = await this.performGmailSync(account);
      return { success: true, synced };

    } catch (error) {
      console.error(`[OAuth] Gmail sync failed for account ${accountId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Outlook OAuth Integration
   */
  async syncOutlookAccount(accountId: string): Promise<{ success: boolean; synced?: number; error?: string }> {
    console.log(`[OAuth] Starting Outlook sync for account: ${accountId}`);

    try {
      const account = await this.getAccountWithTokens(accountId);

      if (!account || account.provider !== "outlook") {
        return { success: false, error: "Invalid Outlook account" };
      }

      // Check if tokens are still valid
      if (this.isTokenExpired(account.oauth_expires_at)) {
        const refreshed = await this.refreshOutlookTokens(account);
        if (!refreshed) {
          return { success: false, error: "Failed to refresh Outlook tokens" };
        }
      }

      const synced = await this.performOutlookSync(account);
      return { success: true, synced };

    } catch (error) {
      console.error(`[OAuth] Outlook sync failed for account ${accountId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Generate Gmail OAuth URL
   */
  generateGmailAuthUrl(state: string): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/gmail/callback`
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify", // For marking as read
    ];

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state,
    });
  }

  /**
   * Generate Outlook OAuth URL
   */
  generateOutlookAuthUrl(state: string): string {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/outlook/callback`;

    const scopes = [
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/Mail.ReadWrite", // For marking as read
      "offline_access", // For refresh tokens
    ];

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes.join(" "))}&` +
      `state=${encodeURIComponent(state)}`;

    return authUrl;
  }

  /**
   * Handle Gmail OAuth callback
   */
  async handleGmailCallback(code: string, state: string): Promise<{
    success: boolean;
    accountId?: string;
    error?: string;
  }> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/gmail/callback`
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user profile
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: "me" });

      const emailAddress = profile.data.emailAddress;
      if (!emailAddress) {
        return { success: false, error: "Could not get Gmail address" };
      }

      // Parse state to get tenant info
      const stateData = JSON.parse(state);
      const { tenantId, userId } = stateData;

      // Create or update account
      const accountData = {
        tenant_id: tenantId,
        name: `${emailAddress} (Gmail)`,
        email_address: emailAddress,
        provider: "gmail",
        mode: "custom",
        is_default: false,
        is_active: true,
        sync_enabled: true,
        sync_interval_minutes: 5,
        oauth_access_token: tokens.access_token,
        oauth_refresh_token: tokens.refresh_token,
        oauth_expires_at: tokens.expiry_date,
        oauth_token_type: tokens.token_type,
        created_by: userId,
      };

      const { data: account, error } = await this.supabase
        .from("email_accounts")
        .upsert(accountData, { onConflict: "tenant_id,email_address" })
        .select()
        .single();

      if (error) {
        console.error("Error creating Gmail account:", error);
        return { success: false, error: error.message };
      }

      return { success: true, accountId: account.id };

    } catch (error) {
      console.error("Gmail OAuth callback error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Handle Outlook OAuth callback
   */
  async handleOutlookCallback(code: string, state: string): Promise<{
    success: boolean;
    accountId?: string;
    error?: string;
  }> {
    try {
      const clientId = process.env.OUTLOOK_CLIENT_ID;
      const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/outlook/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Outlook token exchange failed:", {
          status: tokenResponse.status,
          error: tokens?.error,
          error_description: tokens?.error_description,
          trace_id: tokens?.trace_id,
          correlation_id: tokens?.correlation_id,
        });
        return { success: false, error: "Failed to get Outlook tokens" };
      }

      // Get user profile
      const client = Client.init({
        authProvider: (done) => {
          done(null, tokens.access_token);
        },
      });

      const user = await client.api("/me").get();

      // Parse state to get tenant info
      const stateData = JSON.parse(state);
      const { tenantId, userId } = stateData;

      // Create or update account
      const accountData = {
        tenant_id: tenantId,
        name: `${user.mail} (Outlook)`,
        email_address: user.mail,
        provider: "outlook",
        mode: "custom",
        is_default: false,
        is_active: true,
        sync_enabled: true,
        sync_interval_minutes: 5,
        oauth_access_token: tokens.access_token,
        oauth_refresh_token: tokens.refresh_token,
        oauth_expires_at: Date.now() + (tokens.expires_in * 1000),
        oauth_token_type: tokens.token_type,
        created_by: userId,
      };

      const { data: account, error } = await this.supabase
        .from("email_accounts")
        .upsert(accountData, { onConflict: "tenant_id,email_address" })
        .select()
        .single();

      if (error) {
        console.error("Error creating Outlook account:", error);
        return { success: false, error: error.message };
      }

      return { success: true, accountId: account.id };

    } catch (error) {
      console.error("Outlook OAuth callback error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Private helper methods
   */
  private async getAccountWithTokens(accountId: string): Promise<any> {
    const { data: account } = await this.supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    return account;
  }

  private isTokenExpired(expiresAt?: number): boolean {
    if (!expiresAt) return true;
    // Add 5 minute buffer
    return Date.now() >= (expiresAt - 5 * 60 * 1000);
  }

  private async refreshGmailTokens(account: any): Promise<boolean> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: account.oauth_refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      const newTokens = credentials;

      // Update tokens in database
      await this.supabase
        .from("email_accounts")
        .update({
          oauth_access_token: newTokens.access_token,
          oauth_expires_at: newTokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      return true;

    } catch (error) {
      console.error("Failed to refresh Gmail tokens:", error);
      return false;
    }
  }

  private async refreshOutlookTokens(account: any): Promise<boolean> {
    try {
      const clientId = process.env.OUTLOOK_CLIENT_ID;
      const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: account.oauth_refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Outlook token refresh failed:", {
          status: tokenResponse.status,
          error: tokens?.error,
          error_description: tokens?.error_description,
          trace_id: tokens?.trace_id,
          correlation_id: tokens?.correlation_id,
        });
        return false;
      }

      // Update tokens in database
      await this.supabase
        .from("email_accounts")
        .update({
          oauth_access_token: tokens.access_token,
          oauth_refresh_token: tokens.refresh_token || account.oauth_refresh_token,
          oauth_expires_at: Date.now() + (tokens.expires_in * 1000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      return true;

    } catch (error) {
      console.error("Failed to refresh Outlook tokens:", error);
      return false;
    }
  }

  private async performGmailSync(account: any): Promise<number> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: account.oauth_access_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get recent messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
      q: "newer_than:1d", // Last day
    });

    let processed = 0;

    if (response.data.messages) {
      for (const message of response.data.messages) {
        try {
          // Check if already processed
          const existing = await this.supabase
            .from("email_messages")
            .select("id")
            .eq("provider_id", message.id)
            .single();

          if (existing.data) continue;

          // Get full message
          const fullMessage = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          });

          const emailData = this.parseGmailMessage(fullMessage.data);

          // Process through workspace
          const webhookPayload = {
            type: "email.received",
            data: emailData,
          };

          const result = await emailWorkspace.processInboundWebhook(
            webhookPayload,
            "gmail-oauth-signature",
            "dummy-secret"
          );

          if (result.success) processed++;

        } catch (error) {
          console.error(`Error processing Gmail message ${message.id}:`, error);
        }
      }
    }

    return processed;
  }

  private async performOutlookSync(account: any): Promise<number> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, account.oauth_access_token);
      },
    });

    // Get recent messages
    const messages = await client
      .api("/me/messages")
      .filter("receivedDateTime ge 2024-01-01T00:00:00Z") // Last day
      .top(50)
      .orderby("receivedDateTime desc")
      .get();

    let processed = 0;

    for (const message of messages.value) {
      try {
        // Check if already processed
        const existing = await this.supabase
          .from("email_messages")
          .select("id")
          .eq("provider_id", message.id)
          .single();

        if (existing.data) continue;

        const emailData = this.parseOutlookMessage(message);

        // Process through workspace
        const webhookPayload = {
          type: "email.received",
          data: emailData,
        };

        const result = await emailWorkspace.processInboundWebhook(
          webhookPayload,
          "outlook-oauth-signature",
          "dummy-secret"
        );

        if (result.success) processed++;

      } catch (error) {
        console.error(`Error processing Outlook message ${message.id}:`, error);
      }
    }

    return processed;
  }

  private parseGmailMessage(message: any): any {
    // Parse Gmail message format - simplified implementation
    const headers = message.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value;

    return {
      email_id: message.id,
      message_id: getHeader("Message-ID") || message.id,
      from: getHeader("From"),
      to: [getHeader("To")].filter(Boolean),
      subject: getHeader("Subject"),
      text: message.snippet,
      created_at: new Date(parseInt(message.internalDate)).toISOString(),
    };
  }

  private parseOutlookMessage(message: any): any {
    // Parse Outlook message format
    return {
      email_id: message.id,
      message_id: message.internetMessageId || message.id,
      from: message.sender?.emailAddress?.address,
      to: message.toRecipients?.map((r: any) => r.emailAddress.address) || [],
      subject: message.subject,
      text: message.bodyPreview,
      created_at: message.receivedDateTime,
    };
  }
}

// Export singleton instance
export const emailOAuth = new EmailOAuthService();
