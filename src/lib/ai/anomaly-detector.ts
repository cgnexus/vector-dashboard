import { type ApiMetric } from '@/db/schema';

/**
 * Anomaly types that can be detected
 */
export type AnomalyType = 
  | 'cost_spike'
  | 'usage_spike'
  | 'response_time_spike'
  | 'error_rate_spike'
  | 'unusual_pattern'
  | 'provider_outage'
  | 'token_efficiency_drop';

/**
 * Detected anomaly with context
 */
export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  title: string;
  description: string;
  value: number;
  baseline: number;
  threshold: number;
  confidence: number; // 0-1
  providerId?: string;
  endpoint?: string;
  metadata: Record<string, any>;
  recommendations: string[];
}

/**
 * Statistical baseline for anomaly detection
 */
interface Baseline {
  mean: number;
  standardDeviation: number;
  median: number;
  percentile95: number;
  percentile99: number;
  trend: number; // slope of linear trend
}

/**
 * Time series data point for analysis
 */
interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Detection configuration
 */
interface DetectionConfig {
  costSpikeThreshold: number;       // multiple of standard deviation
  usageSpikeThreshold: number;      // multiple of standard deviation
  responseTimeThreshold: number;    // multiple of standard deviation
  errorRateThreshold: number;       // percentage
  minimumDataPoints: number;        // minimum samples for reliable detection
  lookbackHours: number;           // hours to look back for baseline
  confidenceThreshold: number;     // minimum confidence to report anomaly
}

const DEFAULT_CONFIG: DetectionConfig = {
  costSpikeThreshold: 3.0,
  usageSpikeThreshold: 2.5,
  responseTimeThreshold: 2.0,
  errorRateThreshold: 20.0,
  minimumDataPoints: 30,
  lookbackHours: 168, // 7 days
  confidenceThreshold: 0.7
};

export class AnomalyDetector {
  private config: DetectionConfig;

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect all types of anomalies in metrics
   */
  async detectAnomalies(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (metrics.length < this.config.minimumDataPoints) {
      return anomalies;
    }

    // Sort metrics by timestamp
    const sortedMetrics = metrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Detect different types of anomalies
    anomalies.push(...await this.detectCostSpikes(sortedMetrics));
    anomalies.push(...await this.detectUsageSpikes(sortedMetrics));
    anomalies.push(...await this.detectResponseTimeSpikes(sortedMetrics));
    anomalies.push(...await this.detectErrorRateSpikes(sortedMetrics));
    anomalies.push(...await this.detectUnusualPatterns(sortedMetrics));
    anomalies.push(...await this.detectProviderOutages(sortedMetrics));
    anomalies.push(...await this.detectTokenEfficiencyDrops(sortedMetrics));

    return anomalies
      .filter(anomaly => anomaly.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect cost spikes
   */
  private async detectCostSpikes(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Group by hour for cost analysis
    const hourlyCosts = this.groupByHour(metrics, (metric) => {
      const cost = metric.cost ? parseFloat(metric.cost) : 0;
      return cost;
    });

    if (hourlyCosts.length < this.config.minimumDataPoints) return anomalies;

    const baseline = this.calculateBaseline(hourlyCosts.map(h => h.value));
    const threshold = baseline.mean + (this.config.costSpikeThreshold * baseline.standardDeviation);

    // Check recent hours for spikes
    const recentHours = hourlyCosts.slice(-24); // Last 24 hours
    
    for (const hour of recentHours) {
      if (hour.value > threshold && hour.value > baseline.mean * 1.5) {
        const anomaly: Anomaly = {
          id: `cost_spike_${hour.timestamp.getTime()}`,
          type: 'cost_spike',
          severity: this.calculateSeverity(hour.value, baseline.mean, threshold),
          timestamp: hour.timestamp,
          title: 'Unusual Cost Spike Detected',
          description: `Hourly cost of $${hour.value.toFixed(4)} is ${((hour.value / baseline.mean - 1) * 100).toFixed(1)}% above normal`,
          value: hour.value,
          baseline: baseline.mean,
          threshold,
          confidence: this.calculateConfidence(hour.value, baseline),
          metadata: {
            percentageIncrease: ((hour.value / baseline.mean - 1) * 100).toFixed(1),
            hourlyBaseline: baseline.mean,
            standardDeviation: baseline.standardDeviation
          },
          recommendations: [
            'Review recent API usage for unusual activity',
            'Check for inefficient API calls or loops',
            'Verify no unauthorized access to API keys',
            'Consider implementing rate limiting'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect usage spikes
   */
  private async detectUsageSpikes(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Group by hour for usage analysis
    const hourlyUsage = this.groupByHour(metrics, () => 1); // Count requests

    if (hourlyUsage.length < this.config.minimumDataPoints) return anomalies;

    const baseline = this.calculateBaseline(hourlyUsage.map(h => h.value));
    const threshold = baseline.mean + (this.config.usageSpikeThreshold * baseline.standardDeviation);

    const recentHours = hourlyUsage.slice(-24);
    
    for (const hour of recentHours) {
      if (hour.value > threshold && hour.value > baseline.mean * 2) {
        const anomaly: Anomaly = {
          id: `usage_spike_${hour.timestamp.getTime()}`,
          type: 'usage_spike',
          severity: this.calculateSeverity(hour.value, baseline.mean, threshold),
          timestamp: hour.timestamp,
          title: 'Unusual Usage Spike Detected',
          description: `${hour.value} requests in one hour is ${((hour.value / baseline.mean - 1) * 100).toFixed(1)}% above normal`,
          value: hour.value,
          baseline: baseline.mean,
          threshold,
          confidence: this.calculateConfidence(hour.value, baseline),
          metadata: {
            requestCount: hour.value,
            normalUsage: baseline.mean,
            percentageIncrease: ((hour.value / baseline.mean - 1) * 100).toFixed(1)
          },
          recommendations: [
            'Investigate source of increased traffic',
            'Check for bot activity or scraping',
            'Review application performance for loops',
            'Consider implementing usage quotas'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect response time spikes
   */
  private async detectResponseTimeSpikes(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Filter out null response times and group by hour
    const validMetrics = metrics.filter(m => m.responseTime && m.responseTime > 0);
    const hourlyResponseTimes = this.groupByHour(validMetrics, (metric) => metric.responseTime!);

    if (hourlyResponseTimes.length < this.config.minimumDataPoints) return anomalies;

    const baseline = this.calculateBaseline(hourlyResponseTimes.map(h => h.value));
    const threshold = baseline.mean + (this.config.responseTimeThreshold * baseline.standardDeviation);

    const recentHours = hourlyResponseTimes.slice(-24);
    
    for (const hour of recentHours) {
      if (hour.value > threshold && hour.value > baseline.mean * 1.5) {
        const anomaly: Anomaly = {
          id: `response_time_spike_${hour.timestamp.getTime()}`,
          type: 'response_time_spike',
          severity: this.calculateSeverity(hour.value, baseline.mean, threshold),
          timestamp: hour.timestamp,
          title: 'Response Time Degradation Detected',
          description: `Average response time of ${hour.value.toFixed(0)}ms is ${((hour.value / baseline.mean - 1) * 100).toFixed(1)}% slower than normal`,
          value: hour.value,
          baseline: baseline.mean,
          threshold,
          confidence: this.calculateConfidence(hour.value, baseline),
          metadata: {
            responseTimeMs: hour.value,
            normalResponseTime: baseline.mean,
            slowdownPercentage: ((hour.value / baseline.mean - 1) * 100).toFixed(1)
          },
          recommendations: [
            'Check API provider status and health',
            'Review network connectivity',
            'Monitor server resources and load',
            'Consider implementing request timeouts'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect error rate spikes
   */
  private async detectErrorRateSpikes(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Group by hour and calculate error rates
    const hourlyErrorRates = this.groupByHour(metrics, (metric, group) => {
      const errors = group.filter(m => m.statusCode >= 400).length;
      return group.length > 0 ? (errors / group.length) * 100 : 0;
    });

    if (hourlyErrorRates.length < this.config.minimumDataPoints) return anomalies;

    const recentHours = hourlyErrorRates.slice(-24);
    
    for (const hour of recentHours) {
      if (hour.value > this.config.errorRateThreshold) {
        const anomaly: Anomaly = {
          id: `error_rate_spike_${hour.timestamp.getTime()}`,
          type: 'error_rate_spike',
          severity: hour.value > 50 ? 'critical' : hour.value > 30 ? 'high' : 'medium',
          timestamp: hour.timestamp,
          title: 'High Error Rate Detected',
          description: `Error rate of ${hour.value.toFixed(1)}% exceeds threshold of ${this.config.errorRateThreshold}%`,
          value: hour.value,
          baseline: this.config.errorRateThreshold,
          threshold: this.config.errorRateThreshold,
          confidence: Math.min(1, hour.value / this.config.errorRateThreshold),
          metadata: {
            errorRatePercentage: hour.value.toFixed(1),
            threshold: this.config.errorRateThreshold
          },
          recommendations: [
            'Investigate error messages and root causes',
            'Check API authentication and permissions',
            'Review request formatting and parameters',
            'Monitor provider service status'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect unusual usage patterns
   */
  private async detectUnusualPatterns(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Analyze patterns by day of week and hour
    const patterns = this.analyzeUsagePatterns(metrics);
    
    // Check for unusual time-of-day usage
    const currentHour = new Date().getHours();
    const recentMetrics = metrics.filter(m => 
      new Date().getTime() - new Date(m.timestamp).getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentMetrics.length > 0) {
      const expectedUsage = patterns.hourlyAverages[currentHour] || 0;
      const actualUsage = recentMetrics.length;
      
      if (expectedUsage > 0 && (actualUsage < expectedUsage * 0.1 || actualUsage > expectedUsage * 3)) {
        const isUnusuallyHigh = actualUsage > expectedUsage * 3;
        
        const anomaly: Anomaly = {
          id: `unusual_pattern_${Date.now()}`,
          type: 'unusual_pattern',
          severity: isUnusuallyHigh ? 'medium' : 'low',
          timestamp: new Date(),
          title: `Unusual ${isUnusuallyHigh ? 'High' : 'Low'} Activity for Time of Day`,
          description: `${actualUsage} requests at ${currentHour}:00 is unusual (expected ~${expectedUsage.toFixed(0)})`,
          value: actualUsage,
          baseline: expectedUsage,
          threshold: expectedUsage * (isUnusuallyHigh ? 3 : 0.1),
          confidence: 0.6,
          metadata: {
            hour: currentHour,
            expectedUsage: expectedUsage.toFixed(0),
            actualUsage,
            isUnusuallyHigh
          },
          recommendations: [
            'Verify if this activity is expected',
            'Check for scheduled jobs or batch processes',
            'Review user activity patterns',
            'Consider adjusting monitoring thresholds'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect provider outages or degradation
   */
  private async detectProviderOutages(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Group by provider and check recent activity
    const providers = new Map<string, ApiMetric[]>();
    metrics.forEach(metric => {
      if (!providers.has(metric.providerId)) {
        providers.set(metric.providerId, []);
      }
      providers.get(metric.providerId)!.push(metric);
    });

    for (const [providerId, providerMetrics] of providers) {
      const last30Minutes = providerMetrics.filter(m => 
        new Date().getTime() - new Date(m.timestamp).getTime() < 30 * 60 * 1000
      );

      if (last30Minutes.length === 0) continue;

      // Check for high error rates or timeouts
      const errors = last30Minutes.filter(m => m.statusCode >= 500).length;
      const timeouts = last30Minutes.filter(m => m.statusCode === 408 || m.statusCode === 504).length;
      const errorRate = (errors / last30Minutes.length) * 100;
      const timeoutRate = (timeouts / last30Minutes.length) * 100;

      if (errorRate > 30 || timeoutRate > 20) {
        const anomaly: Anomaly = {
          id: `provider_outage_${providerId}_${Date.now()}`,
          type: 'provider_outage',
          severity: errorRate > 70 ? 'critical' : 'high',
          timestamp: new Date(),
          title: 'Potential Provider Service Degradation',
          description: `${providerId} showing ${errorRate.toFixed(1)}% error rate and ${timeoutRate.toFixed(1)}% timeout rate`,
          value: errorRate,
          baseline: 5, // Normal error rate baseline
          threshold: 30,
          confidence: Math.min(1, errorRate / 30),
          providerId,
          metadata: {
            errorRate: errorRate.toFixed(1),
            timeoutRate: timeoutRate.toFixed(1),
            totalRequests: last30Minutes.length,
            errors,
            timeouts
          },
          recommendations: [
            'Check provider status page for known issues',
            'Implement fallback to alternative providers',
            'Add circuit breaker pattern',
            'Set up provider health monitoring'
          ]
        };

        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect drops in token efficiency (for LLM APIs)
   */
  private async detectTokenEfficiencyDrops(metrics: ApiMetric[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Filter LLM metrics with token data
    const llmMetrics = metrics.filter(m => 
      m.tokens && 
      typeof m.tokens === 'object' && 
      (m.tokens as any).total > 0
    );

    if (llmMetrics.length < this.config.minimumDataPoints) return anomalies;

    // Calculate token efficiency (output tokens / input tokens)
    const efficiencyData = llmMetrics.map(metric => {
      const tokens = metric.tokens as { input?: number; output?: number; total?: number };
      const efficiency = tokens.input && tokens.input > 0 
        ? (tokens.output || 0) / tokens.input 
        : 0;
      return {
        timestamp: new Date(metric.timestamp),
        efficiency,
        metric
      };
    }).filter(d => d.efficiency > 0);

    if (efficiencyData.length < this.config.minimumDataPoints) return anomalies;

    // Group by day and calculate average efficiency
    const dailyEfficiency = this.groupByDay(efficiencyData, (item) => item.efficiency);
    
    if (dailyEfficiency.length < 7) return anomalies; // Need at least a week of data

    const baseline = this.calculateBaseline(dailyEfficiency.slice(0, -1).map(d => d.value)); // Exclude today
    const today = dailyEfficiency[dailyEfficiency.length - 1];

    // Check if today's efficiency is significantly lower
    const threshold = baseline.mean - (baseline.standardDeviation * 1.5);
    
    if (today.value < threshold && today.value < baseline.mean * 0.7) {
      const anomaly: Anomaly = {
        id: `token_efficiency_drop_${today.timestamp.getTime()}`,
        type: 'token_efficiency_drop',
        severity: 'medium',
        timestamp: today.timestamp,
        title: 'Token Efficiency Drop Detected',
        description: `Today's token efficiency of ${today.value.toFixed(2)} is ${((1 - today.value / baseline.mean) * 100).toFixed(1)}% below normal`,
        value: today.value,
        baseline: baseline.mean,
        threshold,
        confidence: this.calculateConfidence(baseline.mean - today.value, baseline),
        metadata: {
          currentEfficiency: today.value.toFixed(2),
          normalEfficiency: baseline.mean.toFixed(2),
          drop: ((1 - today.value / baseline.mean) * 100).toFixed(1)
        },
        recommendations: [
          'Review prompt engineering for efficiency',
          'Check for changes in input complexity',
          'Verify model parameters and settings',
          'Consider adjusting max_tokens limits'
        ]
      };

      anomalies.push(anomaly);
    }

    return anomalies;
  }

  /**
   * Calculate statistical baseline from historical data
   */
  private calculateBaseline(values: number[]): Baseline {
    if (values.length === 0) {
      return {
        mean: 0,
        standardDeviation: 0,
        median: 0,
        percentile95: 0,
        percentile99: 0,
        trend: 0
      };
    }

    const sorted = values.slice().sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    const median = sorted[Math.floor(sorted.length / 2)];
    const percentile95 = sorted[Math.floor(sorted.length * 0.95)];
    const percentile99 = sorted[Math.floor(sorted.length * 0.99)];

    // Calculate simple linear trend
    const trend = this.calculateTrend(values);

    return {
      mean,
      standardDeviation,
      median,
      percentile95,
      percentile99,
      trend
    };
  }

  /**
   * Calculate linear trend (slope)
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2...n-1
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope || 0;
  }

  /**
   * Group metrics by hour
   */
  private groupByHour<T>(
    metrics: ApiMetric[], 
    valueExtractor: (metric: ApiMetric, group: ApiMetric[]) => T
  ): Array<{ timestamp: Date; value: T }> {
    const groups = new Map<string, ApiMetric[]>();
    
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    return Array.from(groups.entries())
      .map(([key, group]) => ({
        timestamp: new Date(key),
        value: valueExtractor(group[0], group)
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Group data by day
   */
  private groupByDay<T>(
    data: Array<{ timestamp: Date; [key: string]: any }>,
    valueExtractor: (item: any) => number
  ): Array<{ timestamp: Date; value: number }> {
    const groups = new Map<string, any[]>();
    
    data.forEach(item => {
      const day = new Date(item.timestamp);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString();
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([key, group]) => ({
        timestamp: new Date(key),
        value: group.reduce((sum, item) => sum + valueExtractor(item), 0) / group.length
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(metrics: ApiMetric[]): {
    hourlyAverages: number[];
    dailyAverages: number[];
  } {
    const hourlyUsage = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    const dailyUsage = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      hourlyUsage[hour]++;
      hourlyCounts[hour]++;
      dailyUsage[day]++;
      dailyCounts[day]++;
    });

    const hourlyAverages = hourlyUsage.map((usage, i) => 
      hourlyCounts[i] > 0 ? usage / hourlyCounts[i] : 0
    );
    
    const dailyAverages = dailyUsage.map((usage, i) => 
      dailyCounts[i] > 0 ? usage / dailyCounts[i] : 0
    );

    return { hourlyAverages, dailyAverages };
  }

  /**
   * Calculate severity based on deviation from baseline
   */
  private calculateSeverity(
    value: number, 
    baseline: number, 
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / baseline;
    
    if (ratio > 5) return 'critical';
    if (ratio > 3) return 'high';
    if (ratio > 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score for anomaly detection
   */
  private calculateConfidence(value: number, baseline: Baseline): number {
    if (baseline.standardDeviation === 0) return 0.5;
    
    const zScore = Math.abs(value - baseline.mean) / baseline.standardDeviation;
    return Math.min(1, zScore / 3); // Normalize to 0-1 range
  }
}