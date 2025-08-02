# Nexus Dashboard API Endpoints

This document outlines all the API endpoints available in the Nexus dashboard for managing API providers, metrics, alerts, and budgets.

## Authentication

All endpoints require authentication. Include the session token in your requests.

## API Providers

### GET /api/providers
Get all API providers with statistics.

**Query Parameters:**
- `status` (optional): `active`, `inactive`, `maintenance`
- `search` (optional): Search by name or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "provider_123",
      "name": "openai",
      "displayName": "OpenAI",
      "description": "OpenAI API services",
      "baseUrl": "https://api.openai.com",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "stats": {
        "totalApiKeys": 5,
        "activeApiKeys": 4,
        "totalRequests": 1000,
        "totalCost": 25.50,
        "averageResponseTime": 750,
        "errorRate": 2.5,
        "lastRequest": "2024-01-01T12:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### POST /api/providers
Create a new API provider (admin only).

**Request Body:**
```json
{
  "name": "anthropic",
  "displayName": "Anthropic",
  "description": "Anthropic Claude API",
  "baseUrl": "https://api.anthropic.com",
  "status": "active"
}
```

### GET /api/providers/[id]
Get a specific provider with detailed statistics.

### PUT /api/providers/[id]
Update a provider (admin only).

### DELETE /api/providers/[id]
Delete a provider (admin only).

### GET /api/providers/[id]/health
Get provider health status and incidents.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 99.5,
    "averageResponseTime": 850,
    "errorRate": 1.2,
    "lastCheck": "2024-01-01T12:00:00Z",
    "incidents": [
      {
        "timestamp": "2024-01-01T10:00:00Z",
        "type": "slow_response",
        "severity": "medium",
        "description": "Slow response (5500ms) on /v1/chat/completions"
      }
    ]
  }
}
```

### GET /api/providers/trending
Get trending providers by usage growth.

**Query Parameters:**
- `limit` (optional): Number of providers (default: 5, max: 20)

## Metrics

### GET /api/metrics
Get API metrics with filtering and pagination.

**Query Parameters:**
- `providerId` (optional): Filter by provider
- `apiKeyId` (optional): Filter by API key
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string
- `statusCode` (optional): Filter by HTTP status code
- `endpoint` (optional): Search by endpoint
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

### POST /api/metrics
Ingest a new metric.

**Request Body:**
```json
{
  "providerId": "provider_123",
  "apiKeyId": "key_456",
  "endpoint": "/v1/chat/completions",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 850,
  "requestSize": 1024,
  "responseSize": 2048,
  "cost": 0.002,
  "tokens": {
    "input": 100,
    "output": 150,
    "total": 250
  },
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

### PUT /api/metrics
Bulk ingest metrics (up to 100 at once).

### GET /api/metrics/aggregated
Get aggregated metrics summary.

**Query Parameters:**
- `providerId` (optional): Filter by provider
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 10000,
    "totalCost": 250.75,
    "totalTokens": 500000,
    "averageResponseTime": 750,
    "errorRate": 2.1,
    "successRate": 97.9,
    "uniqueEndpoints": 15
  }
}
```

### GET /api/metrics/timeseries
Get time series data for charts.

**Query Parameters:**
- `interval`: `hour`, `day`, `week` (default: hour)
- `providerId` (optional): Filter by provider
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string

### GET /api/metrics/realtime
Get real-time metrics (last 5 minutes).

**Response:**
```json
{
  "success": true,
  "data": {
    "currentRPS": 2.5,
    "currentErrorRate": 1.8,
    "currentResponseTime": 820,
    "activeEndpoints": 8,
    "recentRequests": [...]
  }
}
```

### GET /api/metrics/health-score
Get overall API health score.

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "scores": {
      "availability": 99,
      "performance": 82,
      "reliability": 88,
      "cost": 71
    },
    "factors": [
      {
        "factor": "Availability",
        "score": 99,
        "weight": 0.3,
        "description": "Percentage of successful requests"
      }
    ]
  }
}
```

## Alerts

### GET /api/alerts
Get alerts with filtering and pagination.

**Query Parameters:**
- `providerId` (optional): Filter by provider
- `type` (optional): `cost_threshold`, `rate_limit`, `error_rate`, `downtime`, `budget_exceeded`, `slow_response`
- `severity` (optional): `low`, `medium`, `high`, `critical`
- `isRead` (optional): Filter by read status
- `isResolved` (optional): Filter by resolved status
- `startDate` (optional): ISO datetime string
- `endDate` (optional): ISO datetime string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)

### POST /api/alerts
Create a new alert.

**Request Body:**
```json
{
  "providerId": "provider_123",
  "type": "error_rate",
  "severity": "high",
  "title": "High Error Rate Detected",
  "message": "Error rate of 15.2% detected in the last hour",
  "metadata": {
    "errorRate": 15.2,
    "timeWindow": "1hour"
  }
}
```

### PATCH /api/alerts
Bulk actions on alerts.

**Request Body:**
```json
{
  "alertIds": ["alert_1", "alert_2"],
  "action": "markRead"
}
```

### GET /api/alerts/[id]
Get a specific alert.

### PATCH /api/alerts/[id]
Update an alert (mark as read/resolved).

### DELETE /api/alerts/[id]
Delete an alert.

### GET /api/alerts/stats
Get alert statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "unread": 12,
    "unresolved": 8,
    "recentCount": 3,
    "byType": {
      "cost_threshold": 10,
      "error_rate": 15,
      "slow_response": 8,
      "downtime": 2,
      "budget_exceeded": 5,
      "rate_limit": 5
    },
    "bySeverity": {
      "low": 20,
      "medium": 15,
      "high": 8,
      "critical": 2
    }
  }
}
```

### POST /api/alerts/generate
Generate alerts based on current metrics.

## Budgets

### GET /api/budgets
Get budgets with spending data.

**Query Parameters:**
- `providerId` (optional): Filter by provider
- `period` (optional): `daily`, `weekly`, `monthly`, `yearly`
- `isActive` (optional): Filter by active status
- `isOverBudget` (optional): Filter by over-budget status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "budget_123",
      "userId": "user_456",
      "providerId": "provider_789",
      "name": "OpenAI Monthly Budget",
      "amount": "1000.00",
      "period": "monthly",
      "alertThreshold": "80.00",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "provider": {
        "id": "provider_789",
        "name": "openai",
        "displayName": "OpenAI"
      },
      "currentSpending": 750.25,
      "spendingPercentage": 75.03,
      "remainingAmount": 249.75,
      "daysLeft": 12,
      "isOverBudget": false,
      "projectedSpend": 950.00,
      "spendingTrend": "stable"
    }
  ]
}
```

### POST /api/budgets
Create a new budget.

**Request Body:**
```json
{
  "providerId": "provider_123",
  "name": "OpenAI Monthly Budget",
  "amount": 1000,
  "period": "monthly",
  "alertThreshold": 80
}
```

### GET /api/budgets/[id]
Get a specific budget with spending data.

### PUT /api/budgets/[id]
Update a budget.

### DELETE /api/budgets/[id]
Delete a budget.

### GET /api/budgets/analytics
Get budget analytics and insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBudgets": 8,
    "activeBudgets": 6,
    "overBudgetCount": 1,
    "totalAllocated": 5000.00,
    "totalSpent": 3250.75,
    "averageUtilization": 65.02,
    "savingsOpportunities": [
      {
        "budgetId": "budget_123",
        "budgetName": "Claude API Budget",
        "suggestedReduction": 150.00,
        "reasoning": "Low utilization (25%) with stable trend"
      }
    ]
  }
}
```

### GET /api/budgets/[id]/forecast
Get spending forecast for a specific budget.

**Response:**
```json
{
  "success": true,
  "data": {
    "budgetId": "budget_123",
    "currentPeriodSpend": 750.25,
    "projectedSpend": 950.00,
    "budgetAmount": 1000.00,
    "projectedOverage": 0,
    "daysToOverage": null,
    "confidence": "high"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

## Rate Limiting

All endpoints are rate limited to prevent abuse. Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## Pagination

List endpoints support pagination with consistent response format:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```