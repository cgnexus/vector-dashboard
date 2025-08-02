import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Settings, RefreshCw, Activity, DollarSign, TrendingUp } from "lucide-react";

export default function OpenRouterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight api-openrouter neon-text">
            OpenRouter Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor your OpenRouter API usage, costs, and model performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button className="neon-glow">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500 neon-glow" />
            <span className="font-medium text-purple-400">OpenRouter API is operational</span>
            <Badge variant="outline" className="ml-auto">active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-openrouter neon-text">8.7K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-openrouter neon-text">$45.78</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-openrouter neon-text">312ms</div>
            <p className="text-xs text-muted-foreground">-8% improvement</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-openrouter neon-text">0.1%</div>
            <p className="text-xs text-muted-foreground">Excellent reliability</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 api-openrouter" />
            OpenRouter Integration
          </CardTitle>
          <CardDescription>Detailed monitoring features coming soon</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Enhanced Monitoring in Development</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re building comprehensive OpenRouter monitoring features including model performance analysis, 
              cost optimization, and detailed request analytics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Model Analytics</Badge>
              <Badge variant="outline">Cost Tracking</Badge>
              <Badge variant="outline">Performance Metrics</Badge>
              <Badge variant="outline">Route Optimization</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}