import { db } from '@/db';
import { 
  notificationChannels, 
  alertDeliveries, 
  userNotificationPreferences,
  notificationTemplates,
  type NotificationChannel,
  type AlertDelivery,
  type Alert
} from '@/db/schema';
import { and, eq, desc, gte, lte, or } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';
import crypto from 'crypto';

export interface NotificationChannelConfig {
  email?: {
    address: string;
    verified?: boolean;
  };
  webhook?: {
    url: string;
    secret?: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
  };
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  discord?: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
  };
  teams?: {
    webhookUrl: string;
  };
}

export interface CreateChannelData {
  userId: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'discord' | 'teams' | 'in_app';
  config: NotificationChannelConfig;
}

export interface NotificationContext {
  alert: Alert;
  channel: NotificationChannel;
  variables: Record<string, unknown>;
}

export interface DeliveryResult {
  success: boolean;
  error?: string;
  response?: Record<string, unknown>;
  shouldRetry?: boolean;
}

export class NotificationsService {
  // Create notification channel
  static async createChannel(data: CreateChannelData): Promise<NotificationChannel> {
    return await withTransaction(async (tx) => {
      // Validate configuration based on type
      await this.validateChannelConfig(data.type, data.config);

      const newChannel: typeof notificationChannels.$inferInsert = {
        id: generateId('channel'),
        userId: data.userId,
        name: data.name,
        type: data.type,
        config: data.config,
        isActive: true,
        isVerified: data.type === 'in_app', // in_app channels are auto-verified
        lastUsed: null,
        failureCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await tx
        .insert(notificationChannels)
        .values(newChannel)
        .returning();

      // Send verification if needed
      if (data.type === 'email' && data.config.email) {
        await this.sendVerificationEmail(created, data.config.email.address);
      }

      return created;
    });
  }

  // Get user's notification channels
  static async getUserChannels(userId: string): Promise<NotificationChannel[]> {
    return await db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.userId, userId))
      .orderBy(desc(notificationChannels.createdAt));
  }

  // Update channel
  static async updateChannel(
    id: string, 
    userId: string, 
    updates: Partial<Pick<NotificationChannel, 'name' | 'config' | 'isActive'>>
  ): Promise<boolean> {
    const result = await db
      .update(notificationChannels)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notificationChannels.id, id),
          eq(notificationChannels.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Delete channel
  static async deleteChannel(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(notificationChannels)
      .where(
        and(
          eq(notificationChannels.id, id),
          eq(notificationChannels.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Test notification channel
  static async testChannel(id: string, userId: string): Promise<DeliveryResult> {
    const [channel] = await db
      .select()
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.id, id),
          eq(notificationChannels.userId, userId)
        )
      )
      .limit(1);

    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }

    // Create a test alert context
    const testAlert = {
      id: 'test',
      userId,
      providerId: null,
      type: 'test' as const,
      severity: 'low' as const,
      title: 'Test Notification',
      message: 'This is a test notification from Nexus Dashboard',
      metadata: null,
      isRead: false,
      isResolved: false,
      resolvedAt: null,
      createdAt: new Date()
    };

    const context: NotificationContext = {
      alert: testAlert,
      channel,
      variables: {
        alertTitle: testAlert.title,
        alertMessage: testAlert.message,
        severity: testAlert.severity,
        timestamp: testAlert.createdAt.toISOString(),
        dashboardUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'
      }
    };

    return await this.deliverNotification(context);
  }

  // Send notification for alert
  static async sendNotification(alert: Alert): Promise<void> {
    // Get user's notification preferences for this alert type and severity
    const channels = await this.getNotificationChannels(alert.userId, alert.type, alert.severity);

    for (const channel of channels) {
      // Check cooldown and failure limits
      if (await this.shouldSkipChannel(channel)) {
        continue;
      }

      const context: NotificationContext = {
        alert,
        channel,
        variables: await this.buildNotificationVariables(alert)
      };

      // Create delivery record
      const delivery = await this.createDeliveryRecord(alert.id, channel.id);

      try {
        const result = await this.deliverNotification(context);
        await this.updateDeliveryRecord(delivery.id, result);

        if (result.success) {
          await this.updateChannelStats(channel.id, true);
        } else {
          await this.updateChannelStats(channel.id, false);
          
          // Schedule retry if applicable
          if (result.shouldRetry && delivery.attempt < delivery.maxAttempts) {
            await this.scheduleRetry(delivery.id);
          }
        }
      } catch (error) {
        console.error('Notification delivery failed:', error);
        await this.updateDeliveryRecord(delivery.id, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true
        });
        await this.updateChannelStats(channel.id, false);
      }
    }
  }

  // Get notification channels for alert type and severity
  private static async getNotificationChannels(
    userId: string, 
    alertType: string, 
    severity: string
  ): Promise<NotificationChannel[]> {
    // First check for user preferences
    const preferences = await db
      .select({
        channelId: userNotificationPreferences.channelId,
        isEnabled: userNotificationPreferences.isEnabled
      })
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.alertType, alertType),
          eq(userNotificationPreferences.severity, severity),
          eq(userNotificationPreferences.isEnabled, true)
        )
      );

    if (preferences.length > 0) {
      // Use specific preferences
      const channelIds = preferences.map(p => p.channelId);
      return await db
        .select()
        .from(notificationChannels)
        .where(
          and(
            eq(notificationChannels.userId, userId),
            eq(notificationChannels.isActive, true),
            eq(notificationChannels.isVerified, true),
            or(...channelIds.map(id => eq(notificationChannels.id, id)))
          )
        );
    } else {
      // Use default: all active channels for critical/high, email/in_app for medium/low
      const typeFilter = severity === 'critical' || severity === 'high' 
        ? undefined // all types
        : or(
            eq(notificationChannels.type, 'email'),
            eq(notificationChannels.type, 'in_app')
          );

      return await db
        .select()
        .from(notificationChannels)
        .where(
          and(
            eq(notificationChannels.userId, userId),
            eq(notificationChannels.isActive, true),
            eq(notificationChannels.isVerified, true),
            typeFilter
          )
        );
    }
  }

  // Build notification variables
  private static async buildNotificationVariables(alert: Alert): Promise<Record<string, unknown>> {
    const dashboardUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
    
    return {
      alertId: alert.id,
      alertTitle: alert.title,
      alertMessage: alert.message,
      alertType: alert.type,
      severity: alert.severity,
      timestamp: alert.createdAt.toISOString(),
      formattedTime: alert.createdAt.toLocaleString(),
      dashboardUrl,
      alertUrl: `${dashboardUrl}/dashboard/alerts/${alert.id}`,
      providerId: alert.providerId,
      metadata: alert.metadata || {}
    };
  }

  // Deliver notification based on channel type
  private static async deliverNotification(context: NotificationContext): Promise<DeliveryResult> {
    const { channel, alert, variables } = context;

    try {
      switch (channel.type) {
        case 'email':
          return await this.deliverEmail(channel, alert, variables);
        case 'webhook':
          return await this.deliverWebhook(channel, alert, variables);
        case 'slack':
          return await this.deliverSlack(channel, alert, variables);
        case 'discord':
          return await this.deliverDiscord(channel, alert, variables);
        case 'teams':
          return await this.deliverTeams(channel, alert, variables);
        case 'in_app':
          return { success: true }; // Always successful for in-app
        default:
          return { success: false, error: 'Unsupported channel type' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        shouldRetry: true
      };
    }
  }

  // Email delivery
  private static async deliverEmail(
    channel: NotificationChannel,
    alert: Alert,
    variables: Record<string, any>
  ): Promise<DeliveryResult> {
    const config = channel.config as { email: { address: string } };
    const template = await this.getTemplate('email', alert.type, alert.severity);
    
    const subject = this.renderTemplate(template.subject || 'Alert: {{alertTitle}}', variables);
    const body = this.renderTemplate(template.body, variables);

    // Here you would integrate with your email provider (SendGrid, Resend, etc.)
    // For now, we'll simulate success
    console.log('Email notification:', {
      to: config.email.address,
      subject,
      body
    });

    return { success: true, response: { messageId: generateId('email') } };
  }

  // Webhook delivery
  private static async deliverWebhook(
    channel: NotificationChannel,
    alert: Alert,
    variables: Record<string, any>
  ): Promise<DeliveryResult> {
    const config = channel.config as { webhook: { url: string; secret?: string; headers?: Record<string, string>; method?: string } };
    const template = await this.getTemplate('webhook', alert.type, alert.severity);
    
    const payload = JSON.parse(this.renderTemplate(template.body, variables));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Nexus-Dashboard/1.0',
      ...(config.webhook.headers || {})
    };

    // Add webhook signature if secret is provided
    if (config.webhook.secret) {
      const signature = crypto
        .createHmac('sha256', config.webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Nexus-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(config.webhook.url, {
      method: config.webhook.method || 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        shouldRetry: response.status >= 500 || response.status === 429
      };
    }

    const responseData = await response.text();
    return { success: true, response: { status: response.status, data: responseData } };
  }

  // Slack delivery
  private static async deliverSlack(
    channel: NotificationChannel,
    alert: Alert,
    variables: Record<string, any>
  ): Promise<DeliveryResult> {
    const config = channel.config as { slack: { webhookUrl: string; channel?: string; username?: string } };
    const template = await this.getTemplate('slack', alert.type, alert.severity);
    
    const payload = {
      channel: config.slack.channel,
      username: config.slack.username || 'Nexus Dashboard',
      text: this.renderTemplate(template.body, variables),
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Alert Type', value: alert.type, short: true },
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Time', value: variables.formattedTime, short: true }
        ]
      }]
    };

    const response = await fetch(config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Slack webhook failed: ${response.status}`,
        shouldRetry: response.status >= 500
      };
    }

    return { success: true, response: { status: response.status } };
  }

  // Discord delivery
  private static async deliverDiscord(
    channel: NotificationChannel,
    alert: Alert,
    variables: Record<string, any>
  ): Promise<DeliveryResult> {
    const config = channel.config as { discord: { webhookUrl: string; username?: string; avatarUrl?: string } };
    const template = await this.getTemplate('discord', alert.type, alert.severity);
    
    const payload = {
      username: config.discord.username || 'Nexus Dashboard',
      avatar_url: config.discord.avatarUrl,
      embeds: [{
        title: alert.title,
        description: this.renderTemplate(template.body, variables),
        color: parseInt(this.getSeverityColor(alert.severity).replace('#', ''), 16),
        fields: [
          { name: 'Type', value: alert.type, inline: true },
          { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
          { name: 'Time', value: variables.formattedTime, inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    const response = await fetch(config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Discord webhook failed: ${response.status}`,
        shouldRetry: response.status >= 500
      };
    }

    return { success: true, response: { status: response.status } };
  }

  // Teams delivery
  private static async deliverTeams(
    channel: NotificationChannel,
    alert: Alert,
    variables: Record<string, any>
  ): Promise<DeliveryResult> {
    const config = channel.config as { teams: { webhookUrl: string } };
    const template = await this.getTemplate('teams', alert.type, alert.severity);
    
    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": this.getSeverityColor(alert.severity),
      "summary": alert.title,
      "sections": [{
        "activityTitle": alert.title,
        "activitySubtitle": this.renderTemplate(template.body, variables),
        "facts": [
          { "name": "Type", "value": alert.type },
          { "name": "Severity", "value": alert.severity.toUpperCase() },
          { "name": "Time", "value": variables.formattedTime }
        ]
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "View in Dashboard",
        "targets": [{ "os": "default", "uri": variables.alertUrl }]
      }]
    };

    const response = await fetch(config.teams.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Teams webhook failed: ${response.status}`,
        shouldRetry: response.status >= 500
      };
    }

    return { success: true, response: { status: response.status } };
  }

  // Get notification template
  private static async getTemplate(
    channelType: string,
    alertType: string,
    severity: string
  ): Promise<{ subject?: string; body: string }> {
    // Try to find specific template
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.type, channelType),
          eq(notificationTemplates.alertType, alertType),
          eq(notificationTemplates.severity, severity)
        )
      )
      .limit(1);

    if (template) {
      return { subject: template.subject || undefined, body: template.body };
    }

    // Fall back to default templates
    return this.getDefaultTemplate(channelType, alertType, severity);
  }

  // Get default template
  private static getDefaultTemplate(
    channelType: string,
    alertType: string,
    severity: string
  ): { subject?: string; body: string } {
    const defaultTemplates: Record<string, { subject?: string; body: string }> = {
      email: {
        subject: '[{{severity}}] {{alertTitle}}',
        body: `Alert: {{alertTitle}}

{{alertMessage}}

Details:
- Type: {{alertType}}
- Severity: {{severity}}
- Time: {{formattedTime}}

View in dashboard: {{alertUrl}}`
      },
      webhook: {
        body: JSON.stringify({
          alert_id: '{{alertId}}',
          title: '{{alertTitle}}',
          message: '{{alertMessage}}',
          type: '{{alertType}}',
          severity: '{{severity}}',
          timestamp: '{{timestamp}}',
          dashboard_url: '{{dashboardUrl}}'
        }, null, 2)
      },
      slack: {
        body: ':warning: *{{alertTitle}}*\n\n{{alertMessage}}\n\n<{{alertUrl}}|View in Dashboard>'
      },
      discord: {
        body: '{{alertMessage}}'
      },
      teams: {
        body: '{{alertMessage}}'
      }
    };

    return defaultTemplates[channelType] || { body: '{{alertMessage}}' };
  }

  // Render template with variables
  private static renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  // Get severity color
  private static getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a2eb',
      medium: '#ffce56',
      high: '#ff6384',
      critical: '#dc3545'
    };
    return colors[severity as keyof typeof colors] || '#6c757d';
  }

  // Validate channel configuration
  private static async validateChannelConfig(
    type: string,
    config: NotificationChannelConfig
  ): Promise<void> {
    switch (type) {
      case 'email':
        if (!config.email?.address) {
          throw new Error('Email address is required');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.email.address)) {
          throw new Error('Invalid email address');
        }
        break;
      
      case 'webhook':
        if (!config.webhook?.url) {
          throw new Error('Webhook URL is required');
        }
        try {
          new URL(config.webhook.url);
        } catch {
          throw new Error('Invalid webhook URL');
        }
        break;
      
      case 'slack':
        if (!config.slack?.webhookUrl) {
          throw new Error('Slack webhook URL is required');
        }
        break;
      
      case 'discord':
        if (!config.discord?.webhookUrl) {
          throw new Error('Discord webhook URL is required');
        }
        break;
      
      case 'teams':
        if (!config.teams?.webhookUrl) {
          throw new Error('Teams webhook URL is required');
        }
        break;
    }
  }

  // Helper methods for delivery tracking
  private static async createDeliveryRecord(alertId: string, channelId: string): Promise<AlertDelivery> {
    const [delivery] = await db
      .insert(alertDeliveries)
      .values({
        id: generateId('delivery'),
        alertId,
        channelId,
        status: 'pending',
        attempt: 1,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return delivery;
  }

  private static async updateDeliveryRecord(deliveryId: string, result: DeliveryResult): Promise<void> {
    await db
      .update(alertDeliveries)
      .set({
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        response: result.response || null,
        sentAt: result.success ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(alertDeliveries.id, deliveryId));
  }

  private static async updateChannelStats(channelId: string, success: boolean): Promise<void> {
    if (success) {
      await db
        .update(notificationChannels)
        .set({
          lastUsed: new Date(),
          failureCount: 0,
          updatedAt: new Date()
        })
        .where(eq(notificationChannels.id, channelId));
    } else {
      await db
        .update(notificationChannels)
        .set({
          failureCount: db.raw('failure_count + 1'),
          updatedAt: new Date()
        } as any)
        .where(eq(notificationChannels.id, channelId));
    }
  }

  private static async shouldSkipChannel(channel: NotificationChannel): Promise<boolean> {
    // Skip if too many failures
    if (channel.failureCount >= 5) {
      return true;
    }

    // Skip if channel is not active or verified
    if (!channel.isActive || !channel.isVerified) {
      return true;
    }

    return false;
  }

  private static async scheduleRetry(deliveryId: string): Promise<void> {
    const nextRetry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    await db
      .update(alertDeliveries)
      .set({
        status: 'retrying',
        nextRetryAt: nextRetry,
        attempt: db.raw('attempt + 1'),
        updatedAt: new Date()
      } as any)
      .where(eq(alertDeliveries.id, deliveryId));
  }

  private static async sendVerificationEmail(channel: NotificationChannel, email: string): Promise<void> {
    // Implementation for sending verification email
    // This would integrate with your email provider
    console.log('Verification email sent to:', email);
  }

  // Verify channel (for email verification)
  static async verifyChannel(channelId: string, token: string): Promise<boolean> {
    // Implementation for verifying channels
    // This would validate the verification token and update the channel
    return true;
  }

  // Get delivery history
  static async getDeliveryHistory(
    userId: string,
    filters?: {
      channelId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AlertDelivery[]> {
    const { channelId, status, startDate, endDate, limit = 50 } = filters || {};
    
    const conditions = [];
    
    if (channelId) {
      conditions.push(eq(alertDeliveries.channelId, channelId));
    }
    
    if (status) {
      conditions.push(eq(alertDeliveries.status, status));
    }
    
    if (startDate) {
      conditions.push(gte(alertDeliveries.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(alertDeliveries.createdAt, endDate));
    }

    // Join with channels to filter by user
    return await db
      .select({
        id: alertDeliveries.id,
        alertId: alertDeliveries.alertId,
        channelId: alertDeliveries.channelId,
        status: alertDeliveries.status,
        attempt: alertDeliveries.attempt,
        maxAttempts: alertDeliveries.maxAttempts,
        error: alertDeliveries.error,
        response: alertDeliveries.response,
        sentAt: alertDeliveries.sentAt,
        nextRetryAt: alertDeliveries.nextRetryAt,
        createdAt: alertDeliveries.createdAt,
        updatedAt: alertDeliveries.updatedAt
      })
      .from(alertDeliveries)
      .innerJoin(notificationChannels, eq(alertDeliveries.channelId, notificationChannels.id))
      .where(
        and(
          eq(notificationChannels.userId, userId),
          ...(conditions.length > 0 ? [and(...conditions)] : [])
        )
      )
      .orderBy(desc(alertDeliveries.createdAt))
      .limit(limit);
  }
}