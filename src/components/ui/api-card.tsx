"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusOrb } from "./status-orb";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Activity, Zap } from "lucide-react";
import { createRippleEffect, useIntersectionAnimation } from "@/lib/animations";

interface ApiCardProps {
  name: string;
  status: "active" | "warning" | "error" | "offline";
  requests: string;
  cost: string;
  responseTime: string;
  errorRate: string;
  className?: string;
  apiClass?: string;
  trend?: {
    requests: "up" | "down" | "neutral";
    cost: "up" | "down" | "neutral";
    responseTime: "up" | "down" | "neutral";
    errorRate: "up" | "down" | "neutral";
  };
  onViewDetails?: () => void;
}

export function ApiCard({
  name,
  status,
  requests,
  cost,
  responseTime,
  errorRate,
  className,
  apiClass,
  trend,
  onViewDetails
}: ApiCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const intersectionRef = useIntersectionAnimation();
  
  // Track mouse position for 3D tilt effect
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });
  };
  
  // Status change animation
  useEffect(() => {
    setIsStatusChanging(true);
    const timer = setTimeout(() => setIsStatusChanging(false), 600);
    return () => clearTimeout(timer);
  }, [status]);
  
  // Calculate 3D transform based on mouse position
  const getTransform = () => {
    if (!isHovered || !cardRef.current) return '';
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / 10;
    const rotateY = (centerX - mousePosition.x) / 10;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  const getTrendIcon = (trendDirection?: "up" | "down" | "neutral") => {
    switch (trendDirection) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-neon-green" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-neon-red" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case "active":
        return "default";
      case "warning":
        return "secondary";
      case "error":
      case "offline":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Card
      ref={(el) => {
        cardRef.current = el;
        if (intersectionRef.current !== el) {
          (intersectionRef as { current: HTMLElement | null }).current = el;
        }
      }}
      className={cn(
        "glass-card depth-card border-border/50 hover:border-primary/50",
        "transition-all duration-500 cursor-pointer group relative overflow-hidden",
        "grid-pattern transform-gpu",
        isHovered && "neon-glow shadow-2xl",
        isStatusChanging && "animate-pulse",
        className
      )}
      style={{
        transform: getTransform(),
        transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Holographic overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 255, 0.3) 0%, transparent 50%)`
        }}
      />
      
      {/* Status change ripple effect */}
      {isStatusChanging && (
        <div className="absolute inset-0 border-2 border-primary/50 rounded-lg animate-ping" />
      )}
      
      {/* Scanning lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
        <div className="absolute -bottom-2 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent transform translate-x-full group-hover:-translate-x-full transition-transform duration-2000 delay-300" />
      </div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusOrb status={status} size="md" />
            <div className="flex flex-col">
              <CardTitle className={cn("neon-text text-lg transition-all duration-300", apiClass, isHovered && "scale-105")}>
                {name}
              </CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Live monitoring</span>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={getStatusBadgeVariant()}
              className={cn(
                "neon-glow capitalize transition-all duration-300",
                isStatusChanging && "animate-bounce"
              )}
            >
              {status}
            </Badge>
            {isHovered && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                <span>Real-time</span>
              </div>
            )}
          </div>
        </div>
        <CardDescription className="text-muted-foreground/80 transition-colors group-hover:text-muted-foreground">
          API monitoring metrics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Requests', value: requests, trend: trend?.requests },
            { label: 'Cost', value: cost, trend: trend?.cost },
            { label: 'Response', value: responseTime, trend: trend?.responseTime },
            { label: 'Error Rate', value: errorRate, trend: trend?.errorRate }
          ].map((metric, index) => (
            <div 
              key={metric.label}
              className="space-y-1 group/metric hover:bg-white/5 p-2 rounded transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground group-hover/metric:text-primary transition-colors">
                  {metric.label}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  {metric.trend === 'up' && (
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                  )}
                </div>
              </div>
              <p className="font-semibold text-sm animated-number group-hover/metric:scale-105 transition-transform">
                {metric.value}
              </p>
              
              {/* Mini progress bar for each metric */}
              <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 rounded-full",
                    metric.trend === 'up' ? 'bg-green-400' : 
                    metric.trend === 'down' ? 'bg-red-400' : 'bg-blue-400'
                  )}
                  style={{ 
                    width: `${Math.random() * 40 + 30}%`,
                    animationDelay: `${index * 200}ms`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Performance</span>
            <span>85%</span>
          </div>
          <div className="neon-progress h-2 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-1000"
              style={{ width: "85%" }}
            />
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full cyber-button group-hover:border-primary/50 relative overflow-hidden"
          onClick={(e) => {
            createRippleEffect(e);
            onViewDetails?.();
          }}
        >
          <ExternalLink className="w-3 h-3 mr-2 transition-transform group-hover:scale-110" />
          <span className="relative z-10">View Details</span>
          
          {/* Button glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
        
        {/* Performance radar */}
        {isHovered && (
          <div className="absolute bottom-2 right-2 w-8 h-8">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 border border-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-1 border border-primary/50 rounded-full animate-ping" style={{animationDelay: '0.5s'}} />
              <div className="absolute inset-2 bg-primary/20 rounded-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}