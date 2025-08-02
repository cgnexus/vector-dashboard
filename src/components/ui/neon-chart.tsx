"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPoint {
  time: string;
  value: number;
  label?: string;
}

interface NeonChartProps {
  data: DataPoint[];
  title?: string;
  color?: "cyan" | "purple" | "green" | "orange" | "red";
  height?: number;
  showGrid?: boolean;
  animated?: boolean;
  type?: "line" | "area";
  className?: string;
}

export function NeonChart({
  data,
  title,
  color = "cyan",
  height = 200,
  showGrid = true,
  animated = true,
  type = "line",
  className
}: NeonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const getColorValue = () => {
    switch (color) {
      case "cyan":
        return "var(--neon-cyan)";
      case "purple":
        return "var(--neon-purple)";
      case "green":
        return "var(--neon-green)";
      case "orange":
        return "var(--neon-orange)";
      case "red":
        return "var(--neon-red)";
      default:
        return "var(--neon-cyan)";
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const chartHeight = rect.height;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const actualHeight = chartHeight - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, chartHeight);

    // Get color
    const colorValue = getColorValue();
    
    // Set up gradient for glow effect
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
    gradient.addColorStop(0, colorValue);
    gradient.addColorStop(1, "transparent");

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, chartHeight - padding);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (actualHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
    }

    // Calculate data points
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = chartHeight - padding - ((point.value - minValue) / range) * actualHeight;
      return { x, y, value: point.value };
    });

    // Draw area if type is area
    if (type === "area") {
      ctx.beginPath();
      ctx.moveTo(points[0].x, chartHeight - padding);
      
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.lineTo(point.x, point.y);
        } else {
          // Smooth curve
          const prevPoint = points[index - 1];
          const cpx = (prevPoint.x + point.x) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, (prevPoint.y + point.y) / 2);
          ctx.quadraticCurveTo(cpx, (prevPoint.y + point.y) / 2, point.x, point.y);
        }
      });
      
      ctx.lineTo(points[points.length - 1].x, chartHeight - padding);
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw main line with glow effect
    ctx.lineWidth = 3;
    ctx.strokeStyle = colorValue;
    ctx.shadowColor = colorValue;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // Smooth curve
        const prevPoint = points[index - 1];
        const cpx = (prevPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, (prevPoint.y + point.y) / 2);
        ctx.quadraticCurveTo(cpx, (prevPoint.y + point.y) / 2, point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw data points
    ctx.shadowBlur = 15;
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colorValue;
      ctx.fill();
      
      // Outer glow ring
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = colorValue;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Reset shadow
    ctx.shadowBlur = 0;

  }, [data, color, showGrid, type]);

  return (
    <Card className={cn("glass-card border-primary/20", className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="neon-text text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative" style={{ height: `${height}px` }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ height: `${height}px` }}
          />
          {/* Animated overlay for real-time effect */}
          {animated && (
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-50"
                style={{ 
                  color: getColorValue(),
                  animation: "scan-line 3s linear infinite"
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* Simple performance metrics chart */\nexport function PerformanceChart({ className }: { className?: string }) {\n  const data = [\n    { time: \"00:00\", value: 245 },\n    { time: \"04:00\", value: 312 },\n    { time: \"08:00\", value: 189 },\n    { time: \"12:00\", value: 423 },\n    { time: \"16:00\", value: 367 },\n    { time: \"20:00\", value: 298 },\n    { time: \"24:00\", value: 334 }\n  ];\n\n  return (\n    <NeonChart\n      data={data}\n      title=\"Response Time (24h)\"\n      color=\"cyan\"\n      height={180}\n      type=\"area\"\n      className={className}\n    />\n  );\n}\n\n/* Cost trend chart */\nexport function CostChart({ className }: { className?: string }) {\n  const data = [\n    { time: \"Week 1\", value: 45 },\n    { time: \"Week 2\", value: 67 },\n    { time: \"Week 3\", value: 89 },\n    { time: \"Week 4\", value: 78 },\n    { time: \"Week 5\", value: 92 },\n    { time: \"Week 6\", value: 105 },\n    { time: \"Week 7\", value: 98 }\n  ];\n\n  return (\n    <NeonChart\n      data={data}\n      title=\"Weekly Costs ($)\"\n      color=\"purple\"\n      height={180}\n      type=\"line\"\n      className={className}\n    />\n  );\n}"