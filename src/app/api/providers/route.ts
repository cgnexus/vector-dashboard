import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ProvidersService } from '@/lib/services/providers.service';
import { 
  createResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  getPaginationParams,
  getFilterParams,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// Validation schemas
const providersQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
});

const createProviderSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Name must contain only lowercase letters, numbers, hyphens, and underscores'),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional()
});

// GET /api/providers - Get all providers with stats
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
      status: searchParams.get('status') as any,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      userId: session.user.id // For user-specific stats
    };

    // Validate query parameters
    const validation = providersQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const result = await ProvidersService.getAll(validation.data);

    return createResponse(result.providers, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch providers',
      500
    );
  }
}

// POST /api/providers - Create new provider (admin only)
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

    // Note: In a real app, you'd check for admin role here
    // if (!session.user.isAdmin) {
    //   return createErrorResponse(
    //     ErrorCodes.FORBIDDEN,
    //     'Admin access required',
    //     403
    //   );
    // }

    const body = await request.json();
    
    const validation = createProviderSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const provider = await ProvidersService.create(validation.data);

    return createResponse(provider, undefined);

  } catch (error) {
    console.error('Error creating provider:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return createErrorResponse(
          ErrorCodes.ALREADY_EXISTS,
          error.message,
          409
        );
      }
    }

    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create provider',
      500
    );
  }
}