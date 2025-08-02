// AI-powered cost tracking and optimization services
export { CostCalculator } from './cost-calculator';
export { AnomalyDetector, type Anomaly, type AnomalyType } from './anomaly-detector';
export { 
  UsageAnalyzer, 
  type UsageTrend, 
  type UsagePattern, 
  type UsagePrediction,
  type CrossAPICorrelation,
  type OptimizationInsight 
} from './usage-analyzer';
export { 
  CostOptimizer, 
  type OptimizationStrategy,
  type ModelAlternative,
  type BudgetAllocation,
  type CostForecast,
  type CacheStrategy 
} from './cost-optimizer';

/**
 * Main AI service orchestrator for dashboard insights
 */
import { type ApiMetric } from '@/db/schema';
import { CostCalculator } from './cost-calculator';
import { AnomalyDetector } from './anomaly-detector';
import { UsageAnalyzer } from './usage-analyzer';
import { CostOptimizer } from './cost-optimizer';

export interface DashboardInsights {
  // Real-time metrics
  realTimeCosts: {
    currentCost: number;
    hourlyRate: number;
    dailyProjection: number;
    monthlyProjection: number;
  };

  // Anomalies and alerts
  anomalies: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: Date;
    confidence: number;
  }>;

  // Usage insights
  usagePatterns: {
    peakHours: number[];
    peakDays: number[];
    predictability: number;
    seasonality: {
      hasPattern: boolean;
      cycle: 'daily' | 'weekly' | 'monthly' | 'none';
      strength: number;
    };
  };

  // Predictions
  predictions: {
    nextHour: { requests: number; confidence: number };
    nextDay: { requests: number; confidence: number };
    nextWeek: { requests: number; confidence: number };
    factors: string[];
  };

  // Optimization opportunities
  optimizations: Array<{
    type: string;
    title: string;
    description: string;
    savings: number;
    confidence: number;
    effort: 'low' | 'medium' | 'high';
    timeToImplement: string;
  }>;

  // Cost forecasts
  forecasts: Array<{
    timeframe: 'week' | 'month' | 'quarter' | 'year';
    baselineCost: number;
    optimizedCost: number;
    projectedSavings: number;
    confidence: number;
  }>;
}

export class AIOrchestrator {
  /**
   * Generate comprehensive dashboard insights
   */
  static async generateDashboardInsights(
    metrics: ApiMetric[],
    _userId: string
  ): Promise<DashboardInsights> {
    if (metrics.length === 0) {
      return this.getEmptyInsights();
    }

    try {
      // Calculate real-time costs
      const realTimeCosts = CostCalculator.calculateRealTimeCost(metrics);

      // Detect anomalies
      const anomalyDetector = new AnomalyDetector();
      const anomalies = await anomalyDetector.detectAnomalies(metrics);

      // Analyze usage patterns
      const usagePatterns = UsageAnalyzer.identifyPatterns(metrics);
      const predictions = UsageAnalyzer.predictUsage(metrics);
      const correlations = UsageAnalyzer.analyzeCrossAPICorrelations(metrics);

      // Generate optimizations
      const optimizationStrategies = await CostOptimizer.generateOptimizationStrategies(
        metrics,
        usagePatterns,
        correlations
      );

      // Generate forecasts
      const forecasts = CostOptimizer.generateCostForecast(metrics, optimizationStrategies);

      return {
        realTimeCosts,
        anomalies: anomalies.map(anomaly => ({
          id: anomaly.id,
          type: anomaly.type,
          severity: anomaly.severity,
          title: anomaly.title,
          description: anomaly.description,
          timestamp: anomaly.timestamp,
          confidence: anomaly.confidence
        })),
        usagePatterns: {
          peakHours: usagePatterns.peakHours,
          peakDays: usagePatterns.peakDays,
          predictability: usagePatterns.predictability,
          seasonality: usagePatterns.seasonality
        },
        predictions,
        optimizations: optimizationStrategies.slice(0, 5).map(strategy => ({
          type: strategy.type,
          title: strategy.title,
          description: strategy.description,
          savings: strategy.savings,
          confidence: strategy.confidence,
          effort: strategy.effort,
          timeToImplement: strategy.timeToImplement
        })),
        forecasts
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getEmptyInsights();
    }
  }

  /**
   * Quick anomaly check for real-time alerts
   */
  static async quickAnomalyCheck(
    recentMetrics: ApiMetric[]
  ): Promise<Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    confidence: number;
  }>> {
    if (recentMetrics.length < 5) return [];

    try {
      const anomalyDetector = new AnomalyDetector({
        minimumDataPoints: 5,
        confidenceThreshold: 0.6
      });

      const anomalies = await anomalyDetector.detectAnomalies(recentMetrics);
      
      return anomalies
        .filter(anomaly => anomaly.severity !== 'low')
        .slice(0, 3) // Top 3 most critical
        .map(anomaly => ({
          type: anomaly.type,
          severity: anomaly.severity,
          message: anomaly.description,
          confidence: anomaly.confidence
        }));
    } catch (error) {
      console.error('Error in quick anomaly check:', error);
      return [];
    }
  }

  /**
   * Calculate cost optimization potential
   */
  static async calculateOptimizationPotential(
    metrics: ApiMetric[]
  ): Promise<{
    totalSavings: number;
    savingsPercentage: number;
    topOpportunities: Array<{
      type: string;
      title: string;
      savings: number;
      confidence: number;
    }>;
  }> {
    if (metrics.length === 0) {
      return {
        totalSavings: 0,
        savingsPercentage: 0,
        topOpportunities: []
      };
    }

    try {
      const currentCost = metrics.reduce((sum, metric) => 
        sum + CostCalculator.calculateCallCost(metric), 0
      );

      const patterns = UsageAnalyzer.identifyPatterns(metrics);
      const correlations = UsageAnalyzer.analyzeCrossAPICorrelations(metrics);
      const strategies = await CostOptimizer.generateOptimizationStrategies(
        metrics,
        patterns,
        correlations
      );

      const totalSavings = strategies.reduce((sum, strategy) => sum + strategy.savings, 0);
      const savingsPercentage = currentCost > 0 ? (totalSavings / currentCost) * 100 : 0;

      return {
        totalSavings,
        savingsPercentage,
        topOpportunities: strategies.slice(0, 3).map(strategy => ({
          type: strategy.type,
          title: strategy.title,
          savings: strategy.savings,
          confidence: strategy.confidence
        }))
      };
    } catch (error) {
      console.error('Error calculating optimization potential:', error);
      return {
        totalSavings: 0,
        savingsPercentage: 0,
        topOpportunities: []
      };
    }
  }

  /**
   * Get empty insights structure for error cases
   */
  private static getEmptyInsights(): DashboardInsights {
    return {
      realTimeCosts: {
        currentCost: 0,
        hourlyRate: 0,
        dailyProjection: 0,
        monthlyProjection: 0
      },
      anomalies: [],
      usagePatterns: {
        peakHours: [],
        peakDays: [],
        predictability: 0,
        seasonality: {
          hasPattern: false,
          cycle: 'none',
          strength: 0
        }
      },
      predictions: {
        nextHour: { requests: 0, confidence: 0 },
        nextDay: { requests: 0, confidence: 0 },
        nextWeek: { requests: 0, confidence: 0 },
        factors: ['Insufficient data for predictions']
      },
      optimizations: [],
      forecasts: []
    };
  }
}

/**
 * Utility functions for AI services
 */
export class AIUtils {
  /**
   * Validate metrics data quality
   */
  static validateMetricsQuality(metrics: ApiMetric[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metrics.length === 0) {
      issues.push('No metrics data available');
      recommendations.push('Start using APIs to generate metrics data');
      return { isValid: false, issues, recommendations };
    }

    if (metrics.length < 10) {
      issues.push('Insufficient data for reliable analysis');
      recommendations.push('Collect more usage data for better insights');
    }

    const hasTimestamps = metrics.every(m => m.timestamp);
    if (!hasTimestamps) {
      issues.push('Missing timestamp data');
      recommendations.push('Ensure all API calls are properly timestamped');
    }

    const hasCosts = metrics.some(m => m.cost && parseFloat(m.cost) > 0);
    if (!hasCosts) {
      issues.push('No cost data available');
      recommendations.push('Configure cost tracking for your API providers');
    }

    const hasResponseTimes = metrics.some(m => m.responseTime && m.responseTime > 0);
    if (!hasResponseTimes) {
      issues.push('No response time data');
      recommendations.push('Enable response time tracking for performance analysis');
    }

    // Check data freshness
    const latestMetric = Math.max(...metrics.map(m => new Date(m.timestamp).getTime()));
    const daysSinceLatest = (Date.now() - latestMetric) / (24 * 60 * 60 * 1000);
    
    if (daysSinceLatest > 7) {
      issues.push('Data is not recent');
      recommendations.push('Ensure metrics are being collected from current API usage');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Format cost values for display
   */
  static formatCost(cost: number): string {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    if (cost < 100) return `$${cost.toFixed(2)}`;
    return `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format percentage values
   */
  static formatPercentage(percentage: number): string {
    if (percentage === 0) return '0%';
    if (Math.abs(percentage) < 0.1) return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
    if (Math.abs(percentage) < 1) return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    return `${percentage > 0 ? '+' : ''}${Math.round(percentage)}%`;
  }

  /**
   * Format confidence scores
   */
  static formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 90) return 'Very High';
    if (percentage >= 70) return 'High';
    if (percentage >= 50) return 'Medium';
    if (percentage >= 30) return 'Low';
    return 'Very Low';
  }

  /**
   * Get severity color for UI
   */
  static getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity];
  }
}