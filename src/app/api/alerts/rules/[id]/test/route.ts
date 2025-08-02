import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertRulesService } from '@/lib/services/alert-rules.service';

// POST /api/alerts/rules/[id]/test - Test rule evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleId = params.id;

    // Get the rule first
    const rule = await AlertRulesService.getRuleById(ruleId, session.user.id);
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Test the rule evaluation
    const result = await AlertRulesService.testRule(rule);

    return NextResponse.json({
      success: true,
      data: {
        ruleId: result.ruleId,
        triggered: result.triggered,
        currentValue: result.currentValue,
        threshold: result.threshold,
        error: result.error,
        evaluation: {
          rule: {
            name: rule.name,
            type: rule.type,
            severity: rule.severity,
            conditions: rule.conditions
          },
          result: result.triggered ? 'TRIGGERED' : 'NOT_TRIGGERED',
          message: result.triggered 
            ? `Rule would trigger an alert. Current value (${result.currentValue}) meets the threshold condition.`
            : result.error
            ? `Rule evaluation failed: ${result.error}`
            : `Rule would not trigger. Current value (${result.currentValue}) does not meet the threshold condition.`
        }
      }
    });
  } catch (error) {
    console.error('Error testing alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to test alert rule' },
      { status: 500 }
    );
  }
}