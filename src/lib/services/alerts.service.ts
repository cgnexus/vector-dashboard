import { db } from '@/db';
import { alerts, apiProviders, costBudgets, apiMetrics, type Alert } from '@/db/schema';
import { and, eq, desc, count, sql, gte, lte } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';

export interface CreateAlertData {
  userId: string;
  providerId?: string;
  type: 'cost_threshold' | 'rate_limit' | 'error_rate' | 'downtime' | 'budget_exceeded' | 'slow_response';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AlertsQuery {
  userId: string;
  providerId?: string;
  type?: Alert['type'];
  severity?: Alert['severity'];
  isRead?: boolean;
  isResolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AlertWithProvider extends Alert {
  provider?: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface AlertRule {
  id: string;
  userId: string;
  providerId?: string;
  type: Alert['type'];
  severity: Alert['severity'];
  conditions: {
    threshold?: number;
    timeWindow?: number; // minutes
    metric?: 'error_rate' | 'response_time' | 'cost' | 'request_count';
    operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertStats {
  total: number;
  unread: number;
  unresolved: number;
  byType: Record<Alert['type'], number>;
  bySeverity: Record<Alert['severity'], number>;
  recentCount: number; // last 24 hours
}

export class AlertsService {
  // Create new alert
  static async create(data: CreateAlertData): Promise<Alert> {
    return await withTransaction(async (tx) => {
      // Verify provider exists if provided
      if (data.providerId) {
        const provider = await tx
          .select()
          .from(apiProviders)
          .where(eq(apiProviders.id, data.providerId))
          .limit(1);

        if (!provider.length) {
          throw new Error('Provider not found');
        }
      }

      const newAlert: typeof alerts.$inferInsert = {
        id: generateId('alert'),
        userId: data.userId,
        providerId: data.providerId || null,
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
        isRead: false,
        isResolved: false,
        resolvedAt: null,
        createdAt: new Date()
      };

      const [created] = await tx
        .insert(alerts)
        .values(newAlert)
        .returning();

      return created;
    });
  }

  // Get alerts with filtering and pagination
  static async getAlerts(query: AlertsQuery): Promise<{
    alerts: AlertWithProvider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      userId, 
      providerId, 
      type, 
      severity, 
      isRead, 
      isResolved,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = query;
    
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(alerts.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(alerts.providerId, providerId));
    }
    
    if (type) {
      conditions.push(eq(alerts.type, type));
    }
    
    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }
    
    if (isRead !== undefined) {
      conditions.push(eq(alerts.isRead, isRead));
    }
    
    if (isResolved !== undefined) {
      conditions.push(eq(alerts.isResolved, isResolved));
    }
    
    if (startDate && endDate) {
      conditions.push(
        and(
          gte(alerts.createdAt, startDate),
          lte(alerts.createdAt, endDate)
        )
      );
    } else if (startDate) {
      conditions.push(gte(alerts.createdAt, startDate));
    } else if (endDate) {
      conditions.push(lte(alerts.createdAt, endDate));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(alerts)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results with provider info
    const alertsWithProvider = await db
      .select({
        id: alerts.id,
        userId: alerts.userId,
        providerId: alerts.providerId,
        type: alerts.type,
        severity: alerts.severity,
        title: alerts.title,
        message: alerts.message,
        metadata: alerts.metadata,
        isRead: alerts.isRead,
        isResolved: alerts.isResolved,
        resolvedAt: alerts.resolvedAt,
        createdAt: alerts.createdAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(alerts)
      .leftJoin(apiProviders, eq(alerts.providerId, apiProviders.id))
      .where(whereClause)
      .orderBy(desc(alerts.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      alerts: alertsWithProvider,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get single alert by ID
  static async getById(id: string, userId: string): Promise<AlertWithProvider | null> {
    const [alert] = await db
      .select({
        id: alerts.id,
        userId: alerts.userId,
        providerId: alerts.providerId,
        type: alerts.type,
        severity: alerts.severity,
        title: alerts.title,
        message: alerts.message,
        metadata: alerts.metadata,
        isRead: alerts.isRead,
        isResolved: alerts.isResolved,
        resolvedAt: alerts.resolvedAt,
        createdAt: alerts.createdAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(alerts)
      .leftJoin(apiProviders, eq(alerts.providerId, apiProviders.id))
      .where(
        and(
          eq(alerts.id, id),
          eq(alerts.userId, userId)
        )
      )
      .limit(1);

    return alert || null;
  }

  // Mark alert as read
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(alerts)
      .set({ isRead: true })
      .where(
        and(
          eq(alerts.id, id),
          eq(alerts.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Mark multiple alerts as read
  static async markMultipleAsRead(ids: string[], userId: string): Promise<number> {
    const result = await db
      .update(alerts)
      .set({ isRead: true })
      .where(
        and(
          sql`${alerts.id} = ANY(${ids})`,
          eq(alerts.userId, userId)
        )
      );

    return result.rowCount || 0;
  }

  // Mark all alerts as read for a user
  static async markAllAsRead(userId: string, providerId?: string): Promise<number> {
    const conditions = [eq(alerts.userId, userId), eq(alerts.isRead, false)];
    
    if (providerId) {
      conditions.push(eq(alerts.providerId, providerId));
    }

    const result = await db
      .update(alerts)
      .set({ isRead: true })
      .where(and(...conditions));

    return result.rowCount || 0;
  }

  // Resolve alert
  static async resolve(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(alerts)
      .set({ 
        isResolved: true, 
        resolvedAt: new Date(),
        isRead: true // Also mark as read when resolving
      })
      .where(
        and(
          eq(alerts.id, id),
          eq(alerts.userId, userId),
          eq(alerts.isResolved, false)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Bulk resolve alerts
  static async bulkResolve(ids: string[], userId: string): Promise<number> {
    const result = await db
      .update(alerts)
      .set({ 
        isResolved: true, 
        resolvedAt: new Date(),
        isRead: true
      })
      .where(
        and(
          sql`${alerts.id} = ANY(${ids})`,
          eq(alerts.userId, userId),
          eq(alerts.isResolved, false)
        )
      );

    return result.rowCount || 0;
  }

  // Delete alert
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(alerts)
      .where(
        and(
          eq(alerts.id, id),
          eq(alerts.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Get alert statistics
  static async getStats(userId: string, providerId?: string): Promise<AlertStats> {
    const conditions = [eq(alerts.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(alerts.providerId, providerId));
    }

    const whereClause = and(...conditions);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [stats] = await db
      .select({
        total: count(),
        unread: count(sql`CASE WHEN ${alerts.isRead} = false THEN 1 END`),
        unresolved: count(sql`CASE WHEN ${alerts.isResolved} = false THEN 1 END`),
        recentCount: count(sql`CASE WHEN ${alerts.createdAt} >= ${last24Hours.toISOString()} THEN 1 END`),
        
        // Count by type
        costThreshold: count(sql`CASE WHEN ${alerts.type} = 'cost_threshold' THEN 1 END`),
        rateLimit: count(sql`CASE WHEN ${alerts.type} = 'rate_limit' THEN 1 END`),
        errorRate: count(sql`CASE WHEN ${alerts.type} = 'error_rate' THEN 1 END`),
        downtime: count(sql`CASE WHEN ${alerts.type} = 'downtime' THEN 1 END`),
        budgetExceeded: count(sql`CASE WHEN ${alerts.type} = 'budget_exceeded' THEN 1 END`),
        slowResponse: count(sql`CASE WHEN ${alerts.type} = 'slow_response' THEN 1 END`),
        
        // Count by severity
        low: count(sql`CASE WHEN ${alerts.severity} = 'low' THEN 1 END`),
        medium: count(sql`CASE WHEN ${alerts.severity} = 'medium' THEN 1 END`),
        high: count(sql`CASE WHEN ${alerts.severity} = 'high' THEN 1 END`),
        critical: count(sql`CASE WHEN ${alerts.severity} = 'critical' THEN 1 END`)
      })
      .from(alerts)
      .where(whereClause);

    return {
      total: stats.total,
      unread: stats.unread,
      unresolved: stats.unresolved,
      recentCount: stats.recentCount,
      byType: {
        cost_threshold: stats.costThreshold,
        rate_limit: stats.rateLimit,
        error_rate: stats.errorRate,
        downtime: stats.downtime,
        budget_exceeded: stats.budgetExceeded,
        slow_response: stats.slowResponse
      },
      bySeverity: {
        low: stats.low,
        medium: stats.medium,
        high: stats.high,
        critical: stats.critical
      }
    };
  }

  // Auto-generate alerts based on metrics
  static async generateAlerts(userId: string): Promise<Alert[]> {
    const generatedAlerts: Alert[] = [];
    const last1Hour = new Date(Date.now() - 60 * 60 * 1000);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for high error rates (>10% in last hour)
    const errorRateAlerts = await db.execute(sql`
      SELECT 
        provider_id,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
        ROUND((COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)), 2) as error_rate
      FROM api_metrics
      WHERE user_id = ${userId}
        AND timestamp >= ${last1Hour.toISOString()}
      GROUP BY provider_id
      HAVING COUNT(*) >= 10 AND (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) > 10
    `);

    for (const row of errorRateAlerts.rows) {
      // Check if we already have a recent alert for this
      const [existingAlert] = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.userId, userId),
            eq(alerts.providerId, row.provider_id),
            eq(alerts.type, 'error_rate'),
            eq(alerts.isResolved, false),
            gte(alerts.createdAt, last24Hours)
          )
        )
        .limit(1);

      if (!existingAlert) {
        const alert = await this.create({
          userId,
          providerId: row.provider_id,
          type: 'error_rate',
          severity: row.error_rate > 25 ? 'critical' : row.error_rate > 15 ? 'high' : 'medium',
          title: 'High Error Rate Detected',
          message: `Error rate of ${row.error_rate}% detected in the last hour (${row.error_requests}/${row.total_requests} requests)`,
          metadata: {
            errorRate: row.error_rate,
            totalRequests: row.total_requests,
            errorRequests: row.error_requests,
            timeWindow: '1hour'
          }
        });
        generatedAlerts.push(alert);
      }
    }

    // Check for slow response times (>5s average in last hour)
    const slowResponseAlerts = await db.execute(sql`
      SELECT 
        provider_id,
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time
      FROM api_metrics
      WHERE user_id = ${userId}
        AND timestamp >= ${last1Hour.toISOString()}
        AND response_time IS NOT NULL
      GROUP BY provider_id
      HAVING COUNT(*) >= 5 AND AVG(response_time) > 5000
    `);

    for (const row of slowResponseAlerts.rows) {
      const [existingAlert] = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.userId, userId),
            eq(alerts.providerId, row.provider_id),
            eq(alerts.type, 'slow_response'),
            eq(alerts.isResolved, false),
            gte(alerts.createdAt, last24Hours)
          )
        )
        .limit(1);

      if (!existingAlert) {
        const avgTime = Math.round(row.avg_response_time);
        const alert = await this.create({
          userId,
          providerId: row.provider_id,
          type: 'slow_response',
          severity: avgTime > 30000 ? 'critical' : avgTime > 15000 ? 'high' : 'medium',
          title: 'Slow Response Time Detected',
          message: `Average response time of ${avgTime}ms detected in the last hour (${row.total_requests} requests)`,
          metadata: {
            averageResponseTime: avgTime,
            totalRequests: row.total_requests,
            timeWindow: '1hour'
          }
        });
        generatedAlerts.push(alert);
      }
    }

    // Check for budget thresholds
    const budgetAlerts = await this.checkBudgetThresholds(userId);
    generatedAlerts.push(...budgetAlerts);

    return generatedAlerts;
  }

  // Check budget thresholds and create alerts
  private static async checkBudgetThresholds(userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get active budgets for the user
    const budgets = await db
      .select()
      .from(costBudgets)
      .where(
        and(
          eq(costBudgets.userId, userId),
          eq(costBudgets.isActive, true)
        )
      );

    for (const budget of budgets) {
      // Calculate current period spending
      const periodStart = this.getPeriodStart(budget.period);
      
      const conditions = [
        eq(apiMetrics.userId, userId),
        gte(apiMetrics.timestamp, periodStart)
      ];
      
      if (budget.providerId) {
        conditions.push(eq(apiMetrics.providerId, budget.providerId));
      }

      const [spending] = await db
        .select({
          totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
        })
        .from(apiMetrics)
        .where(and(...conditions));

      const currentSpending = spending.totalCost;
      const budgetAmount = parseFloat(budget.amount);
      const percentage = (currentSpending / budgetAmount) * 100;
      const alertThreshold = budget.alertThreshold ? parseFloat(budget.alertThreshold) : 80;

      // Check if we should alert
      if (percentage >= alertThreshold) {
        // Check if we already have a recent alert for this budget
        const [existingAlert] = await db
          .select()
          .from(alerts)
          .where(
            and(
              eq(alerts.userId, userId),
              eq(alerts.type, percentage >= 100 ? 'budget_exceeded' : 'cost_threshold'),
              sql`${alerts.metadata}->>'budgetId' = ${budget.id}`,
              eq(alerts.isResolved, false),
              gte(alerts.createdAt, last24Hours)
            )
          )
          .limit(1);

        if (!existingAlert) {
          const alertType = percentage >= 100 ? 'budget_exceeded' : 'cost_threshold';
          const severity = percentage >= 100 ? 'critical' : percentage >= 90 ? 'high' : 'medium';
          
          const alert = await this.create({
            userId,
            providerId: budget.providerId || undefined,
            type: alertType,
            severity,
            title: percentage >= 100 ? 'Budget Exceeded' : 'Budget Threshold Reached',
            message: percentage >= 100 
              ? `Budget "${budget.name}" has been exceeded. Current spending: $${currentSpending.toFixed(2)} / $${budgetAmount.toFixed(2)} (${percentage.toFixed(1)}%)`
              : `Budget "${budget.name}" is at ${percentage.toFixed(1)}% of limit. Current spending: $${currentSpending.toFixed(2)} / $${budgetAmount.toFixed(2)}`,
            metadata: {
              budgetId: budget.id,
              budgetName: budget.name,
              currentSpending,
              budgetAmount,
              percentage: Math.round(percentage),
              period: budget.period
            }
          });
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  // Helper to get period start date
  private static getPeriodStart(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }

  // Clean up old resolved alerts
  static async cleanupOldAlerts(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(alerts)
      .where(
        and(
          eq(alerts.isResolved, true),
          lte(alerts.resolvedAt, cutoffDate)
        )
      );

    return result.rowCount || 0;
  }
}