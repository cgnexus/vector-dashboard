import { NextRequest } from 'next/server';
import { z } from 'zod';
import { AlertsService } from '@/lib/services/alerts.service';
import { 
  createResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// Validation schemas
const alertsQuerySchema = z.object({
  providerId: z.string().optional(),
  type: z.enum(['cost_threshold', 'rate_limit', 'error_rate', 'downtime', 'budget_exceeded', 'slow_response']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isRead: z.coerce.boolean().optional(),
  isResolved: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

const createAlertSchema = z.object({
  providerId: z.string().optional(),
  type: z.enum(['cost_threshold', 'rate_limit', 'error_rate', 'downtime', 'budget_exceeded', 'slow_response']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional()
});

const bulkActionSchema = z.object({
  alertIds: z.array(z.string()).min(1).max(50),
  action: z.enum(['markRead', 'resolve', 'delete'])
});

// GET /api/alerts - Get alerts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      providerId: searchParams.get('providerId') || undefined,
      type: searchParams.get('type') as any,
      severity: searchParams.get('severity') as any,
      isRead: searchParams.get('isRead') ? searchParams.get('isRead') === 'true' : undefined,
      isResolved: searchParams.get('isResolved') ? searchParams.get('isResolved') === 'true' : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      userId: session.user.id
    };

    const validation = alertsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const query = {
      ...validation.data,
      userId: session.user.id,
      startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
    };

    const result = await AlertsService.getAlerts(query);

    return createResponse(result.alerts, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch alerts',
      500
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const body = await request.json();
    
    const validation = createAlertSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const alertData = {
      ...validation.data,
      userId: session.user.id
    };

    const alert = await AlertsService.create(alertData);

    return createResponse(alert);

  } catch (error) {
    console.error('Error creating alert:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createErrorResponse(
          ErrorCodes.NOT_FOUND,
          error.message,
          404
        );
      }
    }

    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create alert',
      500
    );
  }
}

// PATCH /api/alerts - Bulk actions on alerts
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const body = await request.json();
    
    const validation = bulkActionSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const { alertIds, action } = validation.data;
    let result: number;

    switch (action) {
      case 'markRead':
        result = await AlertsService.markMultipleAsRead(alertIds, session.user.id);
        break;
      case 'resolve':
        result = await AlertsService.bulkResolve(alertIds, session.user.id);
        break;
      case 'delete':
        // Note: Implement bulk delete if needed
        throw new Error('Bulk delete not implemented');
      default:
        return createErrorResponse(
          ErrorCodes.INVALID_INPUT,
          'Invalid action',
          400
        );
    }

    return createResponse({
      action,
      processed: result,
      alertIds
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to perform bulk action',
      500
    );
  }
}