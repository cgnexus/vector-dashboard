# Component Library - Nexus Dashboard

## Overview

The Nexus Dashboard component library extends shadcn/ui with custom cyberpunk-themed components optimized for API monitoring and data visualization. All components follow the established design system and are built for rapid development cycles.

## Base Components (shadcn/ui)

### Currently Installed
- `button` - Interactive elements with cyber styling
- `card` - Container components with glassmorphism
- `input` - Form inputs with neon focus states
- `label` - Text labels with consistent typography
- `dialog` - Modal overlays with backdrop blur
- `dropdown-menu` - Context menus with neon accents
- `badge` - Status indicators with glow effects

### Installation Command
```bash
pnpm dlx shadcn@latest add <component>
```

## Custom Components

### 1. AnimatedMetric
**Purpose**: Display key performance indicators with smooth animations and trend visualization.

**Usage**:
```tsx
<AnimatedMetric
  title="Total Requests"
  value="1,247"
  previousValue="1,156"
  change="+7.9%"
  icon={TrendingUp}
  trend="up"
  animate={true}
/>
```

**Props**:
- `title: string` - Metric label
- `value: string | number` - Current value
- `previousValue?: string | number` - Previous value for animation
- `change?: string` - Percentage change display
- `icon: LucideIcon` - Icon component
- `trend?: "up" | "down" | "neutral"` - Trend direction
- `className?: string` - Additional CSS classes
- `animate?: boolean` - Enable value animations

**Variants**:
- Default: Standard metric card with glass background
- Compact: Smaller version for dashboard grids
- Large: Prominent version for hero metrics

**States**:
- Default: Standard display
- Loading: Skeleton animation
- Error: Red accent with error icon
- Animating: Scale transform during value changes

### 2. ApiCard
**Purpose**: Display comprehensive API monitoring information with status indicators and metrics.

**Usage**:
```tsx
<ApiCard
  name="OpenAI API"
  status="active"
  requests="2.4k"
  cost="$23.45"
  responseTime="245ms"
  errorRate="0.1%"
  apiClass="api-openai"
  trend={{
    requests: "up",
    cost: "down",
    responseTime: "neutral",
    errorRate: "down"
  }}
  onViewDetails={() => router.push('/api/openai')}
/>
```

**Props**:
- `name: string` - API service name
- `status: "active" | "warning" | "error" | "offline"` - Current status
- `requests: string` - Request count display
- `cost: string` - Cost information
- `responseTime: string` - Average response time
- `errorRate: string` - Error percentage
- `apiClass?: string` - API-specific styling class
- `trend?: object` - Trend indicators for each metric
- `onViewDetails?: () => void` - Click handler

**Features**:
- Hover effects with neon glow
- Progress indicators with animated gradients
- Status orb with pulsing animation
- Grid-based metric layout
- Gradient overlay on hover

### 3. StatusOrb
**Purpose**: Visual status indicator with pulsing animations and consistent color coding.

**Usage**:
```tsx
<StatusOrb
  status="active"
  size="md"
  label="Operational"
  showPulse={true}
/>
```

**Props**:
- `status: "active" | "warning" | "error" | "offline"` - Status type
- `size?: "sm" | "md" | "lg"` - Orb size
- `label?: string` - Optional text label
- `className?: string` - Additional styling
- `showPulse?: boolean` - Enable pulse animation

**Size Variants**:
- `sm`: 8px diameter - For inline status
- `md`: 12px diameter - Default size
- `lg`: 16px diameter - Prominent status display

**Status Colors**:
- `active`: Neon green with subtle pulse
- `warning`: Neon yellow with medium pulse
- `error`: Neon red with rapid pulse
- `offline`: Gray with no animation

### 4. NeonChart
**Purpose**: Interactive data visualization with holographic styling and multiple chart types.

**Usage**:
```tsx
<NeonChart
  data={performanceData}
  title="API Response Times"
  color="cyan"
  height={200}
  type="area"
  showGrid={true}
  animated={true}
/>
```

**Props**:
- `data: DataPoint[]` - Chart data points
- `title?: string` - Chart title
- `color?: "cyan" | "purple" | "green" | "orange" | "red"` - Theme color
- `height?: number` - Chart height in pixels
- `showGrid?: boolean` - Display background grid
- `animated?: boolean` - Enable scan line animation
- `type?: "line" | "area"` - Chart visualization type

**Data Format**:
```tsx
interface DataPoint {
  time: string;    // X-axis label
  value: number;   // Y-axis value
  label?: string;  // Optional tooltip text
}
```

**Features**:
- Canvas-based rendering for performance
- Smooth curve interpolation
- Gradient fill for area charts
- Glow effects on data points
- Animated scan line overlay
- Responsive design with device pixel ratio support

### 5. HoloLoader
**Purpose**: Futuristic loading indicator with multi-layered spinning rings.

**Usage**:
```tsx
<HoloLoader size="md" color="cyan" />
```

**Props**:
- `size?: "sm" | "md" | "lg"` - Loader size
- `color?: "cyan" | "purple" | "green"` - Theme color

**Features**:
- Dual-ring animation with opposing rotations
- Gradient borders for holographic effect
- Multiple size variants
- Customizable color themes

### 6. LoadingScreen
**Purpose**: Full-screen loading overlay with branding and progress indication.

**Usage**:
```tsx
<LoadingScreen 
  message="Initializing Nexus Dashboard..."
  progress={65}
  showProgress={true}
/>
```

**Props**:
- `message?: string` - Loading message
- `progress?: number` - Progress percentage (0-100)
- `showProgress?: boolean` - Display progress bar

### 7. EmptyState
**Purpose**: Placeholder component for empty data states with call-to-action.

**Usage**:
```tsx
<EmptyState
  icon={Database}
  title="No API Data Available"
  description="Start monitoring your APIs to see metrics and analytics."
  actionLabel="Add API"
  onAction={() => setShowAddDialog(true)}
/>
```

**Props**:
- `icon: LucideIcon` - Illustrative icon
- `title: string` - Primary message
- `description: string` - Supporting text
- `actionLabel?: string` - CTA button text
- `onAction?: () => void` - CTA handler

### 8. CommandPalette
**Purpose**: Global search and command interface with keyboard navigation.

**Usage**:
```tsx
<CommandPalette
  isOpen={showCommand}
  onClose={() => setShowCommand(false)}
  commands={availableCommands}
/>
```

**Features**:
- Fuzzy search functionality
- Keyboard navigation (↑↓ arrows, Enter, Esc)
- Command categorization
- Recent commands history
- Glassmorphism backdrop

### 9. NotificationPanel
**Purpose**: Real-time alert and notification management interface.

**Usage**:
```tsx
<NotificationPanel
  notifications={alerts}
  onMarkAsRead={handleRead}
  onClearAll={handleClearAll}
/>
```

**Features**:
- Real-time updates with WebSocket integration
- Priority-based sorting
- Bulk actions (mark all read, clear all)
- Notification categories with color coding
- Auto-dismiss for certain notification types

## Button Variants

### Cyber Button
**Enhanced styling for primary actions**
```tsx
<Button className="cyber-button" variant="default">
  Execute Command
</Button>
```

### Neon Button
**High-impact CTA with glow effects**
```tsx
<Button className="neon-glow border-neon-cyan text-neon-cyan">
  Deploy Now
</Button>
```

### Ghost Button
**Minimal styling for secondary actions**
```tsx
<Button variant="ghost" className="hover:bg-primary/10">
  View Details
</Button>
```

## Form Components

### Enhanced Input
**Standard inputs with neon focus states**
```tsx
<Input 
  className="cyber-input border-primary/30 focus:border-neon-cyan"
  placeholder="Enter API endpoint..."
/>
```

### Status Select
**Dropdown with status-specific styling**
```tsx
<Select>
  <SelectTrigger className="cyber-input">
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent className="glass-card">
    <SelectItem value="active" className="text-neon-green">
      <StatusOrb status="active" size="sm" />
      Active
    </SelectItem>
  </SelectContent>
</Select>
```

## Layout Components

### Dashboard Grid
**Responsive grid system for dashboard layouts**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <AnimatedMetric {...metric1} />
  <AnimatedMetric {...metric2} />
  <ApiCard {...apiData} />
</div>
```

### Glass Panel
**Container with glassmorphism effects**
```tsx
<div className="glass-card p-6 border-primary/20">
  <h2 className="neon-text text-xl mb-4">System Status</h2>
  {/* Panel content */}
</div>
```

## Component States

### Loading States
- **Skeleton**: Animated placeholder shapes
- **Spinner**: Rotating loading indicator
- **Progress**: Determinate progress bar
- **Pulse**: Subtle breathing animation

### Error States
- **Inline Error**: Red accent with error icon
- **Error Boundary**: Full component error state
- **Network Error**: Specific messaging for connectivity issues

### Empty States
- **No Data**: When APIs return empty results
- **No Connection**: When APIs are unreachable
- **Permission Denied**: When access is restricted

## Responsive Behavior

### Breakpoint System
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Large tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Component Adaptations
- **Cards**: Stack vertically on mobile, grid on desktop
- **Navigation**: Drawer on mobile, sidebar on desktop
- **Tables**: Horizontal scroll on mobile, full width on desktop
- **Charts**: Responsive height and font scaling

## Animation Presets

### Entrance Animations
```css
.fade-in { animation: fadeIn 0.3s ease-out; }
.slide-up { animation: slideUp 0.4s ease-out; }
.scale-in { animation: scaleIn 0.2s ease-out; }
```

### Hover Animations
```css
.hover-lift:hover { transform: translateY(-2px); }
.hover-glow:hover { box-shadow: 0 0 20px currentColor; }
.hover-scale:hover { transform: scale(1.02); }
```

### Loading Animations
```css
.pulse { animation: pulse 2s ease-in-out infinite; }
.spin { animation: spin 1s linear infinite; }
.bounce { animation: bounce 1s ease-in-out infinite; }
```

## Usage Guidelines

### Component Selection
1. **High Frequency**: Use `AnimatedMetric` for key dashboard metrics
2. **Status Display**: Use `StatusOrb` for all status indicators
3. **Data Visualization**: Use `NeonChart` for time-series data
4. **Loading States**: Use `HoloLoader` for component loading
5. **Empty Content**: Use `EmptyState` for zero-data scenarios

### Performance Tips
- Lazy load chart components on large datasets
- Use `React.memo` for static metric components
- Implement virtualization for long lists
- Optimize image assets for retina displays

### Accessibility
- All components support keyboard navigation
- Screen reader compatibility with proper ARIA labels
- High contrast mode support
- Reduced motion preferences respected