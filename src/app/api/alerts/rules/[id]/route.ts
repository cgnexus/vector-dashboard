import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertRulesService } from '@/lib/services/alert-rules.service';
import { z } from 'zod';

// Validation schemas
const ruleConditionsSchema = z.object({
  threshold: z.number().positive(),
  timeWindow: z.number().min(1).max(1440),
  metric: z.enum(['error_rate', 'response_time', 'cost', 'request_count', 'success_rate']),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  aggregation: z.enum(['avg', 'sum', 'count', 'max', 'min']).optional(),
  minimumDataPoints: z.number().min(1).optional()
});

const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  conditions: ruleConditionsSchema.optional(),
  isActive: z.boolean().optional(),
  cooldownMinutes: z.number().min(1).max(1440).optional()
});

// GET /api/alerts/rules/[id] - Get specific rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleId = params.id;
    const rule = await AlertRulesService.getRuleById(ruleId, session.user.id);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rule' },
      { status: 500 }
    );
  }
}

// PUT /api/alerts/rules/[id] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleId = params.id;
    const body = await request.json();

    // Validate request body
    const validationResult = updateRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    const success = await AlertRulesService.updateRule(
      ruleId,
      session.user.id,
      updates
    );

    if (!success) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    
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
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/rules/[id] - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleId = params.id;

    const success = await AlertRulesService.deleteRule(ruleId, session.user.id);

    if (!success) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}