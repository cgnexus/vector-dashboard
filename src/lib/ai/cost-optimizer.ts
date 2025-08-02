import { type ApiMetric } from '@/db/schema';
import { CostCalculator } from './cost-calculator';
import { UsageAnalyzer, type UsagePattern, type CrossAPICorrelation } from './usage-analyzer';

/**
 * Cost optimization strategy
 */
export interface OptimizationStrategy {
  id: string;
  type: 'model_optimization' | 'provider_switching' | 'batching' | 'caching' | 'scheduling' | 'budget_allocation';
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  confidence: number; // 0-1
  timeToImplement: 'immediate' | 'hours' | 'days' | 'weeks';
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  implementation: {
    steps: string[];
    codeChanges: string[];
    testing: string[];
  };
  metrics: {
    estimatedMonthlySavings: number;
    paybackPeriod: string;
    riskAssessment: string;
  };
}

/**
 * Model alternative suggestion
 */
export interface ModelAlternative {
  currentModel: string;
  alternativeModel: string;
  provider: string;
  costReduction: number;
  performanceImpact: 'minimal' | 'slight' | 'moderate' | 'significant';
  useCase: string;
  confidence: number;
}

/**
 * Budget allocation recommendation
 */
export interface BudgetAllocation {
  provider: string;
  currentSpend: number;
  recommendedBudget: number;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  adjustmentType: 'increase' | 'decrease' | 'maintain';
}

/**
 * Cost forecasting result
 */
export interface CostForecast {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  baselineCost: number;
  optimizedCost: number;
  projectedSavings: number;
  factors: string[];
  confidence: number;
  breakdown: {
    provider: string;
    currentProjection: number;
    optimizedProjection: number;
    savings: number;
  }[];
}

/**
 * Cache strategy recommendation
 */
export interface CacheStrategy {
  endpoint: string;
  provider: string;
  cacheHitRate: number;
  avgResponseSize: number;
  requestFrequency: number;
  ttl: number; // recommended TTL in seconds
  strategy: 'redis' | 'memory' | 'cdn' | 'hybrid';
  estimatedSavings: number;
  implementation: string;
}

export class CostOptimizer {
  /**
   * Generate comprehensive optimization strategies
   */
  static async generateOptimizationStrategies(
    metrics: ApiMetric[],
    patterns: UsagePattern,
    correlations: CrossAPICorrelation
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];

    // Analyze current costs
    const currentTotalCost = metrics.reduce((sum, metric) => 
      sum + CostCalculator.calculateCallCost(metric), 0
    );

    // Generate different types of optimization strategies
    strategies.push(...await this.generateModelOptimizations(metrics, currentTotalCost));
    strategies.push(...await this.generateProviderSwitchingStrategies(metrics, correlations, currentTotalCost));
    strategies.push(...await this.generateBatchingStrategies(metrics, patterns, currentTotalCost));
    strategies.push(...await this.generateCachingStrategies(metrics, currentTotalCost));
    strategies.push(...await this.generateSchedulingStrategies(metrics, patterns, currentTotalCost));

    return strategies
      .filter(strategy => strategy.savings > 0.01) // Filter out insignificant savings
      .sort((a, b) => b.savings - a.savings); // Sort by savings amount
  }

  /**
   * Suggest model alternatives for cost reduction
   */
  static suggestModelAlternatives(metrics: ApiMetric[]): ModelAlternative[] {
    const alternatives: ModelAlternative[] = [];
    
    // Group metrics by provider and model
    const modelUsage = new Map<string, { count: number; cost: number; responseTime: number[] }>();
    
    metrics.forEach(metric => {
      const model = this.extractModelFromMetric(metric);
      const key = `${metric.providerId}:${model}`;
      const cost = CostCalculator.calculateCallCost(metric);
      
      if (!modelUsage.has(key)) {
        modelUsage.set(key, { count: 0, cost: 0, responseTime: [] });
      }
      
      const usage = modelUsage.get(key)!;
      usage.count++;
      usage.cost += cost;
      if (metric.responseTime) usage.responseTime.push(metric.responseTime);
    });

    // Analyze each model for optimization opportunities
    modelUsage.forEach((usage, key) => {
      const [provider, model] = key.split(':');
      
      // OpenAI model alternatives
      if (provider === 'openai') {
        if (model === 'gpt-4' && usage.cost > 0.1) {
          alternatives.push({
            currentModel: model,
            alternativeModel: 'gpt-4-turbo',
            provider,
            costReduction: usage.cost * 0.67, // 67% cost reduction
            performanceImpact: 'minimal',
            useCase: 'Most GPT-4 use cases',
            confidence: 0.9
          });

          alternatives.push({
            currentModel: model,
            alternativeModel: 'gpt-4o',
            provider,
            costReduction: usage.cost * 0.83, // 83% cost reduction
            performanceImpact: 'slight',
            useCase: 'Complex reasoning tasks',
            confidence: 0.8
          });
        }

        if ((model === 'gpt-4' || model === 'gpt-4-turbo') && this.isSimpleTask(usage.responseTime)) {
          alternatives.push({
            currentModel: model,
            alternativeModel: 'gpt-3.5-turbo',
            provider,
            costReduction: usage.cost * 0.95, // 95% cost reduction
            performanceImpact: 'moderate',
            useCase: 'Simple text generation and analysis',
            confidence: 0.7
          });
        }
      }

      // Add alternatives for other providers
      if (provider === 'openrouter') {
        if (model.includes('claude-3-opus')) {
          alternatives.push({
            currentModel: model,
            alternativeModel: 'anthropic/claude-3-sonnet',
            provider,
            costReduction: usage.cost * 0.8, // 80% cost reduction
            performanceImpact: 'slight',
            useCase: 'Most reasoning tasks',
            confidence: 0.85
          });
        }
      }
    });

    return alternatives.sort((a, b) => b.costReduction - a.costReduction);
  }

  /**
   * Optimize budget allocation across providers
   */
  static optimizeBudgetAllocation(
    metrics: ApiMetric[],
    currentBudgets: { provider: string; budget: number }[]
  ): BudgetAllocation[] {
    const allocations: BudgetAllocation[] = [];
    
    // Calculate actual spending by provider
    const actualSpending = new Map<string, number>();
    metrics.forEach(metric => {
      const cost = CostCalculator.calculateCallCost(metric);
      actualSpending.set(
        metric.providerId, 
        (actualSpending.get(metric.providerId) || 0) + cost
      );
    });

    // Calculate efficiency metrics by provider
    const providerEfficiency = new Map<string, {
      costPerRequest: number;
      errorRate: number;
      avgResponseTime: number;
      reliability: number;
    }>();

    actualSpending.forEach((spend, providerId) => {
      const providerMetrics = metrics.filter(m => m.providerId === providerId);
      const requestCount = providerMetrics.length;
      const errorCount = providerMetrics.filter(m => m.statusCode >= 400).length;
      const avgResponseTime = providerMetrics
        .filter(m => m.responseTime)
        .reduce((sum, m) => sum + (m.responseTime || 0), 0) / 
        Math.max(providerMetrics.filter(m => m.responseTime).length, 1);

      providerEfficiency.set(providerId, {
        costPerRequest: spend / requestCount,
        errorRate: (errorCount / requestCount) * 100,
        avgResponseTime,
        reliability: Math.max(0, 100 - (errorCount / requestCount) * 100)
      });
    });

    // Generate allocation recommendations
    currentBudgets.forEach(({ provider, budget }) => {
      const actualSpend = actualSpending.get(provider) || 0;
      const efficiency = providerEfficiency.get(provider);
      
      if (!efficiency) {
        allocations.push({
          provider,
          currentSpend: actualSpend,
          recommendedBudget: budget * 0.5, // Reduce unused budget
          reasoning: 'No usage detected, consider reducing allocation',
          priority: 'low',
          adjustmentType: 'decrease'
        });
        return;
      }

      let recommendedBudget = budget;
      let adjustmentType: 'increase' | 'decrease' | 'maintain' = 'maintain';
      let reasoning = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';

      // High efficiency, high utilization - increase budget
      if (efficiency.reliability > 95 && efficiency.costPerRequest < 0.01 && actualSpend > budget * 0.8) {
        recommendedBudget = budget * 1.2;
        adjustmentType = 'increase';
        reasoning = 'High efficiency and utilization, consider increasing allocation';
        priority = 'high';
      }
      // Low efficiency - decrease budget
      else if (efficiency.reliability < 80 || efficiency.errorRate > 10) {
        recommendedBudget = budget * 0.8;
        adjustmentType = 'decrease';
        reasoning = 'Poor reliability or high error rate, consider reducing allocation';
        priority = 'high';
      }
      // Low utilization - decrease budget
      else if (actualSpend < budget * 0.3) {
        recommendedBudget = actualSpend * 1.5; // 50% buffer above actual usage
        adjustmentType = 'decrease';
        reasoning = 'Low utilization, reduce allocation and redistribute';
        priority = 'medium';
      }
      // High utilization but average efficiency - slight increase
      else if (actualSpend > budget * 0.9 && efficiency.reliability > 90) {
        recommendedBudget = budget * 1.1;
        adjustmentType = 'increase';
        reasoning = 'High utilization with good reliability, slight increase recommended';
        priority = 'medium';
      }

      allocations.push({
        provider,
        currentSpend: actualSpend,
        recommendedBudget,
        reasoning,
        priority,
        adjustmentType
      });
    });

    return allocations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate cost forecasts with optimization
   */
  static generateCostForecast(
    metrics: ApiMetric[],
    optimizationStrategies: OptimizationStrategy[]
  ): CostForecast[] {
    const forecasts: CostForecast[] = [];
    const timeframes: Array<{ period: 'week' | 'month' | 'quarter' | 'year'; multiplier: number }> = [
      { period: 'week', multiplier: 7 },
      { period: 'month', multiplier: 30 },
      { period: 'quarter', multiplier: 90 },
      { period: 'year', multiplier: 365 }
    ];

    // Calculate daily baseline cost
    const totalCost = metrics.reduce((sum, metric) => 
      sum + CostCalculator.calculateCallCost(metric), 0
    );
    const days = this.getUniqueDays(metrics);
    const dailyBaseline = totalCost / Math.max(days, 1);

    // Calculate total optimization savings
    const totalOptimizationSavings = optimizationStrategies
      .reduce((sum, strategy) => sum + strategy.savings, 0);
    const dailyOptimizationSavings = totalOptimizationSavings / Math.max(days, 1);

    timeframes.forEach(({ period, multiplier }) => {
      const baselineCost = dailyBaseline * multiplier;
      const optimizedCost = Math.max(0, baselineCost - (dailyOptimizationSavings * multiplier));
      const projectedSavings = baselineCost - optimizedCost;

      // Generate provider breakdown
      const providerCosts = this.calculateProviderBreakdown(metrics, multiplier, optimizationStrategies);

      forecasts.push({
        timeframe: period,
        baselineCost,
        optimizedCost,
        projectedSavings,
        factors: this.generateForecastFactors(metrics, optimizationStrategies),
        confidence: this.calculateForecastConfidence(metrics, period),
        breakdown: providerCosts
      });
    });

    return forecasts;
  }

  /**
   * Generate cache strategy recommendations
   */
  static generateCacheStrategies(metrics: ApiMetric[]): CacheStrategy[] {
    const strategies: CacheStrategy[] = [];
    
    // Group by endpoint and analyze caching potential
    const endpointAnalysis = new Map<string, {
      provider: string;
      requests: number;
      avgResponseSize: number;
      avgResponseTime: number;
      repeatability: number;
      costs: number[];
    }>();

    metrics.forEach(metric => {
      const endpoint = metric.endpoint;
      if (!endpointAnalysis.has(endpoint)) {
        endpointAnalysis.set(endpoint, {
          provider: metric.providerId,
          requests: 0,
          avgResponseSize: 0,
          avgResponseTime: 0,
          repeatability: 0,
          costs: []
        });
      }

      const analysis = endpointAnalysis.get(endpoint)!;
      analysis.requests++;
      analysis.avgResponseSize += (metric.responseSize || 0);
      analysis.avgResponseTime += (metric.responseTime || 0);
      analysis.costs.push(CostCalculator.calculateCallCost(metric));
    });

    // Generate strategies for high-value caching opportunities
    endpointAnalysis.forEach((analysis, endpoint) => {
      analysis.avgResponseSize /= analysis.requests;
      analysis.avgResponseTime /= analysis.requests;
      
      // Calculate repeatability (how often same requests occur)
      analysis.repeatability = this.calculateRepeatability(metrics.filter(m => m.endpoint === endpoint));

      // Only recommend caching for endpoints with sufficient repeatability and volume
      if (analysis.requests > 10 && analysis.repeatability > 0.3) {
        const totalCost = analysis.costs.reduce((sum, cost) => sum + cost, 0);
        const cacheHitRate = Math.min(0.9, analysis.repeatability);
        const estimatedSavings = totalCost * cacheHitRate;

        let strategy: 'redis' | 'memory' | 'cdn' | 'hybrid' = 'memory';
        let ttl = 300; // 5 minutes default

        // Determine caching strategy based on characteristics
        if (analysis.avgResponseSize > 1000000) { // > 1MB
          strategy = 'cdn';
          ttl = 3600; // 1 hour
        } else if (analysis.requests > 100) {
          strategy = 'redis';
          ttl = 1800; // 30 minutes
        } else if (analysis.avgResponseTime > 2000) {
          strategy = 'hybrid';
          ttl = 900; // 15 minutes
        }

        strategies.push({
          endpoint,
          provider: analysis.provider,
          cacheHitRate,
          avgResponseSize: analysis.avgResponseSize,
          requestFrequency: analysis.requests,
          ttl,
          strategy,
          estimatedSavings,
          implementation: this.generateCacheImplementation(endpoint, strategy, ttl)
        });
      }
    });

    return strategies.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  /**
   * Generate model optimization strategies
   */
  private static async generateModelOptimizations(
    metrics: ApiMetric[],
    currentTotalCost: number
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];
    const alternatives = this.suggestModelAlternatives(metrics);

    alternatives.forEach((alt, index) => {
      if (alt.costReduction > currentTotalCost * 0.05) { // At least 5% savings
        strategies.push({
          id: `model_opt_${index}`,
          type: 'model_optimization',
          title: `Switch from ${alt.currentModel} to ${alt.alternativeModel}`,
          description: `Replace ${alt.currentModel} with ${alt.alternativeModel} for ${alt.useCase}`,
          currentCost: alt.costReduction / (1 - this.getModelCostReduction(alt.currentModel, alt.alternativeModel)),
          optimizedCost: alt.costReduction / (1 - this.getModelCostReduction(alt.currentModel, alt.alternativeModel)) - alt.costReduction,
          savings: alt.costReduction,
          savingsPercentage: (alt.costReduction / currentTotalCost) * 100,
          confidence: alt.confidence,
          timeToImplement: 'hours',
          effort: 'low',
          risk: alt.performanceImpact === 'minimal' ? 'low' : 'medium',
          implementation: {
            steps: [
              `Update model parameter from "${alt.currentModel}" to "${alt.alternativeModel}"`,
              'Test with a small subset of requests',
              'Monitor performance metrics',
              'Gradually roll out to all requests'
            ],
            codeChanges: [
              `Change model: "${alt.currentModel}" → "${alt.alternativeModel}"`,
              'Update any model-specific parameters',
              'Adjust token limits if necessary'
            ],
            testing: [
              'Compare output quality on sample requests',
              'Measure response times',
              'Validate cost reduction'
            ]
          },
          metrics: {
            estimatedMonthlySavings: alt.costReduction * 30,
            paybackPeriod: 'Immediate',
            riskAssessment: `${alt.performanceImpact} performance impact expected`
          }
        });
      }
    });

    return strategies;
  }

  /**
   * Generate provider switching strategies
   */
  private static async generateProviderSwitchingStrategies(
    metrics: ApiMetric[],
    correlations: CrossAPICorrelation,
    currentTotalCost: number
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];

    // Analyze provider costs and performance
    const providerAnalysis = this.analyzeProviderPerformance(metrics);

    providerAnalysis.forEach((analysis, providerId) => {
      if (analysis.costPerRequest > 0.01 && analysis.reliability < 95) {
        const potentialSavings = analysis.totalCost * 0.3; // Assume 30% savings possible

        strategies.push({
          id: `provider_switch_${providerId}`,
          type: 'provider_switching',
          title: `Optimize ${providerId} Usage`,
          description: `Consider alternative providers or optimization for ${providerId} (${analysis.reliability.toFixed(1)}% reliability)`,
          currentCost: analysis.totalCost,
          optimizedCost: analysis.totalCost - potentialSavings,
          savings: potentialSavings,
          savingsPercentage: (potentialSavings / currentTotalCost) * 100,
          confidence: 0.6,
          timeToImplement: 'weeks',
          effort: 'high',
          risk: 'medium',
          implementation: {
            steps: [
              'Research alternative providers',
              'Implement provider abstraction layer',
              'Add circuit breaker pattern',
              'Test with fallback providers'
            ],
            codeChanges: [
              'Create provider interface',
              'Implement multiple provider clients',
              'Add configuration for provider selection'
            ],
            testing: [
              'Test all providers with same requests',
              'Compare costs and performance',
              'Validate failover behavior'
            ]
          },
          metrics: {
            estimatedMonthlySavings: potentialSavings * 30,
            paybackPeriod: '2-3 months',
            riskAssessment: 'Medium risk due to provider dependency changes'
          }
        });
      }
    });

    return strategies;
  }

  /**
   * Generate batching strategies
   */
  private static async generateBatchingStrategies(
    metrics: ApiMetric[],
    patterns: UsagePattern,
    currentTotalCost: number
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];

    // Find high-frequency endpoints during peak hours
    const batchingOpportunities = this.findBatchingOpportunities(metrics, patterns);

    batchingOpportunities.forEach((opportunity, index) => {
      const savings = opportunity.potentialSavings;
      if (savings > currentTotalCost * 0.02) { // At least 2% savings
        strategies.push({
          id: `batching_${index}`,
          type: 'batching',
          title: `Implement Batching for ${opportunity.endpoint}`,
          description: `Batch ${opportunity.requestCount} requests to reduce overhead`,
          currentCost: opportunity.currentCost,
          optimizedCost: opportunity.currentCost - savings,
          savings,
          savingsPercentage: (savings / currentTotalCost) * 100,
          confidence: 0.8,
          timeToImplement: 'days',
          effort: 'medium',
          risk: 'low',
          implementation: {
            steps: [
              'Identify batchable requests',
              'Implement batching queue',
              'Add batch processing logic',
              'Update client code to use batching'
            ],
            codeChanges: [
              'Create batching middleware',
              'Implement queue mechanism',
              'Add batch size optimization'
            ],
            testing: [
              'Test batch processing correctness',
              'Validate performance improvements',
              'Ensure no data loss'
            ]
          },
          metrics: {
            estimatedMonthlySavings: savings * 30,
            paybackPeriod: '1-2 weeks',
            riskAssessment: 'Low risk, improves efficiency'
          }
        });
      }
    });

    return strategies;
  }

  /**
   * Generate caching strategies
   */
  private static async generateCachingStrategies(
    metrics: ApiMetric[],
    currentTotalCost: number
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];
    const cacheStrategies = this.generateCacheStrategies(metrics);

    const totalCacheSavings = cacheStrategies.reduce((sum, strategy) => 
      sum + strategy.estimatedSavings, 0
    );

    if (totalCacheSavings > currentTotalCost * 0.03) { // At least 3% savings
      strategies.push({
        id: 'caching_implementation',
        type: 'caching',
        title: 'Implement Response Caching',
        description: `Cache responses for ${cacheStrategies.length} high-value endpoints`,
        currentCost: totalCacheSavings / 0.7, // Assume 70% cache hit rate
        optimizedCost: (totalCacheSavings / 0.7) - totalCacheSavings,
        savings: totalCacheSavings,
        savingsPercentage: (totalCacheSavings / currentTotalCost) * 100,
        confidence: 0.85,
        timeToImplement: 'days',
        effort: 'medium',
        risk: 'low',
        implementation: {
          steps: [
            'Set up Redis cluster',
            'Implement cache middleware',
            'Add cache invalidation logic',
            'Monitor cache hit rates'
          ],
          codeChanges: [
            'Add caching layer to API clients',
            'Implement cache key generation',
            'Add TTL management'
          ],
          testing: [
            'Test cache hit/miss scenarios',
            'Validate cache invalidation',
            'Monitor memory usage'
          ]
        },
        metrics: {
          estimatedMonthlySavings: totalCacheSavings * 30,
          paybackPeriod: '2-4 weeks',
          riskAssessment: 'Low risk, high benefit'
        }
      });
    }

    return strategies;
  }

  /**
   * Generate scheduling strategies
   */
  private static async generateSchedulingStrategies(
    metrics: ApiMetric[],
    patterns: UsagePattern,
    currentTotalCost: number
  ): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];

    if (patterns.quietPeriods.length > 0) {
      const potentialSavings = currentTotalCost * 0.1; // Assume 10% savings from better scheduling

      strategies.push({
        id: 'scheduling_optimization',
        type: 'scheduling',
        title: 'Optimize Task Scheduling',
        description: `Move non-urgent tasks to quiet periods (${patterns.quietPeriods.length} periods identified)`,
        currentCost: currentTotalCost,
        optimizedCost: currentTotalCost - potentialSavings,
        savings: potentialSavings,
        savingsPercentage: (potentialSavings / currentTotalCost) * 100,
        confidence: 0.7,
        timeToImplement: 'days',
        effort: 'medium',
        risk: 'low',
        implementation: {
          steps: [
            'Identify deferrable tasks',
            'Implement task scheduling system',
            'Add priority-based queuing',
            'Monitor load balancing'
          ],
          codeChanges: [
            'Create task scheduler',
            'Add priority levels to requests',
            'Implement queue management'
          ],
          testing: [
            'Test task deferral logic',
            'Validate priority handling',
            'Monitor system load'
          ]
        },
        metrics: {
          estimatedMonthlySavings: potentialSavings * 30,
          paybackPeriod: '3-6 weeks',
          riskAssessment: 'Low risk, improves resource utilization'
        }
      });
    }

    return strategies;
  }

  /**
   * Helper methods
   */
  private static extractModelFromMetric(metric: ApiMetric): string {
    if (metric.metadata && typeof metric.metadata === 'object') {
      const metadata = metric.metadata as any;
      if (metadata.model) return metadata.model;
    }
    
    // Extract from endpoint URL
    const endpoint = metric.endpoint.toLowerCase();
    if (endpoint.includes('gpt-4o-mini')) return 'gpt-4o-mini';
    if (endpoint.includes('gpt-4o')) return 'gpt-4o';
    if (endpoint.includes('gpt-4-turbo')) return 'gpt-4-turbo';
    if (endpoint.includes('gpt-4')) return 'gpt-4';
    if (endpoint.includes('gpt-3.5-turbo')) return 'gpt-3.5-turbo';
    
    return 'unknown';
  }

  private static isSimpleTask(responseTimes: number[]): boolean {
    if (responseTimes.length === 0) return false;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return avgResponseTime < 2000; // Under 2 seconds suggests simple tasks
  }

  private static getModelCostReduction(currentModel: string, alternativeModel: string): number {
    const reductions: Record<string, Record<string, number>> = {
      'gpt-4': {
        'gpt-4-turbo': 0.67,
        'gpt-4o': 0.83,
        'gpt-3.5-turbo': 0.95
      },
      'gpt-4-turbo': {
        'gpt-3.5-turbo': 0.83
      }
    };
    
    return reductions[currentModel]?.[alternativeModel] || 0;
  }

  private static analyzeProviderPerformance(metrics: ApiMetric[]): Map<string, {
    totalCost: number;
    requestCount: number;
    costPerRequest: number;
    reliability: number;
    avgResponseTime: number;
  }> {
    const analysis = new Map();
    
    const providerGroups = new Map<string, ApiMetric[]>();
    metrics.forEach(metric => {
      if (!providerGroups.has(metric.providerId)) {
        providerGroups.set(metric.providerId, []);
      }
      providerGroups.get(metric.providerId)!.push(metric);
    });

    providerGroups.forEach((providerMetrics, providerId) => {
      const totalCost = providerMetrics.reduce((sum, m) => sum + CostCalculator.calculateCallCost(m), 0);
      const requestCount = providerMetrics.length;
      const errorCount = providerMetrics.filter(m => m.statusCode >= 400).length;
      const avgResponseTime = providerMetrics
        .filter(m => m.responseTime)
        .reduce((sum, m) => sum + (m.responseTime || 0), 0) / 
        Math.max(providerMetrics.filter(m => m.responseTime).length, 1);

      analysis.set(providerId, {
        totalCost,
        requestCount,
        costPerRequest: totalCost / requestCount,
        reliability: ((requestCount - errorCount) / requestCount) * 100,
        avgResponseTime
      });
    });

    return analysis;
  }

  private static findBatchingOpportunities(metrics: ApiMetric[], patterns: UsagePattern): Array<{
    endpoint: string;
    requestCount: number;
    currentCost: number;
    potentialSavings: number;
  }> {
    const opportunities: Array<{
      endpoint: string;
      requestCount: number;
      currentCost: number;
      potentialSavings: number;
    }> = [];

    const endpointCounts = new Map<string, { count: number; cost: number }>();
    
    // Focus on peak hour metrics
    const peakMetrics = metrics.filter(m => 
      patterns.peakHours.includes(new Date(m.timestamp).getHours())
    );

    peakMetrics.forEach(metric => {
      const cost = CostCalculator.calculateCallCost(metric);
      if (!endpointCounts.has(metric.endpoint)) {
        endpointCounts.set(metric.endpoint, { count: 0, cost: 0 });
      }
      const data = endpointCounts.get(metric.endpoint)!;
      data.count++;
      data.cost += cost;
    });

    endpointCounts.forEach(({ count, cost }, endpoint) => {
      if (count > 20) { // High frequency endpoint
        const potentialSavings = cost * 0.3; // Assume 30% savings from batching
        opportunities.push({
          endpoint,
          requestCount: count,
          currentCost: cost,
          potentialSavings
        });
      }
    });

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  private static calculateRepeatability(metrics: ApiMetric[]): number {
    const requestHashes = new Map<string, number>();
    
    metrics.forEach(metric => {
      const hash = `${metric.method}:${Math.floor((metric.requestSize || 0) / 100)}`;
      requestHashes.set(hash, (requestHashes.get(hash) || 0) + 1);
    });

    const totalRequests = metrics.length;
    const repeatableRequests = Array.from(requestHashes.values())
      .reduce((sum, count) => sum + Math.max(0, count - 1), 0);

    return totalRequests > 0 ? repeatableRequests / totalRequests : 0;
  }

  private static generateCacheImplementation(endpoint: string, strategy: string, ttl: number): string {
    return `Implement ${strategy} caching for ${endpoint} with ${ttl}s TTL`;
  }

  private static getUniqueDays(metrics: ApiMetric[]): number {
    const days = new Set<string>();
    metrics.forEach(metric => {
      days.add(new Date(metric.timestamp).toISOString().split('T')[0]);
    });
    return days.size;
  }

  private static calculateProviderBreakdown(
    metrics: ApiMetric[],
    multiplier: number,
    optimizationStrategies: OptimizationStrategy[]
  ): Array<{
    provider: string;
    currentProjection: number;
    optimizedProjection: number;
    savings: number;
  }> {
    const breakdown: Array<{
      provider: string;
      currentProjection: number;
      optimizedProjection: number;
      savings: number;
    }> = [];

    const providerCosts = new Map<string, number>();
    metrics.forEach(metric => {
      const cost = CostCalculator.calculateCallCost(metric);
      providerCosts.set(
        metric.providerId,
        (providerCosts.get(metric.providerId) || 0) + cost
      );
    });

    const days = this.getUniqueDays(metrics);

    providerCosts.forEach((totalCost, provider) => {
      const dailyCost = totalCost / Math.max(days, 1);
      const currentProjection = dailyCost * multiplier;
      
      // Calculate provider-specific optimizations
      const providerOptimizations = optimizationStrategies.filter(strategy => 
        strategy.id.includes(provider) || strategy.type === 'model_optimization'
      );
      const providerSavings = providerOptimizations.reduce((sum, opt) => sum + opt.savings, 0);
      const dailySavings = providerSavings / Math.max(days, 1);
      
      const optimizedProjection = Math.max(0, currentProjection - (dailySavings * multiplier));
      const savings = currentProjection - optimizedProjection;

      breakdown.push({
        provider,
        currentProjection,
        optimizedProjection,
        savings
      });
    });

    return breakdown.sort((a, b) => b.savings - a.savings);
  }

  private static generateForecastFactors(
    metrics: ApiMetric[],
    optimizationStrategies: OptimizationStrategy[]
  ): string[] {
    const factors: string[] = [];
    
    if (optimizationStrategies.length > 0) {
      factors.push(`${optimizationStrategies.length} optimization strategies available`);
    }
    
    const trends = UsageAnalyzer.analyzeTrends(metrics);
    const growingTrends = trends.filter(t => t.direction === 'increasing');
    if (growingTrends.length > 0) {
      factors.push('Usage growth trends detected');
    }

    const patterns = UsageAnalyzer.identifyPatterns(metrics);
    if (patterns.seasonality.hasPattern) {
      factors.push(`${patterns.seasonality.cycle} seasonality pattern`);
    }

    return factors;
  }

  private static calculateForecastConfidence(
    metrics: ApiMetric[],
    period: 'week' | 'month' | 'quarter' | 'year'
  ): number {
    const days = this.getUniqueDays(metrics);
    const baseConfidence = Math.min(1, days / 30); // Higher confidence with more data
    
    const periodMultipliers = {
      week: 1.0,
      month: 0.9,
      quarter: 0.7,
      year: 0.5
    };

    return baseConfidence * periodMultipliers[period];
  }
}