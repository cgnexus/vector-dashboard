"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, Database, Loader2 } from 'lucide-react';
import { useExport, ExportFormat } from '@/hooks/useExport';
import { AnalyticsDataPoint, ApiMetrics, ErrorAnalysis } from '@/hooks/useAnalytics';

interface ExportButtonProps {
  data: {
    timeSeriesData?: AnalyticsDataPoint[];
    apiMetrics?: ApiMetrics[];
    errorAnalysis?: ErrorAnalysis[];
  };
  filename?: string;
  className?: string;
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const { exportAnalyticsData } = useExport();

  const handleExport = async (format: ExportFormat, includeCharts = false) => {
    setIsExporting(true);
    setExportingFormat(format);
    
    try {
      await exportAnalyticsData(data, {
        format,
        includeCharts,
        fileName: filename
      });
    } catch (error) {
      console.error('Export failed:', error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const exportOptions = [
    {
      format: 'csv' as ExportFormat,
      label: 'CSV (Data Tables)',
      description: 'Spreadsheet-friendly format',
      icon: Database,
      action: () => handleExport('csv')
    },
    {
      format: 'json' as ExportFormat,
      label: 'JSON (Raw Data)',
      description: 'Machine-readable format',
      icon: FileText,
      action: () => handleExport('json')
    },
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF (Visual Report)',
      description: 'Charts and visualizations',
      icon: Image,
      action: () => handleExport('pdf', true)
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Analytics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isCurrentlyExporting = exportingFormat === option.format;
          
          return (
            <DropdownMenuItem
              key={option.format}
              onClick={option.action}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <div className="flex items-center w-full">
                {isCurrentlyExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="mr-2 h-4 w-4" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">Custom Report</div>
            <div className="text-xs text-muted-foreground">
              Build your own report
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}