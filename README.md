# Vector Dashboard

A modern Next.js 15 dashboard application built with TypeScript, Tailwind CSS, and the App Router.

## Features

- ⚡ **Next.js 15** with App Router and Turbopack for fast development
- 🔷 **TypeScript** for type safety and better developer experience
- 🎨 **Tailwind CSS 4** for modern, responsive styling
- 📱 **Responsive Design** with mobile-first approach
- 🔧 **ESLint** for code quality and consistency
- 🚀 **Optimized** for performance and SEO

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The development server uses Turbopack for faster builds and hot reloading. The page auto-updates as you edit files.

### Building for Production

```bash
npm run build
npm start
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

- **Next.js Development Server** - Start development with hot reload
- **Build Next.js Application** - Create production build
- **Start Production Server** - Run production server
- **Lint Code** - Run ESLint checks
- **Install Dependencies** - Install npm packages

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
