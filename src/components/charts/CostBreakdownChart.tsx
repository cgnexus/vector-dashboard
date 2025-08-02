"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

export interface CostBreakdownData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  requests?: number;
  avgCost?: number;
}

interface CostBreakdownChartProps {
  data: CostBreakdownData[];
  title: string;
  totalCost: number;
  height?: number;
  showInner?: boolean;
  className?: string;
}

export function CostBreakdownChart({
  data,
  title,
  totalCost,
  height = 300,
  showInner = true,
  className
}: CostBreakdownChartProps) {
  const colors = [
    'hsl(var(--neon-cyan))',
    'hsl(var(--neon-purple))',
    'hsl(var(--neon-green))',
    'hsl(var(--neon-orange))',
    'hsl(var(--neon-red))',
    'hsl(var(--neon-blue))',
    'hsl(var(--neon-pink))',
    'hsl(var(--neon-yellow))'
  ];

  const processedData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CostBreakdownData & { color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full neon-glow"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium">${data.value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Percentage:</span>
                <span className="font-medium">{data.percentage.toFixed(1)}%</span>
              </div>
              {data.requests && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Requests:</span>
                  <span className="font-medium">{data.requests.toLocaleString()}</span>
                </div>
              )}
              {data.avgCost && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Avg per request:</span>
                  <span className="font-medium">${data.avgCost.toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { 
    cx: number; 
    cy: number; 
    midAngle: number; 
    innerRadius: number; 
    outerRadius: number; 
    percent: number; 
  }) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="rgba(255,255,255,0.8)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        filter="drop-shadow(0 0 4px rgba(0,0,0,0.8))"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="neon-text text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            Total: ${totalCost.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {processedData.map((entry, index) => (
                  <filter key={`glow-${index}`} id={`glow-${index}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                ))}
              </defs>
              
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={showInner ? 80 : 100}
                innerRadius={showInner ? 40 : 0}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="rgba(255,255,255,0.1)"
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    filter={`url(#glow-${index})`}
                  />
                ))}
              </Pie>
              
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {processedData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full neon-glow"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">${item.value.toFixed(2)}</span>
                  <span className="text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Cost efficiency insight */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Most efficient: {processedData.reduce((prev, current) => 
                (prev.avgCost || 0) < (current.avgCost || 0) ? prev : current
              ).name} (${processedData.reduce((prev, current) => 
                (prev.avgCost || 0) < (current.avgCost || 0) ? prev : current
              ).avgCost?.toFixed(4)}/req)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}