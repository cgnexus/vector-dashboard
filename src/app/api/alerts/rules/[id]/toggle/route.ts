import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertRulesService } from '@/lib/services/alert-rules.service';

// POST /api/alerts/rules/[id]/toggle - Toggle rule activation
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

    const success = await AlertRulesService.toggleRule(ruleId, session.user.id);

    if (!success) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Get updated rule to return new status
    const updatedRule = await AlertRulesService.getRuleById(ruleId, session.user.id);

    return NextResponse.json({
      success: true,
      message: `Rule ${updatedRule?.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        isActive: updatedRule?.isActive || false
      }
    });
  } catch (error) {
    console.error('Error toggling alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to toggle alert rule' },
      { status: 500 }
    );
  }
}