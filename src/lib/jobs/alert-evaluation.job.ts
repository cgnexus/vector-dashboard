import { db } from '@/db';
import { user, alertRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AlertRulesService } from '../services/alert-rules.service';
import { NotificationsService } from '../services/notifications.service';

export interface JobResult {
  success: boolean;
  usersProcessed: number;
  rulesEvaluated: number;
  alertsCreated: number;
  errors: string[];
  executionTime: number;
}

export class AlertEvaluationJob {
  private static isRunning = false;
  private static lastRun: Date | null = null;

  // Main job execution
  static async execute(): Promise<JobResult> {
    const startTime = Date.now();
    
    if (this.isRunning) {
      return {
        success: false,
        usersProcessed: 0,
        rulesEvaluated: 0,
        alertsCreated: 0,
        errors: ['Job is already running'],
        executionTime: 0
      };
    }

    this.isRunning = true;
    console.log('Starting alert evaluation job...');

    let usersProcessed = 0;
    let rulesEvaluated = 0;
    let alertsCreated = 0;
    const errors: string[] = [];

    try {
      // Get all users who have active alert rules
      const usersWithRules = await db
        .selectDistinct({ userId: alertRules.userId })
        .from(alertRules)
        .innerJoin(user, eq(alertRules.userId, user.id))
        .where(eq(alertRules.isActive, true));

      console.log(`Found ${usersWithRules.length} users with active alert rules`);

      // Process each user's rules
      for (const { userId } of usersWithRules) {
        try {
          const results = await AlertRulesService.evaluateUserRules(userId);
          rulesEvaluated += results.length;
          
          // Count alerts created
          const alertsCreatedForUser = results.filter(r => r.alertCreated).length;
          alertsCreated += alertsCreatedForUser;

          // Log errors for individual rules
          const ruleErrors = results.filter(r => r.error).map(r => `Rule ${r.ruleId}: ${r.error}`);
          errors.push(...ruleErrors);

          usersProcessed++;
          
          if (alertsCreatedForUser > 0) {
            console.log(`Created ${alertsCreatedForUser} alerts for user ${userId}`);
          }
        } catch (error) {
          console.error(`Error processing rules for user ${userId}:`, error);
          errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.lastRun = new Date();
      
      console.log(`Alert evaluation job completed:`, {
        usersProcessed,
        rulesEvaluated,
        alertsCreated,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        usersProcessed,
        rulesEvaluated,
        alertsCreated,
        errors,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Alert evaluation job failed:', error);
      return {
        success: false,
        usersProcessed,
        rulesEvaluated,
        alertsCreated,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Check if job is currently running
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun
    };
  }

  // Schedule the job to run periodically
  static startScheduler(intervalMinutes: number = 1): NodeJS.Timeout {
    console.log(`Starting alert evaluation scheduler (every ${intervalMinutes} minutes)`);
    
    return setInterval(async () => {
      try {
        await this.execute();
      } catch (error) {
        console.error('Scheduled alert evaluation failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Stop the scheduler
  static stopScheduler(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('Alert evaluation scheduler stopped');
  }
}

// Job for processing auto-generated alerts (legacy support)
export class AutoAlertJob {
  private static isRunning = false;

  static async execute(): Promise<JobResult> {
    const startTime = Date.now();
    
    if (this.isRunning) {
      return {
        success: false,
        usersProcessed: 0,
        rulesEvaluated: 0,
        alertsCreated: 0,
        errors: ['Auto alert job is already running'],
        executionTime: 0
      };
    }

    this.isRunning = true;
    console.log('Starting auto alert generation job...');

    let usersProcessed = 0;
    let alertsCreated = 0;
    const errors: string[] = [];

    try {
      // Get all users
      const users = await db.select({ id: user.id }).from(user);

      for (const userRecord of users) {
        try {
          // Use the existing generateAlerts method from AlertsService
          const { AlertsService } = await import('../services/alerts.service');
          const generatedAlerts = await AlertsService.generateAlerts(userRecord.id);
          
          // Send notifications for each generated alert
          for (const alert of generatedAlerts) {
            try {
              await NotificationsService.sendNotification(alert);
            } catch (notificationError) {
              console.error(`Failed to send notification for alert ${alert.id}:`, notificationError);
              errors.push(`Notification failed for alert ${alert.id}: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`);
            }
          }

          alertsCreated += generatedAlerts.length;
          usersProcessed++;

          if (generatedAlerts.length > 0) {
            console.log(`Generated ${generatedAlerts.length} auto alerts for user ${userRecord.id}`);
          }
        } catch (error) {
          console.error(`Error generating auto alerts for user ${userRecord.id}:`, error);
          errors.push(`User ${userRecord.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`Auto alert generation completed:`, {
        usersProcessed,
        alertsCreated,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        usersProcessed,
        rulesEvaluated: 0, // Not applicable for auto alerts
        alertsCreated,
        errors,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Auto alert generation job failed:', error);
      return {
        success: false,
        usersProcessed,
        rulesEvaluated: 0,
        alertsCreated,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  static startScheduler(intervalMinutes: number = 15): NodeJS.Timeout {
    console.log(`Starting auto alert generation scheduler (every ${intervalMinutes} minutes)`);
    
    return setInterval(async () => {
      try {
        await this.execute();
      } catch (error) {
        console.error('Scheduled auto alert generation failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}