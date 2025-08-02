import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AlertsService } from '@/lib/services/alerts.service';
import { AlertRulesService } from '@/lib/services/alert-rules.service';

// GET /api/alerts/stats - Get alert and rule statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId') || undefined;

    // Get alert stats
    const alertStats = await AlertsService.getStats(session.user.id, providerId);
    
    // Get rule stats
    const ruleStats = await AlertRulesService.getRuleStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        alerts: alertStats,
        rules: ruleStats,
        summary: {
          totalAlerts: alertStats.total,
          unreadAlerts: alertStats.unread,
          unresolvedAlerts: alertStats.unresolved,
          recentAlerts: alertStats.recentCount,
          totalRules: ruleStats.totalRules,
          activeRules: ruleStats.activeRules,
          triggeredToday: ruleStats.triggeredToday,
          triggeredThisWeek: ruleStats.triggeredThisWeek
        }
      }
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert statistics' },
      { status: 500 }
    );
  }
}