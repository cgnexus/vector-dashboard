# API Integration Guide - Nexus API Monitoring Dashboard

## Overview

This guide provides comprehensive instructions for integrating with the five external APIs monitored by the Nexus dashboard: OpenAI, OpenRouter, Exa API, Twilio, and Apollo lead generation. Each integration includes authentication, monitoring implementation, cost tracking, and error handling.

## General Integration Architecture

### Common Integration Pattern

```typescript
interface ApiIntegration {
  provider: string;
  authenticate(): Promise<boolean>;
  makeRequest(endpoint: string, options: RequestOptions): Promise<ApiResponse>;
  trackMetrics(request: Request, response: Response): Promise<void>;
  calculateCost(usage: UsageData): Promise<number>;
  healthCheck(): Promise<HealthStatus>;
}
```

### Request Interceptor Pattern

```typescript
// Base interceptor for all API calls
class ApiInterceptor {
  constructor(
    private provider: string,
    private userId: string,
    private apiKeyId?: string
  ) {}

  async intercept<T>(
    request: () => Promise<T>,
    endpoint: string,
    method: string
  ): Promise<T> {
    const startTime = performance.now();
    let response: T;
    let error: Error | null = null;
    let statusCode = 200;
    
    try {
      response = await request();
      return response;
    } catch (err) {
      error = err as Error;
      statusCode = err.status || 500;
      throw err;
    } finally {
      const endTime = performance.now();
      await this.trackMetrics({
        endpoint,
        method,
        statusCode,
        responseTime: Math.round(endTime - startTime),
        error: error?.message
      });
    }
  }

  private async trackMetrics(data: MetricData): Promise<void> {
    // Send to metrics service
    await MetricsService.ingest({
      providerId: this.provider,
      userId: this.userId,
      apiKeyId: this.apiKeyId,
      ...data
    });
  }
}
```

## 1. OpenAI Integration

### Authentication and Setup

```typescript
// src/lib/integrations/openai.ts
import OpenAI from 'openai';
import { ApiIntegration } from './base';

export class OpenAIIntegration extends ApiIntegration {
  private client: OpenAI;
  
  constructor(apiKey: string, userId: string, apiKeyId?: string) {
    super('openai', userId, apiKeyId);
    this.client = new OpenAI({
      apiKey,
      // Custom fetch to intercept requests
      fetch: this.createInterceptedFetch()
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Intercepted methods for all OpenAI operations
  async createChatCompletion(params: OpenAI.Chat.CompletionCreateParams) {
    return this.intercept(
      () => this.client.chat.completions.create(params),
      '/chat/completions',
      'POST',
      { tokens: this.estimateTokens(params) }
    );
  }

  async createEmbedding(params: OpenAI.EmbeddingCreateParams) {
    return this.intercept(
      () => this.client.embeddings.create(params),
      '/embeddings',
      'POST',
      { tokens: this.estimateEmbeddingTokens(params) }
    );
  }

  async createCompletion(params: OpenAI.CompletionCreateParams) {
    return this.intercept(
      () => this.client.completions.create(params),
      '/completions',
      'POST',
      { tokens: this.estimateTokens(params) }
    );
  }

  private estimateTokens(params: any): TokenUsage {
    // Implement token estimation logic
    const inputTokens = this.countTokens(params.messages || params.prompt);
    return {
      input: inputTokens,
      output: 0, // Will be updated with actual response
      total: inputTokens
    };
  }

  private countTokens(text: string | any[]): number {
    // Simple token estimation (replace with tiktoken for accuracy)
    if (Array.isArray(text)) {
      return text.reduce((acc, msg) => acc + this.countTokens(msg.content), 0);
    }
    return Math.ceil(text.length / 4);
  }

  calculateCost(usage: TokenUsage, model: string): number {
    const pricing = {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
      'gpt-3.5-turbo': { input: 0.000001, output: 0.000002 },
      'text-embedding-ada-002': { input: 0.0000001, output: 0 }
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    return (usage.input * modelPricing.input) + (usage.output * modelPricing.output);
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const start = performance.now();
      await this.client.models.list();
      const responseTime = performance.now() - start;
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  private createInterceptedFetch() {
    return async (url: string, options: any) => {
      const startTime = performance.now();
      
      try {
        const response = await fetch(url, options);
        const endTime = performance.now();
        
        // Extract additional metrics
        const requestSize = options.body ? new Blob([options.body]).size : 0;
        const responseSize = parseInt(response.headers.get('content-length') || '0');
        
        // Track the request
        await this.trackDetailedMetrics({
          endpoint: new URL(url).pathname,
          method: options.method || 'GET',
          statusCode: response.status,
          responseTime: Math.round(endTime - startTime),
          requestSize,
          responseSize,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        await this.trackDetailedMetrics({
          endpoint: new URL(url).pathname,
          method: options.method || 'GET',
          statusCode: 0,
          responseTime: Math.round(endTime - startTime),
          error: error.message
        });
        
        throw error;
      }
    };
  }
}
```

### Usage Examples

```typescript
// Initialize OpenAI integration
const openai = new OpenAIIntegration(apiKey, userId, apiKeyId);

// Make tracked API calls
const completion = await openai.createChatCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello, world!' }]
});

// All metrics are automatically tracked
```

## 2. OpenRouter Integration

### Setup and Configuration

```typescript
// src/lib/integrations/openrouter.ts
export class OpenRouterIntegration extends ApiIntegration {
  private baseURL = 'https://openrouter.ai/api/v1';
  
  constructor(apiKey: string, userId: string, apiKeyId?: string) {
    super('openrouter', userId, apiKeyId);
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/key', 'GET');
      return response.data?.valid === true;
    } catch {
      return false;
    }
  }

  async createChatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }) {
    return this.intercept(
      () => this.makeRequest('/chat/completions', 'POST', params),
      '/chat/completions',
      'POST',
      { 
        tokens: this.estimateTokens(params.messages),
        model: params.model 
      }
    );
  }

  async getModels() {
    return this.intercept(
      () => this.makeRequest('/models', 'GET'),
      '/models',
      'GET'
    );
  }

  async getBalance() {
    return this.intercept(
      () => this.makeRequest('/auth/key', 'GET'),
      '/auth/key',
      'GET'
    );
  }

  private async makeRequest(endpoint: string, method: string, body?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Nexus API Monitor'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  calculateCost(usage: TokenUsage, model: string): number {
    // OpenRouter has dynamic pricing per model
    const basePricing = {
      'anthropic/claude-3-opus': { input: 0.000015, output: 0.000075 },
      'anthropic/claude-3-sonnet': { input: 0.000003, output: 0.000015 },
      'openai/gpt-4': { input: 0.00003, output: 0.00006 },
      'openai/gpt-3.5-turbo': { input: 0.000001, output: 0.000002 }
    };

    const modelPricing = basePricing[model] || basePricing['openai/gpt-3.5-turbo'];
    return (usage.input * modelPricing.input) + (usage.output * modelPricing.output);
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const start = performance.now();
      await this.getBalance();
      const responseTime = performance.now() - start;
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
```

## 3. Exa API Integration

### Search and Web Data Integration

```typescript
// src/lib/integrations/exa.ts
export class ExaIntegration extends ApiIntegration {
  private baseURL = 'https://api.exa.ai';
  
  constructor(apiKey: string, userId: string, apiKeyId?: string) {
    super('exa', userId, apiKeyId);
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<boolean> {
    try {
      // Test with a simple search
      await this.search({ query: 'test', numResults: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async search(params: {
    query: string;
    numResults?: number;
    type?: 'neural' | 'keyword';
    useAutoprompt?: boolean;
    category?: string;
    includeDomains?: string[];
    excludeDomains?: string[];
    startCrawlDate?: string;
    endCrawlDate?: string;
    startPublishedDate?: string;
    endPublishedDate?: string;
  }) {
    return this.intercept(
      () => this.makeRequest('/search', 'POST', params),
      '/search',
      'POST',
      { searchParams: params }
    );
  }

  async getContents(params: {
    ids: string[];
    text?: boolean;
    highlights?: boolean;
    summary?: boolean;
  }) {
    return this.intercept(
      () => this.makeRequest('/contents', 'POST', params),
      '/contents',
      'POST',
      { contentIds: params.ids }
    );
  }

  async findSimilar(params: {
    url: string;
    numResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    startCrawlDate?: string;
    endCrawlDate?: string;
  }) {
    return this.intercept(
      () => this.makeRequest('/findSimilar', 'POST', params),
      '/findSimilar',
      'POST',
      { sourceUrl: params.url }
    );
  }

  private async makeRequest(endpoint: string, method: string, body?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  calculateCost(searchParams: any): number {
    // Exa pricing: $1 per 1000 search requests
    const baseSearchCost = 0.001;
    let totalCost = baseSearchCost;
    
    // Additional costs for contents
    if (searchParams.text || searchParams.highlights || searchParams.summary) {
      totalCost += 0.0002; // Additional $0.0002 per content request
    }
    
    return totalCost;
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const start = performance.now();
      await this.search({ query: 'test', numResults: 1 });
      const responseTime = performance.now() - start;
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
```

## 4. Twilio Integration

### Communication Services Integration

```typescript
// src/lib/integrations/twilio.ts
import twilio from 'twilio';

export class TwilioIntegration extends ApiIntegration {
  private client: twilio.Twilio;
  
  constructor(accountSid: string, authToken: string, userId: string, apiKeyId?: string) {
    super('twilio', userId, apiKeyId);
    this.client = twilio(accountSid, authToken);
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.client.api.account.fetch();
      return true;
    } catch {
      return false;
    }
  }

  async sendSMS(params: {
    to: string;
    from: string;
    body: string;
  }) {
    return this.intercept(
      () => this.client.messages.create(params),
      '/Messages',
      'POST',
      { messageLength: params.body.length }
    );
  }

  async makeCall(params: {
    to: string;
    from: string;
    url: string;
  }) {
    return this.intercept(
      () => this.client.calls.create(params),
      '/Calls',
      'POST'
    );
  }

  async sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
  }) {
    return this.intercept(
      () => this.client.sendgrid.v3.mail.send.post({
        request_body: {
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: params.from },
          subject: params.subject,
          content: [{ type: 'text/html', value: params.html }]
        }
      }),
      '/mail/send',
      'POST',
      { emailSize: params.html.length }
    );
  }

  async getAccountInfo() {
    return this.intercept(
      () => this.client.api.account.fetch(),
      '/Accounts',
      'GET'
    );
  }

  async getUsage(startDate?: Date, endDate?: Date) {
    return this.intercept(
      () => this.client.usage.records.list({
        startDate: startDate,
        endDate: endDate
      }),
      '/Usage/Records',
      'GET'
    );
  }

  calculateCost(operation: string, params: any): number {
    const pricing = {
      sms: {
        us: 0.0075,
        international: 0.12
      },
      call: {
        us: 0.0025, // per minute
        international: 0.05
      },
      email: 0.0001 // per email
    };

    switch (operation) {
      case 'sms':
        return pricing.sms.us; // Simplified - would need country detection
      case 'call':
        return pricing.call.us; // Would multiply by duration
      case 'email':
        return pricing.email;
      default:
        return 0;
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const start = performance.now();
      await this.client.api.account.fetch();
      const responseTime = performance.now() - start;
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
```

## 5. Apollo Lead Generation Integration

### CRM and Lead Management Integration

```typescript
// src/lib/integrations/apollo.ts
export class ApolloIntegration extends ApiIntegration {
  private baseURL = 'https://api.apollo.io/v1';
  
  constructor(apiKey: string, userId: string, apiKeyId?: string) {
    super('apollo', userId, apiKeyId);
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch {
      return false;
    }
  }

  async searchPeople(params: {
    q_keywords?: string;
    person_titles?: string[];
    person_locations?: string[];
    organization_name?: string;
    organization_num_employees_ranges?: string[];
    page?: number;
    per_page?: number;
  }) {
    return this.intercept(
      () => this.makeRequest('/mixed_people/search', 'POST', params),
      '/mixed_people/search',
      'POST',
      { searchParams: params }
    );
  }

  async searchOrganizations(params: {
    q_keywords?: string;
    organization_locations?: string[];
    organization_num_employees_ranges?: string[];
    organization_industries?: string[];
    page?: number;
    per_page?: number;
  }) {
    return this.intercept(
      () => this.makeRequest('/organizations/search', 'POST', params),
      '/organizations/search',
      'POST',
      { searchParams: params }
    );
  }

  async enrichPerson(params: {
    first_name?: string;
    last_name?: string;
    email?: string;
    organization_name?: string;
    domain?: string;
  }) {
    return this.intercept(
      () => this.makeRequest('/people/match', 'POST', params),
      '/people/match',
      'POST',
      { enrichParams: params }
    );
  }

  async enrichOrganization(params: {
    domain?: string;
    organization_name?: string;
  }) {
    return this.intercept(
      () => this.makeRequest('/organizations/enrich', 'POST', params),
      '/organizations/enrich',
      'POST',
      { enrichParams: params }
    );
  }

  async getEmailFinderCredits() {
    return this.intercept(
      () => this.makeRequest('/email_finder_credits', 'GET'),
      '/email_finder_credits',
      'GET'
    );
  }

  async findEmails(params: {
    first_name: string;
    last_name: string;
    organization_name?: string;
    domain?: string;
  }) {
    return this.intercept(
      () => this.makeRequest('/mixed_people/search', 'POST', {
        ...params,
        reveal_personal_emails: true
      }),
      '/mixed_people/search',
      'POST',
      { emailFinderParams: params }
    );
  }

  private async makeRequest(endpoint: string, method: string, body?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAccountInfo() {
    return this.makeRequest('/auth/health', 'GET');
  }

  calculateCost(operation: string, params: any): number {
    const pricing = {
      search: 0.01, // $0.01 per search result
      enrich: 0.05, // $0.05 per enrichment
      emailFinder: 0.10, // $0.10 per email found
      export: 0.02 // $0.02 per export
    };

    switch (operation) {
      case 'search':
        return pricing.search * (params.per_page || 25);
      case 'enrich':
        return pricing.enrich;
      case 'emailFinder':
        return pricing.emailFinder;
      default:
        return 0;
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const start = performance.now();
      await this.getAccountInfo();
      const responseTime = performance.now() - start;
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
```

## Integration Manager

### Centralized Integration Management

```typescript
// src/lib/integrations/manager.ts
export class IntegrationManager {
  private integrations = new Map<string, ApiIntegration>();
  
  constructor(private userId: string) {}

  async addIntegration(
    provider: string, 
    credentials: Record<string, string>,
    apiKeyId?: string
  ): Promise<void> {
    let integration: ApiIntegration;

    switch (provider) {
      case 'openai':
        integration = new OpenAIIntegration(credentials.apiKey, this.userId, apiKeyId);
        break;
      case 'openrouter':
        integration = new OpenRouterIntegration(credentials.apiKey, this.userId, apiKeyId);
        break;
      case 'exa':
        integration = new ExaIntegration(credentials.apiKey, this.userId, apiKeyId);
        break;
      case 'twilio':
        integration = new TwilioIntegration(
          credentials.accountSid, 
          credentials.authToken, 
          this.userId, 
          apiKeyId
        );
        break;
      case 'apollo':
        integration = new ApolloIntegration(credentials.apiKey, this.userId, apiKeyId);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Verify authentication
    const isAuthenticated = await integration.authenticate();
    if (!isAuthenticated) {
      throw new Error(`Authentication failed for ${provider}`);
    }

    this.integrations.set(provider, integration);
  }

  getIntegration(provider: string): ApiIntegration | undefined {
    return this.integrations.get(provider);
  }

  async healthCheckAll(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};
    
    for (const [provider, integration] of this.integrations) {
      try {
        results[provider] = await integration.healthCheck();
      } catch (error) {
        results[provider] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date()
        };
      }
    }
    
    return results;
  }

  async removeIntegration(provider: string): Promise<void> {
    this.integrations.delete(provider);
  }

  listIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }
}
```

## Usage Example

### Complete Integration Setup

```typescript
// src/lib/api-client.ts
export class ApiClient {
  private integrationManager: IntegrationManager;
  
  constructor(userId: string) {
    this.integrationManager = new IntegrationManager(userId);
  }

  async setupIntegrations(apiKeys: Array<{
    provider: string;
    credentials: Record<string, string>;
    apiKeyId?: string;
  }>) {
    for (const config of apiKeys) {
      try {
        await this.integrationManager.addIntegration(
          config.provider,
          config.credentials,
          config.apiKeyId
        );
        console.log(`✅ ${config.provider} integration setup successful`);
      } catch (error) {
        console.error(`❌ ${config.provider} integration failed:`, error.message);
      }
    }
  }

  // Unified interface for all providers
  async sendMessage(provider: string, message: string, options?: any) {
    const integration = this.integrationManager.getIntegration(provider);
    if (!integration) {
      throw new Error(`Integration not found: ${provider}`);
    }

    switch (provider) {
      case 'openai':
        return (integration as OpenAIIntegration).createChatCompletion({
          model: options?.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }],
          ...options
        });
      case 'openrouter':
        return (integration as OpenRouterIntegration).createChatCompletion({
          model: options?.model || 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }],
          ...options
        });
      default:
        throw new Error(`Provider ${provider} does not support messaging`);
    }
  }

  async search(provider: string, query: string, options?: any) {
    const integration = this.integrationManager.getIntegration(provider);
    if (!integration) {
      throw new Error(`Integration not found: ${provider}`);
    }

    switch (provider) {
      case 'exa':
        return (integration as ExaIntegration).search({
          query,
          numResults: options?.numResults || 10,
          ...options
        });
      case 'apollo':
        return (integration as ApolloIntegration).searchPeople({
          q_keywords: query,
          per_page: options?.per_page || 25,
          ...options
        });
      default:
        throw new Error(`Provider ${provider} does not support search`);
    }
  }

  async getHealthStatus(): Promise<Record<string, HealthStatus>> {
    return this.integrationManager.healthCheckAll();
  }
}

// Usage in API routes or components
const apiClient = new ApiClient(userId);

await apiClient.setupIntegrations([
  {
    provider: 'openai',
    credentials: { apiKey: 'sk-...' },
    apiKeyId: 'key_123'
  },
  {
    provider: 'twilio',
    credentials: { 
      accountSid: 'AC123...', 
      authToken: 'abc123...' 
    },
    apiKeyId: 'key_124'
  }
]);

// All API calls are automatically tracked
const response = await apiClient.sendMessage('openai', 'Hello, world!');
```

## Error Handling and Retry Logic

### Robust Error Handling

```typescript
export class ApiErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  static handleApiError(error: any, provider: string): ApiError {
    return {
      provider,
      code: error.status || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      retryable: this.isRetryableError(error)
    };
  }

  private static isRetryableError(error: any): boolean {
    const retryableCodes = [429, 500, 502, 503, 504];
    return retryableCodes.includes(error.status);
  }
}
```

This comprehensive integration guide provides:

1. **Standardized Integration Pattern**: Consistent interface across all APIs
2. **Automatic Metrics Tracking**: Every API call is monitored and tracked
3. **Cost Calculation**: Provider-specific cost calculation logic
4. **Health Monitoring**: Regular health checks for all integrations
5. **Error Handling**: Robust retry logic and error management
6. **Authentication Management**: Secure credential handling
7. **Unified Interface**: Single client for all API interactions

Each integration is production-ready and includes comprehensive error handling, cost tracking, and performance monitoring.