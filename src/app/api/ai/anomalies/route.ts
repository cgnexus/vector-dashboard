import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MetricsService } from '@/lib/services/metrics.service';
import { AnomalyDetector, AIUtils } from '@/lib/ai';

/**
 * GET /api/ai/anomalies
 * Detect anomalies in API usage patterns
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
    const severity = searchParams.get('severity'); // low, medium, high, critical
    const type = searchParams.get('type'); // cost_spike, usage_spike, error_rate_spike, etc.
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '7');

    // Validate parameters
    if (days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 90' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Get metrics for analysis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { metrics } = await MetricsService.getMetrics({
      userId: session.user.id,
      providerId: providerId || undefined,
      startDate,
      endDate,
      limit: 10000 // Get all metrics for anomaly detection
    });

    if (metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          anomalies: [],
          summary: {
            totalAnomalies: 0,
            bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
            byType: {},
            confidence: 0
          }
        },
        metadata: {
          metricsCount: 0,
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
        }
      });
    }

    // Configure anomaly detector based on data volume
    const detectorConfig = {
      minimumDataPoints: Math.max(5, Math.min(30, Math.floor(metrics.length / 10))),
      confidenceThreshold: 0.6,
      lookbackHours: Math.min(168, days * 24) // Up to 7 days lookback
    };

    const anomalyDetector = new AnomalyDetector(detectorConfig);
    const detectedAnomalies = await anomalyDetector.detectAnomalies(metrics);

    // Filter anomalies based on query parameters
    let filteredAnomalies = detectedAnomalies;

    if (severity) {
      filteredAnomalies = filteredAnomalies.filter(anomaly => 
        anomaly.severity === severity
      );
    }

    if (type) {
      filteredAnomalies = filteredAnomalies.filter(anomaly => 
        anomaly.type === type
      );
    }

    // Limit results
    filteredAnomalies = filteredAnomalies.slice(0, limit);

    // Generate summary statistics
    const summary = {
      totalAnomalies: detectedAnomalies.length,
      bySeverity: {
        low: detectedAnomalies.filter(a => a.severity === 'low').length,
        medium: detectedAnomalies.filter(a => a.severity === 'medium').length,
        high: detectedAnomalies.filter(a => a.severity === 'high').length,
        critical: detectedAnomalies.filter(a => a.severity === 'critical').length
      },
      byType: detectedAnomalies.reduce((acc, anomaly) => {
        acc[anomaly.type] = (acc[anomaly.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      confidence: detectedAnomalies.length > 0 ? 
        detectedAnomalies.reduce((sum, a) => sum + a.confidence, 0) / detectedAnomalies.length : 0
    };

    // Format anomalies for response
    const formattedAnomalies = filteredAnomalies.map(anomaly => ({
      id: anomaly.id,
      type: anomaly.type,
      severity: anomaly.severity,
      title: anomaly.title,
      description: anomaly.description,
      timestamp: anomaly.timestamp,
      value: anomaly.value,
      baseline: anomaly.baseline,
      threshold: anomaly.threshold,
      confidence: anomaly.confidence,
      confidenceLabel: AIUtils.formatConfidence(anomaly.confidence),
      providerId: anomaly.providerId,
      endpoint: anomaly.endpoint,
      metadata: anomaly.metadata,
      recommendations: anomaly.recommendations,
      formattedValue: this.formatAnomalyValue(anomaly),
      severityColor: AIUtils.getSeverityColor(anomaly.severity)
    }));

    return NextResponse.json({
      success: true,
      data: {
        anomalies: formattedAnomalies,
        summary
      },
      metadata: {
        metricsCount: metrics.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        filters: {
          providerId: providerId || 'all',
          severity: severity || 'all',
          type: type || 'all',
          limit
        },
        detectorConfig,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error detecting anomalies:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to detect anomalies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }

/**
 * Format anomaly values for display
 */
function formatAnomalyValue(anomaly: { type: string; value: number }): string {
    switch (anomaly.type) {
      case 'cost_spike':
        return AIUtils.formatCost(anomaly.value);
      case 'usage_spike':
        return `${anomaly.value} requests`;
      case 'response_time_spike':
        return `${Math.round(anomaly.value)}ms`;
      case 'error_rate_spike':
        return `${anomaly.value.toFixed(1)}%`;
      case 'token_efficiency_drop':
        return `${anomaly.value.toFixed(2)} ratio`;
      default:
        return anomaly.value.toString();
    }
  }
}

/**
 * POST /api/ai/anomalies/acknowledge
 * Acknowledge an anomaly (mark as seen/handled)
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
    const { anomalyId, action, comment } = body;

    // Validate input
    if (!anomalyId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: anomalyId, action' },
        { status: 400 }
      );
    }

    const validActions = ['acknowledged', 'investigating', 'resolved', 'false_positive'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Store acknowledgment
    const acknowledgment = {
      userId: session.user.id,
      anomalyId,
      action,
      comment: comment || '',
      timestamp: new Date()
    };

    // TODO: Implement anomaly acknowledgment storage
    // await AnomalyService.acknowledgeAnomaly(acknowledgment);
    
    console.log('Anomaly acknowledgment:', acknowledgment);

    return NextResponse.json({
      success: true,
      message: `Anomaly ${action} successfully`,
      data: acknowledgment
    });

  } catch (error) {
    console.error('Error acknowledging anomaly:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to acknowledge anomaly',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}