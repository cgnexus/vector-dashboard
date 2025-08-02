import { db } from '@/db';
import { alertDeliveries, notificationChannels, alerts } from '@/db/schema';
import { eq, and, or, lte, sql } from 'drizzle-orm';
import { NotificationsService } from '../services/notifications.service';

export interface DeliveryJobResult {
  success: boolean;
  deliveriesProcessed: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  retriesScheduled: number;
  errors: string[];
  executionTime: number;
}

export class NotificationDeliveryJob {
  private static isRunning = false;
  private static lastRun: Date | null = null;

  // Main job execution
  static async execute(): Promise<DeliveryJobResult> {
    const startTime = Date.now();
    
    if (this.isRunning) {
      return {
        success: false,
        deliveriesProcessed: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        retriesScheduled: 0,
        errors: ['Notification delivery job is already running'],
        executionTime: 0
      };
    }

    this.isRunning = true;
    console.log('Starting notification delivery job...');

    let deliveriesProcessed = 0;
    let successfulDeliveries = 0;
    let failedDeliveries = 0;
    let retriesScheduled = 0;
    const errors: string[] = [];

    try {
      // Get pending deliveries and deliveries ready for retry
      const pendingDeliveries = await this.getPendingDeliveries();
      
      console.log(`Found ${pendingDeliveries.length} pending notification deliveries`);

      for (const delivery of pendingDeliveries) {
        try {
          const result = await this.processDelivery(delivery);
          deliveriesProcessed++;

          if (result.success) {
            successfulDeliveries++;
            await this.markDeliverySuccess(delivery.id, result.response);
            await this.updateChannelStats(delivery.channelId, true);
          } else {
            failedDeliveries++;
            
            if (result.shouldRetry && delivery.attempt < delivery.maxAttempts) {
              await this.scheduleRetry(delivery.id, result.error);
              retriesScheduled++;
            } else {
              await this.markDeliveryFailed(delivery.id, result.error || 'Unknown error');
            }
            
            await this.updateChannelStats(delivery.channelId, false);
          }
        } catch (error) {
          console.error(`Error processing delivery ${delivery.id}:`, error);
          errors.push(`Delivery ${delivery.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedDeliveries++;
          
          try {
            await this.markDeliveryFailed(delivery.id, error instanceof Error ? error.message : 'Unknown error');
            await this.updateChannelStats(delivery.channelId, false);
          } catch (updateError) {
            console.error(`Failed to update delivery status:`, updateError);
          }
        }
      }

      this.lastRun = new Date();
      
      console.log(`Notification delivery job completed:`, {
        deliveriesProcessed,
        successfulDeliveries,
        failedDeliveries,
        retriesScheduled,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        deliveriesProcessed,
        successfulDeliveries,
        failedDeliveries,
        retriesScheduled,
        errors,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Notification delivery job failed:', error);
      return {
        success: false,
        deliveriesProcessed,
        successfulDeliveries,
        failedDeliveries,
        retriesScheduled,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Get pending deliveries and those ready for retry
  private static async getPendingDeliveries() {
    const now = new Date();
    
    return await db
      .select({
        id: alertDeliveries.id,
        alertId: alertDeliveries.alertId,
        channelId: alertDeliveries.channelId,
        status: alertDeliveries.status,
        attempt: alertDeliveries.attempt,
        maxAttempts: alertDeliveries.maxAttempts,
        error: alertDeliveries.error,
        nextRetryAt: alertDeliveries.nextRetryAt,
        createdAt: alertDeliveries.createdAt,
        
        // Join alert data
        alert: {
          id: alerts.id,
          userId: alerts.userId,
          providerId: alerts.providerId,
          type: alerts.type,
          severity: alerts.severity,
          title: alerts.title,
          message: alerts.message,
          metadata: alerts.metadata,
          createdAt: alerts.createdAt
        },
        
        // Join channel data
        channel: {
          id: notificationChannels.id,
          userId: notificationChannels.userId,
          name: notificationChannels.name,
          type: notificationChannels.type,
          config: notificationChannels.config,
          isActive: notificationChannels.isActive,
          isVerified: notificationChannels.isVerified
        }
      })
      .from(alertDeliveries)
      .innerJoin(alerts, eq(alertDeliveries.alertId, alerts.id))
      .innerJoin(notificationChannels, eq(alertDeliveries.channelId, notificationChannels.id))
      .where(
        and(
          or(
            eq(alertDeliveries.status, 'pending'),
            and(
              eq(alertDeliveries.status, 'retrying'),
              lte(alertDeliveries.nextRetryAt, now)
            )
          ),
          eq(notificationChannels.isActive, true),
          eq(notificationChannels.isVerified, true)
        )
      )
      .orderBy(alertDeliveries.createdAt)
      .limit(100); // Process in batches
  }

  // Process individual delivery
  private static async processDelivery(delivery: any) {
    const { alert, channel } = delivery;
    
    // Build notification context
    const variables = await this.buildNotificationVariables(alert);
    const context = {
      alert,
      channel,
      variables
    };

    // Use the notification service to deliver
    return await NotificationsService['deliverNotification'](context);
  }

  // Build notification variables (similar to NotificationsService)
  private static async buildNotificationVariables(alert: any): Promise<Record<string, any>> {
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

  // Mark delivery as successful
  private static async markDeliverySuccess(deliveryId: string, response?: any): Promise<void> {
    await db
      .update(alertDeliveries)
      .set({
        status: 'sent',
        sentAt: new Date(),
        response: response || null,
        updatedAt: new Date()
      })
      .where(eq(alertDeliveries.id, deliveryId));
  }

  // Mark delivery as failed
  private static async markDeliveryFailed(deliveryId: string, error: string): Promise<void> {
    await db
      .update(alertDeliveries)
      .set({
        status: 'failed',
        error,
        updatedAt: new Date()
      })
      .where(eq(alertDeliveries.id, deliveryId));
  }

  // Schedule retry
  private static async scheduleRetry(deliveryId: string, error?: string): Promise<void> {
    // Calculate next retry time with exponential backoff
    const [delivery] = await db
      .select({ attempt: alertDeliveries.attempt })
      .from(alertDeliveries)
      .where(eq(alertDeliveries.id, deliveryId))
      .limit(1);

    if (!delivery) return;

    // Exponential backoff: 5min, 15min, 45min
    const backoffMinutes = Math.pow(3, delivery.attempt) * 5;
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    await db
      .update(alertDeliveries)
      .set({
        status: 'retrying',
        attempt: delivery.attempt + 1,
        nextRetryAt,
        error: error || null,
        updatedAt: new Date()
      })
      .where(eq(alertDeliveries.id, deliveryId));
  }

  // Update channel statistics
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
      // Increment failure count
      await db.execute(sql`
        UPDATE notification_channels 
        SET failure_count = failure_count + 1, updated_at = NOW()
        WHERE id = ${channelId}
      `);
    }
  }

  // Clean up old completed deliveries
  static async cleanupOldDeliveries(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(alertDeliveries)
      .where(
        and(
          or(
            eq(alertDeliveries.status, 'sent'),
            eq(alertDeliveries.status, 'failed')
          ),
          lte(alertDeliveries.updatedAt, cutoffDate)
        )
      );

    return result.rowCount || 0;
  }

  // Get job status
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun
    };
  }

  // Start scheduler
  static startScheduler(intervalMinutes: number = 2): NodeJS.Timeout {
    console.log(`Starting notification delivery scheduler (every ${intervalMinutes} minutes)`);
    
    return setInterval(async () => {
      try {
        await this.execute();
      } catch (error) {
        console.error('Scheduled notification delivery failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Stop scheduler
  static stopScheduler(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('Notification delivery scheduler stopped');
  }

  // Process failed deliveries for retry
  static async retryFailedDeliveries(channelId?: string): Promise<DeliveryJobResult> {
    const startTime = Date.now();
    console.log('Retrying failed deliveries...');

    let deliveriesProcessed = 0;
    const successfulDeliveries = 0;
    const failedDeliveries = 0;
    const errors: string[] = [];

    try {
      // Get failed deliveries that can be retried
      const conditions = [
        eq(alertDeliveries.status, 'failed'),
        sql`${alertDeliveries.attempt} < ${alertDeliveries.maxAttempts}`
      ];

      if (channelId) {
        conditions.push(eq(alertDeliveries.channelId, channelId));
      }

      const failedDeliveries = await db
        .select()
        .from(alertDeliveries)
        .where(and(...conditions))
        .limit(50); // Process in smaller batches

      for (const delivery of failedDeliveries) {
        try {
          // Reset to retrying status
          await this.scheduleRetry(delivery.id, 'Manual retry');
          deliveriesProcessed++;
        } catch (error) {
          console.error(`Error scheduling retry for delivery ${delivery.id}:`, error);
          errors.push(`Delivery ${delivery.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedDeliveries++;
        }
      }

      return {
        success: errors.length === 0,
        deliveriesProcessed,
        successfulDeliveries,
        failedDeliveries,
        retriesScheduled: deliveriesProcessed,
        errors,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Retry failed deliveries job failed:', error);
      return {
        success: false,
        deliveriesProcessed,
        successfulDeliveries,
        failedDeliveries,
        retriesScheduled: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime
      };
    }
  }
}