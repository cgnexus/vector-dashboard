import { NextRequest } from 'next/server';
import { z } from 'zod';
import { BudgetsService } from '@/lib/services/budgets.service';
import { 
  createResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  ErrorCodes
} from '@/lib/api-utils';
import { auth } from '@/lib/auth';

const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional()
});

// GET /api/budgets/[id] - Get single budget with spending data
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

    const budget = await BudgetsService.getById(params.id, session.user.id);

    if (!budget) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Budget not found',
        404
      );
    }

    return createResponse(budget);

  } catch (error) {
    console.error('Error fetching budget:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch budget',
      500
    );
  }
}

// PUT /api/budgets/[id] - Update budget
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

    const body = await request.json();
    
    const validation = updateBudgetSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const budget = await BudgetsService.update(params.id, session.user.id, validation.data);

    if (!budget) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Budget not found',
        404
      );
    }

    return createResponse(budget);

  } catch (error) {
    console.error('Error updating budget:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update budget',
      500
    );
  }
}

// DELETE /api/budgets/[id] - Delete budget
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

    const deleted = await BudgetsService.delete(params.id, session.user.id);

    if (!deleted) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Budget not found',
        404
      );
    }

    return createResponse({ deleted: true });

  } catch (error) {
    console.error('Error deleting budget:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete budget',
      500
    );
  }
}