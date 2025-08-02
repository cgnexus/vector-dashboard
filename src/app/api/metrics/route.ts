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

// Validation schemas
const metricsQuerySchema = z.object({
  providerId: z.string().optional(),
  apiKeyId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  statusCode: z.coerce.number().optional(),
  endpoint: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

const createMetricSchema = z.object({
  providerId: z.string(),
  apiKeyId: z.string().optional(),
  endpoint: z.string(),
  method: z.string(),
  statusCode: z.number().int().min(100).max(599),
  responseTime: z.number().positive().optional(),
  requestSize: z.number().positive().optional(),
  responseSize: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  tokens: z.object({
    input: z.number().int().positive().optional(),
    output: z.number().int().positive().optional(),
    total: z.number().int().positive().optional()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional()
});

const bulkMetricsSchema = z.object({
  metrics: z.array(createMetricSchema).min(1).max(100)
});

// GET /api/metrics - Get metrics with filtering and pagination
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
      apiKeyId: searchParams.get('apiKeyId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      statusCode: searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : undefined,
      endpoint: searchParams.get('endpoint') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      userId: session.user.id
    };

    const validation = metricsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const query = {
      ...validation.data,
      userId: session.user.id,
      startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
    };

    const result = await MetricsService.getMetrics(query);

    return createResponse(result.metrics, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch metrics',
      500
    );
  }
}

// POST /api/metrics - Ingest new metric
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
    
    const validation = createMetricSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const metricData = {
      ...validation.data,
      userId: session.user.id,
      timestamp: validation.data.timestamp ? new Date(validation.data.timestamp) : undefined
    };

    const metric = await MetricsService.ingest(metricData);

    return createResponse(metric);

  } catch (error) {
    console.error('Error ingesting metric:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createErrorResponse(
          ErrorCodes.NOT_FOUND,
          error.message,
          404
        );
      }
    }

    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to ingest metric',
      500
    );
  }
}

// POST /api/metrics/bulk - Bulk ingest metrics
export async function PUT(request: NextRequest) {
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
    
    const validation = bulkMetricsSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const metricsData = validation.data.metrics.map(metric => ({
      ...metric,
      userId: session.user.id,
      timestamp: metric.timestamp ? new Date(metric.timestamp) : undefined
    }));

    const metrics = await MetricsService.bulkIngest(metricsData);

    return createResponse({
      ingested: metrics.length,
      metrics
    });

  } catch (error) {
    console.error('Error bulk ingesting metrics:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to bulk ingest metrics',
      500
    );
  }
}