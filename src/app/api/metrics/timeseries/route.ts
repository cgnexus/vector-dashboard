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

const timeseriesQuerySchema = z.object({
  interval: z.enum(['hour', 'day', 'week']).default('hour'),
  providerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// GET /api/metrics/timeseries - Get time series data
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
      interval: (searchParams.get('interval') || 'hour') as 'hour' | 'day' | 'week',
      providerId: searchParams.get('providerId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };

    const validation = timeseriesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const timeseries = await MetricsService.getTimeSeriesData(
      session.user.id,
      validation.data.interval,
      validation.data.providerId,
      validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      validation.data.endDate ? new Date(validation.data.endDate) : undefined
    );

    return createResponse(timeseries);

  } catch (error) {
    console.error('Error fetching timeseries data:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch timeseries data',
      500
    );
  }
}