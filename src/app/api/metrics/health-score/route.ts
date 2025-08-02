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

const healthScoreQuerySchema = z.object({
  providerId: z.string().optional()
});

// GET /api/metrics/health-score - Get API health score
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

    const validation = healthScoreQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const healthScore = await MetricsService.getHealthScore(
      session.user.id,
      validation.data.providerId
    );

    return createResponse(healthScore);

  } catch (error) {
    console.error('Error fetching health score:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch health score',
      500
    );
  }
}