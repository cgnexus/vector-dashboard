import { type ApiMetric } from '@/db/schema';

/**
 * Usage trend analysis result
 */
export interface UsageTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: number; // percentage change
  confidence: number; // 0-1
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  description: string;
}

/**
 * Usage pattern insights
 */
export interface UsagePattern {
  peakHours: number[];
  peakDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  quietPeriods: Array<{ start: number; end: number; type: 'hour' | 'day' }>;
  seasonality: {
    hasPattern: boolean;
    cycle: 'daily' | 'weekly' | 'monthly' | 'none';
    strength: number; // 0-1
  };
  predictability: number; // 0-1, how predictable the usage is
}

/**
 * Usage prediction for different time horizons
 */
export interface UsagePrediction {
  nextHour: {
    requests: number;
    confidence: number;
    range: { min: number; max: number };
  };
  nextDay: {
    requests: number;
    confidence: number;
    range: { min: number; max: number };
  };
  nextWeek: {
    requests: number;
    confidence: number;
    range: { min: number; max: number };
  };
  factors: string[];
}

/**
 * Cross-API correlation analysis
 */
export interface CrossAPICorrelation {
  providerPairs: Array<{
    provider1: string;
    provider2: string;
    correlation: number; // -1 to 1
    description: string;
    insight: string;
  }>;
  strongCorrelations: Array<{
    type: 'positive' | 'negative';
    providers: string[];
    correlation: number;
    explanation: string;
  }>;
}

/**
 * Performance optimization insights
 */
export interface OptimizationInsight {
  type: 'batching' | 'caching' | 'timing' | 'provider_switching' | 'rate_limiting';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
  estimatedSavings?: {
    cost?: number;
    requests?: number;
    responseTime?: number;
  };
}

/**
 * Time-based usage statistics
 */
interface TimeBasedStats {
  hourly: number[];
  daily: number[];
  weekly: number[];
  monthly: number[];
}

export class UsageAnalyzer {
  /**
   * Analyze usage trends over time
   */
  static analyzeTrends(metrics: ApiMetric[]): UsageTrend[] {
    const trends: UsageTrend[] = [];
    
    if (metrics.length < 14) return trends; // Need at least 2 weeks of data

    const sortedMetrics = metrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Analyze different time periods
    trends.push(...this.analyzeHourlyTrends(sortedMetrics));
    trends.push(...this.analyzeDailyTrends(sortedMetrics));
    trends.push(...this.analyzeWeeklyTrends(sortedMetrics));

    return trends;
  }

  /**
   * Identify usage patterns
   */
  static identifyPatterns(metrics: ApiMetric[]): UsagePattern {
    const timeStats = this.calculateTimeBasedStats(metrics);
    
    // Find peak hours (top 3)
    const hourlyWithIndex = timeStats.hourly.map((count, hour) => ({ hour, count }));
    const peakHours = hourlyWithIndex
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => hour)
      .sort((a, b) => a - b);

    // Find peak days (top 2)
    const dailyWithIndex = timeStats.daily.map((count, day) => ({ day, count }));
    const peakDays = dailyWithIndex
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(({ day }) => day)
      .sort((a, b) => a - b);

    // Find quiet periods
    const quietPeriods = this.findQuietPeriods(timeStats);

    // Analyze seasonality
    const seasonality = this.analyzeSeasonality(metrics);

    // Calculate predictability
    const predictability = this.calculatePredictability(timeStats);

    return {
      peakHours,
      peakDays,
      quietPeriods,
      seasonality,
      predictability
    };
  }

  /**
   * Predict future usage
   */
  static predictUsage(metrics: ApiMetric[]): UsagePrediction {
    if (metrics.length < 7) {
      return {
        nextHour: { requests: 0, confidence: 0, range: { min: 0, max: 0 } },
        nextDay: { requests: 0, confidence: 0, range: { min: 0, max: 0 } },
        nextWeek: { requests: 0, confidence: 0, range: { min: 0, max: 0 } },
        factors: ['Insufficient data for reliable prediction']
      };
    }

    const timeStats = this.calculateTimeBasedStats(metrics);
    const patterns = this.identifyPatterns(metrics);
    const trends = this.analyzeTrends(metrics);

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Predict next hour based on historical patterns
    const hourlyBaseline = timeStats.hourly[currentHour] || 0;
    const hourlyTrend = trends.find(t => t.period === 'hourly');
    const hourlyAdjustment = hourlyTrend ? (hourlyTrend.magnitude / 100) + 1 : 1;
    
    const nextHourPrediction = Math.round(hourlyBaseline * hourlyAdjustment);
    const nextHourRange = {
      min: Math.max(0, Math.round(nextHourPrediction * 0.7)),
      max: Math.round(nextHourPrediction * 1.3)
    };

    // Predict next day
    const dailyBaseline = timeStats.daily[currentDay] || 0;
    const dailyTrend = trends.find(t => t.period === 'daily');
    const dailyAdjustment = dailyTrend ? (dailyTrend.magnitude / 100) + 1 : 1;
    
    const nextDayPrediction = Math.round(dailyBaseline * dailyAdjustment);
    const nextDayRange = {
      min: Math.max(0, Math.round(nextDayPrediction * 0.6)),
      max: Math.round(nextDayPrediction * 1.4)
    };

    // Predict next week
    const weeklyAverage = timeStats.weekly.reduce((sum, count) => sum + count, 0) / 
                         Math.max(timeStats.weekly.length, 1);
    const weeklyTrend = trends.find(t => t.period === 'weekly');
    const weeklyAdjustment = weeklyTrend ? (weeklyTrend.magnitude / 100) + 1 : 1;
    
    const nextWeekPrediction = Math.round(weeklyAverage * 7 * weeklyAdjustment);
    const nextWeekRange = {
      min: Math.max(0, Math.round(nextWeekPrediction * 0.5)),
      max: Math.round(nextWeekPrediction * 1.5)
    };

    // Calculate confidence based on predictability and data quality
    const baseConfidence = patterns.predictability;
    const dataQualityFactor = Math.min(1, metrics.length / 100);
    const confidence = baseConfidence * dataQualityFactor;

    // Identify factors affecting predictions
    const factors: string[] = [];
    if (patterns.seasonality.hasPattern) {
      factors.push(`${patterns.seasonality.cycle} seasonal pattern detected`);
    }
    if (trends.some(t => t.direction !== 'stable')) {
      factors.push('Usage trend in progress');
    }
    if (patterns.peakHours.includes(currentHour)) {
      factors.push('Currently in peak usage hour');
    }
    if (patterns.peakDays.includes(currentDay)) {
      factors.push('Currently in peak usage day');
    }

    return {
      nextHour: {
        requests: nextHourPrediction,
        confidence: Math.min(confidence * 1.2, 1),
        range: nextHourRange
      },
      nextDay: {
        requests: nextDayPrediction,
        confidence,
        range: nextDayRange
      },
      nextWeek: {
        requests: nextWeekPrediction,
        confidence: Math.max(confidence * 0.8, 0.3),
        range: nextWeekRange
      },
      factors
    };
  }

  /**
   * Analyze cross-API correlations
   */
  static analyzeCrossAPICorrelations(metrics: ApiMetric[]): CrossAPICorrelation {
    const providers = [...new Set(metrics.map(m => m.providerId))];
    
    if (providers.length < 2) {
      return {
        providerPairs: [],
        strongCorrelations: []
      };
    }

    // Group metrics by provider and hour
    const providerUsage = new Map<string, Map<string, number>>();
    
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      
      if (!providerUsage.has(metric.providerId)) {
        providerUsage.set(metric.providerId, new Map());
      }
      
      const hourlyMap = providerUsage.get(metric.providerId)!;
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    // Calculate correlations between all provider pairs
    const providerPairs: Array<{
      provider1: string;
      provider2: string;
      correlation: number;
      description: string;
      insight: string;
    }> = [];

    for (let i = 0; i < providers.length; i++) {
      for (let j = i + 1; j < providers.length; j++) {
        const provider1 = providers[i];
        const provider2 = providers[j];
        
        const correlation = this.calculateCorrelation(
          providerUsage.get(provider1)!,
          providerUsage.get(provider2)!
        );

        if (!isNaN(correlation)) {
          const description = this.describeCorrelation(correlation);
          const insight = this.generateCorrelationInsight(provider1, provider2, correlation);
          
          providerPairs.push({
            provider1,
            provider2,
            correlation,
            description,
            insight
          });
        }
      }
    }

    // Find strong correlations
    const strongCorrelations = providerPairs
      .filter(pair => Math.abs(pair.correlation) > 0.6)
      .map(pair => ({
        type: pair.correlation > 0 ? 'positive' as const : 'negative' as const,
        providers: [pair.provider1, pair.provider2],
        correlation: pair.correlation,
        explanation: this.explainStrongCorrelation(pair.provider1, pair.provider2, pair.correlation)
      }));

    return {
      providerPairs: providerPairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
      strongCorrelations
    };
  }

  /**
   * Generate optimization insights
   */
  static generateOptimizationInsights(
    metrics: ApiMetric[],
    patterns: UsagePattern,
    correlations: CrossAPICorrelation
  ): OptimizationInsight[] {
    const insights: OptimizationInsight[] = [];

    // Batching opportunities
    const batchingInsight = this.analyzeBatchingOpportunities(metrics, patterns);
    if (batchingInsight) insights.push(batchingInsight);

    // Caching opportunities
    const cachingInsight = this.analyzeCachingOpportunities(metrics);
    if (cachingInsight) insights.push(cachingInsight);

    // Timing optimization
    const timingInsight = this.analyzeTimingOptimization(patterns);
    if (timingInsight) insights.push(timingInsight);

    // Provider switching opportunities
    const providerInsight = this.analyzeProviderSwitching(correlations);
    if (providerInsight) insights.push(providerInsight);

    // Rate limiting insights
    const rateLimitingInsight = this.analyzeRateLimiting(metrics, patterns);
    if (rateLimitingInsight) insights.push(rateLimitingInsight);

    return insights.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      return impactScore[b.impact] - impactScore[a.impact];
    });
  }

  /**
   * Calculate time-based usage statistics
   */
  private static calculateTimeBasedStats(metrics: ApiMetric[]): TimeBasedStats {
    const hourly = new Array(24).fill(0);
    const daily = new Array(7).fill(0);
    const weekly = new Array(53).fill(0);
    const monthly = new Array(12).fill(0);

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      hourly[date.getHours()]++;
      daily[date.getDay()]++;
      
      // Calculate week of year
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekOfYear < 53) weekly[weekOfYear]++;
      
      monthly[date.getMonth()]++;
    });

    return { hourly, daily, weekly, monthly };
  }

  /**
   * Analyze hourly trends
   */
  private static analyzeHourlyTrends(metrics: ApiMetric[]): UsageTrend[] {
    const trends: UsageTrend[] = [];
    
    // Group by hour for last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentWeek = metrics.filter(m => 
      new Date(m.timestamp) >= sevenDaysAgo
    );
    const previousWeek = metrics.filter(m => 
      new Date(m.timestamp) >= fourteenDaysAgo && new Date(m.timestamp) < sevenDaysAgo
    );

    if (recentWeek.length > 0 && previousWeek.length > 0) {
      const recentAvgPerHour = recentWeek.length / (7 * 24);
      const previousAvgPerHour = previousWeek.length / (7 * 24);
      
      const change = ((recentAvgPerHour - previousAvgPerHour) / previousAvgPerHour) * 100;
      
      if (Math.abs(change) > 5) {
        trends.push({
          direction: change > 0 ? 'increasing' : 'decreasing',
          magnitude: Math.abs(change),
          confidence: Math.min(1, Math.abs(change) / 50),
          period: 'hourly',
          description: `Hourly usage ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% this week`
        });
      }
    }

    return trends;
  }

  /**
   * Analyze daily trends
   */
  private static analyzeDailyTrends(metrics: ApiMetric[]): UsageTrend[] {
    const trends: UsageTrend[] = [];
    
    // Group by day for last 30 days
    const dailyUsage = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    metrics
      .filter(m => new Date(m.timestamp) >= thirtyDaysAgo)
      .forEach(metric => {
        const day = new Date(metric.timestamp).toISOString().split('T')[0];
        dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1);
      });

    if (dailyUsage.size >= 14) {
      const values = Array.from(dailyUsage.values());
      const trend = this.calculateLinearTrend(values);
      
      if (Math.abs(trend) > 0.1) {
        const magnitude = Math.abs(trend) * 30; // Project over 30 days
        
        trends.push({
          direction: trend > 0 ? 'increasing' : 'decreasing',
          magnitude,
          confidence: Math.min(1, magnitude / 100),
          period: 'daily',
          description: `Daily usage shows ${trend > 0 ? 'upward' : 'downward'} trend of ${magnitude.toFixed(1)}% per month`
        });
      }
    }

    return trends;
  }

  /**
   * Analyze weekly trends
   */
  private static analyzeWeeklyTrends(metrics: ApiMetric[]): UsageTrend[] {
    const trends: UsageTrend[] = [];
    
    // Group by week for last 12 weeks
    const weeklyUsage = new Map<number, number>();
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    metrics
      .filter(m => new Date(m.timestamp) >= twelveWeeksAgo)
      .forEach(metric => {
        const week = Math.floor(new Date(metric.timestamp).getTime() / (7 * 24 * 60 * 60 * 1000));
        weeklyUsage.set(week, (weeklyUsage.get(week) || 0) + 1);
      });

    if (weeklyUsage.size >= 8) {
      const values = Array.from(weeklyUsage.values());
      const trend = this.calculateLinearTrend(values);
      
      if (Math.abs(trend) > 0.05) {
        const magnitude = Math.abs(trend) * 52; // Project over 52 weeks
        
        trends.push({
          direction: trend > 0 ? 'increasing' : 'decreasing',
          magnitude,
          confidence: Math.min(1, magnitude / 200),
          period: 'weekly',
          description: `Weekly usage shows ${trend > 0 ? 'growth' : 'decline'} of ${magnitude.toFixed(1)}% annually`
        });
      }
    }

    return trends;
  }

  /**
   * Find quiet periods in usage
   */
  private static findQuietPeriods(stats: TimeBasedStats): Array<{ start: number; end: number; type: 'hour' | 'day' }> {
    const quietPeriods: Array<{ start: number; end: number; type: 'hour' | 'day' }> = [];
    
    // Find quiet hours (below 25% of peak)
    const maxHourly = Math.max(...stats.hourly);
    const hourlyThreshold = maxHourly * 0.25;
    
    let quietStart = -1;
    for (let hour = 0; hour < 24; hour++) {
      if (stats.hourly[hour] < hourlyThreshold) {
        if (quietStart === -1) quietStart = hour;
      } else {
        if (quietStart !== -1) {
          quietPeriods.push({ start: quietStart, end: hour - 1, type: 'hour' });
          quietStart = -1;
        }
      }
    }
    
    // Handle wrap-around quiet period
    if (quietStart !== -1) {
      quietPeriods.push({ start: quietStart, end: 23, type: 'hour' });
    }

    // Find quiet days (below 25% of peak)
    const maxDaily = Math.max(...stats.daily);
    const dailyThreshold = maxDaily * 0.25;
    
    for (let day = 0; day < 7; day++) {
      if (stats.daily[day] < dailyThreshold) {
        quietPeriods.push({ start: day, end: day, type: 'day' });
      }
    }

    return quietPeriods;
  }

  /**
   * Analyze seasonality patterns
   */
  private static analyzeSeasonality(metrics: ApiMetric[]): {
    hasPattern: boolean;
    cycle: 'daily' | 'weekly' | 'monthly' | 'none';
    strength: number;
  } {
    const stats = this.calculateTimeBasedStats(metrics);
    
    // Calculate coefficient of variation for each time period
    const dailyCV = this.calculateCoefficientOfVariation(stats.daily);
    const weeklyCV = this.calculateCoefficientOfVariation(stats.weekly.filter(w => w > 0));
    const monthlyCV = this.calculateCoefficientOfVariation(stats.monthly.filter(m => m > 0));

    // Higher CV indicates more seasonality
    const maxCV = Math.max(dailyCV, weeklyCV, monthlyCV);
    
    if (maxCV < 0.3) {
      return { hasPattern: false, cycle: 'none', strength: 0 };
    }

    let cycle: 'daily' | 'weekly' | 'monthly' = 'daily';
    if (weeklyCV === maxCV) cycle = 'weekly';
    else if (monthlyCV === maxCV) cycle = 'monthly';

    return {
      hasPattern: true,
      cycle,
      strength: Math.min(1, maxCV)
    };
  }

  /**
   * Calculate predictability score
   */
  private static calculatePredictability(stats: TimeBasedStats): number {
    // Predictability is inverse of coefficient of variation
    const hourlyCV = this.calculateCoefficientOfVariation(stats.hourly);
    const dailyCV = this.calculateCoefficientOfVariation(stats.daily);
    
    const avgCV = (hourlyCV + dailyCV) / 2;
    return Math.max(0, 1 - avgCV);
  }

  /**
   * Calculate coefficient of variation
   */
  private static calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    if (mean === 0) return 0;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  /**
   * Calculate linear trend slope
   */
  private static calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  /**
   * Calculate correlation between two time series
   */
  private static calculateCorrelation(
    series1: Map<string, number>,
    series2: Map<string, number>
  ): number {
    const commonKeys = [...series1.keys()].filter(key => series2.has(key));
    
    if (commonKeys.length < 3) return NaN;

    const values1 = commonKeys.map(key => series1.get(key)!);
    const values2 = commonKeys.map(key => series2.get(key)!);

    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? NaN : numerator / denominator;
  }

  /**
   * Describe correlation strength
   */
  private static describeCorrelation(correlation: number): string {
    const abs = Math.abs(correlation);
    const direction = correlation >= 0 ? 'positive' : 'negative';
    
    if (abs >= 0.8) return `Strong ${direction} correlation`;
    if (abs >= 0.6) return `Moderate ${direction} correlation`;
    if (abs >= 0.3) return `Weak ${direction} correlation`;
    return 'No significant correlation';
  }

  /**
   * Generate correlation insight
   */
  private static generateCorrelationInsight(provider1: string, provider2: string, correlation: number): string {
    if (Math.abs(correlation) < 0.3) {
      return `${provider1} and ${provider2} usage patterns are independent`;
    }
    
    if (correlation > 0.6) {
      return `${provider1} and ${provider2} are often used together - consider bundling or optimization`;
    }
    
    if (correlation < -0.6) {
      return `${provider1} and ${provider2} usage is inversely related - one may be a fallback for the other`;
    }
    
    return `${provider1} and ${provider2} show some correlation in usage patterns`;
  }

  /**
   * Explain strong correlation
   */
  private static explainStrongCorrelation(provider1: string, provider2: string, correlation: number): string {
    if (correlation > 0.6) {
      return `High usage of ${provider1} typically coincides with high usage of ${provider2}, suggesting they're part of the same workflows`;
    } else {
      return `When ${provider1} usage increases, ${provider2} usage tends to decrease, indicating they may serve similar purposes`;
    }
  }

  /**
   * Analyze batching opportunities
   */
  private static analyzeBatchingOpportunities(metrics: ApiMetric[], patterns: UsagePattern): OptimizationInsight | null {
    // Find endpoints with high frequency during peak hours
    const peakHourMetrics = metrics.filter(m => 
      patterns.peakHours.includes(new Date(m.timestamp).getHours())
    );

    if (peakHourMetrics.length < 50) return null;

    const endpointCounts = new Map<string, number>();
    peakHourMetrics.forEach(metric => {
      endpointCounts.set(metric.endpoint, (endpointCounts.get(metric.endpoint) || 0) + 1);
    });

    const highFrequencyEndpoints = Array.from(endpointCounts.entries())
      .filter(([, count]) => count > 20)
      .length;

    if (highFrequencyEndpoints === 0) return null;

    return {
      type: 'batching',
      title: 'Implement Request Batching During Peak Hours',
      description: `${highFrequencyEndpoints} endpoints show high frequency usage during peak hours (${patterns.peakHours.join(', ')}:00)`,
      impact: 'medium',
      implementation: 'Implement batching logic to group multiple requests into single API calls',
      estimatedSavings: {
        requests: Math.floor(peakHourMetrics.length * 0.3),
        cost: peakHourMetrics.length * 0.001 * 0.3 // Assume $0.001 per request saved
      }
    };
  }

  /**
   * Analyze caching opportunities
   */
  private static analyzeCachingOpportunities(metrics: ApiMetric[]): OptimizationInsight | null {
    // Look for repeated requests to same endpoints
    const requestSignatures = new Map<string, number>();
    
    metrics.forEach(metric => {
      const signature = `${metric.endpoint}:${metric.method}:${Math.floor((metric.requestSize || 0) / 100)}`;
      requestSignatures.set(signature, (requestSignatures.get(signature) || 0) + 1);
    });

    const repeatableRequests = Array.from(requestSignatures.values())
      .filter(count => count > 1)
      .reduce((sum, count) => sum + count - 1, 0); // Don't count first request

    if (repeatableRequests < 10) return null;

    return {
      type: 'caching',
      title: 'Implement Response Caching',
      description: `${repeatableRequests} repeated requests detected that could benefit from caching`,
      impact: 'high',
      implementation: 'Add Redis or in-memory caching for frequently requested data',
      estimatedSavings: {
        requests: repeatableRequests,
        cost: repeatableRequests * 0.002 // Assume $0.002 per cached request
      }
    };
  }

  /**
   * Analyze timing optimization opportunities
   */
  private static analyzeTimingOptimization(patterns: UsagePattern): OptimizationInsight | null {
    if (patterns.quietPeriods.length === 0) return null;

    const quietHours = patterns.quietPeriods
      .filter(p => p.type === 'hour')
      .map(p => `${p.start}:00-${p.end}:00`)
      .join(', ');

    if (!quietHours) return null;

    return {
      type: 'timing',
      title: 'Optimize Batch Jobs for Off-Peak Hours',
      description: `Quiet periods identified: ${quietHours}. Schedule non-urgent tasks during these times.`,
      impact: 'medium',
      implementation: 'Move batch processing, data synchronization, and maintenance tasks to quiet hours',
      estimatedSavings: {
        responseTime: 20 // 20% improvement during off-peak
      }
    };
  }

  /**
   * Analyze provider switching opportunities
   */
  private static analyzeProviderSwitching(correlations: CrossAPICorrelation): OptimizationInsight | null {
    const negativeCorrelations = correlations.strongCorrelations.filter(c => c.type === 'negative');
    
    if (negativeCorrelations.length === 0) return null;

    const providers = negativeCorrelations[0].providers;

    return {
      type: 'provider_switching',
      title: 'Optimize Provider Usage Strategy',
      description: `${providers.join(' and ')} show inverse usage patterns, suggesting redundancy or fallback opportunities`,
      impact: 'low',
      implementation: 'Implement intelligent provider switching based on availability and cost',
      estimatedSavings: {
        cost: 0.1 // Assume 10% cost savings through optimization
      }
    };
  }

  /**
   * Analyze rate limiting opportunities
   */
  private static analyzeRateLimiting(metrics: ApiMetric[], patterns: UsagePattern): OptimizationInsight | null {
    // Check for very high usage during peak periods
    const peakUsage = Math.max(...patterns.peakHours.map(hour => 
      metrics.filter(m => new Date(m.timestamp).getHours() === hour).length
    ));

    const averageUsage = metrics.length / 24; // Average per hour
    
    if (peakUsage < averageUsage * 3) return null;

    return {
      type: 'rate_limiting',
      title: 'Implement Smart Rate Limiting',
      description: `Peak usage is ${Math.round(peakUsage / averageUsage)}x higher than average, causing potential service strain`,
      impact: 'medium',
      implementation: 'Add rate limiting with burst capacity during peak hours',
      estimatedSavings: {
        responseTime: 15 // 15% improvement in response times
      }
    };
  }
}