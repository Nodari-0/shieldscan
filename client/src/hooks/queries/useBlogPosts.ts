/**
 * useBlogPosts Hook
 * 
 * Fetches and caches blog posts
 */

import { useQuery } from '@tanstack/react-query';
import { getAllBlogPosts, getBlogPostById, BlogPost, BlogPostDetail } from '@/lib/blog';
import { queryKeys } from '@/lib/react-query';

/**
 * Fetch all blog posts
 */
export function useBlogPosts() {
  return useQuery({
    queryKey: queryKeys.blogPosts,
    queryFn: getAllBlogPosts,
    staleTime: 60 * 60 * 1000, // 1 hour - blog posts don't change often
  });
}

/**
 * Fetch a single blog post by ID
 */
export function useBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blogPost(id || ''),
    queryFn: async () => {
      if (!id) return null;
      return getBlogPostById(id);
    },
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

