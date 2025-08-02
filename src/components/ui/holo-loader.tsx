"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getRandomMessage } from "@/lib/animations";

interface HoloLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showRandomMessages?: boolean;
  variant?: "standard" | "matrix" | "pulse" | "orbit";
}

export function HoloLoader({ 
  size = "md", 
  className, 
  text, 
  showRandomMessages = false,
  variant = "standard"
}: HoloLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(text || "Loading...");
  const [dots, setDots] = useState("");
  
  // Rotating messages
  useEffect(() => {
    if (showRandomMessages) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomMessage());
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [showRandomMessages]);
  
  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);
  const getSize = () => {
    switch (size) {
      case "sm":
        return "w-6 h-6";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  const getSpinnerVariant = () => {
    switch (variant) {
      case "matrix":
        return "holo-spinner-matrix";
      case "pulse":
        return "holo-spinner-pulse";
      case "orbit":
        return "holo-spinner-orbit";
      default:
        return "holo-spinner";
    }
  };
  
  return (
    <div className={cn("flex flex-col items-center gap-3 relative", className)}>
      {/* Main spinner */}
      <div className="relative">
        <div className={cn(getSpinnerVariant(), getSize())} />
        
        {/* Additional effects for variants */}
        {variant === "orbit" && (
          <>
            <div className={cn("absolute inset-0 border border-primary/30 rounded-full animate-ping", getSize())} />
            <div className={cn("absolute inset-2 bg-primary/20 rounded-full animate-pulse", getSize())} />
          </>
        )}
        
        {variant === "matrix" && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="absolute w-0.5 h-full bg-gradient-to-b from-transparent via-accent to-transparent animate-pulse" style={{left: '50%'}} />
          </div>
        )}
      </div>
      
      {/* Message display */}
      {(text || showRandomMessages) && (
        <div className="text-center space-y-1">
          <span className={cn(
            "text-muted-foreground neon-text transition-all duration-500", 
            getTextSize(),
            "animate-pulse"
          )}>
            {showRandomMessages ? currentMessage : text}{dots}
          </span>
          
          {showRandomMessages && (
            <div className="flex justify-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-1 h-1 bg-primary rounded-full animate-bounce",
                    `delay-${i * 100}`
                  )}
                  style={{animationDelay: `${i * 0.2}s`}}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Floating particles */}
      {variant === "standard" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HoloSpinner({ className }: { className?: string }) {
  return <div className={cn("holo-spinner w-5 h-5", className)} />;
}