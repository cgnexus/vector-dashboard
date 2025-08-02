# Vector Dashboard

A modern Next.js 15 dashboard application built with TypeScript, Tailwind CSS, shadcn/ui, and the App Router.

## Features

- ⚡ **Next.js 15** with App Router and Turbopack for fast development
- 🔷 **TypeScript** for type safety and better developer experience
- 🎨 **Tailwind CSS 4** for modern, responsive styling
- 🧩 **shadcn/ui** for beautiful, accessible UI components
- 📱 **Responsive Design** with mobile-first approach
- 🔧 **ESLint** for code quality and consistency
- 🚀 **Optimized** for performance and SEO
- 📦 **pnpm** for fast, disk space efficient package management

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended), npm, yarn, or bun

### Development

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The development server uses Turbopack for faster builds and hot reloading. The page auto-updates as you edit files.

### Building for Production

```bash
pnpm run build
pnpm start
```

## Project Structure

```
src/
├── app/                # App Router pages and layouts
│   ├── layout.tsx     # Root layout component
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles
└── components/        # Reusable UI components (create as needed)
```

## VS Code Integration

This project includes VS Code configurations for:

- Debugging (server-side, client-side, and full-stack)
- Tasks for common operations (dev, build, lint)
- Extensions for TypeScript, Tailwind CSS, and ESLint
- Custom settings for optimal development experience

### Available Tasks

Press `Ctrl+Shift+P` and search for "Tasks: Run Task" to access:

- **Next.js Development Server** - Start development with hot reload (uses pnpm)
- **Build Next.js Application** - Create production build (uses pnpm)
- **Start Production Server** - Run production server (uses pnpm)
- **Lint Code** - Run ESLint checks (uses pnpm)
- **Install Dependencies** - Install packages with pnpm

### pnpm Commands

- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm add <package>` - Add a new dependency
- `pnpm add -D <package>` - Add a development dependency

### shadcn/ui Commands

- `pnpm dlx shadcn@latest add <component>` - Add new shadcn/ui components
- `pnpm dlx shadcn@latest add button card input` - Add multiple components at once

#### Available shadcn/ui Components

Currently installed components:
- `button` - Interactive button component with variants
- `card` - Flexible content container with header/content sections
- `input` - Form input component with proper styling
- `label` - Accessible form label component
- `dialog` - Modal/popup dialog component
- `dropdown-menu` - Accessible dropdown menu component
- `badge` - Small status indicator component

Use these components by importing from `@/components/ui`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Package Management

This project uses **pnpm** for package management, which provides:

- **Faster installs** - Up to 2x faster than npm
- **Disk space efficiency** - Saves disk space through content-addressable storage
- **Strict dependency resolution** - Prevents phantom dependencies
- **Better monorepo support** - Built-in workspace support

### Why pnpm?

- **Performance**: Faster installation and less disk usage
- **Security**: Strict dependency resolution prevents supply chain attacks
- **Compatibility**: Drop-in replacement for npm with the same API
- **Modern**: Built for modern JavaScript development workflows

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
