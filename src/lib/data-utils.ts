// Data formatting utilities for the dashboard
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatResponseTime(ms: number): string {
  return `${Math.round(ms)}ms`;
}

export function formatErrorRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function getProviderClass(name: string): string {
  const classMap: Record<string, string> = {
    'openai': 'api-openai',
    'openrouter': 'api-openrouter',
    'exa': 'api-exa',
    'twilio': 'api-twilio',
    'apollo': 'api-apollo'
  };
  return classMap[name.toLowerCase()] || 'api-default';
}

export function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'neutral' {
  if (previous === 0) return 'neutral';
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'neutral';
}

// Error handling utilities
export function isNetworkError(error: Error): boolean {
  return error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.message.includes('Failed to fetch');
}

export function getErrorMessage(error: Error | null): string {
  if (!error) return 'Unknown error occurred';
  
  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'Authentication failed. Please sign in again.';
  }
  
  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return 'Access denied. You do not have permission to view this data.';
  }
  
  if (error.message.includes('404') || error.message.includes('Not Found')) {
    return 'Requested data not found. It may have been moved or deleted.';
  }
  
  if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
    return 'Server error occurred. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred';
}

// Data validation utilities
export function isValidMetricsData(data: any): boolean {
  return data && 
         typeof data.totalRequests === 'number' &&
         typeof data.totalCost === 'number' &&
         typeof data.averageResponseTime === 'number' &&
         typeof data.errorRate === 'number';
}

export function isValidProviderData(data: any): boolean {
  return data && 
         Array.isArray(data) &&
         data.every(provider => 
           provider.id && 
           provider.name && 
           provider.displayName &&
           provider.status &&
           provider.stats
         );
}

export function isValidAlertsData(data: any): boolean {
  return data && 
         Array.isArray(data) &&
         data.every(alert => 
           alert.id && 
           alert.type && 
           alert.severity && 
           alert.message &&
           alert.createdAt
         );
}