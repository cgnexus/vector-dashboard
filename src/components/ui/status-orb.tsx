"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StatusOrbProps {
  status: "active" | "warning" | "error" | "offline";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  showPulse?: boolean;
  intensity?: "low" | "medium" | "high";
  showParticles?: boolean;
}

export function StatusOrb({ 
  status, 
  size = "md", 
  label, 
  className,
  showPulse = true,
  intensity = "medium",
  showParticles = false
}: StatusOrbProps) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "text-neon-green";
      case "warning":
        return "text-neon-yellow";
      case "error":
        return "text-neon-red";
      case "offline":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getSize = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "lg":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  const getPulseAnimation = () => {
    if (!showPulse) return "";
    
    const baseAnimation = (() => {
      switch (status) {
        case "active":
          return "status-active";
        case "warning":
          return "status-warning";
        case "error":
          return "status-error";
        default:
          return "";
      }
    })();
    
    const intensityClass = (() => {
      switch (intensity) {
        case "high":
          return "pulse-intense";
        case "low":
          return "pulse-subtle";
        default:
          return "";
      }
    })();
    
    return `${baseAnimation} ${intensityClass}`.trim();
  };
  
  // Generate particles for active status
  useEffect(() => {
    if (showParticles && status === 'active') {
      const interval = setInterval(() => {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: Math.random() * 20 - 10,
          y: Math.random() * 20 - 10
        };
        
        setParticles(prev => [...prev.slice(-4), newParticle]);
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [showParticles, status]);
  
  const getGlowIntensity = () => {
    switch (intensity) {
      case "high":
        return "drop-shadow-lg";
      case "low":
        return "drop-shadow-sm";
      default:
        return "drop-shadow-md";
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2 relative", className)}>
      <div className={cn(
        "status-orb rounded-full relative",
        getSize(),
        getStatusColor(),
        getPulseAnimation(),
        getGlowIntensity()
      )}>
        {/* Core orb */}
        <div className="w-full h-full rounded-full bg-current relative z-10" />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-current opacity-60 blur-sm" />
        
        {/* Outer rings for enhanced status */}
        {intensity === 'high' && (
          <>
            <div className="absolute -inset-1 rounded-full border border-current opacity-30 animate-ping" />
            <div className="absolute -inset-2 rounded-full border border-current opacity-20 animate-ping" style={{animationDelay: '0.5s'}} />
          </>
        )}
        
        {/* Status-specific effects */}
        {status === 'error' && (
          <div className="absolute inset-0 rounded-full bg-current animate-pulse opacity-75" />
        )}
        
        {status === 'warning' && (
          <div className="absolute inset-0 rounded-full">
            <div className="w-full h-full bg-current rounded-full animate-pulse opacity-50" style={{animationDelay: '0.25s'}} />
          </div>
        )}
        
        {/* Particles for active status */}
        {showParticles && particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-0.5 h-0.5 bg-current rounded-full animate-ping"
            style={{
              left: `${50 + particle.x}%`,
              top: `${50 + particle.y}%`,
              animationDuration: '1s',
              animationDelay: '0s'
            }}
          />
        ))}
      </div>
      
      {label && (
        <span className={cn(
          "text-sm font-medium transition-all duration-300",
          getStatusColor(),
          intensity === 'high' && "drop-shadow-sm"
        )}>
          {label}
        </span>
      )}
      
      {/* Status indicator text for screen readers */}
      <span className="sr-only">
        Status: {status}
        {intensity !== 'medium' && `, intensity: ${intensity}`}
      </span>
    </div>
  );
}