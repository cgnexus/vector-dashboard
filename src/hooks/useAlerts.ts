import useSWR from 'swr';

interface Alert {
  id: string;
  type: 'cost_threshold' | 'rate_limit' | 'error_rate' | 'downtime' | 'budget_exceeded' | 'slow_response';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  providerId?: string;
  providerName?: string;
  isRead: boolean;
  isResolved: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AlertsResponse {
  data: Alert[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AlertsStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
};

export function useAlerts(options?: {
  providerId?: string;
  type?: Alert['type'];
  severity?: Alert['severity'];
  isRead?: boolean;
  isResolved?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.providerId) params.append('providerId', options.providerId);
  if (options?.type) params.append('type', options.type);
  if (options?.severity) params.append('severity', options.severity);
  if (options?.isRead !== undefined) params.append('isRead', options.isRead.toString());
  if (options?.isResolved !== undefined) params.append('isResolved', options.isResolved.toString());
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const url = `/api/alerts${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    alerts: data?.data,
    meta: data?.meta,
    isLoading,
    error,
    mutate
  };
}

export function useAlertsStats(options?: {
  refreshInterval?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<{ data: AlertsStats }>(
    '/api/alerts/stats',
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    stats: data?.data,
    isLoading,
    error,
    mutate
  };
}

// Action functions
export async function markAlertAsRead(alertId: string) {
  const response = await fetch(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isRead: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to mark alert as read');
  }

  return response.json();
}

export async function resolveAlert(alertId: string) {
  const response = await fetch(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isResolved: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to resolve alert');
  }

  return response.json();
}

export async function bulkActionAlerts(alertIds: string[], action: 'markRead' | 'resolve' | 'delete') {
  const response = await fetch('/api/alerts', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alertIds, action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} alerts`);
  }

  return response.json();
}

export type { Alert, AlertsResponse, AlertsStats };