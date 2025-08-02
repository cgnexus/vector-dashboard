import { NextRequest } from 'next/server';
import { AlertsService } from '@/lib/services/alerts.service';
import { 
  createResponse, 
  createErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// GET /api/alerts/[id] - Get single alert
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const alert = await AlertsService.getById(params.id, session.user.id);

    if (!alert) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Alert not found',
        404
      );
    }

    return createResponse(alert);

  } catch (error) {
    console.error('Error fetching alert:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch alert',
      500
    );
  }
}

// PATCH /api/alerts/[id] - Update alert (mark as read/resolved)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action } = body;

    let success = false;

    switch (action) {
      case 'markRead':
        success = await AlertsService.markAsRead(params.id, session.user.id);
        break;
      case 'resolve':
        success = await AlertsService.resolve(params.id, session.user.id);
        break;
      default:
        return createErrorResponse(
          ErrorCodes.INVALID_INPUT,
          'Invalid action. Use "markRead" or "resolve"',
          400
        );
    }

    if (!success) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Alert not found or already processed',
        404
      );
    }

    return createResponse({ 
      action,
      success: true,
      alertId: params.id
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update alert',
      500
    );
  }
}

// DELETE /api/alerts/[id] - Delete alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const deleted = await AlertsService.delete(params.id, session.user.id);

    if (!deleted) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Alert not found',
        404
      );
    }

    return createResponse({ deleted: true });

  } catch (error) {
    console.error('Error deleting alert:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete alert',
      500
    );
  }
}