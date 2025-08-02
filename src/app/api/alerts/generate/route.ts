import { NextRequest } from 'next/server';
import { AlertsService } from '@/lib/services/alerts.service';
import { 
  createResponse, 
  createErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// POST /api/alerts/generate - Generate alerts based on current metrics
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

    const generatedAlerts = await AlertsService.generateAlerts(session.user.id);

    return createResponse({
      generated: generatedAlerts.length,
      alerts: generatedAlerts
    });

  } catch (error) {
    console.error('Error generating alerts:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to generate alerts',
      500
    );
  }
}