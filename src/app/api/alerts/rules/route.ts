import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertRulesService, type CreateRuleData } from '@/lib/services/alert-rules.service';
import { z } from 'zod';

// Validation schemas
const ruleConditionsSchema = z.object({
  threshold: z.number().positive(),
  timeWindow: z.number().min(1).max(1440), // 1 minute to 24 hours
  metric: z.enum(['error_rate', 'response_time', 'cost', 'request_count', 'success_rate']),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  aggregation: z.enum(['avg', 'sum', 'count', 'max', 'min']).optional(),
  minimumDataPoints: z.number().min(1).optional()
});

const createRuleSchema = z.object({
  providerId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['cost_threshold', 'rate_limit', 'error_rate', 'downtime', 'slow_response', 'budget_exceeded']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  conditions: ruleConditionsSchema,
  cooldownMinutes: z.number().min(1).max(1440).optional()
});

// GET /api/alerts/rules - List user's alert rules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      providerId: searchParams.get('providerId') || undefined,
      type: searchParams.get('type') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    };

    const result = await AlertRulesService.getUserRules(session.user.id, filters);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

// POST /api/alerts/rules - Create alert rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const ruleData: CreateRuleData = {
      userId: session.user.id,
      ...validationResult.data
    };

    const rule = await AlertRulesService.createRule(ruleData);

    return NextResponse.json({
      success: true,
      data: rule
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && (
      error.message.includes('Invalid') ||
      error.message.includes('must be')
    )) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}