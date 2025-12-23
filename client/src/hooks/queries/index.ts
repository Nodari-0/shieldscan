/**
 * Query Hooks Index
 * 
 * Re-export all query hooks for easy imports
 */

// Scan history
export {
  useScanHistory,
  useInfiniteScanHistory,
  usePrefetchScanHistory,
  useInvalidateScanHistory,
} from './useScanHistory';

// User profile
export {
  useUserProfile,
  useUpdateProfile,
  useInvalidateProfile,
} from './useUserProfile';

// Testimonials
export {
  useTestimonials,
  useCreateTestimonial,
  usePrefetchTestimonials,
} from './useTestimonials';

// Blog
export {
  useBlogPosts,
  useBlogPost,
} from './useBlogPosts';

// Admin
export {
  useAdminStats,
  useAllUsers,
  useAllScans,
  useRevenueStats,
  useAllTestimonials,
  useRefreshAdminData,
} from './useAdminData';

