import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, BarChart3, Settings, RefreshCw, DollarSign, TrendingUp, Zap } from "lucide-react";

export default function ApolloPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight api-apollo neon-text">
            Apollo GraphQL Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor your Apollo GraphQL queries, performance, and server costs
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
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 neon-glow" />
            <span className="font-medium text-green-400">Apollo GraphQL server is operational</span>
            <Badge variant="outline" className="ml-auto">active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GraphQL Operations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-apollo neon-text">9.1K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-apollo neon-text">$34.56</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-apollo neon-text">423ms</div>
            <p className="text-xs text-muted-foreground">Stable performance</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-apollo neon-text">99.5%</div>
            <p className="text-xs text-muted-foreground">Excellent reliability</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 api-apollo" />
            Apollo GraphQL Analytics
          </CardTitle>
          <CardDescription>Advanced GraphQL monitoring features in development</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Database className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">GraphQL Intelligence Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re building comprehensive Apollo monitoring including query performance analysis, 
              schema optimization suggestions, and detailed resolver metrics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Query Analytics</Badge>
              <Badge variant="outline">Schema Insights</Badge>
              <Badge variant="outline">Resolver Performance</Badge>
              <Badge variant="outline">Cache Optimization</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}