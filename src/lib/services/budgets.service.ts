import { db } from '@/db';
import { costBudgets, apiProviders, apiMetrics, type CostBudget } from '@/db/schema';
import { and, eq, desc, count, sql, gte, lte } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';

export interface CreateBudgetData {
  userId: string;
  providerId?: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold?: number; // percentage (0-100)
}

export interface UpdateBudgetData {
  name?: string;
  amount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold?: number;
  isActive?: boolean;
}

export interface BudgetWithProvider extends CostBudget {
  provider?: {
    id: string;
    name: string;
    displayName: string;
  };
  currentSpending: number;
  spendingPercentage: number;
  remainingAmount: number;
  daysLeft: number;
  isOverBudget: boolean;
  projectedSpend: number;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface BudgetQuery {
  userId: string;
  providerId?: string;
  period?: CostBudget['period'];
  isActive?: boolean;
  isOverBudget?: boolean;
  page?: number;
  limit?: number;
}

export interface BudgetAnalytics {
  totalBudgets: number;
  activeBudgets: number;
  overBudgetCount: number;
  totalAllocated: number;
  totalSpent: number;
  averageUtilization: number;
  savingsOpportunities: Array<{
    budgetId: string;
    budgetName: string;
    suggestedReduction: number;
    reasoning: string;
  }>;
}

export interface SpendingForecast {
  budgetId: string;
  currentPeriodSpend: number;
  projectedSpend: number;
  budgetAmount: number;
  projectedOverage: number;
  daysToOverage: number | null;
  confidence: 'high' | 'medium' | 'low';
}

export class BudgetsService {
  // Create new budget
  static async create(data: CreateBudgetData): Promise<CostBudget> {
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

      // Check for duplicate budget (same user, provider, period)
      const conditions = [
        eq(costBudgets.userId, data.userId),
        eq(costBudgets.period, data.period),
        eq(costBudgets.isActive, true)
      ];

      if (data.providerId) {
        conditions.push(eq(costBudgets.providerId, data.providerId));
      } else {
        conditions.push(sql`${costBudgets.providerId} IS NULL`);
      }

      const [existing] = await tx
        .select()
        .from(costBudgets)
        .where(and(...conditions))
        .limit(1);

      if (existing) {
        throw new Error(`Active budget for this ${data.providerId ? 'provider and' : ''} period already exists`);
      }

      const newBudget: typeof costBudgets.$inferInsert = {
        id: generateId('budget'),
        userId: data.userId,
        providerId: data.providerId || null,
        name: data.name,
        amount: data.amount.toString(),
        period: data.period,
        alertThreshold: data.alertThreshold?.toString() || '80',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await tx
        .insert(costBudgets)
        .values(newBudget)
        .returning();

      return created;
    });
  }

  // Get budgets with spending data
  static async getBudgets(query: BudgetQuery): Promise<{
    budgets: BudgetWithProvider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      userId, 
      providerId, 
      period, 
      isActive, 
      isOverBudget,
      page = 1, 
      limit = 10 
    } = query;
    
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(costBudgets.userId, userId)];
    
    if (providerId) {
      conditions.push(eq(costBudgets.providerId, providerId));
    }
    
    if (period) {
      conditions.push(eq(costBudgets.period, period));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(costBudgets.isActive, isActive));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(costBudgets)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated budgets with provider info
    const budgets = await db
      .select({
        id: costBudgets.id,
        userId: costBudgets.userId,
        providerId: costBudgets.providerId,
        name: costBudgets.name,
        amount: costBudgets.amount,
        period: costBudgets.period,
        alertThreshold: costBudgets.alertThreshold,
        isActive: costBudgets.isActive,
        createdAt: costBudgets.createdAt,
        updatedAt: costBudgets.updatedAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(costBudgets)
      .leftJoin(apiProviders, eq(costBudgets.providerId, apiProviders.id))
      .where(whereClause)
      .orderBy(desc(costBudgets.createdAt))
      .limit(limit)
      .offset(offset);

    // Enhance budgets with spending data
    const budgetsWithSpending: BudgetWithProvider[] = await Promise.all(
      budgets.map(async (budget) => {
        const spendingData = await this.calculateBudgetSpending(budget);
        
        // Filter by isOverBudget if specified
        if (isOverBudget !== undefined && spendingData.isOverBudget !== isOverBudget) {
          return null;
        }
        
        return {
          ...budget,
          ...spendingData
        };
      })
    );

    // Filter out null values (from isOverBudget filtering)
    const filteredBudgets = budgetsWithSpending.filter(Boolean) as BudgetWithProvider[];
    const filteredTotal = isOverBudget !== undefined ? filteredBudgets.length : total;
    const totalPages = Math.ceil(filteredTotal / limit);

    return {
      budgets: filteredBudgets,
      total: filteredTotal,
      page,
      limit,
      totalPages
    };
  }

  // Get single budget by ID
  static async getById(id: string, userId: string): Promise<BudgetWithProvider | null> {
    const [budget] = await db
      .select({
        id: costBudgets.id,
        userId: costBudgets.userId,
        providerId: costBudgets.providerId,
        name: costBudgets.name,
        amount: costBudgets.amount,
        period: costBudgets.period,
        alertThreshold: costBudgets.alertThreshold,
        isActive: costBudgets.isActive,
        createdAt: costBudgets.createdAt,
        updatedAt: costBudgets.updatedAt,
        provider: {
          id: apiProviders.id,
          name: apiProviders.name,
          displayName: apiProviders.displayName
        }
      })
      .from(costBudgets)
      .leftJoin(apiProviders, eq(costBudgets.providerId, apiProviders.id))
      .where(
        and(
          eq(costBudgets.id, id),
          eq(costBudgets.userId, userId)
        )
      )
      .limit(1);

    if (!budget) {
      return null;
    }

    const spendingData = await this.calculateBudgetSpending(budget);

    return {
      ...budget,
      ...spendingData
    };
  }

  // Update budget
  static async update(
    id: string,
    userId: string,
    data: UpdateBudgetData
  ): Promise<CostBudget | null> {
    return await withTransaction(async (tx) => {
      // Verify ownership
      const existing = await tx
        .select()
        .from(costBudgets)
        .where(
          and(
            eq(costBudgets.id, id),
            eq(costBudgets.userId, userId)
          )
        )
        .limit(1);

      if (!existing.length) {
        return null;
      }

      const updateData: Partial<typeof costBudgets.$inferInsert> = {
        updatedAt: new Date()
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.amount !== undefined) updateData.amount = data.amount.toString();
      if (data.period !== undefined) updateData.period = data.period;
      if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold.toString();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updated] = await tx
        .update(costBudgets)
        .set(updateData)
        .where(eq(costBudgets.id, id))
        .returning();

      return updated;
    });
  }

  // Delete budget
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(costBudgets)
      .where(
        and(
          eq(costBudgets.id, id),
          eq(costBudgets.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Get budget analytics
  static async getAnalytics(userId: string): Promise<BudgetAnalytics> {
    // Get budget summary
    const [budgetSummary] = await db
      .select({
        totalBudgets: count(),
        activeBudgets: count(sql`CASE WHEN ${costBudgets.isActive} = true THEN 1 END`),
        totalAllocated: sql<number>`COALESCE(SUM(CASE WHEN ${costBudgets.isActive} = true THEN CAST(${costBudgets.amount} AS NUMERIC) END), 0)`
      })
      .from(costBudgets)
      .where(eq(costBudgets.userId, userId));

    // Calculate current spending for all active budgets
    const activeBudgets = await db
      .select()
      .from(costBudgets)
      .where(
        and(
          eq(costBudgets.userId, userId),
          eq(costBudgets.isActive, true)
        )
      );

    let totalSpent = 0;
    let overBudgetCount = 0;
    let totalUtilization = 0;
    const savingsOpportunities: BudgetAnalytics['savingsOpportunities'] = [];

    for (const budget of activeBudgets) {
      const spendingData = await this.calculateBudgetSpending(budget);
      totalSpent += spendingData.currentSpending;
      
      if (spendingData.isOverBudget) {
        overBudgetCount++;
      }
      
      totalUtilization += spendingData.spendingPercentage;

      // Identify savings opportunities (budgets with <30% utilization and stable/decreasing trend)
      if (spendingData.spendingPercentage < 30 && spendingData.spendingTrend !== 'increasing') {
        const budgetAmount = parseFloat(budget.amount);
        const suggestedReduction = budgetAmount * 0.3; // Suggest 30% reduction
        
        savingsOpportunities.push({
          budgetId: budget.id,
          budgetName: budget.name,
          suggestedReduction,
          reasoning: `Low utilization (${spendingData.spendingPercentage.toFixed(1)}%) with ${spendingData.spendingTrend} trend`
        });
      }
    }

    const averageUtilization = activeBudgets.length > 0 ? totalUtilization / activeBudgets.length : 0;

    return {
      totalBudgets: budgetSummary.totalBudgets,
      activeBudgets: budgetSummary.activeBudgets,
      overBudgetCount,
      totalAllocated: budgetSummary.totalAllocated,
      totalSpent,
      averageUtilization,
      savingsOpportunities
    };
  }

  // Get spending forecast for a budget
  static async getSpendingForecast(budgetId: string, userId: string): Promise<SpendingForecast | null> {
    const budget = await this.getById(budgetId, userId);
    if (!budget) {
      return null;
    }

    const periodStart = this.getPeriodStart(budget.period);
    const periodEnd = this.getPeriodEnd(budget.period);
    const now = new Date();
    
    // Calculate how far we are into the period
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const elapsedTime = now.getTime() - periodStart.getTime();
    const remainingTime = periodEnd.getTime() - now.getTime();
    // const progressPercentage = Math.min(100, (elapsedTime / periodDuration) * 100);

    // Get daily spending for trend analysis
    const dailySpending = await db.execute(sql`
      SELECT 
        DATE(timestamp) as date,
        COALESCE(SUM(CAST(cost AS NUMERIC)), 0) as daily_cost
      FROM api_metrics
      WHERE user_id = ${userId}
        AND timestamp >= ${periodStart.toISOString()}
        AND timestamp <= ${now.toISOString()}
        ${budget.providerId ? sql`AND provider_id = ${budget.providerId}` : sql``}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 14
    `);

    const dailyCosts = dailySpending.rows.map(row => parseFloat(row.daily_cost));
    const recentDays = dailyCosts.slice(0, 7); // Last 7 days
    const previousDays = dailyCosts.slice(7); // Previous 7 days

    // Calculate trend
    const recentAverage = recentDays.length > 0 ? recentDays.reduce((a, b) => a + b, 0) / recentDays.length : 0;
    const previousAverage = previousDays.length > 0 ? previousDays.reduce((a, b) => a + b, 0) / previousDays.length : recentAverage;

    // Project spending based on trend
    let projectionMultiplier = 1;
    if (recentAverage > previousAverage * 1.2) {
      projectionMultiplier = 1.2; // Increasing trend
    } else if (recentAverage < previousAverage * 0.8) {
      projectionMultiplier = 0.8; // Decreasing trend
    }

    const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
    const projectedDailySpend = recentAverage * projectionMultiplier;
    const projectedRemainingSpend = projectedDailySpend * remainingDays;
    const projectedTotalSpend = budget.currentSpending + projectedRemainingSpend;

    const budgetAmount = parseFloat(budget.amount);
    const projectedOverage = Math.max(0, projectedTotalSpend - budgetAmount);

    // Calculate confidence based on data availability and variance
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (dailyCosts.length >= 7) {
      const variance = this.calculateVariance(recentDays);
      const meanSpend = recentAverage;
      const coefficientOfVariation = meanSpend > 0 ? Math.sqrt(variance) / meanSpend : 0;
      
      if (coefficientOfVariation < 0.3) {
        confidence = 'high';
      } else if (coefficientOfVariation > 0.7) {
        confidence = 'low';
      }
    } else {
      confidence = 'low';
    }

    // Calculate days to overage
    let daysToOverage: number | null = null;
    if (projectedDailySpend > 0 && budget.remainingAmount > 0) {
      daysToOverage = Math.ceil(budget.remainingAmount / projectedDailySpend);
    }

    return {
      budgetId: budget.id,
      currentPeriodSpend: budget.currentSpending,
      projectedSpend: projectedTotalSpend,
      budgetAmount,
      projectedOverage,
      daysToOverage,
      confidence
    };
  }

  // Calculate budget spending data
  private static async calculateBudgetSpending(budget: CostBudget): Promise<{
    currentSpending: number;
    spendingPercentage: number;
    remainingAmount: number;
    daysLeft: number;
    isOverBudget: boolean;
    projectedSpend: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const periodStart = this.getPeriodStart(budget.period);
    const periodEnd = this.getPeriodEnd(budget.period);
    const now = new Date();

    // Build conditions for spending query
    const conditions = [
      eq(apiMetrics.userId, budget.userId),
      gte(apiMetrics.timestamp, periodStart),
      lte(apiMetrics.timestamp, now)
    ];

    if (budget.providerId) {
      conditions.push(eq(apiMetrics.providerId, budget.providerId));
    }

    // Get current spending
    const [spending] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
      })
      .from(apiMetrics)
      .where(and(...conditions));

    const currentSpending = spending.totalCost;
    const budgetAmount = parseFloat(budget.amount);
    const spendingPercentage = budgetAmount > 0 ? (currentSpending / budgetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, budgetAmount - currentSpending);
    const isOverBudget = currentSpending > budgetAmount;

    // Calculate days left in period
    const daysLeft = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    // Get spending trend (last 7 days vs previous 7 days)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recentSpending] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
      })
      .from(apiMetrics)
      .where(
        and(
          eq(apiMetrics.userId, budget.userId),
          gte(apiMetrics.timestamp, last7Days),
          lte(apiMetrics.timestamp, now),
          ...(budget.providerId ? [eq(apiMetrics.providerId, budget.providerId)] : [])
        )
      );

    const [previousSpending] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(CAST(${apiMetrics.cost} AS NUMERIC)), 0)`
      })
      .from(apiMetrics)
      .where(
        and(
          eq(apiMetrics.userId, budget.userId),
          gte(apiMetrics.timestamp, last14Days),
          lte(apiMetrics.timestamp, last7Days),
          ...(budget.providerId ? [eq(apiMetrics.providerId, budget.providerId)] : [])
        )
      );

    const recentCost = recentSpending.totalCost;
    const previousCost = previousSpending.totalCost;

    let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentCost > previousCost * 1.1) {
      spendingTrend = 'increasing';
    } else if (recentCost < previousCost * 0.9) {
      spendingTrend = 'decreasing';
    }

    // Simple projection based on current burn rate
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const elapsedTime = now.getTime() - periodStart.getTime();
    const burnRate = elapsedTime > 0 ? currentSpending / (elapsedTime / (24 * 60 * 60 * 1000)) : 0;
    const projectedSpend = burnRate * (periodDuration / (24 * 60 * 60 * 1000));

    return {
      currentSpending,
      spendingPercentage,
      remainingAmount,
      daysLeft,
      isOverBudget,
      projectedSpend,
      spendingTrend
    };
  }

  // Helper methods for period calculations
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

  private static getPeriodEnd(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + 7;
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      case 'yearly':
        return new Date(now.getFullYear() + 1, 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }
  }

  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  }

  // Get budget usage trends over time
  static async getBudgetTrends(
    userId: string,
    budgetId?: string,
    days: number = 30
  ): Promise<Array<{
    date: string;
    budgetId: string;
    budgetName: string;
    dailySpend: number;
    cumulativeSpend: number;
    budgetAmount: number;
    utilizationPercentage: number;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const conditions = [eq(costBudgets.userId, userId)];
    if (budgetId) {
      conditions.push(eq(costBudgets.id, budgetId));
    }

    const budgets = await db
      .select()
      .from(costBudgets)
      .where(and(...conditions));

    const trends = [];

    for (const budget of budgets) {
      const periodStart = this.getPeriodStart(budget.period);
      
      // Get daily spending for this budget
      const dailySpending = await db.execute(sql`
        SELECT 
          DATE(timestamp) as date,
          COALESCE(SUM(CAST(cost AS NUMERIC)), 0) as daily_cost
        FROM api_metrics
        WHERE user_id = ${userId}
          AND timestamp >= ${Math.max(startDate.getTime(), periodStart.getTime())}
          ${budget.providerId ? sql`AND provider_id = ${budget.providerId}` : sql``}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `);

      let cumulativeSpend = 0;
      const budgetAmount = parseFloat(budget.amount);

      for (const row of dailySpending.rows) {
        const dailySpend = parseFloat(row.daily_cost);
        cumulativeSpend += dailySpend;
        const utilizationPercentage = budgetAmount > 0 ? (cumulativeSpend / budgetAmount) * 100 : 0;

        trends.push({
          date: row.date,
          budgetId: budget.id,
          budgetName: budget.name,
          dailySpend,
          cumulativeSpend,
          budgetAmount,
          utilizationPercentage
        });
      }
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }
}