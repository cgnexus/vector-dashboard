"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useCountAnimation, useIntersectionAnimation, createSuccessParticles } from "@/lib/animations";

interface AnimatedMetricProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  animate?: boolean;
  sparklineData?: number[];
  onClick?: () => void;
}

export function AnimatedMetric({
  title,
  value,
  previousValue,
  change,
  icon: Icon,
  trend = "neutral",
  className = "",
  animate = true,
  sparklineData,
  onClick
}: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(previousValue || value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const intersectionRef = useIntersectionAnimation();
  
  // Count animation for numeric values
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
  const animatedCount = useCountAnimation(numericValue, 1500);

  useEffect(() => {
    if (animate && previousValue !== value) {
      setIsAnimating(true);
      
      // Create success particles if trend is up
      if (trend === 'up' && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        createSuccessParticles(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
      }
      
      // Animate the value change
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [value, previousValue, animate, trend]);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      // Add a subtle bounce effect
      if (cardRef.current) {
        cardRef.current.style.animation = 'bounceIn 0.6s ease-out';
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.animation = '';
          }
        }, 600);
      }
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-neon-green";
      case "down":
        return "text-neon-red";
      default:
        return "text-primary";
    }
  };

  const formatDisplayValue = () => {
    if (typeof value === 'number') {
      return animatedCount.toLocaleString();
    }
    return displayValue;
  };
  
  const createSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    const points = sparklineData.map((point, index) => {
      const x = (index / (sparklineData.length - 1)) * 60;
      const y = 20 - ((point - min) / range) * 15;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="60" height="20" className="opacity-60 hover:opacity-100 transition-opacity">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
          className="drop-shadow-sm"
        />
        <defs>
          <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <polyline
          fill={`url(#gradient-${title.replace(/\s/g, '')})`}
          stroke="none"
          points={`0,20 ${points} 60,20`}
        />
      </svg>
    );
  };

  return (
    <Card 
      ref={(el) => {
        cardRef.current = el;
        if (intersectionRef.current !== el) {
          (intersectionRef as any).current = el;
        }
      }}
      className={`glass-card border-primary/20 hover:border-primary/40 transition-all duration-500 group cursor-pointer
        ${isHovered ? 'neon-glow transform scale-105' : ''}
        ${onClick ? 'hover:shadow-2xl' : ''}
        ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      
      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute -top-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {sparklineData && createSparkline()}
          <Icon className={`h-4 w-4 text-muted-foreground transition-all duration-300 ${isHovered ? 'text-primary scale-110' : ''}`} />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className={`text-2xl font-bold neon-text animated-number transition-all duration-300 ${isAnimating ? 'scale-110 glow-pulse' : ''} ${getTrendColor()}`}>
          {formatDisplayValue()}
        </div>
        
        {change && (
          <div className="flex items-center gap-1 mt-1">
            <p className={`text-xs ${getTrendColor()} transition-all duration-300`}>
              {change}
            </p>
            {trend === 'up' && (
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-current rounded-full animate-ping" style={{animationDelay: '0ms'}} />
                <div className="w-1 h-1 bg-current rounded-full animate-ping" style={{animationDelay: '150ms'}} />
                <div className="w-1 h-1 bg-current rounded-full animate-ping" style={{animationDelay: '300ms'}} />
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced progress indicator */}
        <div className="mt-3 relative">
          <div className="w-full h-1.5 neon-progress rounded-full overflow-hidden">
            <div 
              className={`h-full ${getTrendColor()} transition-all duration-1000 relative`}
              style={{ 
                width: trend === "up" ? "85%" : trend === "down" ? "25%" : "60%",
                background: `linear-gradient(90deg, ${trend === "up" ? "var(--neon-green)" : trend === "down" ? "var(--neon-red)" : "var(--primary)"}, transparent)`
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse" />
            </div>
          </div>
          
          {/* Performance indicator dots */}
          <div className="flex justify-between mt-1 px-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className={`w-1 h-1 rounded-full transition-all duration-500 ${
                  i < (trend === 'up' ? 4 : trend === 'down' ? 1 : 3)
                    ? getTrendColor().replace('text-', 'bg-')
                    : 'bg-muted'
                }`}
                style={{transitionDelay: `${i * 100}ms`}}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}