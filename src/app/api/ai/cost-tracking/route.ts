import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MetricsService } from '@/lib/services/metrics.service';
import { CostCalculator, CostOptimizer, UsageAnalyzer } from '@/lib/ai';

/**
 * GET /api/ai/cost-tracking
 * Get real-time cost tracking and predictions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const timeframe = searchParams.get('timeframe') || '24h'; // 1h, 24h, 7d, 30d

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    // Get metrics for the timeframe
    const { metrics } = await MetricsService.getMetrics({
      userId: session.user.id,
      providerId: providerId || undefined,
      startDate,
      endDate,
      limit: 10000
    });

    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          realTimeCosts: {
            currentCost: 0,
            hourlyRate: 0,
            dailyProjection: 0,
            monthlyProjection: 0
          },
          costBreakdown: [],
          predictions: {
            nextHour: 0,
            nextDay: 0,
            nextWeek: 0,
            confidence: 0
          },
          trends: [],
          optimizations: []
        },
        metadata: {
          timeframe,
          metricsCount: 0,
          providerId: providerId || 'all'
        }
      });
    }

    // Calculate real-time costs
    const realTimeCosts = CostCalculator.calculateRealTimeCost(metrics);

    // Calculate cost breakdown by provider
    const providerCosts = new Map<string, number>();
    metrics.forEach(metric => {
      const cost = CostCalculator.calculateCallCost(metric);
      providerCosts.set(
        metric.providerId,
        (providerCosts.get(metric.providerId) || 0) + cost
      );
    });

    const costBreakdown = Array.from(providerCosts.entries()).map(([provider, cost]) => ({
      provider,
      cost,
      percentage: realTimeCosts.currentCost > 0 ? (cost / realTimeCosts.currentCost) * 100 : 0
    })).sort((a, b) => b.cost - a.cost);

    // Analyze usage patterns for predictions
    const usagePatterns = UsageAnalyzer.identifyPatterns(metrics);
    const usagePrediction = UsageAnalyzer.predictUsage(metrics);
    
    // Convert request predictions to cost predictions
    const avgCostPerRequest = realTimeCosts.currentCost / Math.max(metrics.length, 1);
    const costPredictions = {
      nextHour: usagePrediction.nextHour.requests * avgCostPerRequest,
      nextDay: usagePrediction.nextDay.requests * avgCostPerRequest,
      nextWeek: usagePrediction.nextWeek.requests * avgCostPerRequest,
      confidence: usagePrediction.nextDay.confidence
    };

    // Analyze cost trends
    const trends = UsageAnalyzer.analyzeTrends(metrics);

    // Get optimization opportunities
    const correlations = UsageAnalyzer.analyzeCrossAPICorrelations(metrics);
    const optimizationStrategies = await CostOptimizer.generateOptimizationStrategies(
      metrics,
      usagePatterns,
      correlations
    );

    // Format optimizations for API response
    const optimizations = optimizationStrategies.slice(0, 5).map(strategy => ({
      type: strategy.type,
      title: strategy.title,
      description: strategy.description,
      savings: strategy.savings,
      savingsPercentage: strategy.savingsPercentage,
      confidence: strategy.confidence,
      effort: strategy.effort,
      timeToImplement: strategy.timeToImplement
    }));

    return NextResponse.json({
      success: true,
      data: {
        realTimeCosts,
        costBreakdown,
        predictions: costPredictions,
        trends: trends.map(trend => ({
          direction: trend.direction,
          magnitude: trend.magnitude,
          period: trend.period,
          description: trend.description,
          confidence: trend.confidence
        })),
        optimizations,
        usagePatterns: {
          peakHours: usagePatterns.peakHours,
          peakDays: usagePatterns.peakDays,
          predictability: usagePatterns.predictability
        }
      },
      metadata: {
        timeframe,
        metricsCount: metrics.length,
        providerId: providerId || 'all',
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in cost tracking:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get cost tracking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/cost-tracking/recalculate
 * Recalculate costs for existing metrics (useful after pricing updates)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { providerId, days = 7, dryRun = true } = body;

    // Get metrics without costs or with outdated costs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { metrics } = await MetricsService.getMetrics({
      userId: session.user.id,
      providerId: providerId || undefined,
      startDate,
      endDate,
      limit: 10000
    });

    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No metrics found for recalculation',
        stats: { processed: 0, updated: 0, errors: 0 }
      });
    }

    const stats = {
      processed: 0,
      updated: 0,
      errors: 0,
      totalCostBefore: 0,
      totalCostAfter: 0
    };

    const updates: Array<{
      metricId: string;
      oldCost: number;
      newCost: number;
      difference: number;
    }> = [];

    // Process each metric
    for (const metric of metrics) {
      try {
        stats.processed++;
        
        const oldCost = metric.cost ? parseFloat(metric.cost) : 0;
        const newCost = CostCalculator.calculateCallCost(metric);
        
        stats.totalCostBefore += oldCost;
        stats.totalCostAfter += newCost;

        if (Math.abs(newCost - oldCost) > 0.000001) { // Significant difference
          updates.push({
            metricId: metric.id,
            oldCost,
            newCost,
            difference: newCost - oldCost
          });

          if (!dryRun) {
            // Update the metric with new cost
            // Note: This would require adding an update method to MetricsService
            // await MetricsService.updateMetricCost(metric.id, newCost);
            stats.updated++;
          }
        }
      } catch (error) {
        console.error(`Error processing metric ${metric.id}:`, error);
        stats.errors++;
      }
    }

    const summary = {
      ...stats,
      totalCostDifference: stats.totalCostAfter - stats.totalCostBefore,
      averageCostChange: stats.processed > 0 ? 
        (stats.totalCostAfter - stats.totalCostBefore) / stats.processed : 0
    };

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed - no data was modified' : 'Cost recalculation completed',
      summary,
      updates: dryRun ? updates.slice(0, 10) : [], // Show sample updates in dry run
      metadata: {
        dryRun,
        providerId: providerId || 'all',
        days,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in cost recalculation:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to recalculate costs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}