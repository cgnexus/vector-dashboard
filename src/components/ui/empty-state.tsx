"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Search, 
  AlertCircle, 
  TrendingUp, 
  Inbox,
  XCircle,
  LucideIcon
} from "lucide-react";

interface EmptyStateProps {
  type?: "empty" | "error" | "search" | "success" | "loading";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfigs = {
  empty: {
    icon: Inbox,
    defaultTitle: "No data available",
    defaultDescription: "There's no data to display at the moment. Try refreshing or check back later.",
    defaultAction: "Refresh",
    gradient: "from-muted/50 to-background"
  },
  error: {
    icon: XCircle,
    defaultTitle: "Something went wrong",
    defaultDescription: "We encountered an error while loading the data. Please try again.",
    defaultAction: "Try Again",
    gradient: "from-destructive/10 to-background"
  },
  search: {
    icon: Search,
    defaultTitle: "No results found",
    defaultDescription: "We couldn't find any results matching your search criteria.",
    defaultAction: "Clear Search",
    gradient: "from-accent/50 to-background"
  },
  success: {
    icon: TrendingUp,
    defaultTitle: "All systems operational",
    defaultDescription: "Everything is running smoothly. No issues detected.",
    defaultAction: "View Dashboard",
    gradient: "from-primary/10 to-background"
  },
  loading: {
    icon: AlertCircle,
    defaultTitle: "Loading data...",
    defaultDescription: "Please wait while we fetch the latest information.",
    defaultAction: "",
    gradient: "from-muted/30 to-background"
  }
};

export function EmptyState({
  type = "empty",
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  const config = emptyStateConfigs[type];
  const Icon: LucideIcon = config.icon;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        "bg-gradient-to-b",
        config.gradient,
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
        {/* Icon with animated background */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-background border border-border">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        {/* Text content */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold tracking-tight">
            {title || config.defaultTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description || config.defaultDescription}
          </p>
        </div>
        
        {/* Action button */}
        {(onAction || actionLabel) && (
          <Button 
            onClick={onAction}
            className="cyber-button neon-glow mt-6"
            size="lg"
          >
            <Icon className="w-4 h-4 mr-2" />
            {actionLabel || config.defaultAction}
          </Button>
        )}
        
        {/* Background pattern */}
        <div className="absolute inset-0 circuit-pattern opacity-5 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

/* Error boundary component */
export function ErrorState({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void; 
}) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong!"
      description={error.message || "An unexpected error occurred while loading the dashboard"}
      actionLabel="Try Again"
      onAction={reset}
    />
  );
}