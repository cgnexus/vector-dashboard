import { useEffect, useMemo, useCallback } from 'react';
import { useProviders } from './useProviders';
import { useAggregatedMetrics, useRealtimeMetrics } from './useMetrics';
import { useAlerts, useAlertsStats } from './useAlerts';
import { useInsights, useQuickInsights } from './useInsights';

export interface DashboardState {
  providers: ReturnType<typeof useProviders>;
  metrics: ReturnType<typeof useAggregatedMetrics>;
  realtime: ReturnType<typeof useRealtimeMetrics>;
  alerts: ReturnType<typeof useAlerts>;
  alertStats: ReturnType<typeof useAlertsStats>;
  insights: ReturnType<typeof useInsights>;
  quickInsights: ReturnType<typeof useQuickInsights>;
  
  // Computed states
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  
  // Actions
  refreshAll: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

interface DashboardOptions {
  // Refresh intervals (in milliseconds)
  providersRefresh?: number;
  metricsRefresh?: number;
  realtimeRefresh?: number;
  alertsRefresh?: number;
  insightsRefresh?: number;
  
  // Data filtering
  activeProvidersOnly?: boolean;
  unresolvedAlertsOnly?: boolean;
  
  // Real-time features
  enableRealTimeUpdates?: boolean;
  autoRefreshOnError?: boolean;
}

export function useDashboard(options: DashboardOptions = {}) {
  const {
    providersRefresh = 30000,
    metricsRefresh = 30000,
    realtimeRefresh = 5000,
    alertsRefresh = 30000,
    insightsRefresh = 120000,
    activeProvidersOnly = true,
    unresolvedAlertsOnly = true,
    enableRealTimeUpdates = true,
    autoRefreshOnError = true
  } = options;

  // Fetch all data using individual hooks
  const providers = useProviders({
    status: activeProvidersOnly ? 'active' : undefined,
    refreshInterval: providersRefresh
  });

  const metrics = useAggregatedMetrics({
    refreshInterval: metricsRefresh
  });

  const realtime = useRealtimeMetrics({
    refreshInterval: enableRealTimeUpdates ? realtimeRefresh : 0
  });

  const alerts = useAlerts({
    isResolved: unresolvedAlertsOnly ? false : undefined,
    limit: 10,
    refreshInterval: alertsRefresh
  });

  const alertStats = useAlertsStats({
    refreshInterval: alertsRefresh
  });

  const insights = useInsights({
    type: 'quick',
    refreshInterval: insightsRefresh
  });

  const quickInsights = useQuickInsights({
    refreshInterval: 60000 // 1 minute for quick insights
  });

  // Computed states
  const isLoading = useMemo(() => {
    return providers.isLoading || 
           metrics.isLoading || 
           (enableRealTimeUpdates && realtime.isLoading) ||
           alerts.isLoading;
  }, [
    providers.isLoading,
    metrics.isLoading,
    realtime.isLoading,
    alerts.isLoading,
    enableRealTimeUpdates
  ]);

  const hasError = useMemo(() => {
    return !!providers.error || 
           !!metrics.error || 
           !!realtime.error ||
           !!alerts.error;
  }, [providers.error, metrics.error, realtime.error, alerts.error]);

  const isEmpty = useMemo(() => {
    return (!providers.providers || providers.providers.length === 0) &&
           (!alerts.alerts || alerts.alerts.length === 0) &&
           !metrics.metrics;
  }, [providers.providers, alerts.alerts, metrics.metrics]);

  // Actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      providers.mutate(),
      metrics.mutate(),
      realtime.mutate(),
      alerts.mutate(),
      alertStats.mutate(),
      insights.mutate(),
      quickInsights.mutate()
    ]);
  }, [providers, metrics, realtime, alerts, alertStats, insights, quickInsights]);

  const refreshProviders = async () => {
    await providers.mutate();
  };

  const refreshMetrics = async () => {
    await Promise.all([
      metrics.mutate(),
      realtime.mutate()
    ]);
  };

  const refreshAlerts = async () => {
    await Promise.all([
      alerts.mutate(),
      alertStats.mutate()
    ]);
  };

  // Auto-refresh on error
  useEffect(() => {
    if (autoRefreshOnError && hasError) {
      const timer = setTimeout(() => {
        refreshAll();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [hasError, autoRefreshOnError, refreshAll]);

  // Log data updates in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard data updated:', {
        providers: providers.providers?.length || 0,
        metrics: !!metrics.metrics,
        alerts: alerts.alerts?.length || 0,
        insights: !!insights.insights,
        errors: {
          providers: !!providers.error,
          metrics: !!metrics.error,
          realtime: !!realtime.error,
          alerts: !!alerts.error
        }
      });
    }
  }, [
    providers.providers,
    metrics.metrics,
    alerts.alerts,
    insights.insights,
    providers.error,
    metrics.error,
    realtime.error,
    alerts.error
  ]);

  return {
    providers,
    metrics,
    realtime,
    alerts,
    alertStats,
    insights,
    quickInsights,
    
    // Computed states
    isLoading,
    hasError,
    isEmpty,
    
    // Actions
    refreshAll,
    refreshProviders,
    refreshMetrics,
    refreshAlerts
  } as DashboardState;
}

// Helper hook for system health monitoring
export function useSystemHealth() {
  const { realtime, alerts, providers } = useDashboard({
    enableRealTimeUpdates: true,
    realtimeRefresh: 5000
  });

  const systemHealth = useMemo(() => {
    if (!realtime.metrics) return 'unknown';
    
    const criticalAlerts = alerts.alerts?.filter(a => a.severity === 'critical').length || 0;
    const activeProviders = providers.providers?.filter(p => p.status === 'active').length || 0;
    const totalProviders = providers.providers?.length || 0;
    
    // Critical if any critical alerts or >50% providers down
    if (criticalAlerts > 0 || (totalProviders > 0 && activeProviders / totalProviders < 0.5)) {
      return 'critical';
    }
    
    // Warning if high alerts or average response time > 1s
    const highAlerts = alerts.alerts?.filter(a => a.severity === 'high').length || 0;
    if (highAlerts > 0 || (realtime.metrics.averageResponseTime > 1000)) {
      return 'warning';
    }
    
    return 'healthy';
  }, [realtime.metrics, alerts.alerts, providers.providers]);

  return {
    health: systemHealth,
    metrics: realtime.metrics,
    isLoading: realtime.isLoading,
    error: realtime.error
  };
}