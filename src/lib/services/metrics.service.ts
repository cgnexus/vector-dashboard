import { db } from '@/db';
import { apiMetrics, apiKeys, apiProviders, type ApiMetric } from '@/db/schema';
import { and, eq, desc, count, sql, gte, lte, between } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';

export interface CreateMetricData {
  providerId: string;
  userId: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime?: number;
  requestSize?: number;
  responseSize?: number;
  cost?: number;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface MetricsQuery {
  userId: string;
  providerId?: string;
  apiKeyId?: string;
  startDate?: Date;
  endDate?: Date;
  statusCode?: number;
  endpoint?: string;
  page?: number;
  limit?: number;
}

export interface MetricsAggregation {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  uniqueEndpoints: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  cost: number;
  tokens: number;
  averageResponseTime: number;
  errorCount: number;
}

export class MetricsService {
  // Ingest new metric
  static async ingest(data: CreateMetricData): Promise<ApiMetric> {
    return await withTransaction(async (tx) => {
      // Verify provider exists
      const provider = await tx
        .select()
        .from(apiProviders)
        .where(eq(apiProviders.id, data.providerId))
        .limit(1);

      if (!provider.length) {
        throw new Error('Provider not found');
      }

      // Verify API key exists and belongs to user (if provided)
      if (data.apiKeyId) {
        const apiKey = await tx
          .select()
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.id, data.apiKeyId),
              eq(apiKeys.userId, data.userId),
              eq(apiKeys.isActive, true)
            )
          )
          .limit(1);

        if (!apiKey.length) {
          throw new Error('API key not found or inactive');
        }
      }

      const newMetric: typeof apiMetrics.$inferInsert = {
        id: generateId('metric'),
        providerId: data.providerId,
        userId: data.userId,
        apiKeyId: data.apiKeyId || null,
        endpoint: data.endpoint,
        method: data.method.toUpperCase(),
        statusCode: data.statusCode,
        responseTime: data.responseTime || null,
        requestSize: data.requestSize || null,
        responseSize: data.responseSize || null,
        cost: data.cost?.toString() || null,
        tokens: data.tokens || null,
        metadata: data.metadata || null,
        timestamp: data.timestamp || new Date()
      };

      const [created] = await tx
        .insert(apiMetrics)
        .values(newMetric)
        .returning();

      return created;
    });
  }

  // Bulk ingest metrics (for high-throughput scenarios)
  static async bulkIngest(metrics: CreateMetricData[]): Promise<ApiMetric[]> {
    return await withTransaction(async (tx) => {
      const metricsToInsert = metrics.map(data => ({
        id: generateId('metric'),
        providerId: data.providerId,
        userId: data.userId,
        apiKeyId: data.apiKeyId || null,
        endpoint: data.endpoint,
        method: data.method.toUpperCase(),
        statusCode: data.statusCode,
        responseTime: data.responseTime || null,
        requestSize: data.requestSize || null,
        responseSize: data.responseSize || null,
        cost: data.cost?.toString() || null,
        tokens: data.tokens || null,
        metadata: data.metadata || null,
        timestamp: data.timestamp || new Date()
      }));

      const created = await tx
        .insert(apiMetrics)
        .values(metricsToInsert)
        .returning();

      return created;
    });
  }

  // Get metrics with filtering and pagination
  static async getMetrics(query: MetricsQuery): Promise<{
    metrics: ApiMetric[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      userId, 
      providerId, 
      apiKeyId, 
      startDate, 
      endDate, 
      statusCode, 
      endpoint,
      page = 1, 
      limit = 50 
    } = query;
    
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(apiMetrics.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }
    
    if (apiKeyId) {
      conditions.push(eq(apiMetrics.apiKeyId, apiKeyId));
    }
    
    if (statusCode) {
      conditions.push(eq(apiMetrics.statusCode, statusCode));
    }
    
    if (endpoint) {
      conditions.push(sql`${apiMetrics.endpoint} ILIKE ${`%${endpoint}%`}`);
    }
    
    if (startDate && endDate) {
      conditions.push(between(apiMetrics.timestamp, startDate, endDate));
    } else if (startDate) {
      conditions.push(gte(apiMetrics.timestamp, startDate));
    } else if (endDate) {
      conditions.push(lte(apiMetrics.timestamp, endDate));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiMetrics)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results
    const metrics = await db
      .select()
      .from(apiMetrics)
      .where(whereClause)
      .orderBy(desc(apiMetrics.timestamp))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      metrics,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get aggregated metrics
  static async getAggregatedMetrics(
    userId: string,
    providerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MetricsAggregation> {
    const conditions = [eq(apiMetrics.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }
    
    if (startDate && endDate) {
      conditions.push(between(apiMetrics.timestamp, startDate, endDate));
    } else if (startDate) {
      conditions.push(gte(apiMetrics.timestamp, startDate));
    } else if (endDate) {
      conditions.push(lte(apiMetrics.timestamp, endDate));
    }

    const whereClause = and(...conditions);

    const [result] = await db
      .select({
        totalRequests: count(),
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(CAST(${apiMetrics.tokens}->>'total' AS INTEGER)), 0)`,
        averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
        errorCount: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`,
        uniqueEndpoints: sql<number>`COUNT(DISTINCT ${apiMetrics.endpoint})`
      })
      .from(apiMetrics)
      .where(whereClause);

    const errorRate = result.totalRequests > 0 ? (result.errorCount / result.totalRequests) * 100 : 0;
    const successRate = 100 - errorRate;

    return {
      totalRequests: result.totalRequests,
      totalCost: result.totalCost,
      totalTokens: result.totalTokens,
      averageResponseTime: result.averageResponseTime,
      errorRate,
      successRate,
      uniqueEndpoints: result.uniqueEndpoints
    };
  }

  // Get time series data
  static async getTimeSeriesData(
    userId: string,
    interval: 'hour' | 'day' | 'week' = 'hour',
    providerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeSeriesPoint[]> {
    const conditions = [eq(apiMetrics.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }
    
    if (startDate && endDate) {
      conditions.push(between(apiMetrics.timestamp, startDate, endDate));
    }

    const whereClause = and(...conditions);

    // SQL for different time intervals
    const dateFormat = {
      hour: "date_trunc('hour', timestamp)",
      day: "date_trunc('day', timestamp)",
      week: "date_trunc('week', timestamp)"
    }[interval];

    const results = await db.execute(sql`
      SELECT 
        ${sql.raw(dateFormat)} as timestamp,
        COUNT(*) as requests,
        COALESCE(SUM(CAST(cost AS NUMERIC)), 0) as cost,
        COALESCE(SUM(CAST(tokens->>'total' AS INTEGER)), 0) as tokens,
        COALESCE(AVG(response_time), 0) as average_response_time,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
      FROM api_metrics
      WHERE ${whereClause}
      GROUP BY ${sql.raw(dateFormat)}
      ORDER BY timestamp ASC
    `);

    return results.rows.map(row => ({
      timestamp: row.timestamp,
      requests: parseInt(row.requests),
      cost: parseFloat(row.cost),
      tokens: parseInt(row.tokens),
      averageResponseTime: parseFloat(row.average_response_time),
      errorCount: parseInt(row.error_count)
    }));
  }

  // Get provider performance comparison
  static async getProviderComparison(
    userId: string,
    providerIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    providerId: string;
    providerName: string;
    requests: number;
    cost: number;
    averageResponseTime: number;
    errorRate: number;
    reliability: number;
    totalTokens: number;
  }>> {
    return await Promise.all(
      providerIds.map(async (providerId) => {
        const conditions = [
          eq(apiMetrics.userId, userId),
          eq(apiMetrics.providerId, providerId)
        ];
        
        if (startDate && endDate) {
          conditions.push(between(apiMetrics.timestamp, startDate, endDate));
        } else if (startDate) {
          conditions.push(gte(apiMetrics.timestamp, startDate));
        } else if (endDate) {
          conditions.push(lte(apiMetrics.timestamp, endDate));
        }

        const whereClause = and(...conditions);

        const [metrics] = await db
          .select({
            requests: count(),
            cost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`,
            averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
            errorCount: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`,
            totalTokens: sql<number>`COALESCE(SUM(CAST(${apiMetrics.tokens}->>'total' AS INTEGER)), 0)`
          })
          .from(apiMetrics)
          .where(whereClause);

        const [provider] = await db
          .select({ name: apiProviders.displayName })
          .from(apiProviders)
          .where(eq(apiProviders.id, providerId))
          .limit(1);

        const errorRate = metrics.requests > 0 ? (metrics.errorCount / metrics.requests) * 100 : 0;
        const reliability = Math.max(0, 100 - errorRate);

        return {
          providerId,
          providerName: provider?.name || 'Unknown Provider',
          requests: metrics.requests,
          cost: metrics.cost,
          averageResponseTime: metrics.averageResponseTime,
          errorRate,
          reliability,
          totalTokens: metrics.totalTokens
        };
      })
    );
  }

  // Get real-time metrics (last 5 minutes)
  static async getRealTimeMetrics(
    userId: string,
    providerId?: string
  ): Promise<{
    currentRPS: number; // requests per second
    currentErrorRate: number;
    currentResponseTime: number;
    activeEndpoints: number;
    recentRequests: ApiMetric[];
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, fiveMinutesAgo)
    ];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const whereClause = and(...conditions);

    // Get metrics for last 5 minutes
    const [realtimeStats] = await db
      .select({
        totalRequests: count(),
        errorCount: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`,
        averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
        uniqueEndpoints: sql<number>`COUNT(DISTINCT ${apiMetrics.endpoint})`
      })
      .from(apiMetrics)
      .where(whereClause);

    // Calculate RPS (requests per second)
    const currentRPS = realtimeStats.totalRequests / 300; // 5 minutes = 300 seconds
    const currentErrorRate = realtimeStats.totalRequests > 0 
      ? (realtimeStats.errorCount / realtimeStats.totalRequests) * 100 
      : 0;

    // Get recent requests for real-time feed
    const recentRequests = await db
      .select()
      .from(apiMetrics)
      .where(whereClause)
      .orderBy(desc(apiMetrics.timestamp))
      .limit(10);

    return {
      currentRPS,
      currentErrorRate,
      currentResponseTime: realtimeStats.averageResponseTime,
      activeEndpoints: realtimeStats.uniqueEndpoints,
      recentRequests
    };
  }

  // Get cost optimization insights
  static async getCostOptimizationInsights(
    userId: string,
    providerId?: string,
    days: number = 30
  ): Promise<{
    totalCost: number;
    potentialSavings: number;
    recommendations: Array<{
      type: 'high_cost_endpoint' | 'inefficient_calls' | 'unused_features';
      title: string;
      description: string;
      potentialSavings: number;
      action: string;
    }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, startDate)
    ];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const whereClause = and(...conditions);

    // Get total cost
    const [costData] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
      })
      .from(apiMetrics)
      .where(whereClause);

    // Find high-cost endpoints
    const highCostEndpoints = await db.execute(sql`
      SELECT 
        endpoint,
        COUNT(*) as requests,
        COALESCE(SUM(CAST(cost AS NUMERIC)), 0) as total_cost,
        COALESCE(AVG(CAST(cost AS NUMERIC)), 0) as avg_cost_per_request
      FROM api_metrics
      WHERE ${whereClause}
      GROUP BY endpoint
      HAVING COALESCE(SUM(CAST(cost AS NUMERIC)), 0) > ${costData.totalCost * 0.1}
      ORDER BY total_cost DESC
      LIMIT 5
    `);

    // Find endpoints with high error rates (wasted costs)
    const inefficientEndpoints = await db.execute(sql`
      SELECT 
        endpoint,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
        COALESCE(SUM(CASE WHEN status_code >= 400 THEN CAST(cost AS NUMERIC) END), 0) as wasted_cost
      FROM api_metrics
      WHERE ${whereClause}
      GROUP BY endpoint
      HAVING COUNT(*) >= 10 AND (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) > 20
      ORDER BY wasted_cost DESC
      LIMIT 3
    `);

    const recommendations = [];
    let potentialSavings = 0;

    // High cost endpoint recommendations
    for (const endpoint of highCostEndpoints.rows) {
      const savings = parseFloat(endpoint.total_cost) * 0.2; // Assume 20% savings possible
      potentialSavings += savings;
      
      recommendations.push({
        type: 'high_cost_endpoint' as const,
        title: `Optimize high-cost endpoint: ${endpoint.endpoint}`,
        description: `This endpoint accounts for $${parseFloat(endpoint.total_cost).toFixed(2)} (${((parseFloat(endpoint.total_cost) / costData.totalCost) * 100).toFixed(1)}%) of your total costs`,
        potentialSavings: savings,
        action: 'Consider caching responses, optimizing queries, or reducing request frequency'
      });
    }

    // Inefficient calls recommendations
    for (const endpoint of inefficientEndpoints.rows) {
      const savings = parseFloat(endpoint.wasted_cost);
      potentialSavings += savings;
      
      recommendations.push({
        type: 'inefficient_calls' as const,
        title: `Fix high error rate: ${endpoint.endpoint}`,
        description: `${((parseInt(endpoint.error_requests) / parseInt(endpoint.total_requests)) * 100).toFixed(1)}% error rate is wasting $${savings.toFixed(2)}`,
        potentialSavings: savings,
        action: 'Investigate and fix the root cause of errors to avoid wasted API calls'
      });
    }

    return {
      totalCost: costData.totalCost,
      potentialSavings,
      recommendations
    };
  }

  // Get API health score
  static async getHealthScore(
    userId: string,
    providerId?: string
  ): Promise<{
    overallScore: number;
    scores: {
      availability: number;
      performance: number;
      reliability: number;
      cost: number;
    };
    factors: Array<{
      factor: string;
      score: number;
      weight: number;
      description: string;
    }>;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, last24Hours)
    ];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const whereClause = and(...conditions);

    const [healthMetrics] = await db
      .select({
        totalRequests: count(),
        errorRequests: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`,
        slowRequests: sql<number>`COUNT(CASE WHEN ${apiMetrics.responseTime} > 5000 THEN 1 END)`,
        averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
      })
      .from(apiMetrics)
      .where(whereClause);

    // Calculate individual scores (0-100)
    const availability = healthMetrics.totalRequests > 0 
      ? Math.max(0, 100 - (healthMetrics.errorRequests / healthMetrics.totalRequests) * 100)
      : 100;
    
    const performance = healthMetrics.averageResponseTime <= 1000 ? 100 :
                       healthMetrics.averageResponseTime <= 3000 ? 80 :
                       healthMetrics.averageResponseTime <= 5000 ? 60 :
                       healthMetrics.averageResponseTime <= 10000 ? 40 : 20;
    
    const reliability = healthMetrics.totalRequests > 0
      ? Math.max(0, 100 - (healthMetrics.slowRequests / healthMetrics.totalRequests) * 100)
      : 100;

    // Cost score based on efficiency (simple heuristic)
    const avgCostPerRequest = healthMetrics.totalRequests > 0 
      ? healthMetrics.totalCost / healthMetrics.totalRequests 
      : 0;
    const cost = avgCostPerRequest <= 0.01 ? 100 :
                avgCostPerRequest <= 0.05 ? 80 :
                avgCostPerRequest <= 0.1 ? 60 :
                avgCostPerRequest <= 0.5 ? 40 : 20;

    const factors = [
      {
        factor: 'Availability',
        score: availability,
        weight: 0.3,
        description: 'Percentage of successful requests'
      },
      {
        factor: 'Performance',
        score: performance,
        weight: 0.25,
        description: 'Average response time performance'
      },
      {
        factor: 'Reliability',
        score: reliability,
        weight: 0.25,
        description: 'Consistency of response times'
      },
      {
        factor: 'Cost Efficiency',
        score: cost,
        weight: 0.2,
        description: 'Cost per request efficiency'
      }
    ];

    const overallScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0
    );

    return {
      overallScore: Math.round(overallScore),
      scores: {
        availability: Math.round(availability),
        performance: Math.round(performance),
        reliability: Math.round(reliability),
        cost: Math.round(cost)
      },
      factors
    };
  }

  // Get top endpoints by usage
  static async getTopEndpoints(
    userId: string,
    limit: number = 10,
    providerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    endpoint: string;
    requests: number;
    cost: number;
    averageResponseTime: number;
    errorRate: number;
  }>> {
    const conditions = [eq(apiMetrics.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }
    
    if (startDate && endDate) {
      conditions.push(between(apiMetrics.timestamp, startDate, endDate));
    }

    const whereClause = and(...conditions);

    const results = await db.execute(sql`
      SELECT 
        endpoint,
        COUNT(*) as requests,
        COALESCE(SUM(CAST(cost AS NUMERIC)), 0) as cost,
        COALESCE(AVG(response_time), 0) as average_response_time,
        ROUND((COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)), 2) as error_rate
      FROM api_metrics
      WHERE ${whereClause}
      GROUP BY endpoint
      ORDER BY requests DESC
      LIMIT ${limit}
    `);

    return results.rows.map(row => ({
      endpoint: row.endpoint,
      requests: parseInt(row.requests),
      cost: parseFloat(row.cost),
      averageResponseTime: parseFloat(row.average_response_time),
      errorRate: parseFloat(row.error_rate)
    }));
  }

  // Get recent errors
  static async getRecentErrors(
    userId: string,
    limit: number = 10,
    providerId?: string
  ): Promise<ApiMetric[]> {
    const conditions = [
      eq(apiMetrics.userId, userId),
      sql`${apiMetrics.statusCode} >= 400`
    ];
    
    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const whereClause = and(...conditions);

    return await db
      .select()
      .from(apiMetrics)
      .where(whereClause)
      .orderBy(desc(apiMetrics.timestamp))
      .limit(limit);
  }

  // Delete old metrics (for data retention)
  static async deleteOldMetrics(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(apiMetrics)
      .where(lte(apiMetrics.timestamp, cutoffDate));

    return result.rowCount || 0;
  }
}