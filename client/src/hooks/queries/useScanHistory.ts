/**
 * useScanHistory Hook
 * 
 * Fetches and caches user's scan history with pagination support
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getUserScans, ScanRecord } from '@/firebase/firestore';
import { queryKeys } from '@/lib/react-query';

interface UseScanHistoryOptions {
  enabled?: boolean;
  limit?: number;
}

/**
 * Fetch paginated scan history for a user
 */
export function useScanHistory(
  userId: string | undefined,
  options: UseScanHistoryOptions = {}
) {
  const { enabled = true, limit = 20 } = options;

  return useQuery({
    queryKey: queryKeys.scanHistory(userId || '', 1),
    queryFn: async () => {
      if (!userId) return [];
      const scans = await getUserScans(userId);
      return scans.slice(0, limit);
    },
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch all scan history with infinite scroll support
 */
export function useInfiniteScanHistory(
  userId: string | undefined,
  options: UseScanHistoryOptions = {}
) {
  const { enabled = true, limit = 10 } = options;

  return useInfiniteQuery({
    queryKey: ['scans', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { scans: [], nextPage: null };
      const allScans = await getUserScans(userId);
      const start = pageParam * limit;
      const scans = allScans.slice(start, start + limit);
      return {
        scans,
        nextPage: scans.length === limit ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: enabled && !!userId,
  });
}

/**
 * Prefetch scan history for better UX
 */
export function usePrefetchScanHistory() {
  const queryClient = useQueryClient();

  return async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.scanHistory(userId, 1),
      queryFn: () => getUserScans(userId),
    });
  };
}

/**
 * Invalidate scan history cache (call after new scan)
 */
export function useInvalidateScanHistory() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['scans', userId] });
    queryClient.invalidateQueries({ queryKey: ['scans', 'infinite', userId] });
  };
}

