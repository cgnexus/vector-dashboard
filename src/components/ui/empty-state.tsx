"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon, Zap, Database, AlertCircle, Wifi } from "lucide-react";

interface EmptyStateProps {
  type?: "no-data" | "no-apis" | "offline" | "error";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  type = "no-data",
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  const getStateConfig = () => {
    switch (type) {
      case "no-apis":
        return {
          icon: Database,
          defaultTitle: "No APIs Connected",
          defaultDescription: "Connect your first API to start monitoring performance and costs",
          defaultAction: "Add API",
          color: "text-neon-cyan"
        };
      case "offline":
        return {
          icon: Wifi,
          defaultTitle: "Connection Lost",
          defaultDescription: "Unable to connect to monitoring services. Check your network connection",
          defaultAction: "Retry Connection",
          color: "text-neon-yellow"
        };
      case "error":
        return {
          icon: AlertCircle,
          defaultTitle: "System Error",
          defaultDescription: "Something went wrong while loading your data. Our team has been notified",
          defaultAction: "Try Again",
          color: "text-neon-red"
        };
      default:
        return {
          icon: Zap,
          defaultTitle: "No Data Available",
          defaultDescription: "Start using your APIs to see monitoring data and analytics appear here",
          defaultAction: "Refresh Data",
          color: "text-neon-green"
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("glass-card border-dashed border-2 border-border/50", className)}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        {/* Animated icon container */}
        <div className="relative">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-background to-muted/50",
            "border-2 border-border/50",
            config.color
          )}>
            <Icon className="w-10 h-10" />
          </div>
          
          {/* Orbital rings */}
          <div className="absolute inset-0 rounded-full border border-current opacity-20 animate-ping" />
          <div className="absolute inset-[-10px] rounded-full border border-current opacity-10 animate-ping animation-delay-1000" />
        </div>
        
        {/* Content */}
        <div className="space-y-3 max-w-md">
          <h3 className={cn("text-xl font-semibold neon-text", config.color)}>
            {title || config.defaultTitle}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {description || config.defaultDescription}
          </p>
        </div>
        
        {/* Action button */}
        {(onAction || actionLabel) && (
          <Button 
            onClick={onAction}
            className="cyber-button neon-glow mt-6"
            size="lg"
          >\n            <Icon className=\"w-4 h-4 mr-2\" />\n            {actionLabel || config.defaultAction}\n          </Button>\n        )}\n        \n        {/* Background pattern */}\n        <div className=\"absolute inset-0 circuit-pattern opacity-5 pointer-events-none\" />\n      </CardContent>\n    </Card>\n  );\n}\n\n/* Error boundary component */\nexport function ErrorState({ \n  error, \n  reset \n}: { \n  error: Error & { digest?: string }; \n  reset: () => void; \n}) {\n  return (\n    <EmptyState\n      type=\"error\"\n      title=\"Something went wrong!\"\n      description={error.message || \"An unexpected error occurred while loading the dashboard\"}\n      actionLabel=\"Try Again\"\n      onAction={reset}\n    />\n  );\n}"