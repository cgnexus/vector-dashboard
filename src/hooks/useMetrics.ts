import useSWR from 'swr';

interface AggregatedMetrics {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  requestsChange: number;
  costChange: number;
  responseTimeChange: number;
  errorRateChange: number;
  providersBreakdown: {
    providerId: string;
    providerName: string;
    requests: number;
    cost: number;
    responseTime: number;
    errorRate: number;
  }[];
  timeSeriesData: {
    timestamp: string;
    requests: number;
    cost: number;
    responseTime: number;
    errors: number;
  }[];
}

interface RealtimeMetrics {
  currentRequests: number;
  currentCost: number;
  activeConnections: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  alerts: {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  return response.json();
};

export function useAggregatedMetrics(options?: {
  providerId?: string;
  startDate?: string;
  endDate?: string;
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.providerId) params.append('providerId', options.providerId);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const url = `/api/metrics/aggregated${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: AggregatedMetrics }>(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    metrics: data?.data,
    isLoading,
    error,
    mutate
  };
}

export function useRealtimeMetrics(options?: {
  refreshInterval?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<{ data: RealtimeMetrics }>(
    '/api/metrics/realtime',
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 5000, // 5 seconds for real-time
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    metrics: data?.data,
    isLoading,
    error,
    mutate
  };
}

export function useTimeSeriesMetrics(options?: {
  providerId?: string;
  startDate?: string;
  endDate?: string;
  interval?: string;
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.providerId) params.append('providerId', options.providerId);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.interval) params.append('interval', options.interval);

  const url = `/api/metrics/timeseries${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 60000, // 1 minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    timeSeries: data?.data,
    isLoading,
    error,
    mutate
  };
}

export type { AggregatedMetrics, RealtimeMetrics };