import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ProvidersService } from '@/lib/services/providers.service';
import { 
  createResponse, 
  createErrorResponse,
  createValidationErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

const trendingQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(5)
});

// GET /api/providers/trending - Get trending providers by usage growth
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
      limit: parseInt(searchParams.get('limit') || '5')
    };

    const validation = trendingQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const trending = await ProvidersService.getTrendingProviders(
      validation.data.limit, 
      session.user.id
    );

    return createResponse(trending);

  } catch (error) {
    console.error('Error fetching trending providers:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch trending providers',
      500
    );
  }
}