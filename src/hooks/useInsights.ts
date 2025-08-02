import useSWR from 'swr';

interface DataQuality {
  isValid: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

interface Anomaly {
  type: 'cost_spike' | 'error_surge' | 'latency_increase' | 'usage_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  value: number;
  threshold: number;
  timestamp: string;
  providerId?: string;
}

interface OptimizationPotential {
  totalSavings: number;
  potentialSavings: {
    providerId: string;
    providerName: string;
    currentCost: number;
    optimizedCost: number;
    savings: number;
    recommendations: string[];
  }[];
  quickWins: {
    action: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    estimatedSavings: number;
  }[];
}

interface FullInsights {
  summary: {
    totalCost: number;
    totalRequests: number;
    averageResponseTime: number;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  trends: {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    insights: string[];
  };
  predictions: {
    nextMonthCost: number;
    nextMonthRequests: number;
    confidence: number;
    factors: string[];
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'cost' | 'performance' | 'reliability' | 'optimization';
    title: string;
    description: string;
    estimatedImpact: string;
    actionItems: string[];
  }[];
}

interface CostTracking {
  currentSpend: number;
  projectedSpend: number;
  budgetUtilization: number;
  burnRate: number;
  costBreakdown: {
    providerId: string;
    providerName: string;
    cost: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  budgetAlerts: {
    type: 'approaching' | 'exceeded' | 'critical';
    threshold: number;
    current: number;
    message: string;
  }[];
}

interface InsightsResponse<T> {
  success: boolean;
  insights: T & { type: string; dataQuality: DataQuality };
  metadata: {
    metricsCount: number;
    dateRange: {
      start: string;
      end: string;
    };
    providerId: string;
    generatedAt: string;
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }
  return response.json();
};

export function useInsights(options?: {
  providerId?: string;
  days?: number;
  type?: 'full' | 'quick' | 'optimization';
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.providerId) params.append('providerId', options.providerId);
  if (options?.days) params.append('days', options.days.toString());
  if (options?.type) params.append('type', options.type);

  const url = `/api/ai/insights${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<InsightsResponse<FullInsights>>(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 120000, // 2 minutes (AI insights are expensive)
      revalidateOnFocus: false, // Don't refetch on focus for AI insights
      revalidateOnReconnect: true
    }
  );

  return {
    insights: data?.insights,
    metadata: data?.metadata,
    isLoading,
    error,
    mutate
  };
}

export function useQuickInsights(options?: {
  refreshInterval?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<InsightsResponse<{ anomalies: Anomaly[] }>>(
    '/api/ai/insights?type=quick',
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 60000, // 1 minute for quick insights
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    quickInsights: data?.insights,
    metadata: data?.metadata,
    isLoading,
    error,
    mutate
  };
}

export function useOptimizationInsights(options?: {
  providerId?: string;
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.providerId) params.append('providerId', options.providerId);
  params.append('type', 'optimization');

  const url = `/api/ai/insights?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<InsightsResponse<OptimizationPotential>>(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 300000, // 5 minutes for optimization insights
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  return {
    optimizationInsights: data?.insights,
    metadata: data?.metadata,
    isLoading,
    error,
    mutate
  };
}

export function useCostTracking(options?: {
  refreshInterval?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<{ data: CostTracking }>(
    '/api/ai/cost-tracking',
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 60000, // 1 minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    costTracking: data?.data,
    isLoading,
    error,
    mutate
  };
}

// Feedback function
export async function submitInsightFeedback(
  insightId: string,
  insightType: string,
  feedback: 'helpful' | 'not_helpful' | 'incorrect' | 'implemented',
  rating?: number,
  comment?: string
) {
  const response = await fetch('/api/ai/insights/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      insightId,
      insightType,
      feedback,
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  return response.json();
}

export type {
  DataQuality,
  Anomaly,
  OptimizationPotential,
  FullInsights,
  CostTracking,
  InsightsResponse
};