"use client";

import { useState, useEffect } from "react";
import { HoloLoader } from "./holo-loader";
import { cn } from "@/lib/utils";
import { getRandomMessage, useKonamiCode, createSuccessParticles } from "@/lib/animations";
import { Code, Zap, Shield, Database } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  showProgress?: boolean;
  variant?: "minimal" | "full" | "matrix";
}

const loadingSteps = [
  { label: "Initializing Nexus Core", icon: Code, progress: 100, delay: 0 },
  { label: "Loading Vector Components", icon: Zap, progress: 85, delay: 500 },
  { label: "Establishing Secure Connection", icon: Shield, progress: 70, delay: 1000 },
  { label: "Synchronizing Database", icon: Database, progress: 60, delay: 1500 }
];

export function LoadingScreen({ 
  message, 
  className, 
  showProgress = true,
  variant = "full"
}: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(message || "Loading...");
  const [easterEggTriggered, setEasterEggTriggered] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  
  // Konami code easter egg
  useKonamiCode(() => {
    setEasterEggTriggered(true);
    setCurrentMessage("💀 HACKER MODE ACTIVATED 💀");
    createSuccessParticles(window.innerWidth / 2, window.innerHeight / 2);
  });
  
  // Rotate messages
  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomMessage());
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);
  
  // Stagger loading steps
  useEffect(() => {
    loadingSteps.forEach((_, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, index]);
      }, loadingSteps[index].delay);
    });
  }, []);
  
  if (variant === "minimal") {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        className
      )}>
        <HoloLoader text={currentMessage} showRandomMessages={!message} variant="pulse" />
      </div>
    );
  }
  
  if (variant === "matrix") {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        "bg-black text-green-400 relative overflow-hidden",
        className
      )}>
        {/* Matrix rain effect */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xs font-mono opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {Math.random().toString(36).substring(7)}
            </div>
          ))}
        </div>
        
        <div className="relative z-10 text-center">
          <HoloLoader size="lg" text={currentMessage} variant="matrix" />
          <div className="mt-4 text-sm font-mono">
            <span className="animate-pulse">ACCESSING MAINFRAME...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-gradient-to-br from-background via-muted/20 to-background",
      "relative overflow-hidden",
      easterEggTriggered && "bg-gradient-to-r from-purple-900 via-red-900 to-yellow-900",
      className
    )}>
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(easterEggTriggered ? 50 : 20)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 rounded-full animate-ping",
              easterEggTriggered ? "bg-red-500/50" : "bg-primary/30"
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Scanning line */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse transform -translate-y-full" 
             style={{animation: 'scan-line 3s ease-in-out infinite'}} />
      </div>
      
      {/* Main Loading Content */}
      <div className="relative z-10 text-center space-y-8">
        <div className="relative">
          {/* Outer Ring */}
          <div className={cn(
            "absolute -inset-16 border-2 rounded-full animate-spin",
            easterEggTriggered ? "border-red-500/30" : "border-primary/20"
          )} style={{animationDuration: '8s'}} />
          
          {/* Middle Ring */}
          <div className={cn(
            "absolute -inset-8 border-2 rounded-full animate-spin",
            easterEggTriggered ? "border-yellow-500/40" : "border-accent/30"
          )} style={{animationDuration: '6s', animationDirection: 'reverse'}} />
          
          {/* Inner Ring */}
          <div className={cn(
            "absolute -inset-4 border rounded-full animate-ping",
            easterEggTriggered ? "border-purple-500/50" : "border-primary/40"
          )} />
          
          {/* Core Loader */}
          <HoloLoader 
            size="lg" 
            text={currentMessage} 
            showRandomMessages={!message && !easterEggTriggered}
            variant={easterEggTriggered ? "matrix" : "orbit"}
          />
        </div>
        
        {/* Progress Steps */}
        {showProgress && (
          <div className="space-y-4 w-80">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              const isVisible = visibleSteps.includes(index);
              const isComplete = isVisible;
              
              return (
                <div 
                  key={step.label}
                  className={cn(
                    "transition-all duration-500",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn(
                        "w-3 h-3",
                        isComplete && "text-green-400"
                      )} />
                      <span className={isComplete ? "text-green-400" : ""}>
                        {step.label}
                      </span>
                    </div>
                    <span className={isComplete ? "text-green-400" : ""}>
                      {step.progress}%
                    </span>
                  </div>
                  
                  <div className="neon-progress h-1 rounded-full">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        isComplete 
                          ? "bg-gradient-to-r from-green-400 to-cyan-400" 
                          : "bg-gradient-to-r from-primary/50 to-accent/50"
                      )} 
                      style={{width: `${isComplete ? step.progress : 0}%`}} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Status Messages */}
        <div className="text-sm text-muted-foreground space-y-2">
          <h1 className={cn(
            "text-xl font-bold neon-text",
            easterEggTriggered && "text-red-400 animate-pulse"
          )}>
            {easterEggTriggered ? "⚡ NEXUS HACKED ⚡" : "Nexus Vector Dashboard"}
          </h1>
          <p className="text-xs opacity-75">
            {easterEggTriggered 
              ? "Welcome to the dark side of data visualization..." 
              : "Preparing your cyberpunk data visualization experience..."}
          </p>
          
          {/* Fun fact */}
          <div className="mt-4 p-2 rounded border border-primary/20 bg-primary/5">
            <p className="text-xs opacity-80">
              💡 Pro tip: Try the Konami code for a surprise!
            </p>
          </div>
        </div>
      </div>
      
      {/* Corner Decorations */}
      <div className={cn(
        "absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2",
        easterEggTriggered ? "border-red-500/50" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2",
        easterEggTriggered ? "border-yellow-500/50" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2",
        easterEggTriggered ? "border-purple-500/50" : "border-primary/30"
      )} />
      <div className={cn(
        "absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2",
        easterEggTriggered ? "border-green-500/50" : "border-primary/30"
      )} />
      
      {/* Version info */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <span className="text-xs text-muted-foreground/50 font-mono">
          v2.1.0-{easterEggTriggered ? "HACKED" : "stable"}
        </span>
      </div>
    </div>
  );
}

// Simple inline loading spinner
export function InlineLoader({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={cn(
      "relative rounded-full border-2 border-primary/20",
      sizeClasses[size],
      className
    )}>
      <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
      <div className="absolute inset-1 rounded-full bg-primary/10" />
    </div>
  );
}

// Page transition loader
export function PageLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background">
      <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse" 
           style={{
             width: "30%",
             animation: "progress-shimmer 1.5s ease-in-out infinite"
           }} />
    </div>
  );
}