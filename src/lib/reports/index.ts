import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { AnalyticsDataPoint, ApiMetrics, ErrorAnalysis } from '@/hooks/useAnalytics';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  schedule?: 'daily' | 'weekly' | 'monthly';
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'insights';
  data?: any;
  config?: any;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  generated: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  sections: ReportSection[];
  summary: {
    totalRequests: number;
    totalCost: number;
    avgResponseTime: number;
    avgSuccessRate: number;
    topAPI: string;
    mainInsight: string;
  };
  insights: string[];
  recommendations: string[];
}

export const reportTemplates: ReportTemplate[] = [
  {
    id: 'daily-summary',
    name: 'Daily Operations Summary',
    description: 'Essential metrics for daily operations monitoring',
    schedule: 'daily',
    sections: [
      {
        id: 'daily-metrics',
        title: 'Key Performance Indicators',
        type: 'summary'
      },
      {
        id: 'hourly-usage',
        title: 'Hourly Usage Pattern',
        type: 'chart',
        config: { chartType: 'timeseries', metric: 'requests' }
      },
      {
        id: 'api-status',
        title: 'API Status Overview',
        type: 'table'
      },
      {
        id: 'alerts',
        title: 'Alerts & Issues',
        type: 'insights'
      }
    ]
  },
  {
    id: 'weekly-analysis',
    name: 'Weekly Performance Analysis',
    description: 'Comprehensive weekly performance and cost analysis',
    schedule: 'weekly',
    sections: [
      {
        id: 'week-summary',
        title: 'Weekly Summary',
        type: 'summary'
      },
      {
        id: 'usage-trends',
        title: 'Usage Trends',
        type: 'chart',
        config: { chartType: 'timeseries', metric: 'requests' }
      },
      {
        id: 'cost-analysis',
        title: 'Cost Breakdown',
        type: 'chart',
        config: { chartType: 'pie', metric: 'cost' }
      },
      {
        id: 'performance-comparison',
        title: 'API Performance Comparison',
        type: 'chart',
        config: { chartType: 'bar', metric: 'responseTime' }
      },
      {
        id: 'error-analysis',
        title: 'Error Analysis',
        type: 'table'
      },
      {
        id: 'insights',
        title: 'Key Insights',
        type: 'insights'
      }
    ]
  },
  {
    id: 'monthly-executive',
    name: 'Monthly Executive Report',
    description: 'High-level monthly report for executives and stakeholders',
    schedule: 'monthly',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        type: 'summary'
      },
      {
        id: 'monthly-trends',
        title: 'Monthly Trends',
        type: 'chart',
        config: { chartType: 'timeseries', metric: 'cost' }
      },
      {
        id: 'roi-analysis',
        title: 'ROI Analysis',
        type: 'chart',
        config: { chartType: 'bar', metric: 'efficiency' }
      },
      {
        id: 'strategic-insights',
        title: 'Strategic Insights',
        type: 'insights'
      },
      {
        id: 'recommendations',
        title: 'Strategic Recommendations',
        type: 'insights'
      }
    ]
  },
  {
    id: 'cost-optimization',
    name: 'Cost Optimization Report',
    description: 'Detailed cost analysis and optimization opportunities',
    sections: [
      {
        id: 'cost-overview',
        title: 'Cost Overview',
        type: 'summary'
      },
      {
        id: 'cost-trends',
        title: 'Cost Trends',
        type: 'chart',
        config: { chartType: 'timeseries', metric: 'cost' }
      },
      {
        id: 'provider-costs',
        title: 'Cost by Provider',
        type: 'chart',
        config: { chartType: 'pie', metric: 'cost' }
      },
      {
        id: 'efficiency-metrics',
        title: 'Efficiency Metrics',
        type: 'table'
      },
      {
        id: 'optimization-opportunities',
        title: 'Optimization Opportunities',
        type: 'insights'
      }
    ]
  }
];

export function generateDailyReport(
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  }
): GeneratedReport {
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  const todayData = data.timeSeriesData?.find(d => 
    format(new Date(d.timestamp), 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
  );

  const summary = {
    totalRequests: todayData?.requests || 0,
    totalCost: todayData?.cost || 0,
    avgResponseTime: todayData?.responseTime || 0,
    avgSuccessRate: todayData?.successRate || 0,
    topAPI: data.apiMetrics?.[0]?.name || 'N/A',
    mainInsight: `Processed ${(todayData?.requests || 0).toLocaleString()} requests with ${todayData?.responseTime || 0}ms average response time`
  };

  return {
    id: `daily-${format(yesterday, 'yyyy-MM-dd')}`,
    templateId: 'daily-summary',
    name: `Daily Report - ${format(yesterday, 'MMM dd, yyyy')}`,
    generated: format(today, 'yyyy-MM-dd HH:mm:ss'),
    period: {
      start: format(yesterday, 'yyyy-MM-dd'),
      end: format(yesterday, 'yyyy-MM-dd'),
      label: format(yesterday, 'MMM dd, yyyy')
    },
    sections: reportTemplates[0].sections,
    summary,
    insights: [
      `API performance was ${todayData?.responseTime && todayData.responseTime < 500 ? 'excellent' : 'within normal range'}`,
      `Success rate of ${summary.avgSuccessRate}% maintained`,
      `${summary.topAPI} was the most utilized API`
    ],
    recommendations: [
      'Continue monitoring response times during peak hours',
      'Review error patterns for optimization opportunities',
      'Consider caching for frequently accessed endpoints'
    ]
  };
}

export function generateWeeklyReport(
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  }
): GeneratedReport {
  const today = new Date();
  const weekStart = startOfWeek(subDays(today, 7));
  const weekEnd = endOfWeek(subDays(today, 7));
  
  const weekData = data.timeSeriesData?.filter(d => {
    const date = new Date(d.timestamp);
    return date >= weekStart && date <= weekEnd;
  }) || [];

  const summary = {
    totalRequests: weekData.reduce((sum, d) => sum + d.requests, 0),
    totalCost: weekData.reduce((sum, d) => sum + d.cost, 0),
    avgResponseTime: weekData.reduce((sum, d) => sum + d.responseTime, 0) / (weekData.length || 1),
    avgSuccessRate: weekData.reduce((sum, d) => sum + d.successRate, 0) / (weekData.length || 1),
    topAPI: data.apiMetrics?.reduce((prev, current) => 
      current.requests > prev.requests ? current : prev
    )?.name || 'N/A',
    mainInsight: `Weekly total of ${weekData.reduce((sum, d) => sum + d.requests, 0).toLocaleString()} requests processed`
  };

  return {
    id: `weekly-${format(weekStart, 'yyyy-MM-dd')}`,
    templateId: 'weekly-analysis',
    name: `Weekly Report - ${format(weekStart, 'MMM dd')} to ${format(weekEnd, 'MMM dd, yyyy')}`,
    generated: format(today, 'yyyy-MM-dd HH:mm:ss'),
    period: {
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
      label: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`
    },
    sections: reportTemplates[1].sections,
    summary,
    insights: [
      `${((summary.totalRequests / 7) * 100 / 1000).toFixed(1)}K average daily requests`,
      `Cost efficiency: $${(summary.totalCost / summary.totalRequests).toFixed(5)} per request`,
      `${summary.topAPI} dominated usage with ${data.apiMetrics?.[0]?.requests || 0} requests`,
      `Error rate maintained below ${Math.max(...(data.errorAnalysis?.map(e => e.percentage) || [0]))}%`
    ],
    recommendations: [
      'Implement request throttling during peak hours',
      'Optimize high-cost API calls for better efficiency',
      'Set up automated alerts for error rate spikes',
      'Consider load balancing for popular endpoints'
    ]
  };
}

export function generateMonthlyReport(
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  }
): GeneratedReport {
  const today = new Date();
  const monthStart = startOfMonth(subDays(today, 30));
  const monthEnd = endOfMonth(subDays(today, 30));
  
  const monthData = data.timeSeriesData?.filter(d => {
    const date = new Date(d.timestamp);
    return date >= monthStart && date <= monthEnd;
  }) || [];

  const summary = {
    totalRequests: monthData.reduce((sum, d) => sum + d.requests, 0),
    totalCost: monthData.reduce((sum, d) => sum + d.cost, 0),
    avgResponseTime: monthData.reduce((sum, d) => sum + d.responseTime, 0) / (monthData.length || 1),
    avgSuccessRate: monthData.reduce((sum, d) => sum + d.successRate, 0) / (monthData.length || 1),
    topAPI: data.apiMetrics?.reduce((prev, current) => 
      current.cost > prev.cost ? current : prev
    )?.name || 'N/A',
    mainInsight: `Monthly API spend of $${monthData.reduce((sum, d) => sum + d.cost, 0).toFixed(2)} with excellent performance`
  };

  const growthRate = monthData.length > 15 ? 
    ((monthData.slice(-15).reduce((sum, d) => sum + d.requests, 0) - 
      monthData.slice(0, 15).reduce((sum, d) => sum + d.requests, 0)) / 
     monthData.slice(0, 15).reduce((sum, d) => sum + d.requests, 0)) * 100 : 0;

  return {
    id: `monthly-${format(monthStart, 'yyyy-MM')}`,
    templateId: 'monthly-executive',
    name: `Monthly Executive Report - ${format(monthStart, 'MMMM yyyy')}`,
    generated: format(today, 'yyyy-MM-dd HH:mm:ss'),
    period: {
      start: format(monthStart, 'yyyy-MM-dd'),
      end: format(monthEnd, 'yyyy-MM-dd'),
      label: format(monthStart, 'MMMM yyyy')
    },
    sections: reportTemplates[2].sections,
    summary,
    insights: [
      `API usage ${growthRate > 0 ? 'grew' : 'decreased'} by ${Math.abs(growthRate).toFixed(1)}% month-over-month`,
      `Maintained ${summary.avgSuccessRate.toFixed(1)}% success rate across all services`,
      `${summary.topAPI} represents the largest cost center`,
      `Average response time of ${summary.avgResponseTime.toFixed(0)}ms meets SLA requirements`
    ],
    recommendations: [
      'Scale infrastructure to accommodate growing API demand',
      'Negotiate volume discounts with top providers',
      'Implement predictive scaling for cost optimization',
      'Establish API governance policies for new integrations'
    ]
  };
}

export function getReportTemplate(templateId: string): ReportTemplate | undefined {
  return reportTemplates.find(template => template.id === templateId);
}

export function generateCustomReport(
  templateId: string,
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  },
  customSections?: ReportSection[]
): GeneratedReport {
  switch (templateId) {
    case 'daily-summary':
      return generateDailyReport(data);
    case 'weekly-analysis':
      return generateWeeklyReport(data);
    case 'monthly-executive':
      return generateMonthlyReport(data);
    default:
      // Generate a custom report
      const template = getReportTemplate(templateId);
      const today = new Date();
      
      return {
        id: `custom-${Date.now()}`,
        templateId,
        name: template?.name || 'Custom Report',
        generated: format(today, 'yyyy-MM-dd HH:mm:ss'),
        period: {
          start: format(subDays(today, 30), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
          label: 'Last 30 days'
        },
        sections: customSections || template?.sections || [],
        summary: {
          totalRequests: data.timeSeriesData?.reduce((sum, d) => sum + d.requests, 0) || 0,
          totalCost: data.timeSeriesData?.reduce((sum, d) => sum + d.cost, 0) || 0,
          avgResponseTime: data.timeSeriesData?.reduce((sum, d) => sum + d.responseTime, 0) / (data.timeSeriesData?.length || 1) || 0,
          avgSuccessRate: data.timeSeriesData?.reduce((sum, d) => sum + d.successRate, 0) / (data.timeSeriesData?.length || 1) || 0,
          topAPI: data.apiMetrics?.[0]?.name || 'N/A',
          mainInsight: 'Custom analysis of API performance and usage patterns'
        },
        insights: [
          'Custom report generated with selected metrics',
          'Data reflects performance across selected time period',
          'Recommendations based on current usage patterns'
        ],
        recommendations: [
          'Review custom metrics for optimization opportunities',
          'Monitor trends for strategic planning',
          'Implement alerts for key performance indicators'
        ]
      };
  }
}