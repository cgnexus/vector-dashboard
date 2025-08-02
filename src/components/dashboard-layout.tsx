"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusOrb } from "@/components/ui/status-orb";
import { HoloSpinner } from "@/components/ui/holo-loader";
import { useCommandPalette } from "@/components/ui/command-palette";
import { SWRProvider } from "@/components/swr-provider";
import {
  Activity,
  BarChart3,
  Bell,
  DollarSign,
  Home,
  Menu,
  Settings,
  Shield,
  Zap,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "OpenAI", href: "/dashboard/openai", icon: Zap, apiClass: "api-openai" },
  { name: "OpenRouter", href: "/dashboard/openrouter", icon: Shield, apiClass: "api-openrouter" },
  { name: "Exa API", href: "/dashboard/exa", icon: Activity, apiClass: "api-exa" },
  { name: "Twilio", href: "/dashboard/twilio", icon: Zap, apiClass: "api-twilio" },
  { name: "Apollo", href: "/dashboard/apollo", icon: BarChart3, apiClass: "api-apollo" },
  { name: "Cost Management", href: "/dashboard/costs", icon: DollarSign },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const { CommandPalette } = useCommandPalette();

  // Simulate loading state for route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <SWRProvider>
      <div className="min-h-screen bg-background gradient-bg">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 glass-card border-r border-border/50 circuit-pattern">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent neon-glow" />
                <div className="absolute inset-0 rounded-lg bg-primary/20 animate-ping" />
              </div>
              <span className="text-xl font-bold neon-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nexus
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-primary/20 text-primary neon-glow"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:neon-glow",
                    item.apiClass
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="relative z-10 flex items-center space-x-3 w-full">
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="transition-all duration-300">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto flex items-center gap-2">
                        <StatusOrb status="active" size="sm" />
                        <Badge variant="outline" className="neon-glow text-xs">
                          Active
                        </Badge>
                      </div>
                    )}
                  </div>
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-500" />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-r border-border/50 px-6 circuit-pattern">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary via-accent to-secondary neon-glow" />
                <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-ping" />
                <div className="absolute inset-2 rounded-md bg-background/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold neon-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nexus
                </span>
                <span className="text-xs text-muted-foreground">
                  API Control Center
                </span>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all duration-300 relative overflow-hidden",
                            isActive
                              ? "bg-primary/20 text-primary neon-glow border border-primary/30"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-primary/20 border border-transparent",
                            item.apiClass
                          )}
                        >
                          <div className="relative z-10 flex items-center gap-x-3 w-full">
                            <Icon className="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                            <span className="transition-all duration-300">{item.name}</span>
                            {isActive && (
                              <div className="ml-auto flex items-center gap-2">
                                <StatusOrb status="active" size="sm" />
                                <Badge variant="outline" className="neon-glow text-xs">
                                  Live
                                </Badge>
                              </div>
                            )}
                          </div>
                          {/* Scan line effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  href="/dashboard/settings"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Settings className="h-6 w-6 shrink-0" />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 glass-card backdrop-blur-xl px-4 shadow-xl sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </Button>

          <div className="h-6 w-px bg-border lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block">
                <div className="flex items-center gap-3">
                  {isLoading && <HoloSpinner />}
                  <h1 className="text-lg font-semibold neon-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    API Control Center
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                className="cyber-button group hidden lg:flex"
                onClick={() => {/* Open command palette */}}
              >
                <span className="text-xs text-muted-foreground mr-2">Quick search</span>
                <Badge variant="outline" className="text-xs">
                  ⌘K
                </Badge>
              </Button>
              
              <Button variant="ghost" size="sm" className="relative cyber-button group">
                <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-neon-red neon-glow animate-pulse">
                  4
                </Badge>
                <div className="absolute inset-0 rounded-md border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              
              <div className="flex items-center gap-2">
                <StatusOrb status="active" size="sm" label="System Online" />
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
        {/* Command Palette */}
        <CommandPalette />
      </div>
    </SWRProvider>
  );
}