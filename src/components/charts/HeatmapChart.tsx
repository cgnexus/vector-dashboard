"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

export interface HeatmapData {
  hour: number;
  day: string;
  value: number;
  requests?: number;
  cost?: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title: string;
  metric: 'requests' | 'cost' | 'value';
  height?: number;
  className?: string;
}

export function HeatmapChart({
  data,
  title,
  metric,
  height = 300,
  className
}: HeatmapChartProps) {
  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const { processedData, maxValue } = useMemo(() => {
    const values = data.map(d => d[metric] || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const processed = days.map(day => 
      hours.map(hour => {
        const item = data.find(d => d.day === day && d.hour === hour);
        const value = item ? (item[metric] || 0) : 0;
        const intensity = max > min ? (value - min) / (max - min) : 0;
        
        return {
          day,
          hour,
          value,
          intensity,
          requests: item?.requests || 0,
          cost: item?.cost || 0
        };
      })
    );

    return { processedData: processed, maxValue: max, minValue: min };
  }, [data, metric, days, hours]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'rgba(255, 255, 255, 0.05)';
    
    // Create a gradient from dark blue to bright cyan
    const alpha = Math.max(0.1, intensity);
    const hue = 180; // Cyan
    const saturation = 70 + (intensity * 30);
    const lightness = 30 + (intensity * 40);
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  };

  const getTextColor = (intensity: number) => {
    return intensity > 0.5 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)';
  };

  const formatValue = (value: number) => {
    if (metric === 'cost') return `$${value.toFixed(0)}`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const cellSize = Math.min(24, (height - 80) / 7);

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="neon-text text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {metric === 'requests' ? 'Requests' : metric === 'cost' ? 'Cost' : 'Activity'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="w-12 h-2 rounded-full bg-gradient-to-r from-blue-900/30 to-cyan-400" />
              <span>High</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-20" /> {/* Space for day labels */}
              {[0, 3, 6, 9, 12, 15, 18, 21].map(hour => (
                <div 
                  key={hour}
                  className="text-xs text-muted-foreground text-center"
                  style={{ width: cellSize * 3, marginRight: hour < 21 ? 0 : 0 }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            {processedData.map((dayData, dayIndex) => (
              <div key={days[dayIndex]} className="flex items-center mb-1">
                {/* Day label */}
                <div className="w-20 text-xs text-muted-foreground text-right pr-2">
                  {days[dayIndex].slice(0, 3)}
                </div>
                
                {/* Hour cells */}
                <div className="flex">
                  {dayData.map((cell, hourIndex) => (
                    <div
                      key={`${dayIndex}-${hourIndex}`}
                      className="relative group cursor-pointer border border-border/20 transition-all duration-200 hover:border-primary/50"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getIntensityColor(cell.intensity),
                        boxShadow: cell.intensity > 0.7 ? '0 0 8px rgba(0, 255, 255, 0.3)' : 'none'
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg whitespace-nowrap">
                          <div className="text-xs space-y-1">
                            <div className="font-medium">{days[dayIndex]} {formatHour(hourIndex)}</div>
                            <div>{metric === 'requests' ? 'Requests' : metric === 'cost' ? 'Cost' : 'Value'}: {formatValue(cell.value)}</div>
                            {metric !== 'requests' && cell.requests > 0 && (
                              <div>Requests: {cell.requests.toLocaleString()}</div>
                            )}
                            {metric !== 'cost' && cell.cost > 0 && (
                              <div>Cost: ${cell.cost.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Value display for larger cells */}
                      {cellSize > 20 && cell.value > 0 && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                          style={{ color: getTextColor(cell.intensity) }}
                        >
                          {cellSize > 30 ? formatValue(cell.value) : cell.intensity > 0.5 ? '•' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Summary statistics */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Peak Hour:</span>
                  <div className="font-medium">
                    {(() => {
                      const peak = data.reduce((prev, current) => 
                        (current[metric] || 0) > (prev[metric] || 0) ? current : prev
                      );
                      return `${formatHour(peak.hour)} ${peak.day.slice(0, 3)}`;
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Peak Value:</span>
                  <div className="font-medium">{formatValue(maxValue)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Daily Average:</span>
                  <div className="font-medium">
                    {formatValue(data.reduce((sum, d) => sum + (d[metric] || 0), 0) / 7)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Busiest Day:</span>
                  <div className="font-medium">
                    {(() => {
                      const dayTotals = days.map(day => ({
                        day,
                        total: data.filter(d => d.day === day).reduce((sum, d) => sum + (d[metric] || 0), 0)
                      }));
                      const busiest = dayTotals.reduce((prev, current) => 
                        current.total > prev.total ? current : prev
                      );
                      return busiest.day.slice(0, 3);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}