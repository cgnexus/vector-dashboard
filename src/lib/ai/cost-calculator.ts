import { type ApiMetric } from '@/db/schema';

/**
 * Provider-specific pricing models
 */
interface ProviderPricing {
  provider: string;
  models: {
    [modelName: string]: {
      inputCost: number;  // cost per 1K tokens for input
      outputCost: number; // cost per 1K tokens for output
      baseCost?: number;  // fixed cost per request
      unit?: 'tokens' | 'requests' | 'characters' | 'minutes';
    };
  };
}

const PROVIDER_PRICING: ProviderPricing[] = [
  {
    provider: 'openai',
    models: {
      'gpt-4': { inputCost: 0.03, outputCost: 0.06 },
      'gpt-4-turbo': { inputCost: 0.01, outputCost: 0.03 },
      'gpt-4o': { inputCost: 0.005, outputCost: 0.015 },
      'gpt-4o-mini': { inputCost: 0.00015, outputCost: 0.0006 },
      'gpt-3.5-turbo': { inputCost: 0.0005, outputCost: 0.0015 },
      'text-embedding-3-small': { inputCost: 0.00002, outputCost: 0 },
      'text-embedding-3-large': { inputCost: 0.00013, outputCost: 0 },
      'text-embedding-ada-002': { inputCost: 0.0001, outputCost: 0 },
      'dall-e-3': { baseCost: 0.04, unit: 'requests' },
      'dall-e-2': { baseCost: 0.02, unit: 'requests' },
      'whisper-1': { inputCost: 0.006, outputCost: 0, unit: 'minutes' },
      'tts-1': { inputCost: 0.015, outputCost: 0, unit: 'characters' },
      'tts-1-hd': { inputCost: 0.03, outputCost: 0, unit: 'characters' }
    }
  },
  {
    provider: 'openrouter',
    models: {
      'anthropic/claude-3-opus': { inputCost: 0.015, outputCost: 0.075 },
      'anthropic/claude-3-sonnet': { inputCost: 0.003, outputCost: 0.015 },
      'anthropic/claude-3-haiku': { inputCost: 0.00025, outputCost: 0.00125 },
      'meta-llama/llama-3-70b': { inputCost: 0.0009, outputCost: 0.0009 },
      'meta-llama/llama-3-8b': { inputCost: 0.00018, outputCost: 0.00018 },
      'mistralai/mixtral-8x7b': { inputCost: 0.0006, outputCost: 0.0006 },
      'google/gemini-pro': { inputCost: 0.0005, outputCost: 0.0015 },
      'cohere/command-r-plus': { inputCost: 0.003, outputCost: 0.015 }
    }
  },
  {
    provider: 'exa',
    models: {
      'search': { baseCost: 0.001, unit: 'requests' },
      'contents': { baseCost: 0.001, unit: 'requests' },
      'similarity': { baseCost: 0.002, unit: 'requests' }
    }
  },
  {
    provider: 'twilio',
    models: {
      'sms': { baseCost: 0.0079, unit: 'requests' },
      'voice': { baseCost: 0.0085, unit: 'minutes' },
      'email': { baseCost: 0.0001, unit: 'requests' },
      'whatsapp': { baseCost: 0.005, unit: 'requests' },
      'verify': { baseCost: 0.05, unit: 'requests' }
    }
  },
  {
    provider: 'apollo',
    models: {
      'enrichment': { baseCost: 0.01, unit: 'requests' },
      'search': { baseCost: 0.05, unit: 'requests' },
      'export': { baseCost: 0.001, unit: 'requests' }
    }
  }
];

/**
 * Usage pattern analysis for cost prediction
 */
interface UsagePattern {
  hourlyAverage: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  peakHours: number[];
  seasonality: number;
  growthRate: number; // monthly growth rate as decimal
}

/**
 * Cost prediction result
 */
interface CostPrediction {
  nextHour: number;
  nextDay: number;
  nextWeek: number;
  nextMonth: number;
  confidence: number; // 0-1 confidence score
  factors: string[];
}

/**
 * Cost optimization recommendation
 */
interface CostOptimization {
  type: 'model_downgrade' | 'batching' | 'caching' | 'rate_limiting' | 'alternative_provider';
  title: string;
  description: string;
  potentialSavings: number;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

export class CostCalculator {
  private static providerPricing = new Map(
    PROVIDER_PRICING.map(p => [p.provider, p.models])
  );

  /**
   * Calculate cost for a single API call
   */
  static calculateCallCost(metric: ApiMetric): number {
    const provider = this.providerPricing.get(metric.providerId);
    if (!provider) return 0;

    // If cost is already calculated, return it
    if (metric.cost) {
      return parseFloat(metric.cost);
    }

    // Extract model from endpoint or metadata
    const model = this.extractModel(metric);
    const pricing = provider[model];
    
    if (!pricing) return 0;

    let cost = 0;

    if (pricing.unit === 'tokens' || !pricing.unit) {
      // Token-based pricing (default for LLMs)
      const tokens = metric.tokens as { input?: number; output?: number; total?: number } || {};
      const inputTokens = tokens.input || 0;
      const outputTokens = tokens.output || 0;
      
      cost = (inputTokens / 1000) * pricing.inputCost + 
             (outputTokens / 1000) * pricing.outputCost;
    } else if (pricing.unit === 'requests') {
      // Fixed cost per request
      cost = pricing.baseCost || 0;
    } else if (pricing.unit === 'characters') {
      // Character-based pricing (TTS)
      const chars = metric.metadata?.characters || metric.requestSize || 0;
      cost = (chars / 1000) * pricing.inputCost;
    } else if (pricing.unit === 'minutes') {
      // Time-based pricing (audio)
      const minutes = metric.metadata?.duration || metric.responseTime || 0;
      cost = (minutes / 60000) * pricing.inputCost; // convert ms to minutes
    }

    return Math.max(0, cost);
  }

  /**
   * Calculate real-time cost for current usage
   */
  static calculateRealTimeCost(metrics: ApiMetric[]): {
    currentCost: number;
    hourlyRate: number;
    dailyProjection: number;
    monthlyProjection: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Filter metrics from last hour
    const recentMetrics = metrics.filter(m => 
      new Date(m.timestamp) >= oneHourAgo
    );

    const currentCost = recentMetrics.reduce((sum, metric) => 
      sum + this.calculateCallCost(metric), 0
    );

    const hourlyRate = currentCost;
    const dailyProjection = hourlyRate * 24;
    const monthlyProjection = dailyProjection * 30;

    return {
      currentCost,
      hourlyRate,
      dailyProjection,
      monthlyProjection
    };
  }

  /**
   * Analyze usage patterns for prediction
   */
  static analyzeUsagePattern(metrics: ApiMetric[]): UsagePattern {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Group metrics by time periods
    const hourlyUsage = new Map<number, number>();
    const dailyUsage = new Map<string, number>();
    const weeklyUsage = new Map<number, number>();
    
    metrics
      .filter(m => new Date(m.timestamp) >= oneMonthAgo)
      .forEach(metric => {
        const date = new Date(metric.timestamp);
        const cost = this.calculateCallCost(metric);
        
        // Hourly patterns
        const hour = date.getHours();
        hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + cost);
        
        // Daily patterns
        const day = date.toISOString().split('T')[0];
        dailyUsage.set(day, (dailyUsage.get(day) || 0) + cost);
        
        // Weekly patterns
        const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
        weeklyUsage.set(week, (weeklyUsage.get(week) || 0) + cost);
      });

    // Calculate averages
    const hourlyValues = Array.from(hourlyUsage.values());
    const dailyValues = Array.from(dailyUsage.values());
    const weeklyValues = Array.from(weeklyUsage.values());

    const hourlyAverage = hourlyValues.length > 0 
      ? hourlyValues.reduce((a, b) => a + b, 0) / hourlyValues.length 
      : 0;
    const dailyAverage = dailyValues.length > 0
      ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
      : 0;
    const weeklyAverage = weeklyValues.length > 0
      ? weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length
      : 0;
    const monthlyAverage = weeklyAverage * 4;

    // Find peak hours
    const peakHours = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Calculate growth rate (simple linear trend)
    const sortedDaily = Array.from(dailyUsage.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    let growthRate = 0;
    if (sortedDaily.length >= 7) {
      const recentWeek = sortedDaily.slice(-7).reduce((sum, [, cost]) => sum + cost, 0) / 7;
      const previousWeek = sortedDaily.slice(-14, -7).reduce((sum, [, cost]) => sum + cost, 0) / 7;
      if (previousWeek > 0) {
        growthRate = (recentWeek - previousWeek) / previousWeek;
      }
    }

    return {
      hourlyAverage,
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      peakHours,
      seasonality: this.calculateSeasonality(dailyValues),
      growthRate
    };
  }

  /**
   * Predict future costs based on usage patterns
   */
  static predictCosts(pattern: UsagePattern): CostPrediction {
    const { hourlyAverage, dailyAverage, weeklyAverage, monthlyAverage, growthRate } = pattern;
    
    // Apply growth rate to predictions
    const growthFactor = 1 + growthRate;
    
    const nextHour = hourlyAverage * growthFactor;
    const nextDay = dailyAverage * growthFactor;
    const nextWeek = weeklyAverage * growthFactor;
    const nextMonth = monthlyAverage * growthFactor;

    // Calculate confidence based on data consistency
    const variance = this.calculateVariance([hourlyAverage, dailyAverage / 24, weeklyAverage / (7 * 24)]);
    const confidence = Math.max(0.1, 1 - (variance / Math.max(hourlyAverage, 0.001)));

    const factors = [];
    if (Math.abs(growthRate) > 0.1) {
      factors.push(`${growthRate > 0 ? 'Growing' : 'Declining'} usage trend (${(growthRate * 100).toFixed(1)}%)`);
    }
    if (pattern.seasonality > 0.3) {
      factors.push('High seasonality detected');
    }
    if (pattern.peakHours.length > 0) {
      factors.push(`Peak usage hours: ${pattern.peakHours.join(', ')}`);
    }

    return {
      nextHour,
      nextDay,
      nextWeek,
      nextMonth,
      confidence,
      factors
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  static generateOptimizations(
    metrics: ApiMetric[],
    currentCost: number
  ): CostOptimization[] {
    const recommendations: CostOptimization[] = [];
    
    // Analyze by provider and model
    const providerCosts = new Map<string, { cost: number; count: number; models: Set<string> }>();
    
    metrics.forEach(metric => {
      const cost = this.calculateCallCost(metric);
      const model = this.extractModel(metric);
      
      if (!providerCosts.has(metric.providerId)) {
        providerCosts.set(metric.providerId, { cost: 0, count: 0, models: new Set() });
      }
      
      const providerData = providerCosts.get(metric.providerId)!;
      providerData.cost += cost;
      providerData.count += 1;
      providerData.models.add(model);
    });

    // Model downgrade recommendations
    providerCosts.forEach((data, providerId) => {
      if (data.models.has('gpt-4') && data.cost > currentCost * 0.3) {
        recommendations.push({
          type: 'model_downgrade',
          title: 'Consider using GPT-4 Turbo or GPT-3.5 Turbo',
          description: `GPT-4 accounts for ${((data.cost / currentCost) * 100).toFixed(1)}% of costs. GPT-4 Turbo is 67% cheaper with similar performance.`,
          potentialSavings: data.cost * 0.67,
          implementation: 'Update your model parameter from "gpt-4" to "gpt-4-turbo"',
          priority: 'high'
        });
      }

      if (data.models.has('gpt-4-turbo') && data.cost > currentCost * 0.2) {
        recommendations.push({
          type: 'model_downgrade',
          title: 'Evaluate GPT-3.5 Turbo for simpler tasks',
          description: `Consider using GPT-3.5 Turbo for ${data.count} requests that may not require GPT-4 capabilities.`,
          potentialSavings: data.cost * 0.83,
          implementation: 'Implement logic to route simple requests to GPT-3.5 Turbo',
          priority: 'medium'
        });
      }
    });

    // Batching recommendations
    const highFrequencyEndpoints = this.findHighFrequencyEndpoints(metrics);
    highFrequencyEndpoints.forEach(({ endpoint, count, avgCost }) => {
      if (count > 100 && avgCost > 0.001) {
        recommendations.push({
          type: 'batching',
          title: `Implement batching for ${endpoint}`,
          description: `${count} requests could be optimized through batching, reducing overhead costs.`,
          potentialSavings: count * avgCost * 0.3,
          implementation: 'Group multiple requests into single API calls where possible',
          priority: count > 500 ? 'high' : 'medium'
        });
      }
    });

    // Caching recommendations
    const repeatableRequests = this.findRepeatableRequests(metrics);
    if (repeatableRequests.count > 50) {
      recommendations.push({
        type: 'caching',
        title: 'Implement response caching',
        description: `${repeatableRequests.count} repeated requests detected. Caching could eliminate redundant API calls.`,
        potentialSavings: repeatableRequests.cost,
        implementation: 'Add Redis or in-memory caching for repeated queries',
        priority: repeatableRequests.cost > currentCost * 0.1 ? 'high' : 'medium'
      });
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Extract model name from API metric
   */
  private static extractModel(metric: ApiMetric): string {
    // Try to extract from metadata first
    if (metric.metadata && typeof metric.metadata === 'object') {
      const metadata = metric.metadata as any;
      if (metadata.model) return metadata.model;
    }

    // Extract from endpoint
    const endpoint = metric.endpoint.toLowerCase();
    
    // OpenAI patterns
    if (endpoint.includes('gpt-4o-mini')) return 'gpt-4o-mini';
    if (endpoint.includes('gpt-4o')) return 'gpt-4o';
    if (endpoint.includes('gpt-4-turbo')) return 'gpt-4-turbo';
    if (endpoint.includes('gpt-4')) return 'gpt-4';
    if (endpoint.includes('gpt-3.5-turbo')) return 'gpt-3.5-turbo';
    if (endpoint.includes('text-embedding-3-small')) return 'text-embedding-3-small';
    if (endpoint.includes('text-embedding-3-large')) return 'text-embedding-3-large';
    if (endpoint.includes('text-embedding-ada-002')) return 'text-embedding-ada-002';
    if (endpoint.includes('dall-e-3')) return 'dall-e-3';
    if (endpoint.includes('dall-e-2')) return 'dall-e-2';
    if (endpoint.includes('whisper')) return 'whisper-1';
    if (endpoint.includes('tts-1-hd')) return 'tts-1-hd';
    if (endpoint.includes('tts-1')) return 'tts-1';

    // Exa patterns
    if (endpoint.includes('search')) return 'search';
    if (endpoint.includes('contents')) return 'contents';
    if (endpoint.includes('similarity')) return 'similarity';

    // Twilio patterns
    if (endpoint.includes('sms') || endpoint.includes('messages')) return 'sms';
    if (endpoint.includes('calls') || endpoint.includes('voice')) return 'voice';
    if (endpoint.includes('email')) return 'email';
    if (endpoint.includes('whatsapp')) return 'whatsapp';
    if (endpoint.includes('verify')) return 'verify';

    // Apollo patterns
    if (endpoint.includes('enrichment')) return 'enrichment';
    if (endpoint.includes('search')) return 'search';
    if (endpoint.includes('export')) return 'export';

    // Default fallback
    return 'unknown';
  }

  /**
   * Calculate seasonality factor
   */
  private static calculateSeasonality(values: number[]): number {
    if (values.length < 7) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / Math.max(mean, 0.001);
  }

  /**
   * Calculate variance for confidence scoring
   */
  private static calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Find high frequency endpoints for batching optimization
   */
  private static findHighFrequencyEndpoints(metrics: ApiMetric[]): Array<{
    endpoint: string;
    count: number;
    avgCost: number;
  }> {
    const endpointMap = new Map<string, { count: number; totalCost: number }>();
    
    metrics.forEach(metric => {
      const cost = this.calculateCallCost(metric);
      const existing = endpointMap.get(metric.endpoint) || { count: 0, totalCost: 0 };
      endpointMap.set(metric.endpoint, {
        count: existing.count + 1,
        totalCost: existing.totalCost + cost
      });
    });

    return Array.from(endpointMap.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgCost: data.totalCost / data.count
      }))
      .filter(item => item.count > 10)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Find repeatable requests for caching optimization
   */
  private static findRepeatableRequests(metrics: ApiMetric[]): {
    count: number;
    cost: number;
  } {
    const requestMap = new Map<string, { count: number; cost: number }>();
    
    metrics.forEach(metric => {
      // Create a hash of the request (endpoint + method + rough request size)
      const requestHash = `${metric.endpoint}:${metric.method}:${Math.floor((metric.requestSize || 0) / 100)}`;
      const cost = this.calculateCallCost(metric);
      
      const existing = requestMap.get(requestHash) || { count: 0, cost: 0 };
      requestMap.set(requestHash, {
        count: existing.count + 1,
        cost: existing.cost + cost
      });
    });

    let repeatableCount = 0;
    let repeatableCost = 0;

    requestMap.forEach(({ count, cost }) => {
      if (count > 1) {
        repeatableCount += count - 1; // Don't count the first request
        repeatableCost += cost * ((count - 1) / count); // Proportional cost saving
      }
    });

    return {
      count: repeatableCount,
      cost: repeatableCost
    };
  }
}