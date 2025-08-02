import { NextRequest } from 'next/server';
import { BudgetsService } from '@/lib/services/budgets.service';
import { 
  createResponse, 
  createErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

// GET /api/budgets/[id]/forecast - Get spending forecast for a budget
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

    const forecast = await BudgetsService.getSpendingForecast(params.id, session.user.id);

    if (!forecast) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Budget not found',
        404
      );
    }

    return createResponse(forecast);

  } catch (error) {
    console.error('Error fetching budget forecast:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch budget forecast',
      500
    );
  }
}