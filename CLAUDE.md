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

**Database:**
```bash
pnpm db:start        # Start Docker database
pnpm db:stop         # Stop Docker database
pnpm db:generate     # Generate Drizzle migrations
pnpm db:push         # Push schema changes to database
pnpm db:studio       # Open Drizzle Studio
pnpm db:migrate      # Run migrations
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
- **Better Auth** for authentication (email/password)
- **Drizzle ORM** with PostgreSQL
- **pnpm** for package management (NOT npm)

## Authentication

The project uses Better Auth with the following setup:
- **Email/password authentication** enabled
- **Session management** with secure cookies
- **Protected routes** via middleware
- **Auth pages** at `/signin` and `/signup`
- **API route** at `/api/auth/[...all]`

### Auth Files:
- `src/lib/auth.ts` - Server-side auth configuration
- `src/lib/auth-client.ts` - Client-side auth utilities
- `src/middleware.ts` - Route protection
- `src/components/auth-provider.tsx` - Auth context provider
- `src/app/(auth)/` - Authentication pages

### Environment Variables:
Create `.env.local` with:
```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

## Key Patterns

1. **Component Development:**
   - Use existing shadcn/ui components from `@/components/ui/`
   - Currently installed: button, card, input, label, dialog, dropdown-menu, badge
   - Follow shadcn/ui composition patterns
   - Use Tailwind CSS for styling (not CSS modules)

2. **File Structure:**
   - Pages and layouts: `src/app/`
   - Reusable components: `src/components/`
   - Utilities and configs: `src/lib/`
   - Database schema: `src/db/`
   - Path alias `@/` maps to `./src/`

3. **TypeScript:**
   - Strict mode is enabled
   - Define proper interfaces for component props
   - Use type inference where appropriate

4. **Database:**
   - Drizzle ORM for type-safe database queries
   - PostgreSQL as the database
   - Schema defined in `src/db/schema.ts`
   - Migrations in `src/db/migrations/`

5. **Important Notes:**
   - No test framework is currently configured
   - Use pnpm (not npm) for all package operations
   - Follow existing code patterns in the codebase
   - Import components using `@/` alias
   - Run database migrations before starting development