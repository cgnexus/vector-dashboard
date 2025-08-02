"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ComparisonDataPoint {
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  previousValue?: number;
  color?: string;
}

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
  title: string;
  metric: string;
  unit?: string;
  type?: 'bar' | 'radar';
  height?: number;
  showTrends?: boolean;
  className?: string;
}

export function ComparisonChart({
  data,
  title,
  metric,
  unit = '',
  type = 'bar',
  height = 300,
  showTrends = true,
  className
}: ComparisonChartProps) {
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
    color: item.color || colors[index % colors.length],
    change: item.previousValue ? 
      ((item.value - item.previousValue) / item.previousValue) * 100 : 0
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: ComparisonDataPoint & { change: number; color: string }; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{metric}:</span>
              <span className="font-medium">
                {payload[0].value.toLocaleString()}{unit}
              </span>
            </div>
            {data.previousValue && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Previous:</span>
                <span className="font-medium">
                  {data.previousValue.toLocaleString()}{unit}
                </span>
              </div>
            )}
            {showTrends && data.trend && (
              <div className="flex items-center gap-2 text-sm">
                {data.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {data.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {data.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                <span className="text-muted-foreground">Trend:</span>
                <span className={`font-medium ${
                  data.trend === 'up' ? 'text-green-500' : 
                  data.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {data.trend}
                </span>
                {data.change !== 0 && (
                  <span className={`text-xs ${
                    data.change > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ({data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxisTick = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="neon-text text-lg">{title}</CardTitle>
          {showTrends && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {metric} {unit}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'radar' ? (
              <RadarChart data={processedData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.8)' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'dataMax']}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={formatYAxisTick}
                />
                <Radar
                  dataKey="value"
                  stroke="hsl(var(--neon-cyan))"
                  fill="hsl(var(--neon-cyan))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  filter="drop-shadow(0 0 8px currentColor)"
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            ) : (
              <BarChart 
                data={processedData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="horizontal"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)" 
                  horizontal={true}
                  vertical={false}
                />
                
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={formatYAxisTick}
                />
                
                <YAxis 
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.8)' }}
                  width={100}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  fill="url(#barGradient)"
                >
                  {processedData.map((entry, index) => (
                    <Bar 
                      key={`bar-${index}`} 
                      fill={entry.color}
                      filter="drop-shadow(0 0 6px currentColor)"
                    />
                  ))}
                </Bar>
                
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Trends Summary */}
        {showTrends && type === 'bar' && (
          <div className="p-4 border-t border-border/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {processedData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full neon-glow"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                  {item.trend && (
                    <div className="flex items-center gap-1">
                      {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {item.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}