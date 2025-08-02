# Analytics & Reporting System

A comprehensive analytics and reporting system for the Nexus dashboard with historical data visualization, export features, and scheduled reports.

## Features

### 📊 Analytics Dashboard
- **Time Series Charts**: Track API usage, costs, and performance over time
- **Comparison Charts**: Compare APIs by requests, response times, and costs
- **Cost Breakdown**: Pie charts showing cost distribution by provider
- **Usage Heatmaps**: Visualize usage patterns by hour and day
- **Distribution Charts**: Analyze response time distributions
- **Real-time Metrics**: Key performance indicators with trend analysis

### 📥 Export System
- **Multiple Formats**: CSV, JSON, and PDF exports
- **Smart Filtering**: Export specific date ranges and metrics
- **Visual Reports**: PDF exports with charts and visualizations
- **Batch Export**: Export multiple data sets simultaneously

### 📅 Scheduled Reports
- **Automated Delivery**: Daily, weekly, and monthly reports via email
- **Custom Templates**: Pre-built templates for different use cases
- **Flexible Recipients**: Multiple email recipients per report
- **Multiple Formats**: Choose between PDF, CSV, or JSON formats

### 🛠️ Report Builder
- **Custom Reports**: Build reports with selected sections
- **Interactive Configuration**: Choose charts, metrics, and date ranges
- **Template System**: Save and reuse report configurations
- **Insights Generation**: Automated insights and recommendations

## Components

### Chart Components (`src/components/charts/`)

#### TimeSeriesChart
```tsx
import { TimeSeriesChart } from '@/components/charts';

<TimeSeriesChart
  data={timeSeriesData}
  title="API Usage Trends"
  metrics={[
    { key: 'requests', label: 'Requests', color: 'hsl(var(--neon-cyan))' },
    { key: 'cost', label: 'Cost', color: 'hsl(var(--neon-purple))' }
  ]}
  type="area"
  height={350}
/>
```

#### ComparisonChart
```tsx
import { ComparisonChart } from '@/components/charts';

<ComparisonChart
  data={apiComparisonData}
  title="API Performance"
  metric="Response Time"
  unit="ms"
  type="bar"
  height={300}
/>
```

#### CostBreakdownChart
```tsx
import { CostBreakdownChart } from '@/components/charts';

<CostBreakdownChart
  data={costData}
  title="Cost Distribution"
  totalCost={totalCost}
  height={350}
  showInner={true}
/>
```

### Analytics Components (`src/components/analytics/`)

#### ExportButton
```tsx
import { ExportButton } from '@/components/analytics';

<ExportButton
  data={{ timeSeriesData, apiMetrics, errorAnalysis }}
  filename="analytics-export"
/>
```

#### DateRangePicker
```tsx
import { DateRangePicker, useDateRange } from '@/components/analytics';

const { dateRange, setDateRange } = useDateRange();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

#### ReportBuilder
```tsx
import { ReportBuilder } from '@/components/analytics';

<ReportBuilder
  data={{ timeSeriesData, apiMetrics, errorAnalysis }}
/>
```

## Hooks

### useAnalytics
Main hook for fetching and processing analytics data:

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const { 
  data, 
  timeSeriesData, 
  apiMetrics, 
  errorAnalysis, 
  usagePatterns,
  isLoading, 
  error 
} = useAnalytics(dateRange);
```

### useExport
Handle data export functionality:

```tsx
import { useExport } from '@/hooks/useExport';

const { exportAnalyticsData, generateReport } = useExport();

await exportAnalyticsData(data, {
  format: 'pdf',
  includeCharts: true,
  fileName: 'monthly-report'
});
```

### useTimeSeriesData
Transform analytics data for time series charts:

```tsx
import { useTimeSeriesData } from '@/hooks/useAnalytics';

const chartData = useTimeSeriesData(timeSeriesData, 'requests');
```

## Report Templates

### Daily Summary (`daily-summary`)
- Key performance indicators
- Hourly usage patterns
- API status overview
- Alerts and issues

### Weekly Analysis (`weekly-analysis`)
- Weekly summary metrics
- Usage trends
- Cost breakdown
- Performance comparison
- Error analysis

### Monthly Executive (`monthly-executive`)
- Executive summary
- Monthly trends
- ROI analysis
- Strategic insights
- Recommendations

### Cost Optimization (`cost-optimization`)
- Cost overview
- Cost trends
- Provider cost analysis
- Efficiency metrics
- Optimization opportunities

## Usage

### Basic Setup
1. The analytics page is available at `/dashboard/analytics`
2. Data is automatically fetched using the `useAnalytics` hook
3. Charts update automatically when date range changes
4. Export functionality is available through the header buttons

### Creating Custom Reports
1. Click "Report Builder" in the analytics header
2. Configure report name and date range
3. Select desired sections (summary, charts, tables, insights)
4. Preview the report configuration
5. Generate and download the report

### Setting Up Scheduled Reports
1. Click "Scheduled Reports" in the analytics header
2. Create a new report with frequency and recipients
3. Choose template and format
4. Configure delivery settings
5. Reports will be automatically generated and sent

### Exporting Data
1. Use the "Export" button for quick exports
2. Choose format: CSV (data), JSON (raw), or PDF (visual)
3. Select date range for filtered exports
4. Download starts automatically

## Data Structure

### Analytics Data Point
```typescript
interface AnalyticsDataPoint {
  timestamp: string;
  requests: number;
  cost: number;
  responseTime: number;
  errorRate: number;
  successRate: number;
}
```

### API Metrics
```typescript
interface ApiMetrics {
  name: string;
  provider: string;
  requests: number;
  avgResponseTime: number;
  successRate: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  endpoints: EndpointMetrics[];
}
```

## Styling

The analytics system uses the existing neon theme with:
- Custom chart colors matching the design system
- Responsive layouts for all screen sizes
- Glass-card effects for modern appearance
- Neon glows for interactive elements
- Smooth animations and transitions

## Performance

- Charts are optimized for large datasets
- Lazy loading for chart components
- Efficient data transformation hooks
- Memoized calculations for better performance
- Virtual scrolling for large lists (where applicable)

## Future Enhancements

- Real-time data streaming
- Custom alert configurations
- Advanced filtering and segmentation
- Machine learning insights
- API performance predictions
- Cost optimization recommendations
- Integration with external BI tools