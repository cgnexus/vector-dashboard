import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

interface UseLoadingStateReturn<T> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setData: (data: T) => void;
  reset: () => void;
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>;
}

export function useLoadingState<T = any>(initialData: T | null = null): UseLoadingStateReturn<T> {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData
    });
  }, [initialData]);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setLoading, setData, setError]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    setLoading,
    setError,
    setData,
    reset,
    execute
  };
}

// Utility hook for managing multiple loading states
export function useMultipleLoadingStates<T extends Record<string, any>>(
  keys: (keyof T)[]
): Record<keyof T, UseLoadingStateReturn<any>> {
  const states = {} as Record<keyof T, UseLoadingStateReturn<any>>;
  
  for (const key of keys) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    states[key] = useLoadingState();
  }
  
  return states;
}