import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Filter
} from "lucide-react";

// Mock data for alerts
const alertsData = [
  {
    id: 1,
    type: "cost_threshold",
    severity: "high",
    title: "OpenAI Budget Alert",
    message: "OpenAI costs have reached 85% of your monthly budget ($127.50 of $150.00)",
    provider: "OpenAI",
    isRead: false,
    isResolved: false,
    createdAt: "2024-01-15T10:30:00Z",
    metadata: {
      currentSpend: 127.50,
      budgetLimit: 150.00,
      threshold: 85
    }
  },
  {
    id: 2,
    type: "error_rate",
    severity: "medium",
    title: "Elevated Error Rate Detected",
    message: "Exa API error rate has increased to 2.3% over the last hour",
    provider: "Exa API",
    isRead: true,
    isResolved: false,
    createdAt: "2024-01-15T09:15:00Z",
    metadata: {
      errorRate: 2.3,
      threshold: 2.0,
      timeWindow: "1 hour"
    }
  },
  {
    id: 3,
    type: "rate_limit",
    severity: "low",
    title: "Rate Limit Warning",
    message: "Twilio API approaching rate limit (45 of 50 requests per minute)",
    provider: "Twilio",
    isRead: true,
    isResolved: true,
    createdAt: "2024-01-15T08:45:00Z",
    resolvedAt: "2024-01-15T09:00:00Z",
    metadata: {
      currentRate: 45,
      rateLimit: 50,
      window: "per minute"
    }
  },
  {
    id: 4,
    type: "downtime",
    severity: "critical",
    title: "Service Unavailable",
    message: "Apollo GraphQL endpoint returning 503 errors",
    provider: "Apollo",
    isRead: false,
    isResolved: true,
    createdAt: "2024-01-15T07:20:00Z",
    resolvedAt: "2024-01-15T07:35:00Z",
    metadata: {
      statusCode: 503,
      duration: "15 minutes"
    }
  },
  {
    id: 5,
    type: "performance",
    severity: "medium",
    title: "Slow Response Times",
    message: "OpenRouter API response times above 2s for the last 30 minutes",
    provider: "OpenRouter",
    isRead: true,
    isResolved: false,
    createdAt: "2024-01-15T06:30:00Z",
    metadata: {
      avgResponseTime: 2.3,
      threshold: 2.0,
      duration: "30 minutes"
    }
  }
];

const alertStats = {
  total: alertsData.length,
  unread: alertsData.filter(a => !a.isRead).length,
  unresolved: alertsData.filter(a => !a.isResolved).length,
  critical: alertsData.filter(a => a.severity === "critical").length
};

const alertTypes = [
  { type: "cost_threshold", count: 1, color: "text-yellow-500" },
  { type: "error_rate", count: 1, color: "text-orange-500" },
  { type: "rate_limit", count: 1, color: "text-blue-500" },
  { type: "downtime", count: 1, color: "text-red-500" },
  { type: "performance", count: 1, color: "text-purple-500" }
];

function getSeverityBadgeProps(severity: string) {
  switch (severity) {
    case "critical":
      return { variant: "destructive" as const, className: "neon-glow" };
    case "high":
      return { variant: "destructive" as const };
    case "medium":
      return { variant: "default" as const };
    default:
      return { variant: "secondary" as const };
  }
}

function getProviderClass(provider: string) {
  switch (provider.toLowerCase()) {
    case "openai":
      return "api-openai";
    case "openrouter":
      return "api-openrouter";
    case "exa api":
      return "api-exa";
    case "twilio":
      return "api-twilio";
    case "apollo":
      return "api-apollo";
    default:
      return "";
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Less than an hour ago";
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text">
            Alerts & Notifications
          </h1>
          <p className="text-muted-foreground">
            Monitor system alerts, warnings, and notifications across all APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="neon-glow">
            <Plus className="mr-2 h-4 w-4" />
            Create Alert Rule
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text">{alertStats.total}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 neon-text">
              {alertStats.unread}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 neon-text">
              {alertStats.unresolved}
            </div>
            <p className="text-xs text-muted-foreground">Need resolution</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 neon-text">
              {alertStats.critical}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alert List */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alertsData.map((alert) => (
                <div 
                  key={alert.id}
                  className={`border rounded-lg p-4 space-y-3 transition-colors ${
                    !alert.isRead ? "border-primary/50 bg-primary/5" : "border-border/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        {!alert.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary neon-glow" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={getProviderClass(alert.provider)}>
                          {alert.provider}
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(alert.createdAt)}</span>
                        {alert.isResolved && alert.resolvedAt && (
                          <>
                            <span>•</span>
                            <span className="text-green-500">
                              Resolved {formatTimeAgo(alert.resolvedAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge {...getSeverityBadgeProps(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.isResolved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.isRead && (
                      <Button variant="outline" size="sm">
                        Mark as Read
                      </Button>
                    )}
                    {!alert.isResolved && (
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Types & Quick Actions */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Alert Types</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertTypes.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${type.color.replace('text-', 'bg-')}`} />
                      <span className="text-sm font-medium capitalize">
                        {type.type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="outline">{type.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage alerts efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter by Severity
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Alert Rule
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>Active monitoring rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Cost threshold alerts</span>
                  <Badge variant="outline" className="text-green-500">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error rate monitoring</span>
                  <Badge variant="outline" className="text-green-500">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response time alerts</span>
                  <Badge variant="outline" className="text-green-500">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Downtime detection</span>
                  <Badge variant="outline" className="text-green-500">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}