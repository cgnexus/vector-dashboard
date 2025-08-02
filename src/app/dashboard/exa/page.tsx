import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Settings, RefreshCw, DollarSign, TrendingUp, Search } from "lucide-react";

export default function ExaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight api-exa neon-text">
            Exa API Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor your Exa API search queries, performance, and costs
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
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500 neon-glow" />
            <span className="font-medium text-yellow-400">Exa API - Performance Warning</span>
            <Badge variant="outline" className="ml-auto">warning</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-exa neon-text">5.2K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-exa neon-text">$23.45</div>
            <p className="text-xs text-muted-foreground">+21% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-exa neon-text">567ms</div>
            <p className="text-xs text-muted-foreground">+12% slower</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-exa neon-text">1.2%</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 api-exa" />
            Exa Search Analytics
          </CardTitle>
          <CardDescription>Advanced search monitoring features in development</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Intelligence Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re building comprehensive Exa API monitoring including search quality metrics, 
              query optimization suggestions, and detailed performance analytics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Query Analytics</Badge>
              <Badge variant="outline">Result Quality</Badge>
              <Badge variant="outline">Performance Tracking</Badge>
              <Badge variant="outline">Cost Optimization</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}