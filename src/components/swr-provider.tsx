'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global fetcher function
        fetcher: async (url: string) => {
          const response = await fetch(url);
          if (!response.ok) {
            const error = new Error('An error occurred while fetching the data.');
            // Attach extra info to the error object
            (error as any).info = await response.json();
            (error as any).status = response.status;
            throw error;
          }
          return response.json();
        },
        // Global error retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // Global revalidation settings
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        // Dedupe interval for same requests
        dedupingInterval: 2000,
        // Background refresh interval
        refreshInterval: 0, // Disabled by default, can be overridden per hook
        // Error handling
        onError: (error, key) => {
          console.error('SWR Error:', error, 'Key:', key);
          // You could add error reporting here
        },
        // Success handling
        onSuccess: (data, key) => {
          // Optional: Log successful requests in development
          if (process.env.NODE_ENV === 'development') {
            console.log('SWR Success:', key, data);
          }
        },
        // Loading timeout
        loadingTimeout: 10000, // 10 seconds
        // Cache provider - use default Map
        // You could use a more sophisticated cache like Redis in production
        provider: () => new Map(),
        // Compare function for data equality
        compare: (a, b) => {
          // Custom comparison logic if needed
          return JSON.stringify(a) === JSON.stringify(b);
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}