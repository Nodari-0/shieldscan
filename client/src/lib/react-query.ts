/**
 * React Query Configuration
 * 
 * Central configuration for data fetching, caching, and state management
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a new QueryClient with optimized defaults
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache data for 10 minutes after component unmount
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus (can be annoying)
        refetchOnWindowFocus: false,
        // Only retry failed requests once
        retry: 1,
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Show errors in console in development
        onError: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Mutation error:', error);
          }
        },
      },
    },
  });
}

// Singleton for client-side usage
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get or create QueryClient
 * Returns singleton on client, new instance on server
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  // User related
  user: ['user'] as const,
  userProfile: (userId: string) => ['userProfile', userId] as const,
  
  // Scans
  scans: ['scans'] as const,
  scanHistory: (userId: string, page?: number) => ['scans', userId, page] as const,
  scanDetail: (scanId: string) => ['scan', scanId] as const,
  
  // Admin
  adminStats: ['adminStats'] as const,
  allUsers: (page?: number) => ['admin', 'users', page] as const,
  allScans: (page?: number) => ['admin', 'scans', page] as const,
  revenue: ['admin', 'revenue'] as const,
  
  // Blog
  blogPosts: ['blogPosts'] as const,
  blogPost: (id: string) => ['blogPost', id] as const,
  
  // Testimonials
  testimonials: ['testimonials'] as const,
  
  // Scan limits
  scanLimits: (userId: string) => ['scanLimits', userId] as const,
};

