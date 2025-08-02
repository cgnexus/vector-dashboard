import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationsService, type CreateChannelData } from '@/lib/services/notifications.service';
import { z } from 'zod';

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['email', 'webhook', 'slack', 'discord', 'teams', 'in_app']),
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
  })
});

// GET /api/notifications/channels - List user's notification channels
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channels = await NotificationsService.getUserChannels(session.user.id);

    return NextResponse.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error fetching notification channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification channels' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/channels - Create notification channel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createChannelSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { name, type, config } = validationResult.data;

    // Validate that config matches the channel type
    if (type === 'email' && !config.email) {
      return NextResponse.json(
        { error: 'Email configuration is required for email channels' },
        { status: 400 }
      );
    }

    if (type === 'webhook' && !config.webhook) {
      return NextResponse.json(
        { error: 'Webhook configuration is required for webhook channels' },
        { status: 400 }
      );
    }

    if (type === 'slack' && !config.slack) {
      return NextResponse.json(
        { error: 'Slack configuration is required for Slack channels' },
        { status: 400 }
      );
    }

    if (type === 'discord' && !config.discord) {
      return NextResponse.json(
        { error: 'Discord configuration is required for Discord channels' },
        { status: 400 }
      );
    }

    if (type === 'teams' && !config.teams) {
      return NextResponse.json(
        { error: 'Teams configuration is required for Teams channels' },
        { status: 400 }
      );
    }

    const channelData: CreateChannelData = {
      userId: session.user.id,
      name,
      type,
      config
    };

    const channel = await NotificationsService.createChannel(channelData);

    return NextResponse.json({
      success: true,
      data: channel
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification channel:', error);
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create notification channel' },
      { status: 500 }
    );
  }
}