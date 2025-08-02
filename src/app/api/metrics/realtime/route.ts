import { NextRequest } from 'next/server';
import { z } from 'zod';
import { MetricsService } from '@/lib/services/metrics.service';
import { 
  createResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

const realtimeQuerySchema = z.object({
  providerId: z.string().optional()
});

// GET /api/metrics/realtime - Get real-time metrics (last 5 minutes)
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
      providerId: searchParams.get('providerId') || undefined
    };

    const validation = realtimeQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const realtime = await MetricsService.getRealTimeMetrics(
      session.user.id,
      validation.data.providerId
    );

    return createResponse(realtime);

  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch realtime metrics',
      500
    );
  }
}