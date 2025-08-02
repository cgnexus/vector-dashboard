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
    }\n  };\n\n  const getSeverityStatus = (severity: string): \"active\" | \"warning\" | \"error\" => {\n    switch (severity) {\n      case \"critical\":\n      case \"high\":\n        return \"error\";\n      case \"medium\":\n        return \"warning\";\n      default:\n        return \"active\";\n    }\n  };\n\n  const getTypeIcon = (type: string) => {\n    switch (type) {\n      case \"cost_threshold\":\n        return \"💰\";\n      case \"error_rate\":\n        return \"⚠️\";\n      case \"rate_limit\":\n        return \"🚦\";\n      case \"performance\":\n        return \"⚡\";\n      case \"security\":\n        return \"🛡️\";\n      default:\n        return \"📊\";\n    }\n  };\n\n  return (\n    <Card className={cn(\"glass-card border-border/50 notification-pulse\", className)}>\n      <CardHeader>\n        <div className=\"flex items-center justify-between\">\n          <div className=\"flex items-center gap-2\">\n            <AlertTriangle className=\"h-5 w-5 text-neon-yellow\" />\n            <CardTitle className=\"neon-text\">System Alerts</CardTitle>\n          </div>\n          <Badge variant=\"secondary\" className=\"neon-glow\">\n            {notifications.filter(n => !n.isRead).length} new\n          </Badge>\n        </div>\n        <CardDescription>\n          Latest notifications and warnings from your APIs\n        </CardDescription>\n      </CardHeader>\n      \n      <CardContent>\n        <div className=\"space-y-3 max-h-96 overflow-y-auto\">\n          {notifications.map((notification) => (\n            <div\n              key={notification.id}\n              className={cn(\n                \"relative group p-3 rounded-lg border transition-all duration-300\",\n                \"hover:bg-white/5 cursor-pointer\",\n                getSeverityColor(notification.severity),\n                !notification.isRead && \"bg-white/5 border-l-4\",\n                hoveredId === notification.id && \"neon-glow\"\n              )}\n              onMouseEnter={() => setHoveredId(notification.id)}\n              onMouseLeave={() => setHoveredId(null)}\n            >\n              {/* Severity indicator */}\n              <div className=\"absolute left-0 top-0 bottom-0 w-1 bg-current opacity-50 rounded-l-lg\" />\n              \n              <div className=\"flex items-start justify-between gap-3\">\n                <div className=\"flex items-start gap-3 flex-1\">\n                  {/* Type icon and status orb */}\n                  <div className=\"flex items-center gap-2 mt-0.5\">\n                    <span className=\"text-sm\">{getTypeIcon(notification.type)}</span>\n                    <StatusOrb \n                      status={getSeverityStatus(notification.severity)} \n                      size=\"sm\" \n                    />\n                  </div>\n                  \n                  <div className=\"flex-1 space-y-1\">\n                    <p className=\"text-sm font-medium leading-relaxed\">\n                      {notification.message}\n                    </p>\n                    <div className=\"flex items-center gap-2 text-xs text-muted-foreground\">\n                      <span className=\"font-medium\">{notification.provider}</span>\n                      <span>•</span>\n                      <div className=\"flex items-center gap-1\">\n                        <Clock className=\"w-3 h-3\" />\n                        <span>{notification.time}</span>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n                \n                {/* Action buttons */}\n                <div className=\"flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity\">\n                  {!notification.isRead && onMarkAsRead && (\n                    <Button\n                      size=\"sm\"\n                      variant=\"ghost\"\n                      className=\"h-6 w-6 p-0 hover:bg-white/10\"\n                      onClick={() => onMarkAsRead(notification.id)}\n                    >\n                      <Eye className=\"w-3 h-3\" />\n                    </Button>\n                  )}\n                  {onDismiss && (\n                    <Button\n                      size=\"sm\"\n                      variant=\"ghost\"\n                      className=\"h-6 w-6 p-0 hover:bg-white/10 text-neon-red\"\n                      onClick={() => onDismiss(notification.id)}\n                    >\n                      <X className=\"w-3 h-3\" />\n                    </Button>\n                  )}\n                </div>\n              </div>\n              \n              {/* Severity badge */}\n              <div className=\"mt-2 flex justify-end\">\n                <Badge \n                  variant={notification.severity === \"critical\" ? \"destructive\" : \"secondary\"}\n                  className=\"text-xs neon-glow capitalize\"\n                >\n                  {notification.severity}\n                </Badge>\n              </div>\n            </div>\n          ))}\n        </div>\n        \n        {onViewAll && (\n          <div className=\"pt-4 border-t border-border/50 mt-4\">\n            <Button \n              variant=\"outline\" \n              className=\"w-full cyber-button\"\n              onClick={onViewAll}\n            >\n              View All Alerts\n            </Button>\n          </div>\n        )}\n      </CardContent>\n    </Card>\n  );\n}"