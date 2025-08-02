import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationsService } from '@/lib/services/notifications.service';

// GET /api/notifications/history - Get delivery history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      channelId: searchParams.get('channelId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    };

    const deliveries = await NotificationsService.getDeliveryHistory(session.user.id, filters);

    return NextResponse.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery history' },
      { status: 500 }
    );
  }
}