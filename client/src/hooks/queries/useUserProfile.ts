/**
 * useUserProfile Hook
 * 
 * Fetches and manages user profile data with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile as updateProfile, UserProfile } from '@/firebase/firestore';
import { queryKeys } from '@/lib/react-query';

interface UseUserProfileOptions {
  enabled?: boolean;
}

/**
 * Fetch user profile
 */
export function useUserProfile(
  userId: string | undefined,
  options: UseUserProfileOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.userProfile(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      return getUserProfile(userId);
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user profile with optimistic updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<UserProfile>;
    }) => {
      await updateProfile(userId, data);
      return data;
    },
    onMutate: async ({ userId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.userProfile(userId) });

      // Get current data
      const previousProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.userProfile(userId)
      );

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData(queryKeys.userProfile(userId), {
          ...previousProfile,
          ...data,
        });
      }

      return { previousProfile };
    },
    onError: (err, { userId }, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.userProfile(userId),
          context.previousProfile
        );
      }
    },
    onSettled: (_, __, { userId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
    },
  });
}

/**
 * Invalidate user profile cache
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
  };
}

