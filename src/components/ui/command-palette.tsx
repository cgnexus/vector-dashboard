"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Activity, 
  BarChart3, 
  Bell, 
  DollarSign, 
  Home, 
  Settings, 
  Shield, 
  Zap,
  Command,
  ArrowRight
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "navigation" | "actions" | "apis";
  keywords: string[];
}

const commands: Command[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Overview of all APIs and metrics",
    href: "/dashboard",
    icon: Home,
    category: "navigation",
    keywords: ["home", "overview", "main"]
  },
  {
    id: "openai",
    title: "OpenAI Monitor",
    description: "Monitor OpenAI API usage and costs",
    href: "/dashboard/openai",
    icon: Zap,
    category: "apis",
    keywords: ["gpt", "openai", "ai", "language model"]
  },
  {
    id: "openrouter",
    title: "OpenRouter Monitor",
    description: "Track OpenRouter API metrics",
    href: "/dashboard/openrouter",
    icon: Shield,
    category: "apis",
    keywords: ["openrouter", "routing", "ai"]
  },
  {
    id: "exa",
    title: "Exa API Monitor",
    description: "Monitor Exa search API performance",
    href: "/dashboard/exa",
    icon: Activity,
    category: "apis",
    keywords: ["exa", "search", "api"]
  },
  {
    id: "costs",
    title: "Cost Management",
    description: "Analyze and manage API costs",
    href: "/dashboard/costs",
    icon: DollarSign,
    category: "navigation",
    keywords: ["cost", "billing", "money", "budget"]
  },
  {
    id: "alerts",
    title: "Alerts & Notifications",
    description: "View and manage system alerts",
    href: "/dashboard/alerts",
    icon: Bell,
    category: "navigation",
    keywords: ["alerts", "notifications", "warnings"]
  },
  {
    id: "analytics",
    title: "Analytics Dashboard",
    description: "Advanced analytics and insights",
    href: "/dashboard/analytics",
    icon: BarChart3,
    category: "navigation",
    keywords: ["analytics", "charts", "insights", "data"]
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure system preferences",
    href: "/dashboard/settings",
    icon: Settings,
    category: "navigation",
    keywords: ["settings", "config", "preferences"]
  }
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels = {
    navigation: "Navigation",
    actions: "Quick Actions", 
    apis: "API Services"
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          window.location.href = filteredCommands[selectedIndex].href;
          onOpenChange(false);
        }
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 p-0 max-w-2xl">
        <div className="flex items-center border-b border-border/50 px-4">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search commands, APIs, or features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <div className="flex items-center gap-1 ml-auto">
            <Badge variant="outline" className="text-xs">
              <Command className="w-3 h-3 mr-1" />
              K
            </Badge>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="mb-4 last:mb-0">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              </div>
              <div className="space-y-1">
                {commands.map((command, _index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  const Icon = command.icon;

                  return (
                    <button
                      key={command.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                        "hover:bg-white/5 group relative overflow-hidden",
                        isSelected && "bg-primary/20 neon-glow"
                      )}
                      onClick={() => {
                        window.location.href = command.href;
                        onOpenChange(false);
                      }}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                        "bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30",
                        isSelected && "border-primary/50 neon-glow"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{command.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {command.description}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-primary" />
                      )}
                      
                      {/* Scan line effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No commands found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try searching for &quot;dashboard&quot;, &quot;api&quot;, or &quot;settings&quot;
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Navigate with ↑ ↓ arrows</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use command palette with keyboard shortcut
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    CommandPalette: (props: Omit<CommandPaletteProps, "open" | "onOpenChange">) => (
      <CommandPalette {...props} open={open} onOpenChange={setOpen} />
    )
  };
}