import { db } from '@/db';
import { apiProviders, apiKeys, apiMetrics, type ApiProvider } from '@/db/schema';
import { and, eq, desc, count, sql } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';

export interface CreateProviderData {
  name: string;
  displayName: string;
  description?: string;
  baseUrl?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateProviderData {
  displayName?: string;
  description?: string;
  baseUrl?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface ProviderWithStats extends ApiProvider {
  stats: {
    totalApiKeys: number;
    activeApiKeys: number;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
    lastRequest?: Date;
  };
}

export interface ProviderListQuery {
  status?: 'active' | 'inactive' | 'maintenance';
  search?: string;
  userId?: string; // For user-specific stats
  page?: number;
  limit?: number;
}

export class ProvidersService {
  // Create new provider (admin only)
  static async create(data: CreateProviderData): Promise<ApiProvider> {
    return await withTransaction(async (tx) => {
      // Check if provider name already exists
      const existing = await tx
        .select()
        .from(apiProviders)
        .where(eq(apiProviders.name, data.name))
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Provider with this name already exists');
      }

      const newProvider: typeof apiProviders.$inferInsert = {
        id: generateId('provider'),
        name: data.name,
        displayName: data.displayName,
        description: data.description || null,
        baseUrl: data.baseUrl || null,
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await tx
        .insert(apiProviders)
        .values(newProvider)
        .returning();

      return created;
    });
  }

  // Get all providers with optional filtering
  static async getAll(query: ProviderListQuery = {}): Promise<{
    providers: ProviderWithStats[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, search, userId, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    // Build where conditions for providers
    const conditions = [];
    
    if (status) {
      conditions.push(eq(apiProviders.status, status));
    }
    
    if (search) {
      conditions.push(
        sql`${apiProviders.displayName} ILIKE ${`%${search}%`} OR ${apiProviders.description} ILIKE ${`%${search}%`}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiProviders)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated providers
    const providers = await db
      .select()
      .from(apiProviders)
      .where(whereClause)
      .orderBy(desc(apiProviders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats for each provider
    const providersWithStats: ProviderWithStats[] = await Promise.all(
      providers.map(async (provider) => {
        const stats = await this.getProviderStats(provider.id, userId);
        return {
          ...provider,
          stats
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      providers: providersWithStats,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get single provider with stats
  static async getById(id: string, userId?: string): Promise<ProviderWithStats | null> {
    const [provider] = await db
      .select()
      .from(apiProviders)
      .where(eq(apiProviders.id, id))
      .limit(1);

    if (!provider) {
      return null;
    }

    const stats = await this.getProviderStats(id, userId);

    return {
      ...provider,
      stats
    };
  }

  // Update provider (admin only)
  static async update(id: string, data: UpdateProviderData): Promise<ApiProvider | null> {
    return await withTransaction(async (tx) => {
      const existing = await tx
        .select()
        .from(apiProviders)
        .where(eq(apiProviders.id, id))
        .limit(1);

      if (!existing.length) {
        return null;
      }

      const [updated] = await tx
        .update(apiProviders)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(apiProviders.id, id))
        .returning();

      return updated;
    });
  }

  // Delete provider (admin only, cascade checks)
  static async delete(id: string): Promise<boolean> {
    return await withTransaction(async (tx) => {
      // Check if provider has associated API keys
      const [keyCount] = await tx
        .select({ count: count() })
        .from(apiKeys)
        .where(eq(apiKeys.providerId, id));

      if (keyCount.count > 0) {
        throw new Error('Cannot delete provider with associated API keys');
      }

      // Check if provider has metrics
      const [metricCount] = await tx
        .select({ count: count() })
        .from(apiMetrics)
        .where(eq(apiMetrics.providerId, id));

      if (metricCount.count > 0) {
        throw new Error('Cannot delete provider with historical metrics');
      }

      const result = await tx
        .delete(apiProviders)
        .where(eq(apiProviders.id, id));

      return (result.rowCount || 0) > 0;
    });
  }

  // Get provider health status
  static async getProviderHealth(
    providerId: string,
    userId?: string
  ): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    lastCheck: Date;
    incidents: Array<{
      timestamp: Date;
      type: 'outage' | 'slow_response' | 'high_error_rate';
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build conditions
    const conditions = [
      eq(apiMetrics.providerId, providerId),
      sql`${apiMetrics.timestamp} >= ${last24Hours.toISOString()}`
    ];
    
    if (userId) {
      conditions.push(eq(apiMetrics.userId, userId));
    }

    const whereClause = and(...conditions);

    // Get health metrics for the last 24 hours
    const [healthMetrics] = await db
      .select({
        totalRequests: count(),
        averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
        errorRate: sql<number>`ROUND((COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END) * 100.0 / COUNT(*)), 2)`,
        slowRequests: sql<number>`COUNT(CASE WHEN ${apiMetrics.responseTime} > 5000 THEN 1 END)`, // > 5 seconds
        lastRequest: sql<Date>`MAX(${apiMetrics.timestamp})`
      })
      .from(apiMetrics)
      .where(whereClause);

    // Calculate status based on metrics
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    
    if (healthMetrics.totalRequests === 0) {
      status = 'down';
    } else if (healthMetrics.errorRate > 50 || healthMetrics.averageResponseTime > 10000) {
      status = 'down';
    } else if (healthMetrics.errorRate > 10 || healthMetrics.averageResponseTime > 2000) {
      status = 'degraded';
    }

    // Calculate uptime (simplified - based on error rate)
    const uptime = Math.max(0, 100 - healthMetrics.errorRate);

    // Get recent incidents (high error rates, slow responses)
    const incidents = await db
      .select({
        timestamp: apiMetrics.timestamp,
        statusCode: apiMetrics.statusCode,
        responseTime: apiMetrics.responseTime,
        endpoint: apiMetrics.endpoint
      })
      .from(apiMetrics)
      .where(
        and(
          eq(apiMetrics.providerId, providerId),
          sql`${apiMetrics.timestamp} >= ${last24Hours.toISOString()}`,
          sql`(${apiMetrics.statusCode} >= 500 OR ${apiMetrics.responseTime} > 10000)`
        )
      )
      .orderBy(desc(apiMetrics.timestamp))
      .limit(10);

    const processedIncidents = incidents.map(incident => ({
      timestamp: incident.timestamp,
      type: incident.statusCode >= 500 ? 'outage' : 'slow_response' as const,
      severity: incident.statusCode >= 500 ? 'high' : (incident.responseTime! > 30000 ? 'high' : 'medium') as const,
      description: incident.statusCode >= 500 
        ? `Server error (${incident.statusCode}) on ${incident.endpoint}`
        : `Slow response (${incident.responseTime}ms) on ${incident.endpoint}`
    }));

    return {
      status,
      uptime,
      averageResponseTime: healthMetrics.averageResponseTime,
      errorRate: healthMetrics.errorRate,
      lastCheck: new Date(),
      incidents: processedIncidents
    };
  }

  // Get provider statistics
  private static async getProviderStats(
    providerId: string,
    userId?: string
  ): Promise<ProviderWithStats['stats']> {
    // const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get API key stats
    const keyConditions = [eq(apiKeys.providerId, providerId)];
    if (userId) {
      keyConditions.push(eq(apiKeys.userId, userId));
    }

    const [keyStats] = await db
      .select({
        totalApiKeys: count(),
        activeApiKeys: count(sql`CASE WHEN ${apiKeys.isActive} = true THEN 1 END`)
      })
      .from(apiKeys)
      .where(and(...keyConditions));

    // Get metrics stats
    const metricConditions = [eq(apiMetrics.providerId, providerId)];
    if (userId) {
      metricConditions.push(eq(apiMetrics.userId, userId));
    }

    const [metricStats] = await db
      .select({
        totalRequests: count(),
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`,
        averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
        errorCount: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`,
        lastRequest: sql<Date>`MAX(${apiMetrics.timestamp})`
      })
      .from(apiMetrics)
      .where(and(...metricConditions));

    const errorRate = metricStats.totalRequests > 0 
      ? (metricStats.errorCount / metricStats.totalRequests) * 100 
      : 0;

    return {
      totalApiKeys: keyStats.totalApiKeys,
      activeApiKeys: keyStats.activeApiKeys,
      totalRequests: metricStats.totalRequests,
      totalCost: metricStats.totalCost,
      averageResponseTime: metricStats.averageResponseTime,
      errorRate,
      lastRequest: metricStats.lastRequest
    };
  }

  // Get trending providers (by usage)
  static async getTrendingProviders(
    limit: number = 5,
    userId?: string
  ): Promise<Array<{
    provider: ApiProvider;
    requestsThisWeek: number;
    requestsLastWeek: number;
    growth: number;
  }>> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const providers = await db
      .select()
      .from(apiProviders)
      .where(eq(apiProviders.status, 'active'));

    const trending = await Promise.all(
      providers.map(async (provider) => {
        const conditions = [eq(apiMetrics.providerId, provider.id)];
        if (userId) {
          conditions.push(eq(apiMetrics.userId, userId));
        }

        // Get this week's requests
        const [thisWeek] = await db
          .select({ count: count() })
          .from(apiMetrics)
          .where(
            and(
              ...conditions,
              sql`${apiMetrics.timestamp} >= ${oneWeekAgo.toISOString()}`
            )
          );

        // Get last week's requests
        const [lastWeek] = await db
          .select({ count: count() })
          .from(apiMetrics)
          .where(
            and(
              ...conditions,
              sql`${apiMetrics.timestamp} >= ${twoWeeksAgo.toISOString()}`,
              sql`${apiMetrics.timestamp} < ${oneWeekAgo.toISOString()}`
            )
          );

        const requestsThisWeek = thisWeek.count;
        const requestsLastWeek = lastWeek.count;
        const growth = requestsLastWeek > 0 
          ? ((requestsThisWeek - requestsLastWeek) / requestsLastWeek) * 100 
          : requestsThisWeek > 0 ? 100 : 0;

        return {
          provider,
          requestsThisWeek,
          requestsLastWeek,
          growth
        };
      })
    );

    // Sort by growth and take top N
    return trending
      .sort((a, b) => b.growth - a.growth)
      .slice(0, limit);
  }

  // Get provider comparison data
  static async compareProviders(
    providerIds: string[],
    userId?: string,
    days: number = 30
  ): Promise<Array<{
    provider: ApiProvider;
    metrics: {
      requests: number;
      cost: number;
      averageResponseTime: number;
      errorRate: number;
      reliability: number;
    };
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await Promise.all(
      providerIds.map(async (providerId) => {
        const [provider] = await db
          .select()
          .from(apiProviders)
          .where(eq(apiProviders.id, providerId))
          .limit(1);

        if (!provider) {
          throw new Error(`Provider ${providerId} not found`);
        }

        const conditions = [
          eq(apiMetrics.providerId, providerId),
          sql`${apiMetrics.timestamp} >= ${startDate.toISOString()}`
        ];
        
        if (userId) {
          conditions.push(eq(apiMetrics.userId, userId));
        }

        const [metrics] = await db
          .select({
            requests: count(),
            cost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`,
            averageResponseTime: sql<number>`COALESCE(AVG(${apiMetrics.responseTime}), 0)`,
            errorCount: sql<number>`COUNT(CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END)`
          })
          .from(apiMetrics)
          .where(and(...conditions));

        const errorRate = metrics.requests > 0 ? (metrics.errorCount / metrics.requests) * 100 : 0;
        const reliability = Math.max(0, 100 - errorRate);

        return {
          provider,
          metrics: {
            requests: metrics.requests,
            cost: metrics.cost,
            averageResponseTime: metrics.averageResponseTime,
            errorRate,
            reliability
          }
        };
      })
    );
  }
}