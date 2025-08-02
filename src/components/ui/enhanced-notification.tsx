"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSuccessParticles, createFloatingText } from "@/lib/animations";

type NotificationType = "success" | "error" | "warning" | "info" | "celebration";

interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: (id: string) => void;
  showProgress?: boolean;
  interactive?: boolean;
}

const notificationConfig = {
  success: {
    icon: CheckCircle,
    className: "border-green-500/50 bg-green-500/10 text-green-400",
    iconClassName: "text-green-400"
  },
  error: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-400",
    iconClassName: "text-red-400"
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
    iconClassName: "text-yellow-400"
  },
  info: {
    icon: Info,
    className: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    iconClassName: "text-blue-400"
  },
  celebration: {
    icon: Sparkles,
    className: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    iconClassName: "text-purple-400"
  }
};

export function EnhancedNotification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  showProgress = true,
  interactive = true
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const config = notificationConfig[type];
  const Icon = config.icon;
  
  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Progress bar and auto-dismiss
  useEffect(() => {
    if (duration <= 0 || isHovered) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          handleClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [duration, isHovered]);
  
  // Celebration effects
  useEffect(() => {
    if (type === 'celebration' || type === 'success') {
      const timer = setTimeout(() => {
        createSuccessParticles(
          window.innerWidth - 200,
          100
        );
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [type]);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };
  
  const handleClick = () => {
    if (!interactive) return;
    
    setClickCount(prev => prev + 1);
    
    // Easter egg: triple click for celebration
    if (clickCount === 2) {
      createSuccessParticles(
        window.innerWidth - 200,
        100
      );
      createFloatingText("Nice!", window.innerWidth - 150, 80);
      setClickCount(0);
    }
  };
  
  return (
    <div
      className={cn(
        "relative max-w-sm w-full glass-card border rounded-lg p-4 shadow-lg",
        "transform transition-all duration-300 ease-out",
        "hover:scale-105 hover:shadow-xl cursor-pointer group",
        config.className,
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isExiting && "translate-x-full opacity-0 scale-95",
        interactive && "hover:border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-current/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon with animation */}
        <div className="flex-shrink-0">
          <Icon className={cn(
            "w-5 h-5 transition-transform duration-300",
            config.iconClassName,
            isHovered && "scale-110 rotate-12"
          )} />
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-5 mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-xs opacity-80 leading-4">
              {message}
            </p>
          )}
          
          {/* Interactive hint */}
          {interactive && clickCount > 0 && (
            <p className="text-xs opacity-60 mt-1">
              {clickCount === 1 ? "Click again..." : "One more time!"}
            </p>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-100 ease-linear",
              type === 'success' && "bg-green-400",
              type === 'error' && "bg-red-400",
              type === 'warning' && "bg-yellow-400",
              type === 'info' && "bg-blue-400",
              type === 'celebration' && "bg-purple-400"
            )}
            style={{ width: `${progress}%` }}
          />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
        </div>
      )}
      
      {/* Sparkle effects for celebration */}
      {type === 'celebration' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Notification container with stacking
export function NotificationContainer({ 
  notifications, 
  onClose 
}: { 
  notifications: NotificationProps[]; 
  onClose: (id: string) => void; 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
            opacity: Math.max(0.7, 1 - index * 0.1),
            zIndex: 50 - index
          }}
        >
          <EnhancedNotification
            {...notification}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  
  const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [{ ...notification, id }, ...prev.slice(0, 4)]); // Limit to 5 notifications
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const showSuccess = (title: string, message?: string) => {
    addNotification({ type: 'success', title, message });
  };
  
  const showError = (title: string, message?: string) => {
    addNotification({ type: 'error', title, message, duration: 8000 });
  };
  
  const showWarning = (title: string, message?: string) => {
    addNotification({ type: 'warning', title, message });
  };
  
  const showInfo = (title: string, message?: string) => {
    addNotification({ type: 'info', title, message });
  };
  
  const celebrate = (title: string, message?: string) => {
    addNotification({ 
      type: 'celebration', 
      title, 
      message, 
      duration: 6000,
      interactive: true
    });
  };
  
  return {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    celebrate
  };
}