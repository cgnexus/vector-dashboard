import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedMetric } from "@/components/ui/animated-metric";
import { StatusOrb } from "@/components/ui/status-orb";
import { NeonChart, PerformanceChart } from "@/components/ui/neon-chart";
import { HoloSpinner } from "@/components/ui/holo-loader";
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Settings,
  RefreshCw,
  Eye,
  Download,
  Key,
  Shield,
  BarChart3,
  Bell
} from "lucide-react";

// Mock data for OpenAI monitoring
const openaiMetrics = {
  status: "active",
  totalRequests: "12.4K",
  totalCost: "$89.32",
  avgResponseTime: "245ms",
  errorRate: "0.2%",
  tokensUsed: "2.4M",
  modelsUsed: ["gpt-4", "gpt-3.5-turbo", "text-embedding-ada-002"]
};

const recentRequests = [
  {
    id: 1,
    endpoint: "/v1/chat/completions",
    model: "gpt-4",
    tokens: { input: 150, output: 80, total: 230 },
    cost: "$0.0046",
    responseTime: "1.2s",
    status: "success",
    timestamp: "2 minutes ago"
  },
  {
    id: 2,
    endpoint: "/v1/embeddings", 
    model: "text-embedding-ada-002",
    tokens: { input: 500, output: 0, total: 500 },
    cost: "$0.0002",
    responseTime: "0.3s",
    status: "success",
    timestamp: "5 minutes ago"
  },
  {
    id: 3,
    endpoint: "/v1/chat/completions",
    model: "gpt-3.5-turbo",
    tokens: { input: 200, output: 120, total: 320 },
    cost: "$0.0006",
    responseTime: "0.8s", 
    status: "success",
    timestamp: "8 minutes ago"
  },
  {
    id: 4,
    endpoint: "/v1/chat/completions",
    model: "gpt-4",
    tokens: { input: 300, output: 0, total: 300 },
    cost: "$0.0090",
    responseTime: "0.0s",
    status: "error",
    timestamp: "12 minutes ago"
  }
];

const modelBreakdown = [
  { model: "gpt-4", requests: "4.2K", cost: "$54.30", percentage: 60 },
  { model: "gpt-3.5-turbo", requests: "6.8K", cost: "$28.90", percentage: 32 },
  { model: "text-embedding-ada-002", requests: "1.4K", cost: "$6.12", percentage: 8 }
];

export default function OpenAIPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-green to-emerald-500 neon-glow flex items-center justify-center">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight api-openai neon-text bg-gradient-to-r from-neon-green to-emerald-400 bg-clip-text text-transparent">
              OpenAI Control Center
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Advanced monitoring and analytics for your OpenAI integration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HoloSpinner />
          <Button variant="outline" className="cyber-button">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button className="cyber-button neon-glow">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Data
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="glass-card border-neon-green/30 bg-neon-green/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusOrb status="active" size="lg" />
              <div>
                <span className="font-semibold text-neon-green neon-text text-lg">OpenAI API Operational</span>
                <p className="text-sm text-muted-foreground">All systems running normally</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="font-medium text-neon-green">{openaiMetrics.avgResponseTime}</p>
              </div>
              <Badge variant="outline" className="neon-glow capitalize bg-neon-green/10">
                {openaiMetrics.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedMetric
          title="Total Requests"
          value={openaiMetrics.totalRequests}
          change="Last 30 days"
          icon={Activity}
          trend="up"
          className="border-neon-green/30"
        />
        
        <AnimatedMetric
          title="Total Cost"
          value={openaiMetrics.totalCost}
          change="+8% from last month"
          icon={DollarSign}
          trend="up"
          className="border-neon-green/30"
        />
        
        <AnimatedMetric
          title="Avg Response Time"
          value={openaiMetrics.avgResponseTime}
          change="-5% improvement"
          icon={TrendingUp}
          trend="down"
          className="border-neon-green/30"
        />
        
        <AnimatedMetric
          title="Tokens Used"
          value={openaiMetrics.tokensUsed}
          change={`Error rate: ${openaiMetrics.errorRate}`}
          icon={Zap}
          trend="neutral"
          className="border-neon-green/30"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <PerformanceChart className="h-full" />
        </div>
        
        {/* Model Usage Breakdown */}
        <Card className="glass-card border-neon-green/30 circuit-pattern">
          <CardHeader>
            <CardTitle className="neon-text flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Model Distribution
            </CardTitle>
            <CardDescription>
              Cost and request breakdown by AI model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelBreakdown.map((model, index) => (
                <div key={model.model} className="space-y-3 p-3 rounded-lg border border-neon-green/20 hover:border-neon-green/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusOrb status="active" size="sm" />
                      <span className="font-medium text-sm">{model.model}</span>
                    </div>
                    <span className="api-openai neon-text font-semibold">{model.cost}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{model.requests} requests</span>
                      <span>{model.percentage}%</span>
                    </div>
                    <div className="neon-progress h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-neon-green to-emerald-400 transition-all duration-1000 rounded-full" 
                        style={{ 
                          width: `${model.percentage}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Requests */}
        <Card className="glass-card border-neon-green/30 grid-pattern">
          <CardHeader>
            <CardTitle className="neon-text flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live API Stream
            </CardTitle>
            <CardDescription>Real-time OpenAI API request monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {recentRequests.map((request, index) => (
                <div 
                  key={request.id}
                  className="glass-card border border-neon-green/20 rounded-lg p-4 space-y-3 hover:border-neon-green/40 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono bg-neon-green/10 text-neon-green px-3 py-1 rounded-full border border-neon-green/20">
                      {request.endpoint}
                    </code>
                    <div className="flex items-center gap-2">
                      <StatusOrb 
                        status={request.status === "success" ? "active" : "error"} 
                        size="sm" 
                      />
                      <Badge 
                        variant={request.status === "success" ? "default" : "destructive"}
                        className="neon-glow text-xs"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Model</span>
                      <p className="font-medium">{request.model}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Cost</span>
                      <p className="font-medium text-neon-green">{request.cost}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Tokens</span>
                      <p className="font-medium">{request.tokens.total}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Response</span>
                      <p className="font-medium">{request.responseTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neon-green/20">
                    <p className="text-xs text-muted-foreground">{request.timestamp}</p>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Controls */}
        <Card className="glass-card border-neon-green/30">
          <CardHeader>
            <CardTitle className="neon-text flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Control Panel
            </CardTitle>
            <CardDescription>Manage your OpenAI integration settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="cyber-button justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Cost Alerts
                </Button>
                <Button variant="outline" className="cyber-button justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="cyber-button justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  API Keys
                </Button>
                <Button variant="outline" className="cyber-button justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Rate Limits
                </Button>
              </div>
              
              <div className="pt-4 border-t border-neon-green/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Auto-scaling</p>
                    <p className="text-xs text-muted-foreground">Automatically adjust rate limits</p>
                  </div>
                  <StatusOrb status="active" size="sm" label="Enabled" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}