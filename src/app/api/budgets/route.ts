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

// Validation schemas
const budgetsQuerySchema = z.object({
  providerId: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  isActive: z.coerce.boolean().optional(),
  isOverBudget: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
});

const createBudgetSchema = z.object({
  providerId: z.string().optional(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  alertThreshold: z.number().min(0).max(100).optional()
});

// GET /api/budgets - Get budgets with spending data
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
      period: searchParams.get('period') as 'monthly' | 'weekly' | 'daily' | null,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      isOverBudget: searchParams.get('isOverBudget') ? searchParams.get('isOverBudget') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      userId: session.user.id
    };

    const validation = budgetsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const query = {
      ...validation.data,
      userId: session.user.id
    };

    const result = await BudgetsService.getBudgets(query);

    return createResponse(result.budgets, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });

  } catch (error) {
    console.error('Error fetching budgets:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch budgets',
      500
    );
  }
}

// POST /api/budgets - Create new budget
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

    const body = await request.json();
    
    const validation = createBudgetSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const budgetData = {
      ...validation.data,
      userId: session.user.id
    };

    const budget = await BudgetsService.create(budgetData);

    return createResponse(budget);

  } catch (error) {
    console.error('Error creating budget:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createErrorResponse(
          ErrorCodes.NOT_FOUND,
          error.message,
          404
        );
      }
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
      'Failed to create budget',
      500
    );
  }
}