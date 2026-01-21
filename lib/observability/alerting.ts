/**
 * Security Alerting System
 *
 * Monitors for security events and sends alerts through various channels.
 * Integrates with logging system and supports multiple notification methods.
 */

import { logSecurity } from './logger';
import { createSupabaseAdmin } from '@/lib/supabase/server';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertChannel {
  LOG = 'log',
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  event: string;
  context: Record<string, any>;
  timestamp: Date;
  tenantId?: string;
  userId?: string;
  ipAddress?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  eventPattern: string; // Regex pattern to match events
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
  cooldownMinutes?: number; // Prevent alert spam
  conditions?: Record<string, any>; // Additional conditions
}

/**
 * Default alert rules for common security events
 */
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'failed_login_attempts',
    name: 'Multiple Failed Login Attempts',
    eventPattern: 'failed_login',
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.LOG, AlertChannel.EMAIL],
    enabled: true,
    cooldownMinutes: 15,
    conditions: { count_threshold: 5 },
  },
  {
    id: 'vault_unlock_from_unknown_ip',
    name: 'Vault Unlocked from Unknown IP',
    eventPattern: 'vault_unlock',
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.LOG, AlertChannel.EMAIL, AlertChannel.SMS],
    enabled: true,
    cooldownMinutes: 5,
  },
  {
    id: 'suspicious_file_access',
    name: 'Suspicious File Access Pattern',
    eventPattern: 'file_access',
    severity: AlertSeverity.MEDIUM,
    channels: [AlertChannel.LOG],
    enabled: true,
    conditions: { suspicious_patterns: ['password', 'secret', 'key'] },
  },
  {
    id: 'admin_privilege_escalation',
    name: 'Admin Privilege Escalation',
    eventPattern: 'privilege_escalation',
    severity: AlertSeverity.CRITICAL,
    channels: [AlertChannel.LOG, AlertChannel.EMAIL, AlertChannel.SMS],
    enabled: true,
  },
  {
    id: 'unusual_api_activity',
    name: 'Unusual API Activity',
    eventPattern: 'api_rate_limit_exceeded',
    severity: AlertSeverity.HIGH,
    channels: [AlertChannel.LOG, AlertChannel.EMAIL],
    enabled: true,
    cooldownMinutes: 10,
  },
];

/**
 * Alert Manager Class
 */
export class AlertManager {
  private rules: AlertRule[] = [...DEFAULT_ALERT_RULES];
  private recentAlerts: Map<string, Date> = new Map();

  /**
   * Process a security event and trigger alerts if needed
   */
  async processSecurityEvent(
    event: string,
    context: Record<string, any> = {},
    severity?: AlertSeverity
  ): Promise<void> {
    // Log the security event first
    logSecurity(event, severity || AlertSeverity.LOW, context);

    // Check if any rules match this event
    const matchingRules = this.rules.filter(rule =>
      rule.enabled && new RegExp(rule.eventPattern).test(event)
    );

    for (const rule of matchingRules) {
      // Check cooldown
      const cooldownKey = `${rule.id}_${context.tenantId || 'global'}`;
      const lastAlert = this.recentAlerts.get(cooldownKey);

      if (lastAlert && rule.cooldownMinutes) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue; // Still in cooldown
        }
      }

      // Check additional conditions
      if (rule.conditions && !this.checkConditions(context, rule.conditions)) {
        continue;
      }

      // Create and send alert
      const alert: SecurityAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: rule.name,
        description: this.generateAlertDescription(event, context),
        severity: rule.severity,
        event,
        context,
        timestamp: new Date(),
        tenantId: context.tenantId,
        userId: context.userId,
        ipAddress: context.ipAddress,
      };

      await this.sendAlert(alert, rule.channels);

      // Update cooldown
      this.recentAlerts.set(cooldownKey, new Date());

      // Clean up old cooldowns (older than 24 hours)
      for (const [key, timestamp] of this.recentAlerts.entries()) {
        if (Date.now() - timestamp.getTime() > 24 * 60 * 60 * 1000) {
          this.recentAlerts.delete(key);
        }
      }
    }
  }

  /**
   * Manually trigger an alert
   */
  async triggerAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<void> {
    const fullAlert: SecurityAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
    };

    // Determine channels based on severity
    const channels = this.getDefaultChannelsForSeverity(alert.severity);

    await this.sendAlert(fullAlert, channels);
  }

  /**
   * Add or update an alert rule
   */
  addRule(rule: AlertRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  /**
   * Send alert through specified channels
   */
  private async sendAlert(alert: SecurityAlert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case AlertChannel.LOG:
            await this.sendToLog(alert);
            break;
          case AlertChannel.EMAIL:
            await this.sendToEmail(alert);
            break;
          case AlertChannel.SMS:
            await this.sendToSms(alert);
            break;
          case AlertChannel.SLACK:
            await this.sendToSlack(alert);
            break;
          case AlertChannel.WEBHOOK:
            await this.sendToWebhook(alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error);
      }
    }

    // Store alert in database for audit purposes
    await this.storeAlertInDatabase(alert);
  }

  private async sendToLog(alert: SecurityAlert): Promise<void> {
    console.warn(`[SECURITY ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`);
    console.warn(`Description: ${alert.description}`);
    console.warn(`Context:`, alert.context);
  }

  private async sendToEmail(alert: SecurityAlert): Promise<void> {
    // TODO: Implement email sending
    // This could use Resend, SendGrid, or another email service
    console.log(`[ALERT EMAIL] Would send email for: ${alert.title}`);

    // Example implementation:
    // const emailService = new EmailService();
    // await emailService.sendSecurityAlert(alert);
  }

  private async sendToSms(alert: SecurityAlert): Promise<void> {
    // TODO: Implement SMS sending
    // This could use Twilio or another SMS service
    console.log(`[ALERT SMS] Would send SMS for: ${alert.title}`);

    // Example implementation:
    // const smsService = new SmsService();
    // await smsService.sendSecurityAlert(alert);
  }

  private async sendToSlack(alert: SecurityAlert): Promise<void> {
    // TODO: Implement Slack integration
    console.log(`[ALERT SLACK] Would send Slack message for: ${alert.title}`);

    // Example implementation:
    // const slackWebhookUrl = process.env.SLACK_SECURITY_WEBHOOK;
    // await fetch(slackWebhookUrl, { ... });
  }

  private async sendToWebhook(alert: SecurityAlert): Promise<void> {
    // TODO: Implement generic webhook
    console.log(`[ALERT WEBHOOK] Would send webhook for: ${alert.title}`);

    // Example implementation:
    // const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
    // await fetch(webhookUrl, { ... });
  }

  private async storeAlertInDatabase(alert: SecurityAlert): Promise<void> {
    try {
      const supabase = await createSupabaseAdmin();

      // Create security_alerts table if it doesn't exist
      // This would be done via migration in production

      await supabase
        .from('security_alerts')
        .insert({
          id: alert.id,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          event: alert.event,
          context: alert.context,
          tenant_id: alert.tenantId,
          user_id: alert.userId,
          ip_address: alert.ipAddress,
          created_at: alert.timestamp.toISOString(),
        });

    } catch (error) {
      console.error('Failed to store alert in database:', error);
    }
  }

  private checkConditions(context: Record<string, any>, conditions: Record<string, any>): boolean {
    // Simple condition checking - can be extended for more complex logic
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = context[key];
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  private generateAlertDescription(event: string, context: Record<string, any>): string {
    const descriptions: Record<string, string> = {
      failed_login: `Multiple failed login attempts detected for user ${context.userId || 'unknown'} from IP ${context.ipAddress || 'unknown'}`,
      vault_unlock: `Vault was unlocked from IP ${context.ipAddress || 'unknown'} at ${new Date().toISOString()}`,
      privilege_escalation: `Privilege escalation detected for user ${context.userId || 'unknown'}`,
      api_rate_limit_exceeded: `API rate limit exceeded for IP ${context.ipAddress || 'unknown'}`,
    };

    return descriptions[event] || `Security event: ${event}`;
  }

  private getDefaultChannelsForSeverity(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return [AlertChannel.LOG, AlertChannel.EMAIL, AlertChannel.SMS];
      case AlertSeverity.HIGH:
        return [AlertChannel.LOG, AlertChannel.EMAIL];
      case AlertSeverity.MEDIUM:
        return [AlertChannel.LOG];
      default:
        return [AlertChannel.LOG];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Global Alert Manager Instance
// ═══════════════════════════════════════════════════════════════════════════

export const alertManager = new AlertManager();

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick alert function for common security events
 */
export async function alertSecurityEvent(
  event: string,
  context: Record<string, any> = {},
  severity: AlertSeverity = AlertSeverity.MEDIUM
): Promise<void> {
  await alertManager.processSecurityEvent(event, context, severity);
}

/**
 * Alert for failed authentication attempts
 */
export async function alertFailedLogin(
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await alertSecurityEvent('failed_login', {
    userId,
    ipAddress,
    userAgent,
  }, AlertSeverity.LOW);
}

/**
 * Alert for successful vault unlock
 */
export async function alertVaultUnlock(
  vaultId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  await alertSecurityEvent('vault_unlock', {
    vaultId,
    userId,
    ipAddress,
  }, AlertSeverity.MEDIUM);
}

/**
 * Alert for suspicious activity
 */
export async function alertSuspiciousActivity(
  activity: string,
  context: Record<string, any>
): Promise<void> {
  await alertSecurityEvent('suspicious_activity', {
    activity,
    ...context,
  }, AlertSeverity.HIGH);
}