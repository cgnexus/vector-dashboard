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

const aggregatedQuerySchema = z.object({
  providerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// GET /api/metrics/aggregated - Get aggregated metrics
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
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };

    const validation = aggregatedQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const aggregated = await MetricsService.getAggregatedMetrics(
      session.user.id,
      validation.data.providerId,
      validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      validation.data.endDate ? new Date(validation.data.endDate) : undefined
    );

    return createResponse(aggregated);

  } catch (error) {
    console.error('Error fetching aggregated metrics:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch aggregated metrics',
      500
    );
  }
}