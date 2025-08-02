import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MetricsService } from '@/lib/services/metrics.service';
import { AIOrchestrator, AIUtils } from '@/lib/ai';

/**
 * GET /api/ai/insights
 * Generate AI-powered insights for the dashboard
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
    const days = parseInt(searchParams.get('days') || '30');
    const insightType = searchParams.get('type') || 'full'; // full, quick, optimization

    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Get metrics for the specified period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metricsQuery = {
      userId: session.user.id,
      providerId: providerId || undefined,
      startDate,
      endDate,
      limit: 10000 // Get all metrics for AI analysis
    };

    const { metrics } = await MetricsService.getMetrics(metricsQuery);

    // Validate data quality
    const dataQuality = AIUtils.validateMetricsQuality(metrics);
    
    if (!dataQuality.isValid && insightType === 'full') {
      return NextResponse.json({
        success: false,
        dataQuality,
        insights: null
      });
    }

    let insights;

    switch (insightType) {
      case 'quick':
        // Quick anomaly check for real-time alerts
        const recentMetrics = metrics.filter(m => 
          new Date().getTime() - new Date(m.timestamp).getTime() < 60 * 60 * 1000 // Last hour
        );
        const quickAnomalies = await AIOrchestrator.quickAnomalyCheck(recentMetrics);
        
        insights = {
          type: 'quick',
          anomalies: quickAnomalies,
          dataQuality
        };
        break;

      case 'optimization':
        // Cost optimization analysis
        const optimizationPotential = await AIOrchestrator.calculateOptimizationPotential(metrics);
        
        insights = {
          type: 'optimization',
          ...optimizationPotential,
          dataQuality
        };
        break;

      case 'full':
      default:
        // Full dashboard insights
        const fullInsights = await AIOrchestrator.generateDashboardInsights(
          metrics,
          session.user.id
        );
        
        insights = {
          type: 'full',
          ...fullInsights,
          dataQuality
        };
        break;
    }

    return NextResponse.json({
      success: true,
      insights,
      metadata: {
        metricsCount: metrics.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        providerId: providerId || 'all',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating AI insights:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/insights/feedback
 * Collect feedback on AI insights to improve recommendations
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
    const { insightId, insightType, feedback, rating, comment } = body;

    // Validate feedback data
    if (!insightId || !insightType || !feedback) {
      return NextResponse.json(
        { error: 'Missing required feedback fields' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Store feedback for future model improvements
    // In a production system, this would go to a feedback collection service
    const feedbackData = {
      userId: session.user.id,
      insightId,
      insightType,
      feedback, // 'helpful', 'not_helpful', 'incorrect', 'implemented'
      rating,
      comment,
      timestamp: new Date()
    };

    console.log('AI Insight Feedback:', feedbackData);

    // TODO: Implement feedback storage and analysis
    // await FeedbackService.storeFeedback(feedbackData);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to record feedback'
      },
      { status: 500 }
    );
  }
}