"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  AlertTriangle
} from "lucide-react";

// Import our chart components
import {
  TimeSeriesChart,
  ComparisonChart,
  CostBreakdownChart,
  HeatmapChart,
  DistributionChart,
  generateDistributionData
} from '@/components/charts';

// Import analytics components
import { ExportButton } from '@/components/analytics/ExportButton';
import { DateRangePicker, useDateRange } from '@/components/analytics/DateRangePicker';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';
import { ScheduledReportModal } from '@/components/analytics/ScheduledReportModal';

// Import hooks
import { useAnalytics, useTimeSeriesData, useComparisonData } from '@/hooks/useAnalytics';


export default function AnalyticsPage() {
  const { dateRange, setDateRange } = useDateRange();
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data, 
    timeSeriesData, 
    apiMetrics, 
    errorAnalysis, 
    usagePatterns,
    isLoading, 
    error 
  } = useAnalytics(dateRange);

  
  const apiComparisonData = useComparisonData(apiMetrics, 'requests');
  const responseTimeComparisonData = useComparisonData(apiMetrics, 'avgResponseTime');
  const costComparisonData = useComparisonData(apiMetrics, 'cost');

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would trigger a data refetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to Load Analytics</h3>
          <p className="text-muted-foreground mb-4">There was an error loading the analytics data.</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Generate mock distribution data
  const responseTimeDistribution = generateDistributionData(
    Array.from({ length: 1000 }, () => Math.floor(Math.random() * 800) + 100)
  );

  // Generate cost breakdown data
  const costBreakdownData = apiMetrics?.map((api) => ({
    name: api.name,
    value: api.cost,
    percentage: (api.cost / apiMetrics.reduce((sum, a) => sum + a.cost, 0)) * 100,
    requests: api.requests,
    avgCost: api.cost / api.requests
  })) || [];

  const totalCost = costBreakdownData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6" id="analytics-dashboard">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text">
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of API usage patterns, performance, and trends
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
          <ExportButton 
            data={{ timeSeriesData, apiMetrics, errorAnalysis }}
            filename="nexus-analytics"
          />
          <ReportBuilder 
            data={{ timeSeriesData, apiMetrics, errorAnalysis }}
          />
          <ScheduledReportModal />
          <Button 
            className="neon-glow" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              {data.summary.responseTimeTrend < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {data.summary.avgResponseTime}ms
              </div>
              <p className={`text-xs ${
                data.summary.responseTimeTrend < 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.summary.responseTimeTrend < 0 ? '' : '+'}{data.summary.responseTimeTrend.toFixed(1)}% vs previous period
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {data.summary.avgSuccessRate}%
              </div>
              <p className="text-xs text-green-500">
                Excellent performance
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              {data.summary.requestsTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                {data.summary.totalRequests.toLocaleString()}
              </div>
              <p className={`text-xs ${
                data.summary.requestsTrend > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.summary.requestsTrend > 0 ? '+' : ''}{data.summary.requestsTrend.toFixed(1)}% growth
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold neon-text">
                ${data.summary.totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                For selected period
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Series Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TimeSeriesChart
          data={timeSeriesData?.map(d => ({ 
            date: d.timestamp, 
            requests: d.requests, 
            cost: d.cost 
          })) || []}
          title="Usage & Cost Trends"
          metrics={[
            { key: 'requests', label: 'Requests', color: 'hsl(var(--neon-cyan))', yAxisId: 'left', unit: '' },
            { key: 'cost', label: 'Cost', color: 'hsl(var(--neon-purple))', yAxisId: 'right', unit: '$' }
          ]}
          type="area"
          height={350}
        />

        <TimeSeriesChart
          data={timeSeriesData?.map(d => ({ 
            date: d.timestamp, 
            responseTime: d.responseTime, 
            errorRate: d.errorRate 
          })) || []}
          title="Performance Metrics"
          metrics={[
            { key: 'responseTime', label: 'Response Time', color: 'hsl(var(--neon-green))', unit: 'ms' },
            { key: 'errorRate', label: 'Error Rate', color: 'hsl(var(--neon-red))', unit: '%' }
          ]}
          type="line"
          height={350}
        />
      </div>

      {/* Comparison Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ComparisonChart
          data={apiComparisonData}
          title="Requests by API"
          metric="Total Requests"
          type="bar"
          height={300}
        />

        <ComparisonChart
          data={responseTimeComparisonData}
          title="Response Times"
          metric="Average Response Time"
          unit="ms"
          type="bar"
          height={300}
        />

        <ComparisonChart
          data={costComparisonData}
          title="Costs by API"
          metric="Total Cost"
          unit="$"
          type="bar"
          height={300}
        />
      </div>

      {/* Advanced Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CostBreakdownChart
          data={costBreakdownData}
          title="Cost Distribution"
          totalCost={totalCost}
          height={350}
          showInner={true}
        />

        <DistributionChart
          data={responseTimeDistribution}
          title="Response Time Distribution"
          metric="Response Time"
          unit="ms"
          type="area"
          height={350}
          showStats={true}
        />
      </div>

      {/* Usage Patterns Heatmap */}
      {usagePatterns && usagePatterns.length > 0 && (
        <HeatmapChart
          data={usagePatterns}
          title="Usage Patterns by Hour & Day"
          metric="requests"
          height={400}
        />
      )}

      {/* Top Endpoints & Error Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Endpoints */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Most frequently used API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topEndpoints?.slice(0, 10).map((endpoint, index) => (
                <div key={`${endpoint.provider}-${endpoint.endpoint}`} className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/20 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {endpoint.provider}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {endpoint.requests.toLocaleString()} requests • 
                      Avg cost: ${endpoint.avgCost.toFixed(4)}
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>

        {/* Error Analysis */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Error Analysis</CardTitle>
            <CardDescription>Breakdown of API errors by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errorAnalysis?.map((error) => (
                <div key={error.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{error.type}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{error.count}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({error.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${error.percentage}%` }}
                    />
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
          <CardDescription>Data-driven suggestions to optimize your API usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-green-400">Performance Status</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {data?.summary.responseTimeTrend && data.summary.responseTimeTrend < 0 
                  ? `Response times improved by ${Math.abs(data.summary.responseTimeTrend).toFixed(1)}% this period.` 
                  : 'Response times are within normal ranges.'}
              </p>
              <Badge variant="outline" className="text-green-500 border-green-500">
                {data?.summary.responseTimeTrend && data.summary.responseTimeTrend < 0 ? 'Improving' : 'Stable'}
              </Badge>
            </div>
            
            <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-blue-400">Usage Growth</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {data?.summary.requestsTrend && data.summary.requestsTrend > 0 
                  ? `${data.summary.requestsTrend.toFixed(1)}% increase in total requests. Strong adoption trends.` 
                  : 'Request volume is stable with consistent usage patterns.'}
              </p>
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                {data?.summary.requestsTrend && data.summary.requestsTrend > 0 ? 'Growing' : 'Stable'}
              </Badge>
            </div>
            
            <div className="border border-purple-500/20 bg-purple-500/5 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-purple-400">Cost Efficiency</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Current cost per request: ${((data?.summary.totalCost || 0) / (data?.summary.totalRequests || 1)).toFixed(5)}. 
                {costBreakdownData.length > 0 && (
                  ` Most efficient: ${costBreakdownData.reduce((prev, current) => 
                    (prev.avgCost || 0) < (current.avgCost || 0) ? prev : current
                  ).name}.`
                )}
              </p>
              <Badge variant="outline" className="text-purple-500 border-purple-500">Optimized</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      )}
    </div>
  );
}