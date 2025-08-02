# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
```bash
pnpm install          # Install dependencies
pnpm run dev         # Start development server with Turbopack (http://localhost:3000)
pnpm run build       # Build for production
pnpm start           # Start production server
pnpm run lint        # Run ESLint
```

**Adding Components:**
```bash
pnpm dlx shadcn@latest add <component>  # Add new shadcn/ui components
```

## Architecture

This is a Next.js 15 project using:
- **App Router** (`src/app/`) for file-based routing
- **React Server Components** by default (use `'use client'` only when needed)
- **TypeScript** with strict mode enabled
- **Tailwind CSS 4** for styling (utility-first)
- **shadcn/ui** components in `@/components/ui/`
- **pnpm** for package management (NOT npm)

## Key Patterns

1. **Component Development:**
   - Use existing shadcn/ui components from `@/components/ui/`
   - Currently installed: button, card, input, label, dialog, dropdown-menu, badge
   - Follow shadcn/ui composition patterns
   - Use Tailwind CSS for styling (not CSS modules)

2. **File Structure:**
   - Pages and layouts: `src/app/`
   - Reusable components: `src/components/`
   - Utilities: `src/lib/`
   - Path alias `@/` maps to `./src/`

3. **TypeScript:**
   - Strict mode is enabled
   - Define proper interfaces for component props
   - Use type inference where appropriate

4. **Important Notes:**
   - No test framework is currently configured
   - Use pnpm (not npm) for all package operations
   - Follow existing code patterns in the codebase
   - Import components using `@/` alias