"use client";

import { useMemo } from 'react';
import useSWR from 'swr';
import { subDays, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsDataPoint {
  timestamp: string;
  requests: number;
  cost: number;
  responseTime: number;
  errorRate: number;
  successRate: number;
}

export interface ApiMetrics {
  name: string;
  provider: string;
  requests: number;
  avgResponseTime: number;
  successRate: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  endpoints: EndpointMetrics[];
}

export interface EndpointMetrics {
  endpoint: string;
  requests: number;
  avgResponseTime: number;
  avgCost: number;
  errorRate: number;
}

export interface ErrorAnalysis {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface UsagePattern {
  hour: number;
  requests: number;
  cost: number;
  day: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Mock data generator for development
const generateMockData = (days: number): AnalyticsDataPoint[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateRange.map(date => ({
    timestamp: format(date, 'yyyy-MM-dd'),
    requests: Math.floor(Math.random() * 50000) + 20000,
    cost: Math.floor(Math.random() * 500) + 100,
    responseTime: Math.floor(Math.random() * 300) + 200,
    errorRate: Math.random() * 5,
    successRate: 95 + Math.random() * 5
  }));
};

const generateMockApiMetrics = (): ApiMetrics[] => [
  {
    name: "OpenAI",
    provider: "openai",
    requests: 12400,
    avgResponseTime: 245,
    successRate: 99.8,
    cost: 89.32,
    trend: "up",
    endpoints: [
      { endpoint: "/v1/chat/completions", requests: 8200, avgResponseTime: 235, avgCost: 0.0052, errorRate: 0.1 },
      { endpoint: "/v1/embeddings", requests: 4200, avgResponseTime: 165, avgCost: 0.0002, errorRate: 0.2 }
    ]
  },
  {
    name: "Apollo",
    provider: "apollo",
    requests: 9100,
    avgResponseTime: 423,
    successRate: 99.5,
    cost: 34.56,
    trend: "up",
    endpoints: [
      { endpoint: "/graphql", requests: 9100, avgResponseTime: 423, avgCost: 0.0038, errorRate: 0.3 }
    ]
  },
  {
    name: "OpenRouter",
    provider: "openrouter", 
    requests: 8700,
    avgResponseTime: 312,
    successRate: 99.9,
    cost: 45.78,
    trend: "down",
    endpoints: [
      { endpoint: "/api/generation", requests: 6800, avgResponseTime: 298, avgCost: 0.0067, errorRate: 0.1 },
      { endpoint: "/api/models", requests: 1900, avgResponseTime: 156, avgCost: 0.0001, errorRate: 0.0 }
    ]
  },
  {
    name: "Exa API",
    provider: "exa",
    requests: 5200,
    avgResponseTime: 567,
    successRate: 98.8,
    cost: 23.45,
    trend: "down",
    endpoints: [
      { endpoint: "/search", requests: 5200, avgResponseTime: 567, avgCost: 0.0045, errorRate: 1.2 }
    ]
  },
  {
    name: "Twilio",
    provider: "twilio",
    requests: 3800,
    avgResponseTime: 189,
    successRate: 99.7,
    cost: 67.89,
    trend: "up",
    endpoints: [
      { endpoint: "/Messages.json", requests: 2800, avgResponseTime: 178, avgCost: 0.015, errorRate: 0.2 },
      { endpoint: "/Calls.json", requests: 1000, avgResponseTime: 234, avgCost: 0.025, errorRate: 0.4 }
    ]
  }
];

const generateMockErrorAnalysis = (): ErrorAnalysis[] => [
  { type: "Rate Limited", count: 45, percentage: 37.5, trend: "down" },
  { type: "Timeout", count: 32, percentage: 26.7, trend: "up" },
  { type: "Authentication", count: 28, percentage: 23.3, trend: "stable" },
  { type: "Server Error", count: 15, percentage: 12.5, trend: "down" }
];

const generateMockUsagePatterns = (): UsagePattern[] => {
  const patterns: UsagePattern[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher usage during business hours
      const baseRequests = hour >= 9 && hour <= 17 ? 1000 : 300;
      const variance = Math.random() * 500;
      
      patterns.push({
        hour,
        day,
        requests: Math.floor(baseRequests + variance),
        cost: Math.floor((baseRequests + variance) * 0.005)
      });
    }
  });
  
  return patterns;
};

export function useAnalytics(dateRange?: { start: Date; end: Date }) {
  const days = dateRange ? 
    Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 
    30;

  // In a real app, these would fetch from actual API endpoints
  const { data: timeSeriesData, error: timeSeriesError, isLoading: timeSeriesLoading } = useSWR(
    `/api/analytics/timeseries?days=${days}`,
    () => generateMockData(days),
    { refreshInterval: 300000 } // Refresh every 5 minutes
  );

  const { data: apiMetrics, error: apiError, isLoading: apiLoading } = useSWR(
    '/api/analytics/apis',
    () => generateMockApiMetrics(),
    { refreshInterval: 300000 }
  );

  const { data: errorAnalysis, error: errorError, isLoading: errorLoading } = useSWR(
    '/api/analytics/errors',
    () => generateMockErrorAnalysis(),
    { refreshInterval: 300000 }
  );

  const { data: usagePatterns, error: usageError, isLoading: usageLoading } = useSWR(
    '/api/analytics/patterns',
    () => generateMockUsagePatterns(),
    { refreshInterval: 300000 }
  );

  const processedData = useMemo(() => {
    if (!timeSeriesData || !apiMetrics) return null;

    // Calculate summary metrics
    const totalRequests = timeSeriesData.reduce((sum, day) => sum + day.requests, 0);
    const totalCost = timeSeriesData.reduce((sum, day) => sum + day.cost, 0);
    const avgResponseTime = timeSeriesData.reduce((sum, day) => sum + day.responseTime, 0) / timeSeriesData.length;
    const avgSuccessRate = timeSeriesData.reduce((sum, day) => sum + day.successRate, 0) / timeSeriesData.length;

    // Calculate trends (compare last 7 days to previous 7 days)
    const recentData = timeSeriesData.slice(-7);
    const previousData = timeSeriesData.slice(-14, -7);
    
    const recentAvgResponseTime = recentData.reduce((sum, day) => sum + day.responseTime, 0) / recentData.length;
    const previousAvgResponseTime = previousData.reduce((sum, day) => sum + day.responseTime, 0) / previousData.length;
    
    const recentTotalRequests = recentData.reduce((sum, day) => sum + day.requests, 0);
    const previousTotalRequests = previousData.reduce((sum, day) => sum + day.requests, 0);

    const responseTimeTrend = ((recentAvgResponseTime - previousAvgResponseTime) / previousAvgResponseTime) * 100;
    const requestsTrend = ((recentTotalRequests - previousTotalRequests) / previousTotalRequests) * 100;

    return {
      summary: {
        totalRequests,
        totalCost,
        avgResponseTime: Math.round(avgResponseTime),
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
        responseTimeTrend,
        requestsTrend
      },
      timeSeriesData,
      apiMetrics,
      topEndpoints: apiMetrics.flatMap(api => 
        api.endpoints.map(endpoint => ({
          ...endpoint,
          provider: api.name
        }))
      ).sort((a, b) => b.requests - a.requests).slice(0, 10)
    };
  }, [timeSeriesData, apiMetrics]);

  return {
    data: processedData,
    timeSeriesData,
    apiMetrics,
    errorAnalysis,
    usagePatterns,
    isLoading: timeSeriesLoading || apiLoading || errorLoading || usageLoading,
    error: timeSeriesError || apiError || errorError || usageError
  };
}

export function useTimeSeriesData(data: AnalyticsDataPoint[] | undefined, metric: keyof AnalyticsDataPoint) {
  return useMemo(() => {
    if (!data) return [];
    
    return data.map(point => ({
      date: point.timestamp,
      value: point[metric] as number,
      formatted: format(new Date(point.timestamp), 'MMM dd')
    }));
  }, [data, metric]);
}

export function useComparisonData(apiMetrics: ApiMetrics[] | undefined, metric: keyof Pick<ApiMetrics, 'requests' | 'avgResponseTime' | 'cost' | 'successRate'>) {
  return useMemo(() => {
    if (!apiMetrics) return [];
    
    return apiMetrics.map(api => ({
      name: api.name,
      value: api[metric] as number,
      trend: api.trend
    })).sort((a, b) => b.value - a.value);
  }, [apiMetrics, metric]);
}