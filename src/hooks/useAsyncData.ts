/**
 * useAsyncData Hook
 *
 * Generic hook for handling async data fetching with loading and error states.
 * Replaces repetitive data loading patterns across components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseAsyncDataOptions {
  /**
   * Whether to fetch data immediately on mount
   */
  immediate?: boolean;

  /**
   * Dependencies that should trigger a refetch
   */
  dependencies?: unknown[];

  /**
   * Callback when data is successfully fetched
   */
  onSuccess?: <T>(data: T) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Whether to retry on error
   */
  retryOnError?: boolean;

  /**
   * Number of retry attempts
   */
  retryCount?: number;

  /**
   * Delay between retries in ms
   */
  retryDelay?: number;
}

/**
 * Custom hook for async data fetching with automatic cleanup
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): AsyncDataState<T> {
  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError,
    retryOnError = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<globalThis.AbortController | null>(null);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    if (typeof window !== 'undefined' && window.AbortController) {
      abortControllerRef.current = new window.AbortController();
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetcher();

      // Only update state if component is still mounted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (err) {
      // Ignore aborted requests
      if ((err as Error).name === 'AbortError') {
        return;
      }

      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        const error = err as Error;

        // Handle retry logic
        if (retryOnError && retryCountRef.current < retryCount) {
          retryCountRef.current++;
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchData();
            }
          }, retryDelay * retryCountRef.current); // Exponential backoff
        } else {
          setError(error);
          setLoading(false);
          onError?.(error);
          retryCountRef.current = 0;
        }
      }
    }
  }, [fetcher, onSuccess, onError, retryOnError, retryCount, retryDelay]);

  // Memoized refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  // Initial fetch and dependency tracking
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      // Cleanup: Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { data, loading, error, refetch };
}

/**
 * Hook for fetching data with pagination
 */
export function usePaginatedData<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  pageSize = 10,
  options: UseAsyncDataOptions = {}
) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const paginatedFetcher = useCallback(async () => {
    const result = await fetcher(page, pageSize);

    if (page === 1) {
      setAllItems(result.items);
    } else {
      setAllItems((prev) => [...prev, ...result.items]);
    }

    setHasMore(allItems.length + result.items.length < result.total);

    return result;
  }, [fetcher, page, pageSize, allItems.length]);

  const { data, loading, error, refetch } = useAsyncData(paginatedFetcher, {
    ...options,
    dependencies: [page, ...(options.dependencies || [])],
  });

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
  }, []);

  return {
    items: allItems,
    total: data?.total || 0,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch,
  };
}

/**
 * Hook for managing async mutations (create, update, delete)
 */
export function useAsyncMutation<TArgs, TResult>(
  mutator: (args: TArgs) => Promise<TResult>,
  options: Omit<UseAsyncDataOptions, 'immediate' | 'dependencies'> = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      try {
        setLoading(true);
        setError(null);

        const res = await mutator(args);

        setResult(res);
        setLoading(false);
        onSuccess?.(res);

        return res;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setLoading(false);
        onError?.(error);

        return null;
      }
    },
    [mutator, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, result, reset };
}
