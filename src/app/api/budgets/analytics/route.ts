import { NextRequest } from 'next/server';
import { BudgetsService } from '@/lib/services/budgets.service';
import { 
  createResponse, 
  createErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// GET /api/budgets/analytics - Get budget analytics and insights
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

    const analytics = await BudgetsService.getAnalytics(session.user.id);

    return createResponse(analytics);

  } catch (error) {
    console.error('Error fetching budget analytics:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch budget analytics',
      500
    );
  }
}