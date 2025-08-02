'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedMetric } from "@/components/ui/animated-metric";
import { ApiCard } from "@/components/ui/api-card";
import { NotificationPanel } from "@/components/ui/notification-panel";
import { HoloLoader } from "@/components/ui/holo-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboard, useSystemHealth } from "@/hooks/useDashboard";
import {
  formatNumber,
  formatCurrency,
  formatResponseTime,
  formatErrorRate,
  formatTimeAgo,
  getProviderClass,
  getTrendDirection
} from "@/lib/data-utils";
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  RefreshCw
} from "lucide-react";


export default function DashboardPage() {
  // Use the comprehensive dashboard hook
  const dashboard = useDashboard({
    enableRealTimeUpdates: true,
    activeProvidersOnly: true,
    unresolvedAlertsOnly: true,
    autoRefreshOnError: true
  });
  
  // Destructure for easier access
  const { 
    providers, 
    metrics, 
    realtime, 
    alerts, 
    alertStats,
    isLoading, 
    hasError,
    refreshAll 
  } = dashboard;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight neon-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Nexus Control Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor your API ecosystem in real-time with advanced telemetry
            </p>
          </div>
        </div>
        <EmptyState
          title="Unable to load dashboard data"
          description="There was an error loading your dashboard. Please try refreshing the page."
          action={
            <Button onClick={refreshAll} className="cyber-button neon-glow">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight neon-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nexus Control Center
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor your API ecosystem in real-time with advanced telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <HoloLoader size="sm" />}
          <Button 
            onClick={refreshAll} 
            disabled={isLoading}
            className="cyber-button neon-glow"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card border-primary/20 p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </Card>
          ))
        ) : (
          <>
            <AnimatedMetric
              title="Total Requests"
              value={metrics.metrics ? formatNumber(metrics.metrics.totalRequests) : "0"}
              change={metrics.metrics ? `${metrics.metrics.requestsChange > 0 ? '+' : ''}${metrics.metrics.requestsChange.toFixed(1)}% from last month` : "No data"}
              icon={Activity}
              trend={metrics.metrics ? (metrics.metrics.requestsChange > 0 ? 'up' : metrics.metrics.requestsChange < 0 ? 'down' : 'neutral') : 'neutral'}
            />
            
            <AnimatedMetric
              title="Total Cost"
              value={metrics.metrics ? formatCurrency(metrics.metrics.totalCost) : "$0.00"}
              change={metrics.metrics ? `${metrics.metrics.costChange > 0 ? '+' : ''}${metrics.metrics.costChange.toFixed(1)}% from last month` : "No data"}
              icon={DollarSign}
              trend={metrics.metrics ? (metrics.metrics.costChange > 0 ? 'up' : metrics.metrics.costChange < 0 ? 'down' : 'neutral') : 'neutral'}
            />
            
            <AnimatedMetric
              title="Avg Response Time"
              value={realtime.metrics ? formatResponseTime(realtime.metrics.averageResponseTime) : metrics.metrics ? formatResponseTime(metrics.metrics.averageResponseTime) : "0ms"}
              change={metrics.metrics ? `${metrics.metrics.responseTimeChange > 0 ? '+' : ''}${metrics.metrics.responseTimeChange.toFixed(1)}% from last month` : "No data"}
              icon={TrendingUp}
              trend={metrics.metrics ? (metrics.metrics.responseTimeChange < 0 ? 'up' : metrics.metrics.responseTimeChange > 0 ? 'down' : 'neutral') : 'neutral'}
            />
            
            <AnimatedMetric
              title="Active Alerts"
              value={alertStats.stats ? alertStats.stats.total.toString() : "0"}
              change={alertStats.stats ? `${alertStats.stats.bySeverity?.critical || 0} critical, ${alertStats.stats.bySeverity?.high || 0} high, ${alertStats.stats.bySeverity?.medium || 0} medium` : "No alerts"}
              icon={AlertTriangle}
              trend={alertStats.stats && alertStats.stats.total > 0 ? 'up' : 'neutral'}
            />
          </>
        )}
      </div>

      {/* API Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons for API cards
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-card border-primary/20 p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))
        ) : providers.providers && providers.providers.length > 0 ? (
          providers.providers.map((provider) => {
            // Find provider stats from metrics breakdown
            const providerMetrics = metrics.metrics?.providersBreakdown?.find(
              p => p.providerId === provider.id
            );
            
            return (
              <ApiCard
                key={provider.id}
                name={provider.displayName}
                status={provider.status}
                requests={formatNumber(providerMetrics?.requests || provider.stats.totalRequests)}
                cost={formatCurrency(providerMetrics?.cost || provider.stats.totalCost)}
                responseTime={formatResponseTime(providerMetrics?.responseTime || provider.stats.averageResponseTime)}
                errorRate={formatErrorRate(providerMetrics?.errorRate || provider.stats.errorRate)}
                apiClass={getProviderClass(provider.name)}
                trend={{
                  requests: getTrendDirection(providerMetrics?.requests || provider.stats.totalRequests, provider.stats.totalRequests),
                  cost: getTrendDirection(providerMetrics?.cost || provider.stats.totalCost, provider.stats.totalCost),
                  responseTime: getTrendDirection(providerMetrics?.responseTime || provider.stats.averageResponseTime, provider.stats.averageResponseTime),
                  errorRate: getTrendDirection(providerMetrics?.errorRate || provider.stats.errorRate, provider.stats.errorRate)
                }}
                onViewDetails={() => console.log(`View details for ${provider.displayName}`)}
              />
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              title="No API providers found"
              description="Start by adding your first API provider to begin monitoring."
              action={
                <Button className="cyber-button neon-glow">
                  <Zap className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      {isLoading ? (
        <Card className="glass-card border-primary/20 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : alerts.alerts && alerts.alerts.length > 0 ? (
        <NotificationPanel
          notifications={alerts.alerts.map(alert => ({
            id: parseInt(alert.id),
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            time: formatTimeAgo(alert.createdAt),
            provider: alert.providerName || 'System',
            isRead: alert.isRead
          }))}
          onMarkAsRead={async (id) => {
            try {
              // Update alert status via API
              await fetch(`/api/alerts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true })
              });
              // Refresh alerts
              await alerts.mutate();
            } catch (error) {
              console.error('Failed to mark alert as read:', error);
            }
          }}
          onDismiss={async (id) => {
            try {
              // Resolve alert via API
              await fetch(`/api/alerts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isResolved: true })
              });
              // Refresh alerts
              await alerts.mutate();
            } catch (error) {
              console.error('Failed to dismiss alert:', error);
            }
          }}
          onViewAll={() => window.location.href = '/dashboard/alerts'}
        />
      ) : (
        <Card className="glass-card border-primary/20 p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No active alerts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your system is running smoothly. All metrics are within normal ranges.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}