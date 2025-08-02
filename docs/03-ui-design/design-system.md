# Nexus API Monitoring Dashboard - Design System

## Overview

The Nexus Dashboard implements a futuristic, cyberpunk-inspired design system optimized for API monitoring and data visualization. The system emphasizes high contrast, neon accents, and glassmorphism effects to create a cutting-edge yet professional aesthetic.

## Color Palette

### Base Colors (OKLCH)
```css
/* Dark Theme Foundation */
--background: oklch(0.08 0 0);          /* Pure dark background */
--foreground: oklch(0.985 0 0);         /* High contrast white text */
--card: oklch(0.15 0 0);                /* Elevated surface */
--card-foreground: oklch(0.985 0 0);    /* Card text */

/* Interactive Elements */
--primary: oklch(0.7 0.25 180);         /* Cyan neon primary */
--secondary: oklch(0.2 0 0);            /* Muted dark secondary */
--muted: oklch(0.18 0 0);               /* Subtle backgrounds */
--muted-foreground: oklch(0.65 0 0);    /* Secondary text */
--accent: oklch(0.8 0.3 270);           /* Purple neon accent */

/* System Colors */
--border: oklch(0.3 0 0);               /* Subtle borders */
--input: oklch(0.18 0 0);               /* Form inputs */
--ring: oklch(0.7 0.25 180);            /* Focus rings */
```

### Neon Accent Colors
```css
/* API-Specific Branding */
--neon-cyan: oklch(0.7 0.25 180);       /* Primary/Exa API */
--neon-purple: oklch(0.8 0.3 270);      /* OpenRouter API */
--neon-green: oklch(0.75 0.28 120);     /* OpenAI API/Success */
--neon-yellow: oklch(0.75 0.25 60);     /* Warning states */
--neon-red: oklch(0.7 0.25 0);          /* Twilio API/Error */
--neon-orange: oklch(0.75 0.25 30);     /* Apollo API */
```

### Status Colors
```css
/* Semantic Status Colors */
.status-active { color: var(--neon-green); }    /* Operational */
.status-warning { color: var(--neon-yellow); }  /* Degraded */
.status-error { color: var(--neon-red); }       /* Critical */
.status-offline { color: oklch(0.5 0 0); }      /* Inactive */
```

### API Brand Colors
```css
/* Consistent API Identification */
.api-openai { color: var(--neon-green); }       /* OpenAI */
.api-openrouter { color: var(--neon-purple); }  /* OpenRouter */
.api-exa { color: var(--neon-cyan); }           /* Exa */
.api-twilio { color: var(--neon-red); }         /* Twilio */
.api-apollo { color: var(--neon-orange); }      /* Apollo */
```

## Typography

### Font Stack
```css
--font-sans: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
--font-mono: "Geist Mono", ui-monospace, "SF Mono", monospace;
```

### Type Scale (Mobile-First)
```css
/* Display & Headers */
.text-display { font-size: 2.25rem; line-height: 2.5rem; } /* 36px/40px */
.text-h1 { font-size: 1.875rem; line-height: 2.25rem; }    /* 30px/36px */
.text-h2 { font-size: 1.5rem; line-height: 2rem; }         /* 24px/32px */
.text-h3 { font-size: 1.25rem; line-height: 1.75rem; }     /* 20px/28px */

/* Body & Interface */
.text-body { font-size: 1rem; line-height: 1.5rem; }       /* 16px/24px */
.text-small { font-size: 0.875rem; line-height: 1.25rem; } /* 14px/20px */
.text-tiny { font-size: 0.75rem; line-height: 1rem; }      /* 12px/16px */

/* Monospace for Data */
.text-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

### Typography Effects
```css
/* Neon Text Effects */
.neon-text {
  text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
  transition: text-shadow 0.3s ease-in-out;
}

.neon-text:hover {
  text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
}

/* Animated Numbers */
.animated-number {
  font-variant-numeric: tabular-nums;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Spacing System

### Base Scale (8px Grid)
```css
/* Tailwind-Compatible Spacing */
--space-1: 0.25rem;  /* 4px - Tight spacing */
--space-2: 0.5rem;   /* 8px - Default small */
--space-3: 0.75rem;  /* 12px - Medium small */
--space-4: 1rem;     /* 16px - Default medium */
--space-5: 1.25rem;  /* 20px - Large small */
--space-6: 1.5rem;   /* 24px - Section spacing */
--space-8: 2rem;     /* 32px - Large spacing */
--space-12: 3rem;    /* 48px - Hero spacing */
--space-16: 4rem;    /* 64px - Major sections */
--space-20: 5rem;    /* 80px - Page sections */
```

### Responsive Spacing
```css
/* Mobile-First Approach */
.container {
  padding-inline: 1rem;    /* 16px mobile */
}

@media (min-width: 768px) {
  .container {
    padding-inline: 2rem;  /* 32px tablet+ */
  }
}

@media (min-width: 1024px) {
  .container {
    padding-inline: 3rem;  /* 48px desktop+ */
  }
}
```

## Border Radius

### Consistent Radius Scale
```css
--radius: 0.625rem;                    /* 10px base */
--radius-sm: calc(var(--radius) - 4px); /* 6px small */
--radius-md: calc(var(--radius) - 2px); /* 8px medium */
--radius-lg: var(--radius);             /* 10px large */
--radius-xl: calc(var(--radius) + 4px); /* 14px extra large */
--radius-full: 9999px;                  /* Fully rounded */
```

## Effects & Filters

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
```

### Neon Glow Effects
```css
.neon-glow {
  box-shadow: 0 0 5px currentColor, 
              0 0 10px currentColor, 
              0 0 15px currentColor,
              0 0 20px currentColor;
  transition: box-shadow 0.3s ease-in-out;
}

.neon-glow:hover {
  box-shadow: 0 0 10px currentColor, 
              0 0 20px currentColor, 
              0 0 30px currentColor,
              0 0 40px currentColor;
}
```

### Background Patterns
```css
/* Circuit Board Pattern */
.circuit-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
  background-size: 20px 20px;
}

/* Grid Pattern */
.grid-pattern {
  background-image: 
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Gradient Background */
.gradient-bg {
  background: linear-gradient(135deg, 
    oklch(0.08 0 0) 0%, 
    oklch(0.12 0.1 270) 50%, 
    oklch(0.08 0 0) 100%);
}
```

## Shadows & Depth

### Elevation System
```css
/* Card Shadows */
.shadow-sm { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); }
.shadow-md { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4); }
.shadow-lg { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3); }
.shadow-xl { box-shadow: 0 20px 25px rgba(0, 0, 0, 0.25); }

/* Depth Card Effects */
.depth-card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.depth-card:hover {
  transform: rotateX(5deg) rotateY(5deg) translateZ(10px);
}
```

## Usage Guidelines

### Color Combinations
1. **Primary Actions**: Use `--neon-cyan` for main CTAs and primary interactions
2. **Success States**: Use `--neon-green` for confirmations and OpenAI branding
3. **Warning States**: Use `--neon-yellow` for caution and attention
4. **Error States**: Use `--neon-red` for errors and Twilio branding
5. **Secondary Actions**: Use `--accent` (purple) for secondary interactions

### Accessibility
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Neon effects should not be the only way to convey information
- Always provide text alternatives for color-coded information
- Test with reduced motion preferences

### Performance Considerations
- Use `backdrop-filter` sparingly as it's GPU-intensive
- Implement neon effects with CSS transforms for better performance
- Use `will-change` property for animated elements
- Optimize glassmorphism for mobile devices

### Design Tokens
```css
:root {
  /* Component Sizes */
  --button-height-sm: 2rem;     /* 32px */
  --button-height-md: 2.5rem;   /* 40px */
  --button-height-lg: 3rem;     /* 48px */
  
  /* Card Padding */
  --card-padding-sm: 1rem;      /* 16px */
  --card-padding-md: 1.5rem;    /* 24px */
  --card-padding-lg: 2rem;      /* 32px */
  
  /* Animation Timing */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
  
  /* Z-Index Scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

This design system ensures consistency across all components while maintaining the futuristic, high-tech aesthetic that makes the Nexus Dashboard feel cutting-edge and professional.