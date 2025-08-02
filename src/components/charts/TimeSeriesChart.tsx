"use client";

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface TimeSeriesDataPoint {
  date: string;
  requests?: number;
  cost?: number;
  responseTime?: number;
  errorRate?: number;
  successRate?: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  metrics: Array<{
    key: keyof TimeSeriesDataPoint;
    label: string;
    color: string;
    yAxisId?: string;
    unit?: string;
  }>;
  type?: 'line' | 'area';
  height?: number;
  showTrend?: boolean;
  className?: string;
}

export function TimeSeriesChart({
  data,
  title,
  metrics,
  type = 'line',
  height = 300,
  showTrend = true,
  className
}: TimeSeriesChartProps) {
  const processedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: format(parseISO(point.date), 'MMM dd'),
      fullDate: format(parseISO(point.date), 'PPP')
    }));
  }, [data]);

  const trend = useMemo(() => {
    if (!showTrend || data.length < 2) return null;

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, point) => sum + (point.requests || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, point) => sum + (point.requests || 0), 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  }, [data, showTrend]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const dataPoint = processedData.find(p => p.formattedDate === label);
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{dataPoint?.fullDate}</p>
          {payload.map((entry, index: number) => {
            const metric = metrics.find(m => m.key === entry.dataKey);
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{metric?.label}:</span>
                <span className="font-medium">
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                  {metric?.unit && ` ${metric.unit}`}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const Chart = type === 'area' ? AreaChart : LineChart;

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="neon-text text-lg">{title}</CardTitle>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge variant="outline" className={`text-xs ${
                trend.direction === 'up' ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'
              }`}>
                {trend.percentage}%
              </Badge>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <div key={metric.key} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full neon-glow"
                style={{ backgroundColor: metric.color }}
              />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {metrics.map(metric => (
                  <linearGradient key={`gradient-${metric.key}`} id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {metrics.map(metric => {
                if (type === 'area') {
                  return (
                    <Area
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${metric.key})`}
                      fillOpacity={1}
                      filter="drop-shadow(0 0 6px currentColor)"
                    />
                  );
                } else {
                  return (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={{ fill: metric.color, strokeWidth: 0, r: 4 }}
                      activeDot={{ 
                        r: 6, 
                        stroke: metric.color, 
                        strokeWidth: 2,
                        filter: "drop-shadow(0 0 8px currentColor)"
                      }}
                      filter="drop-shadow(0 0 6px currentColor)"
                    />
                  );
                }
              })}
            </Chart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}