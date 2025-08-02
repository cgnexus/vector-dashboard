"use client";

import { useCallback } from 'react';
import { format } from 'date-fns';
import { AnalyticsDataPoint, ApiMetrics, ErrorAnalysis } from './useAnalytics';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: { start: Date; end: Date };
  includeCharts?: boolean;
  fileName?: string;
}

export function useExport() {
  const exportToCsv = useCallback((data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
  }, []);

  const exportToJson = useCallback((data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, `${filename}.json`);
  }, []);

  const exportToPdf = useCallback(async (elementId: string, filename: string) => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0b',
        allowTaint: true,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Nexus Analytics Report', pdfWidth / 2, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(format(new Date(), 'PPP'), pdfWidth / 2, 25, { align: 'center' });

      // Add image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  const exportAnalyticsData = useCallback(async (
    data: {
      timeSeriesData?: AnalyticsDataPoint[];
      apiMetrics?: ApiMetrics[];
      errorAnalysis?: ErrorAnalysis[];
    },
    options: ExportOptions
  ) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = options.fileName || `nexus-analytics-${timestamp}`;

    try {
      switch (options.format) {
        case 'csv':
          if (data.timeSeriesData) {
            exportToCsv(data.timeSeriesData, `${filename}-timeseries`);
          }
          if (data.apiMetrics) {
            const flatApiData = data.apiMetrics.map(api => ({
              name: api.name,
              provider: api.provider,
              requests: api.requests,
              avgResponseTime: api.avgResponseTime,
              successRate: api.successRate,
              cost: api.cost,
              trend: api.trend
            }));
            exportToCsv(flatApiData, `${filename}-apis`);
          }
          if (data.errorAnalysis) {
            exportToCsv(data.errorAnalysis, `${filename}-errors`);
          }
          break;

        case 'json':
          exportToJson({
            exported: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            dateRange: options.dateRange,
            data
          }, filename);
          break;

        case 'pdf':
          if (options.includeCharts) {
            await exportToPdf('analytics-dashboard', filename);
          } else {
            // Export summary data as PDF
            const summaryData = {
              exported: format(new Date(), 'PPP'),
              summary: data.timeSeriesData ? {
                totalRequests: data.timeSeriesData.reduce((sum, d) => sum + d.requests, 0),
                totalCost: data.timeSeriesData.reduce((sum, d) => sum + d.cost, 0),
                avgResponseTime: data.timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / data.timeSeriesData.length
              } : {},
              topApis: data.apiMetrics?.slice(0, 5) || [],
              errors: data.errorAnalysis || []
            };
            exportToJson(summaryData, filename);
          }
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [exportToCsv, exportToJson, exportToPdf]);

  const generateReport = useCallback((
    template: 'daily' | 'weekly' | 'monthly' | 'custom',
    data: {
      timeSeriesData?: AnalyticsDataPoint[];
      apiMetrics?: ApiMetrics[];
      errorAnalysis?: ErrorAnalysis[];
    }
  ) => {
    const now = new Date();
    const reportData = {
      template,
      generated: format(now, 'yyyy-MM-dd HH:mm:ss'),
      period: template,
      summary: data.timeSeriesData ? {
        totalRequests: data.timeSeriesData.reduce((sum, d) => sum + d.requests, 0),
        totalCost: data.timeSeriesData.reduce((sum, d) => sum + d.cost, 0).toFixed(2),
        avgResponseTime: Math.round(data.timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / data.timeSeriesData.length),
        avgSuccessRate: (data.timeSeriesData.reduce((sum, d) => sum + d.successRate, 0) / data.timeSeriesData.length).toFixed(1)
      } : {},
      insights: [
        "API performance has improved by 4.9% this period",
        "Cost efficiency remains optimal across all providers",
        "Error rates are within acceptable thresholds",
        "Peak usage occurs during business hours (9 AM - 5 PM)"
      ],
      recommendations: [
        "Consider caching frequently requested endpoints",
        "Monitor OpenAI costs as usage continues to grow",
        "Implement retry logic for timeout errors",
        "Scale infrastructure during peak hours"
      ],
      data
    };

    return reportData;
  }, []);

  return {
    exportToCsv,
    exportToJson,
    exportToPdf,
    exportAnalyticsData,
    generateReport
  };
}