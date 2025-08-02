import { AlertsService } from '../services/alerts.service';
import { AlertRulesService } from '../services/alert-rules.service';
import { NotificationDeliveryJob } from './notification-delivery.job';

export interface CleanupJobResult {
  success: boolean;
  alertsDeleted: number;
  rulesDeleted: number;
  deliveriesDeleted: number;
  errors: string[];
  executionTime: number;
}

export class CleanupJob {
  private static isRunning = false;
  private static lastRun: Date | null = null;

  // Main cleanup job execution
  static async execute(options?: {
    alertRetentionDays?: number;
    ruleInactiveDays?: number;
    deliveryRetentionDays?: number;
  }): Promise<CleanupJobResult> {
    const startTime = Date.now();
    
    if (this.isRunning) {
      return {
        success: false,
        alertsDeleted: 0,
        rulesDeleted: 0,
        deliveriesDeleted: 0,
        errors: ['Cleanup job is already running'],
        executionTime: 0
      };
    }

    this.isRunning = true;
    console.log('Starting cleanup job...');

    const {
      alertRetentionDays = 30,
      ruleInactiveDays = 90,
      deliveryRetentionDays = 30
    } = options || {};

    let alertsDeleted = 0;
    let rulesDeleted = 0;
    let deliveriesDeleted = 0;
    const errors: string[] = [];

    try {
      // Clean up old resolved alerts
      try {
        alertsDeleted = await AlertsService.cleanupOldAlerts(alertRetentionDays);
        console.log(`Cleaned up ${alertsDeleted} old alerts`);
      } catch (error) {
        console.error('Error cleaning up alerts:', error);
        errors.push(`Alert cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Clean up inactive alert rules
      try {
        rulesDeleted = await AlertRulesService.cleanupInactiveRules(ruleInactiveDays);
        console.log(`Cleaned up ${rulesDeleted} inactive alert rules`);
      } catch (error) {
        console.error('Error cleaning up alert rules:', error);
        errors.push(`Rule cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Clean up old notification deliveries
      try {
        deliveriesDeleted = await NotificationDeliveryJob.cleanupOldDeliveries(deliveryRetentionDays);
        console.log(`Cleaned up ${deliveriesDeleted} old notification deliveries`);
      } catch (error) {
        console.error('Error cleaning up deliveries:', error);
        errors.push(`Delivery cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      this.lastRun = new Date();

      console.log(`Cleanup job completed:`, {
        alertsDeleted,
        rulesDeleted,
        deliveriesDeleted,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        alertsDeleted,
        rulesDeleted,
        deliveriesDeleted,
        errors,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Cleanup job failed:', error);
      return {
        success: false,
        alertsDeleted,
        rulesDeleted,
        deliveriesDeleted,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Get job status
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun
    };
  }

  // Start daily cleanup scheduler
  static startScheduler(options?: {
    intervalHours?: number;
    alertRetentionDays?: number;
    ruleInactiveDays?: number;
    deliveryRetentionDays?: number;
  }): NodeJS.Timeout {
    const {
      intervalHours = 24,
      alertRetentionDays = 30,
      ruleInactiveDays = 90,
      deliveryRetentionDays = 30
    } = options || {};

    console.log(`Starting cleanup scheduler (every ${intervalHours} hours)`);
    
    return setInterval(async () => {
      try {
        await this.execute({
          alertRetentionDays,
          ruleInactiveDays,
          deliveryRetentionDays
        });
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  // Stop scheduler
  static stopScheduler(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('Cleanup scheduler stopped');
  }

  // Run cleanup immediately with custom settings
  static async runCustomCleanup(options: {
    alertRetentionDays: number;
    ruleInactiveDays: number;
    deliveryRetentionDays: number;
  }): Promise<CleanupJobResult> {
    return await this.execute(options);
  }
}

// Job manager to coordinate all background jobs
export class JobManager {
  private static alertEvaluationInterval: NodeJS.Timeout | null = null;
  private static notificationDeliveryInterval: NodeJS.Timeout | null = null;
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static autoAlertInterval: NodeJS.Timeout | null = null;

  // Start all background jobs
  static startAll(config?: {
    alertEvaluationMinutes?: number;
    notificationDeliveryMinutes?: number;
    cleanupHours?: number;
    autoAlertMinutes?: number;
    retentionSettings?: {
      alertRetentionDays?: number;
      ruleInactiveDays?: number;
      deliveryRetentionDays?: number;
    };
  }): void {
    const {
      alertEvaluationMinutes = 1,
      notificationDeliveryMinutes = 2,
      cleanupHours = 24,
      autoAlertMinutes = 15,
      retentionSettings = {}
    } = config || {};

    console.log('Starting all background jobs...');

    // Start alert evaluation job
    if (!this.alertEvaluationInterval) {
      const { AlertEvaluationJob } = require('./alert-evaluation.job');
      this.alertEvaluationInterval = AlertEvaluationJob.startScheduler(alertEvaluationMinutes);
    }

    // Start notification delivery job
    if (!this.notificationDeliveryInterval) {
      this.notificationDeliveryInterval = NotificationDeliveryJob.startScheduler(notificationDeliveryMinutes);
    }

    // Start cleanup job
    if (!this.cleanupInterval) {
      this.cleanupInterval = CleanupJob.startScheduler({
        intervalHours: cleanupHours,
        ...retentionSettings
      });
    }

    // Start auto alert job (legacy support)
    if (!this.autoAlertInterval) {
      const { AutoAlertJob } = require('./alert-evaluation.job');
      this.autoAlertInterval = AutoAlertJob.startScheduler(autoAlertMinutes);
    }

    console.log('All background jobs started successfully');
  }

  // Stop all background jobs
  static stopAll(): void {
    console.log('Stopping all background jobs...');

    if (this.alertEvaluationInterval) {
      const { AlertEvaluationJob } = require('./alert-evaluation.job');
      AlertEvaluationJob.stopScheduler(this.alertEvaluationInterval);
      this.alertEvaluationInterval = null;
    }

    if (this.notificationDeliveryInterval) {
      NotificationDeliveryJob.stopScheduler(this.notificationDeliveryInterval);
      this.notificationDeliveryInterval = null;
    }

    if (this.cleanupInterval) {
      CleanupJob.stopScheduler(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('All background jobs stopped');
  }

  // Get status of all jobs
  static getStatus() {
    const { AlertEvaluationJob, AutoAlertJob } = require('./alert-evaluation.job');
    
    return {
      alertEvaluation: AlertEvaluationJob.getStatus(),
      notificationDelivery: NotificationDeliveryJob.getStatus(),
      cleanup: CleanupJob.getStatus(),
      autoAlert: {
        isRunning: false, // AutoAlertJob doesn't track running state
        lastRun: null
      },
      schedulers: {
        alertEvaluation: !!this.alertEvaluationInterval,
        notificationDelivery: !!this.notificationDeliveryInterval,
        cleanup: !!this.cleanupInterval,
        autoAlert: !!this.autoAlertInterval
      }
    };
  }

  // Restart specific job
  static restartJob(
    jobName: 'alertEvaluation' | 'notificationDelivery' | 'cleanup',
    config?: any
  ): void {
    console.log(`Restarting ${jobName} job...`);

    switch (jobName) {
      case 'alertEvaluation':
        if (this.alertEvaluationInterval) {
          const { AlertEvaluationJob } = require('./alert-evaluation.job');
          AlertEvaluationJob.stopScheduler(this.alertEvaluationInterval);
          this.alertEvaluationInterval = AlertEvaluationJob.startScheduler(config?.intervalMinutes || 1);
        }
        break;

      case 'notificationDelivery':
        if (this.notificationDeliveryInterval) {
          NotificationDeliveryJob.stopScheduler(this.notificationDeliveryInterval);
          this.notificationDeliveryInterval = NotificationDeliveryJob.startScheduler(config?.intervalMinutes || 2);
        }
        break;

      case 'cleanup':
        if (this.cleanupInterval) {
          CleanupJob.stopScheduler(this.cleanupInterval);
          this.cleanupInterval = CleanupJob.startScheduler(config);
        }
        break;
    }

    console.log(`${jobName} job restarted successfully`);
  }
}