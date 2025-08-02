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

// Validation schemas
const updateProviderSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional()
});

// GET /api/providers/[id] - Get single provider with stats
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

    const provider = await ProvidersService.getById(params.id, session.user.id);

    if (!provider) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Provider not found',
        404
      );
    }

    return createResponse(provider);

  } catch (error) {
    console.error('Error fetching provider:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch provider',
      500
    );
  }
}

// PUT /api/providers/[id] - Update provider (admin only)
export async function PUT(
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

    // Note: In a real app, you'd check for admin role here
    // if (!session.user.isAdmin) {
    //   return createErrorResponse(
    //     ErrorCodes.FORBIDDEN,
    //     'Admin access required',
    //     403
    //   );
    // }

    const body = await request.json();
    
    const validation = updateProviderSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const provider = await ProvidersService.update(params.id, validation.data);

    if (!provider) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Provider not found',
        404
      );
    }

    return createResponse(provider);

  } catch (error) {
    console.error('Error updating provider:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update provider',
      500
    );
  }
}

// DELETE /api/providers/[id] - Delete provider (admin only)
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

    // Note: In a real app, you'd check for admin role here
    // if (!session.user.isAdmin) {
    //   return createErrorResponse(
    //     ErrorCodes.FORBIDDEN,
    //     'Admin access required',
    //     403
    //   );
    // }

    const deleted = await ProvidersService.delete(params.id);

    if (!deleted) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Provider not found',
        404
      );
    }

    return createResponse({ deleted: true });

  } catch (error) {
    console.error('Error deleting provider:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('associated API keys') || error.message.includes('historical metrics')) {
        return createErrorResponse(
          ErrorCodes.CONFLICT,
          error.message,
          409
        );
      }
    }

    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete provider',
      500
    );
  }
}