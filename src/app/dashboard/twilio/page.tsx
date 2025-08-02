import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Settings, RefreshCw, DollarSign, TrendingUp } from "lucide-react";

export default function TwilioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight api-twilio neon-text">
            Twilio Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor your Twilio SMS, voice calls, and communication costs
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
            <span className="font-medium text-green-400">Twilio services are operational</span>
            <Badge variant="outline" className="ml-auto">active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-twilio neon-text">3.8K</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-twilio neon-text">$67.89</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-twilio neon-text">189ms</div>
            <p className="text-xs text-muted-foreground">Excellent performance</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold api-twilio neon-text">99.7%</div>
            <p className="text-xs text-muted-foreground">High reliability</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 api-twilio" />
            Twilio Communication Analytics
          </CardTitle>
          <CardDescription>Advanced messaging and voice analytics coming soon</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Phone className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Communication Intelligence</h3>
            <p className="text-muted-foreground mb-6">
              We're building comprehensive Twilio monitoring including delivery analytics, 
              cost optimization for SMS/Voice, and detailed communication metrics.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">SMS Analytics</Badge>
              <Badge variant="outline">Voice Metrics</Badge>
              <Badge variant="outline">Delivery Tracking</Badge>
              <Badge variant="outline">Cost Analysis</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}