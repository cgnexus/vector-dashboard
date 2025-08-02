# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js 15 project with TypeScript, Tailwind CSS, and App Router. When working on this project:

## Framework & Architecture

- Use Next.js 15 App Router patterns and conventions
- Follow TypeScript best practices with strict type checking
- Leverage React Server Components when appropriate
- Use Client Components (`'use client'`) only when necessary for interactivity

## Styling & UI

- Use Tailwind CSS for styling with utility classes
- Follow responsive design principles (mobile-first approach)
- Maintain consistent design patterns and component structure
- Use CSS modules or styled-components only when Tailwind is insufficient

## Code Organization

- Keep components in the `src/components` directory
- Use the `src/app` directory for routing and page components
- Implement proper error boundaries and loading states
- Follow the convention of co-locating related files

## Development Practices

- Write clean, readable, and maintainable code
- Use proper TypeScript interfaces and types
- Implement proper error handling and validation
- Follow Next.js performance best practices
- Use ESLint configuration for code quality

## API & Data Fetching

- Use Next.js built-in data fetching methods (fetch, use cache)
- Implement proper loading and error states
- Use Server Actions for form handling when appropriate
- Follow RESTful API design principles

## Testing & Quality

- Write unit tests for utility functions and components
- Use proper prop validation and TypeScript interfaces
- Implement proper accessibility (a11y) practices
- Follow semantic HTML structure
