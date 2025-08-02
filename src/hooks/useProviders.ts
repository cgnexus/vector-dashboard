import useSWR from 'swr';

interface ProviderStats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequest?: Date;
}

interface Provider {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  baseUrl?: string;
  status: 'active' | 'inactive' | 'maintenance';
  stats: ProviderStats;
  createdAt: string;
  updatedAt: string;
}

interface ProvidersResponse {
  data: Provider[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = async (url: string): Promise<ProvidersResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch providers');
  }
  const result = await response.json();
  return {
    data: result.data,
    meta: result.meta
  };
};

export function useProviders(options?: {
  status?: 'active' | 'inactive' | 'maintenance';
  search?: string;
  page?: number;
  limit?: number;
  refreshInterval?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const url = `/api/providers${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ProvidersResponse>(
    url,
    fetcher,
    {
      refreshInterval: options?.refreshInterval || 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    providers: data?.data,
    meta: data?.meta,
    isLoading,
    error,
    mutate
  };
}

export type { Provider, ProviderStats, ProvidersResponse };