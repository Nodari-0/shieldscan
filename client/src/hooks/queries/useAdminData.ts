/**
 * useAdminData Hooks
 * 
 * Admin panel data fetching with caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllUsers,
  getAllScans,
  getRevenueStats,
  getAdminStats,
  getAllTestimonials,
  UserProfile,
  ScanRecord,
  Testimonial,
} from '@/firebase/firestore';
import { queryKeys } from '@/lib/react-query';

/**
 * Fetch admin dashboard stats
 */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: getAdminStats,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
  });
}

/**
 * Fetch all users (admin only)
 */
export function useAllUsers() {
  return useQuery({
    queryKey: queryKeys.allUsers(),
    queryFn: getAllUsers,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch all scans (admin only)
 */
export function useAllScans() {
  return useQuery({
    queryKey: queryKeys.allScans(),
    queryFn: getAllScans,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch revenue stats (admin only)
 */
export function useRevenueStats() {
  return useQuery({
    queryKey: queryKeys.revenue,
    queryFn: getRevenueStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all testimonials for admin review
 */
export function useAllTestimonials() {
  return useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: getAllTestimonials,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Refresh all admin data
 */
export function useRefreshAdminData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
  };
}

