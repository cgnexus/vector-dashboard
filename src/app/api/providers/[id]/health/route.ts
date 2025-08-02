import { NextRequest } from 'next/server';
import { ProvidersService } from '@/lib/services/providers.service';
import { 
  createResponse, 
  createErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// GET /api/providers/[id]/health - Get provider health status
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

    const health = await ProvidersService.getProviderHealth(params.id, session.user.id);

    return createResponse(health);

  } catch (error) {
    console.error('Error fetching provider health:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch provider health',
      500
    );
  }
}