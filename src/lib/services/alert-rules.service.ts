import { db } from '@/db';
import { 
  alertRules, 
  // alerts,
  apiMetrics,
  // costBudgets,
  apiProviders,
  type AlertRule,
  type Alert
} from '@/db/schema';
import { and, eq, desc, count, sql, gte, lte, avg, sum } from 'drizzle-orm';
import { withTransaction } from '@/lib/db-utils';
import { generateId } from '@/lib/api-utils';
import { AlertsService } from './alerts.service';

export interface RuleConditions {
  threshold: number;
  timeWindow: number; // minutes
  metric: 'error_rate' | 'response_time' | 'cost' | 'request_count' | 'success_rate';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  aggregation?: 'avg' | 'sum' | 'count' | 'max' | 'min';
  minimumDataPoints?: number; // minimum number of data points required
}

export interface CreateRuleData {
  userId: string;
  providerId?: string;
  name: string;
  description?: string;
  type: 'cost_threshold' | 'rate_limit' | 'error_rate' | 'downtime' | 'slow_response' | 'budget_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: RuleConditions;
  cooldownMinutes?: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  triggered: boolean;
  currentValue?: number;
  threshold: number;
  alertCreated?: boolean;
  error?: string;
}

export interface RuleStats {
  totalRules: number;
  activeRules: number;
  triggeredToday: number;
  triggeredThisWeek: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export class AlertRulesService {
  // Create alert rule
  static async createRule(data: CreateRuleData): Promise<AlertRule> {
    return await withTransaction(async (tx) => {
      // Validate provider exists if specified
      if (data.providerId) {
        const [provider] = await tx
          .select()
          .from(apiProviders)
          .where(eq(apiProviders.id, data.providerId))
          .limit(1);

        if (!provider) {
          throw new Error('Provider not found');
        }
      }

      // Validate rule conditions
      this.validateRuleConditions(data.conditions);

      const newRule: typeof alertRules.$inferInsert = {
        id: generateId('rule'),
        userId: data.userId,
        providerId: data.providerId || null,
        name: data.name,
        description: data.description || null,
        type: data.type,
        severity: data.severity,
        conditions: data.conditions,
        isActive: true,
        lastTriggered: null,
        triggerCount: 0,
        cooldownMinutes: data.cooldownMinutes || 60,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await tx
        .insert(alertRules)
        .values(newRule)
        .returning();

      return created;
    });
  }

  // Get user's alert rules
  static async getUserRules(
    userId: string,
    filters?: {
      providerId?: string;
      type?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    rules: AlertRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { providerId, type, isActive, page = 1, limit = 20 } = filters || {};
    const offset = (page - 1) * limit;

    const conditions = [eq(alertRules.userId, userId)];

    if (providerId) {
      conditions.push(eq(alertRules.providerId, providerId));
    }

    if (type) {
      conditions.push(eq(alertRules.type, type));
    }

    if (isActive !== undefined) {
      conditions.push(eq(alertRules.isActive, isActive));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(alertRules)
      .where(whereClause);

    const total = totalResult.count;

    // Get paginated results
    const rules = await db
      .select()
      .from(alertRules)
      .where(whereClause)
      .orderBy(desc(alertRules.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      rules,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get rule by ID
  static async getRuleById(id: string, userId: string): Promise<AlertRule | null> {
    const [rule] = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.userId, userId)
        )
      )
      .limit(1);

    return rule || null;
  }

  // Update rule
  static async updateRule(
    id: string,
    userId: string,
    updates: Partial<Pick<AlertRule, 'name' | 'description' | 'conditions' | 'isActive' | 'cooldownMinutes'>>
  ): Promise<boolean> {
    // Validate conditions if provided
    if (updates.conditions) {
      this.validateRuleConditions(updates.conditions as RuleConditions);
    }

    const result = await db
      .update(alertRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Delete rule
  static async deleteRule(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(alertRules)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.userId, userId)
        )
      );

    return (result.rowCount || 0) > 0;
  }

  // Toggle rule activation
  static async toggleRule(id: string, userId: string): Promise<boolean> {
    const [rule] = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.id, id),
          eq(alertRules.userId, userId)
        )
      )
      .limit(1);

    if (!rule) {
      return false;
    }

    const result = await db
      .update(alertRules)
      .set({
        isActive: !rule.isActive,
        updatedAt: new Date()
      })
      .where(eq(alertRules.id, id));

    return (result.rowCount || 0) > 0;
  }

  // Evaluate all rules for a user
  static async evaluateUserRules(userId: string): Promise<RuleEvaluationResult[]> {
    const rules = await db
      .select()
      .from(alertRules)
      .where(
        and(
          eq(alertRules.userId, userId),
          eq(alertRules.isActive, true)
        )
      );

    const results: RuleEvaluationResult[] = [];

    for (const rule of rules) {
      try {
        const result = await this.evaluateRule(rule);
        results.push(result);

        // If rule triggered, create alert and update rule stats
        if (result.triggered && result.alertCreated) {
          await this.updateRuleStats(rule.id);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        results.push({
          ruleId: rule.id,
          triggered: false,
          threshold: rule.conditions.threshold,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Evaluate specific rule
  static async evaluateRule(rule: AlertRule): Promise<RuleEvaluationResult> {
    // Check if rule is in cooldown
    if (await this.isRuleInCooldown(rule)) {
      return {
        ruleId: rule.id,
        triggered: false,
        threshold: rule.conditions.threshold
      };
    }

    const conditions = rule.conditions as RuleConditions;
    let currentValue: number;
    let triggered = false;

    try {
      // Get current metric value based on rule type
      switch (rule.type) {
        case 'error_rate':
          currentValue = await this.getErrorRate(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'slow_response':
          currentValue = await this.getAverageResponseTime(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'cost_threshold':
          currentValue = await this.getCurrentCost(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'rate_limit':
          currentValue = await this.getRequestRate(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        default:
          throw new Error(`Unsupported rule type: ${rule.type}`);
      }

      // Evaluate condition
      triggered = this.evaluateCondition(currentValue, conditions.operator, conditions.threshold);

      // Create alert if triggered
      let alertCreated = false;
      if (triggered) {
        const alert = await this.createAlertFromRule(rule, currentValue);
        alertCreated = !!alert;
      }

      return {
        ruleId: rule.id,
        triggered,
        currentValue,
        threshold: conditions.threshold,
        alertCreated
      };
    } catch (error) {
      return {
        ruleId: rule.id,
        triggered: false,
        threshold: conditions.threshold,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get error rate for time window
  private static async getErrorRate(
    userId: string, 
    providerId: string | null, 
    timeWindowMinutes: number
  ): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, startTime)
    ];

    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const [result] = await db
      .select({
        totalRequests: count(),
        errorRequests: count(sql`CASE WHEN ${apiMetrics.statusCode} >= 400 THEN 1 END`)
      })
      .from(apiMetrics)
      .where(and(...conditions));

    if (result.totalRequests === 0) {
      return 0;
    }

    return (result.errorRequests / result.totalRequests) * 100;
  }

  // Get average response time for time window
  private static async getAverageResponseTime(
    userId: string, 
    providerId: string | null, 
    timeWindowMinutes: number
  ): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, startTime),
      sql`${apiMetrics.responseTime} IS NOT NULL`
    ];

    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const [result] = await db
      .select({
        avgResponseTime: avg(apiMetrics.responseTime)
      })
      .from(apiMetrics)
      .where(and(...conditions));

    return result.avgResponseTime || 0;
  }

  // Get current cost for time window
  private static async getCurrentCost(
    userId: string, 
    providerId: string | null, 
    timeWindowMinutes: number
  ): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, startTime),
      sql`${apiMetrics.cost} IS NOT NULL`
    ];

    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const [result] = await db
      .select({
        totalCost: sum(apiMetrics.cost)
      })
      .from(apiMetrics)
      .where(and(...conditions));

    return parseFloat(result.totalCost as string) || 0;
  }

  // Get request rate for time window
  private static async getRequestRate(
    userId: string, 
    providerId: string | null, 
    timeWindowMinutes: number
  ): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const conditions = [
      eq(apiMetrics.userId, userId),
      gte(apiMetrics.timestamp, startTime)
    ];

    if (providerId) {
      conditions.push(eq(apiMetrics.providerId, providerId));
    }

    const [result] = await db
      .select({
        requestCount: count()
      })
      .from(apiMetrics)
      .where(and(...conditions));

    // Return requests per minute
    return result.requestCount / timeWindowMinutes;
  }

  // Evaluate condition
  private static evaluateCondition(currentValue: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return currentValue > threshold;
      case 'gte':
        return currentValue >= threshold;
      case 'lt':
        return currentValue < threshold;
      case 'lte':
        return currentValue <= threshold;
      case 'eq':
        return currentValue === threshold;
      default:
        return false;
    }
  }

  // Check if rule is in cooldown
  private static async isRuleInCooldown(rule: AlertRule): Promise<boolean> {
    if (!rule.lastTriggered) {
      return false;
    }

    const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
    return new Date() < cooldownEnd;
  }

  // Create alert from rule
  private static async createAlertFromRule(rule: AlertRule, currentValue: number): Promise<Alert | null> {
    try {
      const conditions = rule.conditions as RuleConditions;
      const alertTitle = this.generateAlertTitle(rule, currentValue);
      const alertMessage = this.generateAlertMessage(rule, currentValue, conditions);

      const alert = await AlertsService.create({
        userId: rule.userId,
        providerId: rule.providerId || undefined,
        type: rule.type,
        severity: rule.severity,
        title: alertTitle,
        message: alertMessage,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          currentValue,
          threshold: conditions.threshold,
          operator: conditions.operator,
          timeWindow: conditions.timeWindow,
          triggeredAt: new Date().toISOString()
        }
      });

      return alert;
    } catch (error) {
      console.error('Failed to create alert from rule:', error);
      return null;
    }
  }

  // Generate alert title
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static generateAlertTitle(rule: AlertRule, _currentValue: number): string {
    const typeLabels = {
      error_rate: 'High Error Rate',
      slow_response: 'Slow Response Time',
      cost_threshold: 'Cost Threshold Exceeded',
      rate_limit: 'Rate Limit Reached',
      downtime: 'Service Downtime',
      budget_exceeded: 'Budget Exceeded'
    };

    return `${typeLabels[rule.type] || rule.type}: ${rule.name}`;
  }

  // Generate alert message
  private static generateAlertMessage(
    rule: AlertRule, 
    currentValue: number, 
    conditions: RuleConditions
  ): string {
    const formatValue = (value: number, metric: string): string => {
      switch (metric) {
        case 'error_rate':
          return `${value.toFixed(2)}%`;
        case 'response_time':
          return `${value.toFixed(0)}ms`;
        case 'cost':
          return `$${value.toFixed(2)}`;
        case 'request_count':
          return `${value.toFixed(0)} requests/min`;
        default:
          return value.toFixed(2);
      }
    };

    const operatorLabels = {
      gt: 'greater than',
      gte: 'greater than or equal to',
      lt: 'less than',
      lte: 'less than or equal to',
      eq: 'equal to'
    };

    const currentValueFormatted = formatValue(currentValue, conditions.metric);
    const thresholdFormatted = formatValue(conditions.threshold, conditions.metric);
    const operator = operatorLabels[conditions.operator] || conditions.operator;

    return `Alert rule "${rule.name}" has been triggered. Current value (${currentValueFormatted}) is ${operator} threshold (${thresholdFormatted}) over the last ${conditions.timeWindow} minutes.`;
  }

  // Update rule statistics
  private static async updateRuleStats(ruleId: string): Promise<void> {
    await db
      .update(alertRules)
      .set({
        lastTriggered: new Date(),
        triggerCount: sql`${alertRules.triggerCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(alertRules.id, ruleId));
  }

  // Validate rule conditions
  private static validateRuleConditions(conditions: RuleConditions): void {
    if (!conditions.threshold || conditions.threshold < 0) {
      throw new Error('Threshold must be a positive number');
    }

    if (!conditions.timeWindow || conditions.timeWindow < 1 || conditions.timeWindow > 1440) {
      throw new Error('Time window must be between 1 and 1440 minutes');
    }

    const validMetrics = ['error_rate', 'response_time', 'cost', 'request_count', 'success_rate'];
    if (!validMetrics.includes(conditions.metric)) {
      throw new Error(`Invalid metric: ${conditions.metric}`);
    }

    const validOperators = ['gt', 'gte', 'lt', 'lte', 'eq'];
    if (!validOperators.includes(conditions.operator)) {
      throw new Error(`Invalid operator: ${conditions.operator}`);
    }

    if (conditions.minimumDataPoints && conditions.minimumDataPoints < 1) {
      throw new Error('Minimum data points must be at least 1');
    }
  }

  // Get rule statistics
  static async getRuleStats(userId: string): Promise<RuleStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [stats] = await db
      .select({
        totalRules: count(),
        activeRules: count(sql`CASE WHEN ${alertRules.isActive} = true THEN 1 END`),
        triggeredToday: count(sql`CASE WHEN ${alertRules.lastTriggered} >= ${today.toISOString()} THEN 1 END`),
        triggeredThisWeek: count(sql`CASE WHEN ${alertRules.lastTriggered} >= ${weekAgo.toISOString()} THEN 1 END`),
        
        // Count by type
        errorRate: count(sql`CASE WHEN ${alertRules.type} = 'error_rate' THEN 1 END`),
        slowResponse: count(sql`CASE WHEN ${alertRules.type} = 'slow_response' THEN 1 END`),
        costThreshold: count(sql`CASE WHEN ${alertRules.type} = 'cost_threshold' THEN 1 END`),
        rateLimit: count(sql`CASE WHEN ${alertRules.type} = 'rate_limit' THEN 1 END`),
        downtime: count(sql`CASE WHEN ${alertRules.type} = 'downtime' THEN 1 END`),
        budgetExceeded: count(sql`CASE WHEN ${alertRules.type} = 'budget_exceeded' THEN 1 END`),
        
        // Count by severity
        low: count(sql`CASE WHEN ${alertRules.severity} = 'low' THEN 1 END`),
        medium: count(sql`CASE WHEN ${alertRules.severity} = 'medium' THEN 1 END`),
        high: count(sql`CASE WHEN ${alertRules.severity} = 'high' THEN 1 END`),
        critical: count(sql`CASE WHEN ${alertRules.severity} = 'critical' THEN 1 END`)
      })
      .from(alertRules)
      .where(eq(alertRules.userId, userId));

    return {
      totalRules: stats.totalRules,
      activeRules: stats.activeRules,
      triggeredToday: stats.triggeredToday,
      triggeredThisWeek: stats.triggeredThisWeek,
      byType: {
        error_rate: stats.errorRate,
        slow_response: stats.slowResponse,
        cost_threshold: stats.costThreshold,
        rate_limit: stats.rateLimit,
        downtime: stats.downtime,
        budget_exceeded: stats.budgetExceeded
      },
      bySeverity: {
        low: stats.low,
        medium: stats.medium,
        high: stats.high,
        critical: stats.critical
      }
    };
  }

  // Test rule evaluation without creating alerts
  static async testRule(rule: AlertRule): Promise<RuleEvaluationResult> {
    const conditions = rule.conditions as RuleConditions;
    let currentValue: number;

    try {
      // Get current metric value
      switch (rule.type) {
        case 'error_rate':
          currentValue = await this.getErrorRate(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'slow_response':
          currentValue = await this.getAverageResponseTime(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'cost_threshold':
          currentValue = await this.getCurrentCost(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        case 'rate_limit':
          currentValue = await this.getRequestRate(rule.userId, rule.providerId, conditions.timeWindow);
          break;
        default:
          throw new Error(`Unsupported rule type: ${rule.type}`);
      }

      const triggered = this.evaluateCondition(currentValue, conditions.operator, conditions.threshold);

      return {
        ruleId: rule.id,
        triggered,
        currentValue,
        threshold: conditions.threshold,
        alertCreated: false // Never create alerts in test mode
      };
    } catch (error) {
      return {
        ruleId: rule.id,
        triggered: false,
        threshold: conditions.threshold,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clean up old rules that haven't been triggered in a while
  static async cleanupInactiveRules(inactiveDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const result = await db
      .delete(alertRules)
      .where(
        and(
          eq(alertRules.isActive, false),
          lte(alertRules.updatedAt, cutoffDate)
        )
      );

    return result.rowCount || 0;
  }
}