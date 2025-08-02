import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationsService } from '@/lib/services/notifications.service';
import { z } from 'zod';

// Validation schema
const testNotificationSchema = z.object({
  channelId: z.string().min(1)
});

// POST /api/notifications/test - Test notification channel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = testNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { channelId } = validationResult.data;

    // Test the notification channel
    const result = await NotificationsService.testChannel(channelId, session.user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          response: result.response
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Test notification failed'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing notification channel:', error);
    return NextResponse.json(
      { error: 'Failed to test notification channel' },
      { status: 500 }
    );
  }
}