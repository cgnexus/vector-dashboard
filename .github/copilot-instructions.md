# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js 15 project with TypeScript, Tailwind CSS, shadcn/ui, and App Router. When working on this project:

## Framework & Architecture

- Use Next.js 15 App Router patterns and conventions
- Follow TypeScript best practices with strict type checking
- Leverage React Server Components when appropriate
- Use Client Components (`'use client'`) only when necessary for interactivity

## Package Management

- **Use pnpm** as the package manager (configured in package.json)
- Use `pnpm add` instead of `npm install` for adding dependencies
- Use `pnpm dlx shadcn@latest add <component>` to add new shadcn/ui components
- Prefer `pnpm` commands in all documentation and examples

## Styling & UI

- **Primary**: Use shadcn/ui components for UI elements (located in `@/components/ui`)
- **Secondary**: Use Tailwind CSS for custom styling with utility classes
- Follow the shadcn/ui design system and component patterns
- Use the "new-york" style variant (configured in components.json)
- Follow responsive design principles (mobile-first approach)
- Maintain consistent design patterns with shadcn/ui components
- Use CSS modules or styled-components only when shadcn/ui and Tailwind are insufficient

## shadcn/ui Guidelines

- Import components from `@/components/ui` using the configured aliases
- Use existing shadcn/ui components: button, card, input, label, dialog, dropdown-menu, badge
- Follow shadcn/ui composition patterns for building complex components
- Leverage built-in variants and styling props provided by shadcn/ui components
- Use Lucide React icons (configured as the icon library)
- When adding new components, use: `pnpm dlx shadcn@latest add <component-name>`

## Code Organization

- Keep reusable components in the `src/components` directory
- Place shadcn/ui components in `src/components/ui` (auto-generated)
- Use the `src/app` directory for routing and page components
- Store utilities in `src/lib` directory
- Use configured path aliases: `@/components`, `@/lib`, `@/hooks`
- Implement proper error boundaries and loading states
- Follow the convention of co-locating related files

## Development Practices

- Write clean, readable, and maintainable code
- Use proper TypeScript interfaces and types
- Implement proper error handling and validation
- Follow Next.js performance best practices
- Use ESLint configuration for code quality
- Use pnpm for all package management operations
- Follow shadcn/ui component composition patterns

## API & Data Fetching

- Use Next.js built-in data fetching methods (fetch, use cache)
- Implement proper loading and error states
- Use Server Actions for form handling when appropriate
- Follow RESTful API design principles
- Use shadcn/ui components for form elements and loading states

## Testing & Quality

- Write unit tests for utility functions and components
- Use proper prop validation and TypeScript interfaces
- Implement proper accessibility (a11y) practices
- Follow semantic HTML structure
- Test shadcn/ui component integrations

## Component Development

- Compose new components using existing shadcn/ui primitives
- Follow the established component patterns in the project
- Use proper TypeScript props interfaces
- Implement proper forwarding of refs when needed
- Document component APIs with JSDoc comments
