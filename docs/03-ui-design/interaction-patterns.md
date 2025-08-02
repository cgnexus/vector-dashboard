# Interaction Patterns - Nexus Dashboard

## Overview

The Nexus Dashboard implements sophisticated interaction patterns that enhance the cyberpunk aesthetic while maintaining usability. All interactions are designed for rapid feedback, smooth transitions, and intuitive user flow.

## Animation Principles

### 1. Purposeful Motion
Every animation serves a functional purpose:
- **Feedback**: Confirm user actions
- **Guidance**: Direct user attention
- **Continuity**: Maintain spatial relationships
- **Personality**: Enhance brand experience

### 2. Performance-First
All animations are optimized for 60fps:
- Use CSS transforms instead of layout changes
- Leverage GPU acceleration with `transform3d()`
- Implement `will-change` for animated elements
- Respect `prefers-reduced-motion` preferences

### 3. Timing Functions
```css
/* Easing curves for natural motion */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Micro-Interactions

### 1. Button Interactions
**Cyber Button with Sweep Effect**
```css
.cyber-button {
  position: relative;
  background: linear-gradient(45deg, 
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s var(--ease-out-quart);
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s var(--ease-out-expo);
}

.cyber-button:hover::before {
  left: 100%;
}

.cyber-button:active {
  transform: scale(0.98);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
}
```

**Implementation**:
```tsx
<Button className="cyber-button group">
  <span className="relative z-10 flex items-center gap-2">
    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
    Execute Command
  </span>
</Button>
```

### 2. Card Hover Effects
**Depth and Glow Animation**
```css
.api-card {
  transition: all 0.3s var(--ease-out-quart);
  transform-style: preserve-3d;
}

.api-card:hover {
  transform: translateY(-4px) rotateX(2deg) rotateY(2deg);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 20px currentColor;
}

.api-card:hover .neon-glow {
  box-shadow: 
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 30px currentColor;
}
```

**Implementation**:
```tsx
<Card className="api-card group cursor-pointer">
  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  {/* Card content */}
</Card>
```

### 3. Input Focus States
**Neon Focus with Glow**
```css
.cyber-input {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s var(--ease-out-quart);
}

.cyber-input:focus {
  border-color: var(--neon-cyan);
  box-shadow: 
    0 0 0 1px var(--neon-cyan),
    0 0 20px rgba(0, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.cyber-input:focus + .input-label {
  color: var(--neon-cyan);
  text-shadow: 0 0 10px currentColor;
}
```

## Page Transitions

### 1. Route Transitions
**Slide and Fade Animation**
```tsx
// Using Framer Motion
const pageVariants = {
  initial: { 
    opacity: 0, 
    x: 50,
    scale: 0.98 
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1 
  },
  out: { 
    opacity: 0, 
    x: -50,
    scale: 0.98 
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
```

### 2. Modal Animations
**Glassmorphism Modal with Backdrop Blur**
```tsx
const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.75,
    y: 50 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0 
  },
  exit: { 
    opacity: 0, 
    scale: 0.75,
    y: 50 
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300 
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card p-6 z-50"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

## Data Visualization Interactions

### 1. Chart Hover Effects
**Real-time Data Point Highlighting**
```tsx
const ChartTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card p-3 border border-primary/30"
      >
        <p className="neon-text text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};
```

### 2. Metric Animation
**Number Counting Animation**
```tsx
export function AnimatedCounter({ 
  value, 
  duration = 1000,
  formatter = (n) => n.toLocaleString()
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
}) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(value * easedProgress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.1, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="animated-number"
    >
      {formatter(count)}
    </motion.span>
  );
}
```

## Loading States

### 1. Skeleton Loading
**Animated Placeholder Components**
```tsx
export function MetricSkeleton() {
  return (
    <Card className="glass-card animate-pulse">
      <CardHeader className="space-y-2">
        <div className="h-4 bg-primary/20 rounded animate-shimmer" />
        <div className="h-3 bg-primary/10 rounded w-2/3 animate-shimmer" />
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-primary/20 rounded animate-shimmer" />
      </CardContent>
    </Card>
  );
}

/* Shimmer animation */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

### 2. Progressive Loading
**Staggered Component Entrance**
```tsx
export function StaggeredGrid({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: index * 0.1,
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
```

## Status Transitions

### 1. Status Orb Animations
**Pulsing Status Indicators**
```css
@keyframes status-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.status-active {
  animation: status-pulse 2s ease-in-out infinite;
  color: var(--neon-green);
}

.status-warning {
  animation: status-pulse 1.5s ease-in-out infinite;
  color: var(--neon-yellow);
}

.status-error {
  animation: status-pulse 1s ease-in-out infinite;
  color: var(--neon-red);
}
```

### 2. Status Change Transitions
**Smooth Color Transitions**
```tsx
export function StatusIndicator({ status }: { status: ApiStatus }) {
  return (
    <motion.div
      className="status-orb"
      animate={{
        color: getStatusColor(status),
        scale: status === 'error' ? [1, 1.2, 1] : 1
      }}
      transition={{
        color: { duration: 0.3 },
        scale: { duration: 0.5, times: [0, 0.5, 1] }
      }}
    >
      <div className="w-full h-full rounded-full bg-current" />
    </motion.div>
  );
}
```

## Command Palette Interactions

### 1. Search Animation
**Real-time Search with Debouncing**
```tsx
export function CommandSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      setIsSearching(true);
      const searchResults = await searchCommands(searchQuery);
      setResults(searchResults);
      setIsSearching(false);
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search commands..."
        className="cyber-input"
      />
      
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <HoloLoader size="sm" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full glass-card border border-primary/30 rounded-lg overflow-hidden z-50"
          >
            {results.map((result, index) => (
              <CommandResult key={result.id} result={result} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 2. Keyboard Navigation
**Highlight Selection with Smooth Transitions**
```tsx
export function CommandResult({ result, index, isSelected }: CommandResultProps) {
  return (
    <motion.div
      className={cn(
        "px-4 py-3 cursor-pointer transition-colors",
        isSelected && "bg-primary/10 border-l-2 border-neon-cyan"
      )}
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <result.icon className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="font-medium">{result.title}</p>
          <p className="text-sm text-muted-foreground">{result.description}</p>
        </div>
        {result.shortcut && (
          <kbd className="ml-auto px-2 py-1 text-xs bg-primary/20 rounded">
            {result.shortcut}
          </kbd>
        )}
      </div>
    </motion.div>
  );
}
```

## Notification Animations

### 1. Toast Notifications
**Slide and Stack Animation**
```tsx
export function NotificationToast({ notification, onDismiss }: ToastProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        x: 300, 
        scale: 0.5,
        transition: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4 border border-primary/30 cursor-pointer"
      onClick={onDismiss}
    >
      <div className="flex items-start gap-3">
        <StatusOrb status={notification.type} size="sm" />
        <div className="flex-1">
          <p className="font-medium">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
```

### 2. Real-time Updates
**Pulse Animation for New Data**
```tsx
export function RealTimeMetric({ value, isUpdating }: MetricProps) {
  return (
    <motion.div
      animate={isUpdating ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0 rgba(0, 255, 255, 0)",
          "0 0 20px rgba(0, 255, 255, 0.3)",
          "0 0 0 rgba(0, 255, 255, 0)"
        ]
      } : {}}
      transition={{ duration: 0.6 }}
      className="metric-card"
    >
      <AnimatedCounter value={value} />
    </motion.div>
  );
}
```

## Gesture Support

### 1. Touch Interactions
**Swipe Gestures for Mobile**
```tsx
export function SwipeableCard({ onSwipeLeft, onSwipeRight, children }: SwipeCardProps) {
  const controls = useDragControls();
  const [dragX, setDragX] = useState(0);
  
  return (
    <motion.div
      drag="x"
      dragControls={controls}
      dragConstraints={{ left: -100, right: 100 }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={(_, info) => {
        if (info.offset.x > 50) {
          onSwipeRight?.();
        } else if (info.offset.x < -50) {
          onSwipeLeft?.();
        }
      }}
      className="relative"
    >
      {/* Swipe indicators */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green"
        initial={{ opacity: 0 }}
        animate={{ opacity: dragX > 20 ? 1 : 0 }}
      >
        <ChevronRight className="w-6 h-6" />
      </motion.div>
      
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-red"
        initial={{ opacity: 0 }}
        animate={{ opacity: dragX < -20 ? 1 : 0 }}
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.div>
      
      {children}
    </motion.div>
  );
}
```

## Performance Optimizations

### 1. Animation Throttling
```tsx
// Use requestAnimationFrame for smooth animations
export function useAnimationFrame(callback: () => void, deps: any[]) {
  const requestRef = useRef<number>();
  
  useEffect(() => {
    const animate = () => {
      callback();
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, deps);
}
```

### 2. GPU Acceleration
```css
/* Force GPU acceleration for smooth animations */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* Remove will-change after animation */
.animation-complete {
  will-change: auto;
}
```

### 3. Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .status-orb {
    animation: none !important;
  }
}
```

## Accessibility Considerations

### 1. Focus Management
```tsx
export function FocusTrap({ children, isActive }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  
  return <div ref={containerRef}>{children}</div>;
}
```

### 2. Screen Reader Support
```tsx
// Announce dynamic content changes
export function LiveRegion({ children, politeness = 'polite' }: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Usage
<LiveRegion>
  {`API status changed to ${status}`}
</LiveRegion>
```

These interaction patterns ensure the Nexus Dashboard feels responsive, engaging, and professional while maintaining excellent performance and accessibility across all devices.