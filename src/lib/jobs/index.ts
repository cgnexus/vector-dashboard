// Background jobs initialization and management
import { JobManager } from './cleanup.job';

// Default configuration for background jobs
const DEFAULT_JOB_CONFIG = {
  alertEvaluationMinutes: 1,      // Run alert evaluation every minute
  notificationDeliveryMinutes: 2, // Process notifications every 2 minutes
  cleanupHours: 24,               // Run cleanup once daily
  autoAlertMinutes: 15,           // Generate auto alerts every 15 minutes
  retentionSettings: {
    alertRetentionDays: 30,       // Keep resolved alerts for 30 days
    ruleInactiveDays: 90,         // Clean up inactive rules after 90 days
    deliveryRetentionDays: 30     // Keep delivery records for 30 days
  }
};

let jobsInitialized = false;

// Initialize background jobs
export function initializeBackgroundJobs(config = DEFAULT_JOB_CONFIG) {
  if (jobsInitialized) {
    console.log('Background jobs already initialized');
    return;
  }

  // Only start jobs in production or when explicitly enabled
  const shouldStartJobs = 
    process.env.NODE_ENV === 'production' || 
    process.env.ENABLE_BACKGROUND_JOBS === 'true';

  if (!shouldStartJobs) {
    console.log('Background jobs disabled (not in production)');
    return;
  }

  try {
    console.log('Initializing background jobs...');
    JobManager.startAll(config);
    jobsInitialized = true;
    console.log('Background jobs initialized successfully');

    // Graceful shutdown handler
    const shutdown = () => {
      console.log('Shutting down background jobs...');
      JobManager.stopAll();
      jobsInitialized = false;
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to initialize background jobs:', error);
  }
}

// Stop background jobs
export function stopBackgroundJobs() {
  if (!jobsInitialized) {
    console.log('Background jobs not running');
    return;
  }

  try {
    JobManager.stopAll();
    jobsInitialized = false;
    console.log('Background jobs stopped');
  } catch (error) {
    console.error('Error stopping background jobs:', error);
  }
}

// Get job status
export function getJobStatus() {
  return {
    initialized: jobsInitialized,
    status: jobsInitialized ? JobManager.getStatus() : null
  };
}

// Restart specific job
export function restartJob(
  jobName: 'alertEvaluation' | 'notificationDelivery' | 'cleanup',
  config?: any
) {
  if (!jobsInitialized) {
    throw new Error('Background jobs not initialized');
  }

  JobManager.restartJob(jobName, config);
}

// Manual job execution (for testing/debugging)
export async function runJobOnce(jobName: string) {
  try {
    switch (jobName) {
      case 'alert_evaluation': {
        const { AlertEvaluationJob } = await import('./alert-evaluation.job');
        return await AlertEvaluationJob.execute();
      }
      case 'notification_delivery': {
        const { NotificationDeliveryJob } = await import('./notification-delivery.job');
        return await NotificationDeliveryJob.execute();
      }
      case 'cleanup': {
        const { CleanupJob } = await import('./cleanup.job');
        return await CleanupJob.execute();
      }
      case 'auto_alerts': {
        const { AutoAlertJob } = await import('./alert-evaluation.job');
        return await AutoAlertJob.execute();
      }
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  } catch (error) {
    console.error(`Error running job ${jobName}:`, error);
    throw error;
  }
}

// Configuration utilities
export function updateJobConfig(newConfig: Partial<typeof DEFAULT_JOB_CONFIG>) {
  const mergedConfig = { ...DEFAULT_JOB_CONFIG, ...newConfig };
  
  if (jobsInitialized) {
    console.log('Restarting jobs with new configuration...');
    JobManager.stopAll();
    JobManager.startAll(mergedConfig);
  }
  
  return mergedConfig;
}

// Health check for jobs
export function healthCheck() {
  const status = getJobStatus();
  
  return {
    healthy: status.initialized,
    details: status.status,
    timestamp: new Date().toISOString()
  };
}

export { JobManager, DEFAULT_JOB_CONFIG };