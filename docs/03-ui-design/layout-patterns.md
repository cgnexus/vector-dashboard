# Layout Patterns - Nexus Dashboard

## Overview

The Nexus Dashboard uses a flexible, grid-based layout system that adapts seamlessly from mobile to desktop. All layouts prioritize data density while maintaining visual clarity and accessibility.

## Grid System

### Base Grid Structure
```css
/* 12-column responsive grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem; /* 24px */
  padding: 1rem; /* 16px mobile */
}

@media (min-width: 768px) {
  .grid-container {
    gap: 2rem; /* 32px tablet+ */
    padding: 2rem; /* 32px tablet+ */
  }
}

@media (min-width: 1024px) {
  .grid-container {
    gap: 2.5rem; /* 40px desktop+ */
    padding: 3rem; /* 48px desktop+ */
  }
}
```

### Column Spans
```css
/* Responsive column spanning */
.col-span-full { grid-column: 1 / -1; }          /* Full width */
.col-span-6 { grid-column: span 6; }             /* Half width */
.col-span-4 { grid-column: span 4; }             /* Third width */
.col-span-3 { grid-column: span 3; }             /* Quarter width */

/* Responsive breakpoints */
@media (min-width: 768px) {
  .md\:col-span-6 { grid-column: span 6; }
  .md\:col-span-4 { grid-column: span 4; }
  .md\:col-span-3 { grid-column: span 3; }
}

@media (min-width: 1024px) {
  .lg\:col-span-8 { grid-column: span 8; }
  .lg\:col-span-4 { grid-column: span 4; }
  .lg\:col-span-3 { grid-column: span 3; }
}
```

## Dashboard Layouts

### 1. Overview Dashboard
**Purpose**: High-level system status and key metrics display.

**Structure**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
  {/* Hero Metrics */}
  <div className="lg:col-span-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedMetric title="Total Requests" value="24.7k" trend="up" />
      <AnimatedMetric title="Active APIs" value="5" trend="neutral" />
      <AnimatedMetric title="Response Time" value="245ms" trend="down" />
      <AnimatedMetric title="Error Rate" value="0.1%" trend="down" />
    </div>
  </div>
  
  {/* API Status Grid */}
  <div className="lg:col-span-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ApiCard name="OpenAI API" status="active" {...openaiData} />
      <ApiCard name="OpenRouter API" status="warning" {...openrouterData} />
      <ApiCard name="Exa API" status="active" {...exaData} />
      <ApiCard name="Twilio API" status="error" {...twilioData} />
    </div>
  </div>
  
  {/* Real-time Activity */}
  <div className="lg:col-span-4">
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="neon-text">Real-time Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <NotificationPanel notifications={recentActivity} />
      </CardContent>
    </Card>
  </div>
  
  {/* Performance Charts */}
  <div className="lg:col-span-6">
    <NeonChart 
      title="Response Time Trends" 
      data={responseTimeData}
      color="cyan"
      type="area"
    />
  </div>
  
  <div className="lg:col-span-6">
    <NeonChart 
      title="Cost Analysis" 
      data={costData}
      color="purple"
      type="line"
    />
  </div>
</div>
```

### 2. API Detail View
**Purpose**: Comprehensive monitoring for individual API services.

**Structure**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
  {/* API Header */}
  <div className="lg:col-span-12">
    <div className="glass-card p-6 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <StatusOrb status="active" size="lg" />
          <div>
            <h1 className="neon-text text-2xl api-openai">OpenAI API</h1>
            <p className="text-muted-foreground">gpt-3.5-turbo, gpt-4</p>
          </div>
        </div>
        <Badge variant="default" className="neon-glow">
          Operational
        </Badge>
      </div>
    </div>
  </div>
  
  {/* Key Metrics */}
  <div className="lg:col-span-3">
    <AnimatedMetric 
      title="Requests Today" 
      value="1,247" 
      change="+12.5%"
      trend="up"
    />
  </div>
  <div className="lg:col-span-3">
    <AnimatedMetric 
      title="Avg Response" 
      value="245ms" 
      change="-8.2%"
      trend="down"
    />
  </div>
  <div className="lg:col-span-3">
    <AnimatedMetric 
      title="Cost Today" 
      value="$23.45" 
      change="+5.1%"
      trend="up"
    />
  </div>
  <div className="lg:col-span-3">
    <AnimatedMetric 
      title="Error Rate" 
      value="0.1%" 
      change="-0.05%"
      trend="down"
    />
  </div>
  
  {/* Main Chart */}
  <div className="lg:col-span-8">
    <NeonChart 
      title="Request Volume (24h)" 
      data={hourlyData}
      color="green"
      height={300}
      type="area"
    />
  </div>
  
  {/* Status Timeline */}
  <div className="lg:col-span-4">
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="neon-text">Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3">
              <StatusOrb status={event.status} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">{event.message}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
  
  {/* Response Time Chart */}
  <div className="lg:col-span-6">
    <NeonChart 
      title="Response Time Distribution" 
      data={responseTimeDistribution}
      color="cyan"
      type="line"
    />
  </div>
  
  {/* Error Analysis */}
  <div className="lg:col-span-6">
    <NeonChart 
      title="Error Rate Trends" 
      data={errorRateData}
      color="red"
      type="area"
    />
  </div>
</div>
```

### 3. Settings & Configuration
**Purpose**: System configuration and user preferences.

**Structure**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
  {/* Navigation Sidebar */}
  <div className="lg:col-span-3">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="neon-text">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            General
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            API Configuration
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Appearance
          </Button>
        </nav>
      </CardContent>
    </Card>
  </div>
  
  {/* Settings Content */}
  <div className="lg:col-span-9">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="neon-text">API Configuration</CardTitle>
        <CardDescription>
          Manage your API endpoints and authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form content */}
      </CardContent>
    </Card>
  </div>
</div>
```

## Mobile Layouts

### Stack Pattern
**All components stack vertically on mobile**
```tsx
<div className="space-y-4 p-4">
  {/* Hero metric spans full width */}
  <AnimatedMetric {...mainMetric} className="w-full" />
  
  {/* Secondary metrics in 2-column grid */}
  <div className="grid grid-cols-2 gap-4">
    <AnimatedMetric {...metric1} />
    <AnimatedMetric {...metric2} />
  </div>
  
  {/* Chart spans full width */}
  <NeonChart {...chartData} height={200} />
  
  {/* Cards stack vertically */}
  <div className="space-y-4">
    <ApiCard {...api1} />
    <ApiCard {...api2} />
  </div>
</div>
```

### Bottom Sheet Pattern
**Overlay content slides up from bottom**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button className="cyber-button">View Details</Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="glass-card">
    <SheetHeader>
      <SheetTitle className="neon-text">API Details</SheetTitle>
    </SheetHeader>
    <div className="py-4">
      {/* Mobile-optimized content */}
    </div>
  </SheetContent>
</Sheet>
```

## Navigation Patterns

### Desktop Sidebar
```tsx
<div className="flex h-screen bg-gradient-bg">
  {/* Sidebar */}
  <aside className="w-64 glass-card border-r border-primary/20">
    <div className="p-6">
      <h1 className="neon-text text-xl font-bold">Nexus</h1>
    </div>
    <nav className="px-4 space-y-2">
      <NavItem href="/dashboard" icon={Dashboard} label="Overview" />
      <NavItem href="/apis" icon={Globe} label="API Status" />
      <NavItem href="/analytics" icon={BarChart} label="Analytics" />
      <NavItem href="/settings" icon={Settings} label="Settings" />
    </nav>
  </aside>
  
  {/* Main Content */}
  <main className="flex-1 overflow-y-auto custom-scrollbar">
    <div className="container mx-auto py-6">
      {children}
    </div>
  </main>
</div>
```

### Mobile Navigation
```tsx
<div className="flex flex-col h-screen">
  {/* Top Bar */}
  <header className="glass-card border-b border-primary/20 p-4">
    <div className="flex items-center justify-between">
      <h1 className="neon-text text-lg font-bold">Nexus</h1>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="glass-card">
          <nav className="space-y-4 mt-8">
            <NavItem href="/dashboard" icon={Dashboard} label="Overview" />
            <NavItem href="/apis" icon={Globe} label="API Status" />
            <NavItem href="/analytics" icon={BarChart} label="Analytics" />
            <NavItem href="/settings" icon={Settings} label="Settings" />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  </header>
  
  {/* Content */}
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
  
  {/* Bottom Navigation */}
  <nav className="glass-card border-t border-primary/20 p-2">
    <div className="flex justify-around">
      <TabButton href="/dashboard" icon={Dashboard} label="Home" />
      <TabButton href="/apis" icon={Globe} label="APIs" />
      <TabButton href="/analytics" icon={BarChart} label="Analytics" />
      <TabButton href="/settings" icon={Settings} label="Settings" />
    </div>
  </nav>
</div>
```

## Content Spacing

### Section Spacing
```css
/* Vertical rhythm for content sections */
.section-spacing {
  margin-bottom: 3rem; /* 48px */
}

.section-spacing:last-child {
  margin-bottom: 0;
}

/* Responsive section spacing */
@media (min-width: 768px) {
  .section-spacing {
    margin-bottom: 4rem; /* 64px */
  }
}
```

### Component Spacing
```css
/* Standard component gaps */
.component-grid {
  display: grid;
  gap: 1.5rem; /* 24px mobile */
}

@media (min-width: 768px) {
  .component-grid {
    gap: 2rem; /* 32px tablet+ */
  }
}

@media (min-width: 1024px) {
  .component-grid {
    gap: 2.5rem; /* 40px desktop+ */
  }
}
```

## Container Patterns

### Page Container
```tsx
<div className="container mx-auto px-4 py-6 max-w-7xl">
  {/* Page content */}
</div>
```

### Section Container
```tsx
<section className="space-y-6">
  <header className="space-y-2">
    <h2 className="neon-text text-2xl font-bold">Section Title</h2>
    <p className="text-muted-foreground">Section description</p>
  </header>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Section content */}
  </div>
</section>
```

### Card Container
```tsx
<Card className="glass-card border-primary/20">
  <CardHeader className="space-y-1">
    <CardTitle className="neon-text">Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Card content */}
  </CardContent>
  <CardFooter className="justify-end space-x-2">
    <Button variant="ghost">Cancel</Button>
    <Button className="cyber-button">Save</Button>
  </CardFooter>
</Card>
```

## Responsive Breakpoints

### Breakpoint Usage
```tsx
// Mobile-first approach
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-4 
  xl:grid-cols-6
  gap-4
">
  {/* Responsive grid items */}
</div>
```

### Content Adaptation
```tsx
// Show/hide content based on screen size
<div className="block md:hidden">
  {/* Mobile-only content */}
</div>

<div className="hidden md:block">
  {/* Desktop-only content */}
</div>

<div className="md:col-span-2 lg:col-span-3">
  {/* Responsive column spanning */}
</div>
```

## Performance Considerations

### Layout Optimization
- Use CSS Grid for complex layouts
- Implement virtual scrolling for long lists
- Lazy load charts and heavy components
- Optimize for Core Web Vitals (CLS, LCP, FID)

### Memory Management
- Unmount unused chart components
- Debounce window resize events
- Use React.memo for static layout components
- Implement proper cleanup in useEffect hooks

## Accessibility

### Semantic Structure
```tsx
<main role="main" aria-label="Dashboard">
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading" className="sr-only">Key Metrics</h2>
    {/* Metrics content */}
  </section>
  
  <section aria-labelledby="charts-heading">
    <h2 id="charts-heading" className="sr-only">Performance Charts</h2>
    {/* Charts content */}
  </section>
</main>
```

### Keyboard Navigation
- Implement focus management for dynamic content
- Provide skip links for main content areas
- Ensure tab order follows visual layout
- Support arrow key navigation in grids