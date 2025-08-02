"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Settings, 
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { useExport } from '@/hooks/useExport';
import { AnalyticsDataPoint, ApiMetrics, ErrorAnalysis } from '@/hooks/useAnalytics';

interface ReportSection {
  id: string;
  type: 'summary' | 'timeseries' | 'comparison' | 'distribution' | 'heatmap' | 'errors';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  config?: Record<string, unknown>;
}

interface ReportBuilderProps {
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  };
  className?: string;
}

export function ReportBuilder({ data, className }: ReportBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportName, setReportName] = useState('Custom Analytics Report');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days'
  });
  
  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: 'summary',
      type: 'summary',
      title: 'Executive Summary',
      description: 'Key metrics and KPIs overview',
      icon: BarChart3,
      enabled: true
    },
    {
      id: 'usage-trends',
      type: 'timeseries',
      title: 'Usage Trends',
      description: 'Request volume and cost trends over time',
      icon: TrendingUp,
      enabled: true
    },
    {
      id: 'api-comparison',
      type: 'comparison',
      title: 'API Performance Comparison',
      description: 'Compare response times and costs across APIs',
      icon: BarChart3,
      enabled: true
    },
    {
      id: 'cost-breakdown',
      type: 'comparison',
      title: 'Cost Breakdown',
      description: 'Distribution of costs by provider',
      icon: PieChart,
      enabled: false
    },
    {
      id: 'response-distribution',
      type: 'distribution',
      title: 'Response Time Distribution',
      description: 'Analysis of response time patterns',
      icon: Clock,
      enabled: false
    },
    {
      id: 'usage-heatmap',
      type: 'heatmap',
      title: 'Usage Patterns',
      description: 'Hourly usage patterns throughout the week',
      icon: Activity,
      enabled: false
    },
    {
      id: 'error-analysis',
      type: 'errors',
      title: 'Error Analysis',
      description: 'Error rates and types breakdown',
      icon: AlertTriangle,
      enabled: false
    }
  ]);

  const { generateReport, exportAnalyticsData } = useExport();

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  const generateCustomReport = async () => {
    const enabledSections = sections.filter(s => s.enabled);
    
    const report = generateReport('custom', data);

    try {
      await exportAnalyticsData(data, {
        format: 'json',
        fileName: reportName.toLowerCase().replace(/\s+/g, '-'),
        dateRange
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getDataForSection = (type: string) => {
    switch (type) {
      case 'summary':
        return data.timeSeriesData ? {
          totalRequests: data.timeSeriesData.reduce((sum, d) => sum + d.requests, 0),
          totalCost: data.timeSeriesData.reduce((sum, d) => sum + d.cost, 0),
          avgResponseTime: data.timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / data.timeSeriesData.length
        } : {};
      case 'timeseries':
        return data.timeSeriesData || [];
      case 'comparison':
        return data.apiMetrics || [];
      case 'errors':
        return data.errorAnalysis || [];
      default:
        return {};
    }
  };

  const generateInsights = (enabledSections: ReportSection[]) => {
    const insights = [];
    
    if (enabledSections.some(s => s.type === 'summary')) {
      insights.push('Overall API performance shows stable trends with controlled costs');
    }
    
    if (enabledSections.some(s => s.type === 'timeseries')) {
      insights.push('Usage patterns indicate consistent growth in API consumption');
    }
    
    if (enabledSections.some(s => s.type === 'comparison')) {
      insights.push('Performance varies significantly across different API providers');
    }
    
    if (enabledSections.some(s => s.type === 'errors')) {
      insights.push('Error rates remain within acceptable thresholds');
    }
    
    return insights;
  };

  const generateRecommendations = (enabledSections: ReportSection[]) => {
    const recommendations = [];
    
    if (enabledSections.some(s => s.type === 'summary')) {
      recommendations.push('Continue monitoring key performance indicators regularly');
    }
    
    if (enabledSections.some(s => s.type === 'comparison')) {
      recommendations.push('Consider optimizing usage of higher-cost providers');
    }
    
    if (enabledSections.some(s => s.type === 'errors')) {
      recommendations.push('Implement retry mechanisms for transient failures');
    }
    
    return recommendations;
  };

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <FileText className="mr-2 h-4 w-4" />
          Report Builder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Report Builder
          </DialogTitle>
          <DialogDescription>
            Create a customized analytics report with the sections you need
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Configuration */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter report name..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="mt-1">
                <DateRangePicker 
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full justify-start"
                />
              </div>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Report Sections</h3>
              <Badge variant="secondary">
                {enabledCount} of {sections.length} selected
              </Badge>
            </div>
            
            <div className="grid gap-3">
              {sections.map((section) => {
                const Icon = section.icon;
                
                return (
                  <Card 
                    key={section.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      section.enabled 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          section.enabled 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{section.title}</h4>
                            {section.enabled && (
                              <Badge variant="default" className="text-xs">
                                Included
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {enabledCount > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Report Preview</h3>
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{reportName}</span>
                      <Badge variant="outline" className="text-xs">
                        {dateRange.label}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      This report will include {enabledCount} sections covering{' '}
                      {sections.filter(s => s.enabled).map(s => s.title.toLowerCase()).join(', ')}.
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {sections.filter(s => s.enabled).map(section => (
                        <Badge key={section.id} variant="secondary" className="text-xs">
                          {section.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={generateCustomReport}
              disabled={enabledCount === 0}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}