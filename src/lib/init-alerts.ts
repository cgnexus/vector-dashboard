// Initialize alerting system
import { initializeBackgroundJobs } from './jobs';

// Configuration for different environments
const getJobConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';

  return {
    alertEvaluationMinutes: isDev ? 2 : 1,      // Slower in dev
    notificationDeliveryMinutes: isDev ? 3 : 2, // Slower in dev
    cleanupHours: isDev ? 1 : 24,               // More frequent in dev
    autoAlertMinutes: isDev ? 30 : 15,          // Less frequent in dev
    retentionSettings: {
      alertRetentionDays: isDev ? 7 : 30,       // Shorter retention in dev
      ruleInactiveDays: isDev ? 30 : 90,
      deliveryRetentionDays: isDev ? 7 : 30
    }
  };
};

// Initialize the alerting system
export function initializeAlertingSystem() {
  try {
    const config = getJobConfig();
    initializeBackgroundJobs(config);
    
    console.log('Nexus alerting system initialized with config:', {
      environment: process.env.NODE_ENV,
      alertEvaluation: `${config.alertEvaluationMinutes}min`,
      notificationDelivery: `${config.notificationDeliveryMinutes}min`,
      cleanup: `${config.cleanupHours}h`,
      autoAlerts: `${config.autoAlertMinutes}min`
    });
  } catch (error) {
    console.error('Failed to initialize alerting system:', error);
  }
}

// Export for external initialization
export { initializeBackgroundJobs, getJobConfig };