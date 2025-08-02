import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Vector Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default">Next.js 15</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="outline">Tailwind CSS</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="outline">pnpm</Badge>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Modern Stack</CardTitle>
              <CardDescription>
                Built with the latest technologies for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Next.js 15 with App Router, TypeScript for type safety, and Turbopack for lightning-fast development.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎨 Beautiful UI</CardTitle>
              <CardDescription>
                Designed with shadcn/ui and Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pre-built components that are accessible, customizable, and follow design best practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Fast Development</CardTitle>
              <CardDescription>
                Optimized developer experience with pnpm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fast installs, efficient disk usage, and strict dependency resolution for better security.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Demo */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Quick Demo</CardTitle>
            <CardDescription>
              Try out the shadcn/ui components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <Button className="w-full">Get Started</Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Ready to build your next project? Edit <code className="bg-muted px-1 py-0.5 rounded">src/app/page.tsx</code> to get started.</p>
        </div>
      </div>
    </div>
  );
}
