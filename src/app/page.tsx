import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background gradient-bg p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary neon-glow flex items-center justify-center">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight neon-text">
            Nexus API Monitor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unified dashboard for monitoring OpenAI, OpenRouter, Exa API, Twilio, and Apollo APIs. 
            Track costs, performance, and optimize your API usage in real-time.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="neon-glow">Real-time Monitoring</Badge>
            <Badge variant="secondary">Cost Optimization</Badge>
            <Badge variant="outline">Performance Analytics</Badge>
            <Badge variant="secondary">Smart Alerts</Badge>
            <Badge variant="outline">Multi-API Support</Badge>
          </div>
          <div className="pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="neon-glow text-lg px-8 py-3">
                <Activity className="mr-2 h-5 w-5" />
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 api-openai">
                <Zap className="h-5 w-5" />
                OpenAI Monitoring
              </CardTitle>
              <CardDescription>
                Track GPT model usage, costs, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor token usage, response times, and optimize your AI model costs with detailed analytics.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 api-openrouter">
                <Shield className="h-5 w-5" />
                OpenRouter Analytics
              </CardTitle>
              <CardDescription>
                Multi-model routing and cost optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze model performance across providers and optimize routing for cost and speed.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 hover:border-cyan-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 api-exa">
                <Activity className="h-5 w-5" />
                Search Intelligence
              </CardTitle>
              <CardDescription>
                Exa API search analytics and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track search quality, query performance, and optimize your semantic search costs.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 hover:border-orange-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 api-apollo">
                <BarChart3 className="h-5 w-5" />
                Communication & Data
              </CardTitle>
              <CardDescription>
                Twilio & Apollo GraphQL monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor SMS/voice costs and GraphQL query performance in one unified dashboard.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Real-time Analytics
              </CardTitle>
              <CardDescription>Live monitoring and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant visibility into API performance, costs, and usage patterns across all your services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Smart Alerts
              </CardTitle>
              <CardDescription>Proactive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set custom thresholds for costs, errors, and performance. Get notified before issues impact your users.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Cost Optimization
              </CardTitle>
              <CardDescription>Intelligent recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered suggestions to reduce costs, improve performance, and optimize your API usage patterns.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold neon-text">Ready to Monitor Your APIs?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join developers who are already optimizing their API costs and performance with Nexus. 
                Start monitoring in minutes, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <Button size="lg" className="neon-glow">
                    <Activity className="mr-2 h-5 w-5" />
                    Start Monitoring
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="outline" size="lg">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
