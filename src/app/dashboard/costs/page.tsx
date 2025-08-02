import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Plus,
  Settings
} from "lucide-react";

// Mock data for cost management
const monthlySpend = {
  current: 261.00,
  budget: 500.00,
  lastMonth: 241.50,
  percentageUsed: 52.2
};

const apiCosts = [
  {
    name: "OpenAI",
    current: 89.32,
    budget: 150.00,
    lastMonth: 82.45,
    trend: "up",
    class: "api-openai"
  },
  {
    name: "Twilio", 
    current: 67.89,
    budget: 100.00,
    lastMonth: 71.20,
    trend: "down",
    class: "api-twilio"
  },
  {
    name: "OpenRouter",
    current: 45.78,
    budget: 80.00,
    lastMonth: 39.60,
    trend: "up", 
    class: "api-openrouter"
  },
  {
    name: "Apollo",
    current: 34.56,
    budget: 70.00,
    lastMonth: 28.90,
    trend: "up",
    class: "api-apollo"
  },
  {
    name: "Exa API",
    current: 23.45,
    budget: 50.00,
    lastMonth: 19.35,
    trend: "up",
    class: "api-exa"
  }
];

const budgetAlerts = [
  {
    id: 1,
    api: "OpenAI",
    type: "approaching_limit",
    threshold: 80,
    current: 59.5,
    severity: "warning",
    message: "OpenAI costs are at 59.5% of monthly budget"
  },
  {
    id: 2,
    api: "Twilio",
    type: "budget_exceeded",
    threshold: 70,
    current: 67.9,
    severity: "high",
    message: "Twilio approaching 70% threshold"
  }
];

const costBreakdown = [
  { category: "AI Model Inference", amount: 156.78, percentage: 60 },
  { category: "SMS/Voice", amount: 67.89, percentage: 26 },
  { category: "Search & Analytics", amount: 23.45, percentage: 9 },
  { category: "GraphQL Operations", amount: 12.88, percentage: 5 }
];

export default function CostsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text">
            Cost Management
          </h1>
          <p className="text-muted-foreground">
            Monitor spending, set budgets, and optimize API costs across all services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button className="neon-glow">
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Monthly Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
          <CardDescription>Current month spending vs budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold neon-text">
                  ${monthlySpend.current.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  of ${monthlySpend.budget.toFixed(2)} budget
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">
                    +{((monthlySpend.current - monthlySpend.lastMonth) / monthlySpend.lastMonth * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span>{monthlySpend.percentageUsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full neon-glow transition-all duration-500" 
                  style={{ width: `${monthlySpend.percentageUsed}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Cost Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>API Cost Breakdown</CardTitle>
          <CardDescription>Spending by service this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiCosts.map((api) => (
              <div key={api.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${api.class}`}>{api.name}</span>
                    {api.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${api.current.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      of ${api.budget.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full neon-glow transition-all duration-500`}
                      style={{ 
                        width: `${(api.current / api.budget) * 100}%`,
                        backgroundColor: `var(--${api.class.replace('api-', 'neon-')})`
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {((api.current / api.budget) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Alerts */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Budget Alerts
            </CardTitle>
            <CardDescription>Active cost warnings and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="border border-orange-500/20 bg-orange-500/5 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{alert.api}</span>
                    <Badge 
                      variant={alert.severity === "high" ? "destructive" : "default"}
                      className="neon-glow"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${(alert.current / alert.threshold) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.current}% of {alert.threshold}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Categories */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Cost Categories</CardTitle>
            <CardDescription>Spending breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costBreakdown.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm font-medium">${category.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full neon-glow"
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Optimization Tips */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Cost Optimization Recommendations</CardTitle>
          <CardDescription>Ways to reduce your API spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium mb-2">Optimize OpenAI Usage</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Consider using GPT-3.5-Turbo for simpler tasks to reduce costs by up to 90%
              </p>
              <Badge variant="outline">Potential savings: $25/month</Badge>
            </div>
            <div className="border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium mb-2">Batch API Requests</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Group multiple requests together to reduce overhead and improve efficiency
              </p>
              <Badge variant="outline">Potential savings: $15/month</Badge>
            </div>
            <div className="border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium mb-2">Set Rate Limits</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Implement intelligent rate limiting to prevent unexpected cost spikes
              </p>
              <Badge variant="outline">Risk reduction: High</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}