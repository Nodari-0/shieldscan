/**
 * useTestimonials Hook
 * 
 * Fetches and caches approved testimonials
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovedTestimonials, createTestimonial, Testimonial } from '@/firebase/firestore';
import { queryKeys } from '@/lib/react-query';

/**
 * Fetch approved testimonials
 */
export function useTestimonials() {
  return useQuery({
    queryKey: queryKeys.testimonials,
    queryFn: getApprovedTestimonials,
    staleTime: 60 * 60 * 1000, // 1 hour - testimonials don't change often
  });
}

/**
 * Create a new testimonial
 */
export function useCreateTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      userName: string;
      userEmail: string;
      rating: number;
      message: string;
    }) => {
      return createTestimonial(data);
    },
    onSuccess: () => {
      // Don't invalidate immediately since testimonials need approval
      // But we could show a success message
    },
  });
}

/**
 * Prefetch testimonials for landing page
 */
export function usePrefetchTestimonials() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.testimonials,
      queryFn: getApprovedTestimonials,
    });
  };
}

