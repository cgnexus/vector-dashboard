# Dashboard Data Fetching Hooks

This directory contains custom React hooks for fetching and managing dashboard data with SWR for caching and real-time updates.

## Overview

The dashboard now uses real API data instead of mock data, with the following hooks providing:

- **Automatic caching** with SWR
- **Real-time updates** with configurable intervals
- **Error handling** and retry logic
- **Loading states** with skeleton components
- **Type safety** with TypeScript interfaces

## Available Hooks

### Core Data Hooks

#### `useProviders(options?)`
Fetches API provider data with statistics.

```tsx
const { providers, meta, isLoading, error, mutate } = useProviders({
  status: 'active',
  search: 'openai',
  page: 1,
  limit: 10,
  refreshInterval: 30000
});
```

#### `useAggregatedMetrics(options?)`
Fetches aggregated metrics across all providers.

```tsx
const { metrics, isLoading, error, mutate } = useAggregatedMetrics({
  providerId: 'provider-id',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  refreshInterval: 30000
});
```

#### `useRealtimeMetrics(options?)`
Fetches real-time metrics with high-frequency updates.

```tsx
const { metrics, isLoading, error, mutate } = useRealtimeMetrics({
  refreshInterval: 5000 // 5 seconds
});
```

#### `useAlerts(options?)`
Fetches alerts with filtering and pagination.

```tsx
const { alerts, meta, isLoading, error, mutate } = useAlerts({
  severity: 'critical',
  isResolved: false,
  limit: 10,
  refreshInterval: 30000
});
```

#### `useInsights(options?)`
Fetches AI-powered insights and recommendations.

```tsx
const { insights, metadata, isLoading, error, mutate } = useInsights({
  type: 'full',
  providerId: 'provider-id',
  days: 30,
  refreshInterval: 120000 // 2 minutes
});
```

### Composite Hooks

#### `useDashboard(options?)`
Comprehensive hook that combines all dashboard data sources.

```tsx
const dashboard = useDashboard({
  enableRealTimeUpdates: true,
  activeProvidersOnly: true,
  unresolvedAlertsOnly: true,
  autoRefreshOnError: true
});

const {
  providers,
  metrics,
  realtime,
  alerts,
  alertStats,
  insights,
  isLoading,
  hasError,
  isEmpty,
  refreshAll
} = dashboard;
```

#### `useSystemHealth()`
Monitors overall system health status.

```tsx
const { health, metrics, isLoading, error } = useSystemHealth();
// health: 'healthy' | 'warning' | 'critical' | 'unknown'
```

### Utility Hooks

#### `useLoadingState<T>()`
Generic loading state management.

```tsx
const { isLoading, error, data, execute } = useLoadingState<MyDataType>();

await execute(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

## Configuration Options

### Refresh Intervals
- **Providers**: 30 seconds (moderate frequency)
- **Metrics**: 30 seconds (moderate frequency)  
- **Real-time**: 5 seconds (high frequency)
- **Alerts**: 30 seconds (moderate frequency)
- **Insights**: 2 minutes (low frequency, AI is expensive)

### Error Handling
- **Automatic retry** on network errors
- **Exponential backoff** for repeated failures
- **Graceful degradation** with fallback states
- **User-friendly error messages**

## SWR Configuration

Global SWR configuration is provided by `SWRProvider` in `src/components/swr-provider.tsx`:

```tsx
<SWRConfig
  value={{
    fetcher: async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      return response.json();
    },
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Disabled by default
    dedupingInterval: 2000
  }}
>
```

## Data Flow

1. **Dashboard Page** imports `useDashboard()`
2. **useDashboard()** coordinates multiple data hooks
3. **Individual hooks** use SWR for caching and updates
4. **SWR** manages HTTP requests, caching, and revalidation
5. **Components** receive real-time data with loading states

## Error States

The dashboard handles various error scenarios:

- **Network errors**: Retry with exponential backoff
- **Authentication errors**: Redirect to login
- **Authorization errors**: Show access denied message
- **Server errors**: Show retry button with error details
- **Data validation errors**: Log and show fallback UI

## Real-time Features

- **Automatic refresh** every 30 seconds for most data
- **Real-time metrics** updated every 5 seconds
- **Manual refresh** button for immediate updates
- **Optimistic updates** for user actions
- **Background sync** when tab gains focus
- **Reconnection handling** when network is restored

## Performance Optimizations

- **Request deduplication** within 2-second windows
- **Stale-while-revalidate** caching strategy
- **Conditional requests** with ETags when supported
- **Pagination** for large datasets
- **Lazy loading** of expensive computations
- **Memory cleanup** on component unmount

## Usage in Components

### Basic Usage
```tsx
function MyComponent() {
  const { providers, isLoading, error } = useProviders();
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {providers?.map(provider => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

### Advanced Usage with Actions
```tsx
function AlertsPanel() {
  const { alerts, mutate } = useAlerts({ isResolved: false });
  
  const markAsRead = async (alertId: string) => {
    // Optimistic update
    mutate(
      alerts?.map(alert => 
        alert.id === alertId 
          ? { ...alert, isRead: true }
          : alert
      ),
      false // Don't revalidate immediately
    );
    
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: true })
      });
      
      // Revalidate after successful update
      mutate();
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    }
  };
  
  return (
    <AlertsList alerts={alerts} onMarkAsRead={markAsRead} />
  );
}
```

## API Endpoints

The hooks interact with these API endpoints:

- `GET /api/providers` - Provider list with stats
- `GET /api/metrics/aggregated` - Aggregated metrics
- `GET /api/metrics/realtime` - Real-time metrics  
- `GET /api/alerts` - User alerts
- `GET /api/alerts/stats` - Alert statistics
- `GET /api/ai/insights` - AI insights
- `GET /api/ai/cost-tracking` - Cost tracking data

## Testing

Mock the hooks in tests:

```tsx
jest.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    providers: { providers: mockProviders },
    metrics: { metrics: mockMetrics },
    isLoading: false,
    hasError: false,
    refreshAll: jest.fn()
  })
}));
```

## Future Enhancements

- **WebSocket integration** for true real-time updates
- **Offline support** with service workers
- **Push notifications** for critical alerts
- **Data export** functionality
- **Custom refresh intervals** per user preferences
- **Advanced filtering** and search capabilities