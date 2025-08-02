// Re-export all hooks for easier importing
export * from './useProviders';
export * from './useMetrics';
export * from './useAlerts';
export * from './useInsights';

// Common hook patterns and utilities
export { useMemo, useCallback, useEffect } from 'react';
export { mutate } from 'swr';

// Helper function to invalidate all dashboard data
export function invalidateAllData() {
  // Invalidate all dashboard-related SWR keys
  const keys = [
    '/api/providers',
    '/api/metrics/aggregated',
    '/api/metrics/realtime',
    '/api/alerts',
    '/api/alerts/stats',
    '/api/ai/insights',
    '/api/ai/cost-tracking'
  ];
  
  return Promise.all(keys.map(key => mutate(key)));
}

// Real-time dashboard refresh hook
export function useDashboardRefresh(interval: number = 30000) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      invalidateAllData();
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [interval]);
}