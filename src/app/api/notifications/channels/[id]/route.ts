import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationsService } from '@/lib/services/notifications.service';
import { z } from 'zod';

// Validation schema for updates
const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.object({
    email: z.object({
      address: z.string().email()
    }).optional(),
    webhook: z.object({
      url: z.string().url(),
      secret: z.string().optional(),
      headers: z.record(z.string()).optional(),
      method: z.enum(['POST', 'PUT']).optional()
    }).optional(),
    slack: z.object({
      webhookUrl: z.string().url(),
      channel: z.string().optional(),
      username: z.string().optional()
    }).optional(),
    discord: z.object({
      webhookUrl: z.string().url(),
      username: z.string().optional(),
      avatarUrl: z.string().url().optional()
    }).optional(),
    teams: z.object({
      webhookUrl: z.string().url()
    }).optional()
  }).optional(),
  isActive: z.boolean().optional()
});

// GET /api/notifications/channels/[id] - Get specific channel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = params.id;
    const channels = await NotificationsService.getUserChannels(session.user.id);
    const channel = channels.find(c => c.id === channelId);

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('Error fetching notification channel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification channel' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/channels/[id] - Update channel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = params.id;
    const body = await request.json();

    // Validate request body
    const validationResult = updateChannelSchema.safeParse(body);
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

    const success = await NotificationsService.updateChannel(
      channelId,
      session.user.id,
      updates
    );

    if (!success) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Channel updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification channel:', error);
    return NextResponse.json(
      { error: 'Failed to update notification channel' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/channels/[id] - Delete channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channelId = params.id;

    const success = await NotificationsService.deleteChannel(
      channelId,
      session.user.id
    );

    if (!success) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification channel:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification channel' },
      { status: 500 }
    );
  }
}