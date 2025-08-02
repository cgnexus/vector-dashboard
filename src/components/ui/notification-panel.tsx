"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusOrb } from "./status-orb";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, X, Eye } from "lucide-react";

interface Notification {
  id: string | number;
  type: "cost_threshold" | "error_rate" | "rate_limit" | "performance" | "security";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  time: string;
  provider: string;
  isRead?: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string | number) => void;
  onDismiss?: (id: string | number) => void;
  onViewAll?: () => void;
  className?: string;
}

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onDismiss,
  onViewAll,
  className
}: NotificationPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-neon-red border-neon-red";
      case "high":
        return "text-neon-orange border-neon-orange";
      case "medium":
        return "text-neon-yellow border-neon-yellow";
      case "low":
        return "text-neon-green border-neon-green";
      default:
        return "text-muted-foreground border-muted-foreground";
    }
  };

  const getSeverityStatus = (severity: string): "active" | "warning" | "error" => {
    switch (severity) {
      case "critical":
      case "high":
        return "error";
      case "medium":
        return "warning";
      default:
        return "active";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cost_threshold":
        return "💰";
      case "error_rate":
        return "⚠️";
      case "rate_limit":
        return "🚦";
      case "performance":
        return "⚡";
      case "security":
        return "🛡️";
      default:
        return "📊";
    }
  };

  return (
    <Card className={cn("glass-card border-border/50 notification-pulse", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-neon-yellow" />
            <CardTitle className="neon-text">System Alerts</CardTitle>
          </div>
          <Badge variant="secondary" className="neon-glow">
            {notifications.filter(n => !n.isRead).length} new
          </Badge>
        </div>
        <CardDescription>
          Latest notifications and warnings from your APIs
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "relative group p-3 rounded-lg border transition-all duration-300",
                "hover:bg-white/5 cursor-pointer",
                getSeverityColor(notification.severity),
                !notification.isRead && "bg-white/5 border-l-4",
                hoveredId === notification.id && "neon-glow"
              )}
              onMouseEnter={() => setHoveredId(notification.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Severity indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-50 rounded-l-lg" />
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Type icon and status orb */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm">{getTypeIcon(notification.type)}</span>
                    <StatusOrb 
                      status={getSeverityStatus(notification.severity)} 
                      size="sm" 
                    />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{notification.provider}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && onMarkAsRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/10"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-white/10 text-neon-red"
                      onClick={() => onDismiss(notification.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Severity badge */}
              <div className="mt-2 flex justify-end">
                <Badge 
                  variant={notification.severity === "critical" ? "destructive" : "secondary"}
                  className="text-xs neon-glow capitalize"
                >
                  {notification.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {onViewAll && (
          <div className="pt-4 border-t border-border/50 mt-4">
            <Button 
              variant="outline" 
              className="w-full cyber-button"
              onClick={onViewAll}
            >
              View All Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}