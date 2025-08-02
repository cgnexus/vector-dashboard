"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';

export interface DistributionData {
  range: string;
  count: number;
  percentage: number;
  min: number;
  max: number;
}

interface DistributionChartProps {
  data: DistributionData[];
  title: string;
  metric: string;
  unit?: string;
  type?: 'area' | 'bar';
  height?: number;
  showStats?: boolean;
  className?: string;
}

export function DistributionChart({
  data,
  title,
  metric,
  unit = 'ms',
  type = 'area',
  height = 300,
  showStats = true,
  className
}: DistributionChartProps) {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  
  const stats = {
    mean: data.reduce((sum, item, index) => {
      const midpoint = (item.min + item.max) / 2;
      return sum + (midpoint * item.count);
    }, 0) / totalCount,
    
    median: (() => {
      const sortedData = data.flatMap(item => 
        Array(item.count).fill((item.min + item.max) / 2)
      ).sort((a, b) => a - b);
      const mid = Math.floor(sortedData.length / 2);
      return sortedData.length % 2 === 0 
        ? (sortedData[mid - 1] + sortedData[mid]) / 2 
        : sortedData[mid];
    })(),
    
    mode: (() => {
      const maxCount = Math.max(...data.map(item => item.count));
      const modeItem = data.find(item => item.count === maxCount);
      return modeItem ? (modeItem.min + modeItem.max) / 2 : 0;
    })(),
    
    p95: (() => {
      const sortedData = data.flatMap(item => 
        Array(item.count).fill((item.min + item.max) / 2)
      ).sort((a, b) => a - b);
      const index = Math.ceil(sortedData.length * 0.95) - 1;
      return sortedData[index] || 0;
    })()
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            <div className="font-medium">{label}</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Count:</span>
                <span className="font-medium">{data.count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Percentage:</span>
                <span className="font-medium">{data.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Range:</span>
                <span className="font-medium">{data.min}{unit} - {data.max}{unit}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value: string) => {
    // Extract the min value from the range string
    const match = value.match(/(\d+)/);
    return match ? `${match[1]}${unit}` : value;
  };

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="neon-text text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {totalCount.toLocaleString()} samples
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart 
                data={data} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="distributionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)" 
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={formatXAxisTick}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--neon-cyan))"
                  strokeWidth={2}
                  fill="url(#distributionGradient)"
                  filter="drop-shadow(0 0 6px hsl(var(--neon-cyan)))"
                />
              </AreaChart>
            ) : (
              <BarChart 
                data={data} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)" 
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={formatXAxisTick}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--neon-cyan))"
                  radius={[2, 2, 0, 0]}
                  filter="drop-shadow(0 0 6px hsl(var(--neon-cyan)))"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Statistics */}
        {showStats && (
          <div className="p-4 border-t border-border/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold neon-text">
                  {Math.round(stats.mean)}{unit}
                </div>
                <div className="text-xs text-muted-foreground">Mean</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold neon-text">
                  {Math.round(stats.median)}{unit}
                </div>
                <div className="text-xs text-muted-foreground">Median</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold neon-text">
                  {Math.round(stats.mode)}{unit}
                </div>
                <div className="text-xs text-muted-foreground">Mode</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold neon-text">
                  {Math.round(stats.p95)}{unit}
                </div>
                <div className="text-xs text-muted-foreground">95th %ile</div>
              </div>
            </div>
            
            {/* Performance insights */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <strong>Performance Grade:</strong> {
                    stats.p95 < 200 ? 'Excellent' :
                    stats.p95 < 500 ? 'Good' :
                    stats.p95 < 1000 ? 'Fair' : 'Needs Improvement'
                  }
                </div>
                <div>
                  <strong>Distribution:</strong> {
                    Math.abs(stats.mean - stats.median) < 50 ? 'Normal' : 'Skewed'
                  } distribution with {
                    data.length > 8 ? 'wide' : 'narrow'
                  } spread
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to generate distribution data from raw response times
export function generateDistributionData(
  responseTimes: number[],
  bucketCount: number = 10
): DistributionData[] {
  if (!responseTimes.length) return [];
  
  const min = Math.min(...responseTimes);
  const max = Math.max(...responseTimes);
  const bucketSize = (max - min) / bucketCount;
  
  const buckets: DistributionData[] = [];
  
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + (i * bucketSize);
    const bucketMax = min + ((i + 1) * bucketSize);
    
    const count = responseTimes.filter(time => 
      time >= bucketMin && (i === bucketCount - 1 ? time <= bucketMax : time < bucketMax)
    ).length;
    
    const percentage = (count / responseTimes.length) * 100;
    
    buckets.push({
      range: `${Math.round(bucketMin)}-${Math.round(bucketMax)}`,
      count,
      percentage,
      min: Math.round(bucketMin),
      max: Math.round(bucketMax)
    });
  }
  
  return buckets;
}