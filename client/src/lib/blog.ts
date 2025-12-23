/**
 * Blog data utility functions
 * 
 * Currently reads from JSON files in /data/blog/
 * Can be easily switched to Firestore by replacing these functions
 */

import blogPostsList from '@/data/blog/posts.json';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
}

export interface BlogPostDetail extends BlogPost {
  content: string;
}

/**
 * Get all blog posts (listing page)
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // TODO: Switch to Firestore later
  // return await getDocs(collection(db, 'blog_posts'));
  
  return blogPostsList as BlogPost[];
}

/**
 * Get a single blog post by ID (detail page)
 */
export async function getBlogPostById(id: string): Promise<BlogPostDetail | null> {
  // TODO: Switch to Firestore later
  // const docRef = doc(db, 'blog_posts', id);
  // const docSnap = await getDoc(docRef);
  // if (docSnap.exists()) {
  //   return { id: docSnap.id, ...docSnap.data() } as BlogPostDetail;
  // }
  
  try {
    const postMeta = blogPostsList.find(post => post.id === id);
    
    if (!postMeta) {
      return null;
    }
    
    // Dynamic import of the JSON file for the specific blog post
    let postContent;
    try {
      if (id === '1') {
        postContent = await import('@/data/blog/1.json');
      } else if (id === '2') {
        postContent = await import('@/data/blog/2.json');
      } else {
        // For future posts, use dynamic import
        postContent = await import(`@/data/blog/${id}.json`);
      }
    } catch (importError) {
      console.error(`Error importing blog post content for ${id}:`, importError);
      return null;
    }
    
    const content = postContent.default?.content || postContent.content || '';
    
    return {
      ...postMeta,
      content,
    } as BlogPostDetail;
  } catch (error) {
    console.error(`Error loading blog post ${id}:`, error);
    return null;
  }
}

