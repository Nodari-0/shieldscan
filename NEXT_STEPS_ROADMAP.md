# 🤖 Cursor AI Prompts for ShieldScan Implementation

## 📋 How to Use These Prompts

1. **Copy the entire prompt** for the feature you want to implement
2. **Paste into Cursor AI Chat** (Cmd/Ctrl + L)
3. **Review the changes** before accepting
4. **Test thoroughly** after implementation
5. **Commit changes** with descriptive messages

---

## 🚀 P0 - CRITICAL IMPLEMENTATIONS

### Prompt 1: Image Optimization & Next.js Image Component

```
I need you to optimize all images in my Next.js app for better performance. Here's what to do:

CONTEXT:
- This is a Next.js 14+ app with App Router
- Images are currently using regular <img> tags
- Need to convert to Next.js <Image> component for optimization

TASKS:
1. Find ALL instances of <img> tags in these files:
   - client/src/components/landing/CostSavingsSection.tsx
   - client/src/components/landing/TestimonialsSection.tsx
   - client/src/components/dashboard/ScanDetailModal.tsx
   - client/src/app/account/page.tsx
   - client/src/app/blog/[id]/page.tsx

2. Convert each <img> to Next.js <Image> component:
   - Add proper imports: import Image from 'next/image'
   - Add width and height props (calculate from current images)
   - Add alt text if missing
   - Use priority={true} for above-the-fold images only
   - Use loading="lazy" for below-the-fold images
   - Add placeholder="blur" where appropriate

3. Update next.config.js to add image optimization config:
   ```javascript
   images: {
     formats: ['image/avif', 'image/webp'],
     deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
     minimumCacheTTL: 60,
     dangerouslyAllowSVG: true,
     contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
   }
   ```

4. For any external images, add the domain to next.config.js:
   ```javascript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: '**.example.com',
       },
     ],
   }
   ```

IMPORTANT:
- Maintain existing styling and layout
- Don't break responsive behavior
- Add proper TypeScript types
- Test that images still render correctly
- Keep accessibility (alt text) intact

Show me all the changes you'll make before implementing.
```

---

### Prompt 2: SEO & Dynamic Metadata

```
Implement comprehensive SEO improvements for my Next.js SaaS app (ShieldScan - a security scanning tool).

CONTEXT:
- Next.js 14+ App Router
- Need dynamic metadata for blog posts, scan results, and all pages
- Currently missing Open Graph, Twitter Cards, and structured data

TASKS:

1. Create SEO utility library at client/src/lib/seo.ts:
   - generateMetadata function for different page types
   - Open Graph image generator helpers
   - Twitter Card metadata
   - Canonical URL helpers
   - Structured data (JSON-LD) generators

2. Add dynamic metadata to these pages:
   
   A. Blog Post Page (client/src/app/blog/[id]/page.tsx):
   - Export generateMetadata function
   - Dynamic title: "{post.title} | ShieldScan Blog"
   - Dynamic description from post excerpt
   - Open Graph image
   - Article structured data (JSON-LD)
   - Author and publish date metadata
   
   B. Blog List Page (client/src/app/blog/page.tsx):
   - Static metadata with good description
   - Open Graph tags
   - Breadcrumb structured data
   
   C. Pricing Page (client/src/app/pricing/page.tsx):
   - Product structured data for each plan
   - Offer structured data
   - FAQ structured data if FAQ exists
   
   D. Savings Calculator (client/src/app/savings/page.tsx):
   - WebApplication structured data
   - Calculator-specific metadata

3. Create/update sitemap.ts:
   - Dynamic sitemap generation
   - Include all blog posts
   - Add priority and changefreq
   - Separate sitemap for blog if needed

4. Update/create robots.txt:
   - Allow all search engines
   - Disallow /api/, /admin/, /dashboard/
   - Add sitemap reference
   - Add crawl-delay if needed

5. Add Organization structured data to root layout:
   - Company info
   - Logo
   - Social media links
   - Contact info

EXAMPLE STRUCTURE for generateMetadata:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getBlogPost(params.id);
  
  return {
    title: `${post.title} | ShieldScan`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: [{ url: post.image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}
```

Make sure all metadata is type-safe and follows Next.js best practices.
```

---

### Prompt 3: Code Splitting & Bundle Optimization

```
Optimize bundle size and implement code splitting for my Next.js app.

CONTEXT:
- Large initial bundle size is hurting performance
- Admin panel, charts, and modals should be lazy-loaded
- Using Recharts, Stripe components, and heavy libraries

TASKS:

1. Install and configure bundle analyzer:
   ```bash
   npm install @next/bundle-analyzer
   ```
   Update next.config.js to enable it

2. Implement dynamic imports for these heavy components:
   
   A. Admin Panel (client/src/app/admin/page.tsx):
   ```typescript
   const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
     loading: () => <AdminLoadingSkeleton />,
     ssr: false,
   });
   ```
   
   B. Charts (client/src/components/dashboard/ScanHistoryChart.tsx):
   - Lazy load entire Recharts library
   - Add loading skeleton
   - ssr: false for chart components
   
   C. Modal Components:
   - ScanDetailModal
   - Any other large modals
   - Add loading states
   
   D. Stripe Components:
   - Payment forms
   - Checkout components
   - Only load when needed

3. Create loading skeleton components:
   - AdminLoadingSkeleton
   - ChartLoadingSkeleton
   - ModalLoadingSkeleton

4. Optimize imports:
   - Change default imports to named imports where possible
   - Remove unused imports across the codebase
   - Use tree-shakeable imports (e.g., import { specific } from 'library')

5. Configure webpack splitChunks in next.config.js:
   ```javascript
   webpack: (config, { isServer }) => {
     if (!isServer) {
       config.optimization.splitChunks = {
         chunks: 'all',
         cacheGroups: {
           default: false,
           vendors: false,
           commons: {
             name: 'commons',
             chunks: 'all',
             minChunks: 2,
           },
           firebase: {
             test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
             name: 'firebase',
             priority: 10,
           },
           stripe: {
             test: /[\\/]node_modules[\\/](@stripe)[\\/]/,
             name: 'stripe',
             priority: 10,
           },
         },
       };
     }
     return config;
   }
   ```

6. Add package.json sideEffects configuration for better tree-shaking

ANALYZE FIRST:
- Run bundle analyzer and show me the largest chunks
- Identify optimization opportunities
- Then implement the changes

TARGET: Reduce initial bundle by 40-60%
```

---

### Prompt 4: Enhanced Scanning Algorithms with Real Security Tools

```
Upgrade the security scanning algorithms to use industry-standard tools and provide real vulnerability detection.

CONTEXT:
- Current scanning is basic and not comprehensive
- Need real SSL/TLS analysis, security headers, DNS security, and vulnerability scanning
- Must be production-ready and accurate

TASKS:

1. Create modular scanner architecture:
   
   File structure:
   ```
   client/src/lib/scanners/
   ├── index.ts (orchestrator)
   ├── sslScanner.ts
   ├── headerScanner.ts
   ├── dnsScanner.ts
   ├── vulnerabilityScanner.ts
   ├── portScanner.ts
   └── types.ts
   ```

2. SSL/TLS Scanner (sslScanner.ts):
   - Install: npm install ssl-checker
   - Check certificate validity and expiration
   - Test TLS versions (1.0, 1.1, 1.2, 1.3)
   - Analyze cipher suites
   - Check for: POODLE, BEAST, FREAK vulnerabilities
   - Verify OCSP stapling
   - Validate certificate chain
   - Grade the SSL configuration (A+ to F)

3. Security Headers Scanner (headerScanner.ts):
   - Check for all security headers:
     * Content-Security-Policy
     * Strict-Transport-Security (HSTS)
     * X-Frame-Options
     * X-Content-Type-Options
     * Referrer-Policy
     * Permissions-Policy
   - Validate CSP syntax
   - Check HSTS preload eligibility
   - Provide specific recommendations for missing headers

4. DNS Security Scanner (dnsScanner.ts):
   - Install: npm install dns2 or use native dns
   - Check DNSSEC validation
   - Test for DNS over HTTPS (DoH) support
   - Check for DNS rebinding vulnerabilities
   - Verify SPF, DKIM, DMARC records
   - Check for subdomain takeover risks

5. Vulnerability Scanner (vulnerabilityScanner.ts):
   - Check for common vulnerabilities:
     * SQL injection points (safe testing only)
     * XSS vulnerabilities (safe payloads)
     * Exposed sensitive files (.env, .git, etc.)
     * Directory traversal
     * Insecure cookies
     * CORS misconfigurations
   - Use safe, non-destructive testing methods

6. Update main scan route (client/src/app/api/scan/route.ts):
   - Parallel execution of independent checks
   - Timeout management (30s per check max)
   - Progress tracking
   - Error handling for each scanner
   - Return partial results if some scans fail
   - Cache results for 1 hour

7. Add scan result types (client/src/lib/scanners/types.ts):
   ```typescript
   interface ScanResult {
     url: string;
     timestamp: Date;
     score: number; // 0-100
     grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
     ssl: SSLScanResult;
     headers: HeaderScanResult;
     dns: DNSScanResult;
     vulnerabilities: VulnerabilityScanResult[];
     recommendations: Recommendation[];
   }
   ```

8. Implement deterministic scanning:
   - Version all scanning algorithms
   - Same URL should produce same results (cache for 1hr)
   - Store scan configuration hash
   - Document all checks performed

REQUIREMENTS:
- Must handle timeouts gracefully
- Must return partial results if some checks fail
- Must be non-destructive (no actual attacks)
- Must provide actionable recommendations
- Must be production-ready

Show me the architecture first, then implement each scanner.
```

---

### Prompt 5: React Query Data Fetching & Caching

```
Implement React Query for better data fetching, caching, and state management across the app.

CONTEXT:
- Currently making direct Firestore queries without caching
- Repeated queries on navigation
- No pagination or infinite scroll
- Need better loading states

TASKS:

1. Install React Query:
   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   ```

2. Create React Query setup (client/src/lib/react-query.ts):
   ```typescript
   import { QueryClient } from '@tanstack/react-query';
   
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 min
         cacheTime: 10 * 60 * 1000, // 10 min
         refetchOnWindowFocus: false,
         retry: 1,
       },
     },
   });
   ```

3. Add QueryClientProvider to root layout (client/src/app/layout.tsx):
   - Wrap children with QueryClientProvider
   - Add ReactQueryDevtools in development

4. Create custom hooks for all data fetching:
   
   A. client/src/hooks/useScanHistory.ts:
   ```typescript
   export function useScanHistory(userId: string, page = 1) {
     return useQuery({
       queryKey: ['scans', userId, page],
       queryFn: () => getUserScans(userId, { page, limit: 20 }),
       keepPreviousData: true,
       enabled: !!userId,
     });
   }
   ```
   
   B. client/src/hooks/useBlogPosts.ts:
   - Fetch all blog posts
   - Cache for 1 hour
   - Add pagination support
   
   C. client/src/hooks/useUserProfile.ts:
   - Fetch current user profile
   - Optimistic updates for profile changes
   
   D. client/src/hooks/useScanDetail.ts:
   - Fetch individual scan details
   - Cache aggressively
   
   E. client/src/hooks/useTestimonials.ts:
   - Fetch testimonials
   - Cache for 1 hour

5. Implement mutations for data updates:
   
   A. client/src/hooks/mutations/useUpdateProfile.ts:
   ```typescript
   export function useUpdateProfile() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: updateUserProfile,
       onSuccess: () => {
         queryClient.invalidateQueries(['userProfile']);
       },
       onMutate: async (newData) => {
         // Optimistic update
       },
     });
   }
   ```
   
   B. Create mutations for:
   - Creating scans
   - Deleting scans
   - Updating settings
   - Saving preferences

6. Add pagination to scan history:
   - Implement cursor-based pagination in Firestore queries
   - Add "Load More" button or infinite scroll
   - Use keepPreviousData for smooth transitions

7. Update all components to use these hooks:
   - Replace direct Firestore calls with hooks
   - Remove local state for server data
   - Use query loading/error states
   - Add proper loading skeletons

8. Optimize Firestore queries:
   - Add composite indexes for complex queries
   - Use field selection to reduce payload size
   - Enable offline persistence
   - Add query limits

FILES TO UPDATE:
- All dashboard components using data
- Blog components
- Admin panel
- User profile pages
- Settings pages

BENEFITS:
- Automatic caching (50-70% fewer Firestore reads)
- Better UX with instant cached data
- Automatic refetching and revalidation
- Optimistic updates
- Reduced costs

Implement this step by step, starting with the setup and one hook as an example.
```

---

### Prompt 6: Error Monitoring with Sentry

```
Set up comprehensive error monitoring and logging with Sentry for the Next.js app.

TASKS:

1. Install and configure Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. Configure Sentry for production:
   - Add environment variables to .env.local
   - Configure source maps upload
   - Set up release tracking
   - Add user context

3. Enhance error boundary (client/src/components/ErrorBoundary.tsx):
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   
   class ErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       Sentry.captureException(error, {
         contexts: {
           react: { componentStack: errorInfo.componentStack },
         },
       });
     }
   }
   ```

4. Add error boundaries to:
   - Root layout (catch-all)
   - Dashboard pages
   - Admin panel
   - Individual complex components

5. Add custom error logging for API routes:
   ```typescript
   // In all API routes
   try {
     // API logic
   } catch (error) {
     Sentry.captureException(error, {
       tags: { api_route: '/api/scan' },
       extra: { requestBody, userId },
     });
     return NextResponse.json({ error: 'Internal error' }, { status: 500 });
   }
   ```

6. Track custom events:
   - Scan initiated
   - Scan completed
   - Scan failed
   - Payment successful/failed
   - API key generated
   - Export performed

7. Set up performance monitoring:
   - Track API response times
   - Monitor scan duration
   - Track page load times
   - Database query performance

8. Configure alerting:
   - Slack/Discord webhooks for critical errors
   - Email alerts for repeated errors
   - Alert on spike in error rate

9. Add user feedback widget:
   - Let users report bugs directly
   - Attach session replay
   - Include screenshot

ENVIRONMENT VARIABLES:
```
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_AUTH_TOKEN=your_token_here
```

Implement this and show me how to test that errors are being captured.
```

---

## 🟠 P1 - HIGH PRIORITY IMPLEMENTATIONS

### Prompt 7: Developer API with Authentication

```
Build a complete Developer API system with API key management, rate limiting, and documentation.

CONTEXT:
- Enable Business/Enterprise customers to use ShieldScan programmatically
- Need secure API key management
- Per-key rate limiting
- Comprehensive documentation

TASKS:

1. Create API key management system:
   
   A. Database schema (Firestore collection: apiKeys):
   ```typescript
   interface ApiKey {
     id: string;
     userId: string;
     key: string; // Hashed with bcrypt
     name: string;
     createdAt: Timestamp;
     lastUsedAt: Timestamp;
     usageCount: number;
     rateLimit: number; // requests per minute
     plan: 'business' | 'enterprise';
     scopes: string[]; // ['scan:create', 'scan:read', 'user:read']
     active: boolean;
     expiresAt?: Timestamp;
   }
   ```
   
   B. Create API key generation (client/src/lib/api/apiKeys.ts):
   - Generate cryptographically secure keys
   - Hash keys before storing
   - Show key only once to user
   - Generate keys only for Business/Enterprise plans

2. API key validation middleware (client/src/lib/api/auth.ts):
   ```typescript
   export async function validateApiKey(request: Request) {
     const apiKey = request.headers.get('X-API-Key');
     if (!apiKey) throw new Error('Missing API key');
     
     // Validate, check rate limit, update lastUsedAt
     return apiKeyData;
   }
   ```

3. Rate limiting per API key (client/src/lib/api/rateLimiter.ts):
   - Use Upstash Redis or in-memory store
   - Business: 10 req/min
   - Enterprise: 100 req/min
   - Return rate limit headers:
     * X-RateLimit-Limit
     * X-RateLimit-Remaining
     * X-RateLimit-Reset

4. Create API v1 endpoints:
   
   A. Scan API (client/src/app/api/v1/scan/route.ts):
   ```typescript
   POST /api/v1/scan
   Body: { url: string, options?: ScanOptions }
   Response: { scanId: string, status: 'queued' }
   
   GET /api/v1/scan/:id
   Response: ScanResult
   
   GET /api/v1/scans
   Query: page, limit, status
   Response: { scans: ScanResult[], total: number }
   ```
   
   B. User API (client/src/app/api/v1/user/route.ts):
   ```typescript
   GET /api/v1/user/profile
   Response: UserProfile
   
   GET /api/v1/user/usage
   Response: { scansUsed, scansLimit, resetDate }
   ```
   
   C. Webhooks API (client/src/app/api/v1/webhooks/route.ts):
   ```typescript
   POST /api/v1/webhooks
   Body: { url: string, events: string[] }
   
   GET /api/v1/webhooks
   DELETE /api/v1/webhooks/:id
   ```

5. Create API keys management UI:
   - Page at /dashboard/api-keys
   - List all API keys
   - Create new key button (modal)
   - Show key once, then hide
   - Revoke/delete keys
   - Show usage statistics per key

6. Create OpenAPI specification (docs/openapi.yaml):
   - Complete API documentation
   - Request/response schemas
   - Authentication details
   - Rate limiting info
   - Example requests

7. Build interactive API docs:
   - Install Swagger UI or Scalar
   - Host at /docs/api
   - Code examples in multiple languages
   - Try-it-out functionality

8. Create SDKs (optional, but recommended):
   
   A. TypeScript/JavaScript SDK:
   ```typescript
   // packages/sdk-js/src/index.ts
   class ShieldScanAPI {
     constructor(apiKey: string) {}
     async scan(url: string): Promise<ScanResult> {}
     async getScan(scanId: string): Promise<ScanResult> {}
   }
   ```
   
   B. Python SDK (later):
   ```python
   # packages/sdk-python/shieldscan/__init__.py
   class ShieldScanAPI:
       def __init__(self, api_key: str): pass
       def scan(self, url: str) -> ScanResult: pass
   ```

9. Create code examples repository:
   - Node.js examples
   - Python examples
   - cURL examples
   - Integration guides

SECURITY REQUIREMENTS:
- API keys must be hashed before storage
- Keys shown only once at creation
- Rate limiting strictly enforced
- Proper CORS headers
- Request validation
- Error messages don't leak sensitive info

Start with the API key generation and validation, then build the endpoints.
```

---

### Prompt 8: AI-Powered Security Recommendations

```
Implement AI-powered security analysis and recommendations using OpenAI GPT-4 or Anthropic Claude.

CONTEXT:
- Current "Ask AI" feature is static
- Need real AI integration for vulnerability analysis
- Provide context-aware, actionable security advice

TASKS:

1. Choose and install AI SDK:
   ```bash
   # Option A: OpenAI
   npm install openai
   
   # Option B: Anthropic Claude (recommended for security)
   npm install @anthropic-ai/sdk
   ```

2. Create AI service layer (client/src/lib/ai/securityAdvisor.ts):
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';
   
   const anthropic = new Anthropic({
     apiKey: process.env.ANTHROPIC_API_KEY,
   });
   
   export async function analyzeVulnerability(
     vulnerability: Vulnerability,
     scanContext: ScanResult
   ): Promise<AIRecommendation> {
     const prompt = `You are a cybersecurity expert. Analyze this vulnerability:
     
     Vulnerability Type: ${vulnerability.type}
     Severity: ${vulnerability.severity}
     Details: ${vulnerability.details}
     
     Website Context:
     - URL: ${scanContext.url}
     - Current Security Score: ${scanContext.score}
     - Platform: ${scanContext.detectedPlatform}
     
     Provide:
     1. Clear explanation (2-3 sentences) in non-technical terms
     2. Business risk assessment (Low/Medium/High/Critical)
     3. Step-by-step remediation instructions
     4. Code examples if applicable (HTML/config files)
     5. Estimated fix time
     
     Format as JSON.`;
     
     const response = await anthropic.messages.create({
       model: 'claude-sonnet-4-20250514',
       max_tokens: 1000,
       messages: [{ role: 'user', content: prompt }]
     });
     
     return JSON.parse(response.content[0].text);
   }
   ```

3. Create AI-powered features:
   
   A. Vulnerability Explainer (client/src/lib/ai/explainer.ts):
   - Explain any vulnerability in simple terms
   - Provide real-world examples of exploitation
   - Assess business impact
   
   B. Fix Code Generator (client/src/lib/ai/fixGenerator.ts):
   ```typescript
   export async function generateFix(
     vulnerability: Vulnerability,
     platform: string
   ): Promise<CodeFix> {
     // Generate actual code snippets to fix the issue
     // Support: Apache, Nginx, Node.js, Next.js, etc.
   }
   ```
   
   C. Security Prioritizer (client/src/lib/ai/prioritizer.ts):
   - Analyze all vulnerabilities
   - Prioritize based on: severity, exploitability, business impact
   - Suggest fix order
   - Estimate total remediation time
   
   D. Natural Language Query (client/src/lib/ai/chatbot.ts):
   - Answer security questions
   - "What should I fix first?"
   - "How do I enable HSTS?"
   - "Is my site vulnerable to XSS?"

4. Create API endpoints:
   
   A. Analyze vulnerability (client/src/app/api/ai/analyze/route.ts):
   ```typescript
   POST /api/ai/analyze
   Body: { vulnerabilityId: string, scanId: string }
   Response: AIRecommendation
   ```
   
   B. Generate fix (client/src/app/api/ai/fix/route.ts):
   ```typescript
   POST /api/ai/fix
   Body: { vulnerabilityId: string, platform: string }
   Response: { code: string, instructions: string }
   ```
   
   C. Chat endpoint (client/src/app/api/ai/chat/route.ts):
   ```typescript
   POST /api/ai/chat
   Body: { message: string, scanContext?: ScanResult }
   Response: { reply: string, suggestions?: string[] }
   ```

5. Update UI components:
   
   A. Add "AI Explain" button to each vulnerability:
   - Click to get AI analysis
   - Show loading state
   - Display explanation in modal/expandable section
   
   B. Add "Generate Fix" button:
   - Click to get code fix
   - Copy code snippet
   - Show platform-specific instructions
   
   C. Add AI chat widget:
   - Floating chat button
   - Context-aware (knows current scan)
   - Save chat history
   
   D. Add "Smart Prioritization" feature:
   - Button on scan results page
   - Shows AI-recommended fix order
   - Explains reasoning

6. Implement caching to reduce API costs:
   - Cache AI responses for identical vulnerability types
   - Cache for 7 days
   - Use Redis or Firestore

7. Add usage tracking:
   - Track AI API calls per user
   - Limit free plan: 5 AI queries per month
   - Pro plan: 50 queries
   - Business: 200 queries
   - Enterprise: Unlimited

8. Create AI prompt templates (client/src/lib/ai/prompts.ts):
   - Vulnerability analysis template
   - Fix generation template
   - Chat template
   - Prioritization template

ENVIRONMENT VARIABLES:
```
ANTHROPIC_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here
```

IMPORTANT:
- Always validate AI responses before showing to users
- Add fallbacks for API failures
- Monitor costs closely
- Rate limit AI requests
- Add disclaimer that AI advice should be verified

Start with the vulnerability explainer feature first.
```

---

### Prompt 9: Background Job Queue System

```
Implement a robust job queue system for handling long-running scans asynchronously.

CONTEXT:
- Current scans run synchronously and can timeout
- Need background processing for reliability
- Priority queues for different plan tiers
- Real-time progress tracking

TASKS:

1. Set up Redis (use Upstash for serverless):
   ```bash
   npm install bullmq ioredis
   ```
   
   Sign up for Upstash Redis (free tier available)
   Add to .env:
   ```
   UPSTASH_REDIS_URL=your_url
   UPSTASH_REDIS_TOKEN=your_token
   ```

2. Create queue infrastructure (client/src/lib/queue/scanQueue.ts):
   ```typescript
   import { Queue, Worker, Job } from 'bullmq';
   import Redis from 'ioredis';
   
   const connection = new Redis(process.env.UPSTASH_REDIS_URL!, {
     maxRetriesPerRequest: null,
   });
   
   // Create scan queue with priority
   export const scanQueue = new Queue('scans', {
     connection,
     defaultJobOptions: {
       attempts: 3,
       backoff: {
         type: 'exponential',
         delay: 2000,
       },
       removeOnComplete: { age: 86400 }, // 24 hours
       removeOnFail: { age: 172800 }, // 48 hours
     },
   });
   
   // Job data interface
   interface ScanJob {
     scanId: string;
     url: string;
     userId: string;
     plan: 'free' | 'pro' | 'business' | 'enterprise';
     options: ScanOptions;
   }
   ```

3. Create worker process (worker/scanWorker.ts):
   ```typescript
   import { Worker } from 'bullmq';
   import { performFullScan } from '@/lib/scanners';
   
   const worker = new Worker('scans', async (job: Job<ScanJob>) => {
     const { scanId, url, userId, options } = job.data;
     
     // Update job progress
     await job.updateProgress(0);
     
     try {
       // Perform scan with progress updates
       const result = await performFullScan(url, {
         ...options,
         onProgress: (percent, step) => {
           job.updateProgress(percent);
           job.log(`Progress: ${percent}% - ${step}`);
         },
       });
       
       // Save result to Firestore
       await saveScanResult(scanId, result);
       
       // Send notification
       await notifyUser(userId, 'scan_complete', { scanId });
       
       return result;
     } catch (error) {
       // Log error
       await saveScanError(scanId, error);
       throw error; // Let BullMQ handle retry
     }
   }, {
     connection,
     concurrency: 5, // Process 5 scans concurrently
     limiter: {
       max: 10, // Max 10 jobs
       duration: 60000, // Per minute
     },
   });
   
   worker.on('completed', (job) => {
     console.log(`Scan ${job.id} completed`);
   });
   
   worker.on('failed', (job, err) => {
     console.error(`Scan ${job.id} failed:`, err);
   });
   ```

4. Update scan API to use queue (client/src/app/api/scan/route.ts):
   ```typescript
   import { scanQueue } from '@/lib/queue/scanQueue';
   
   export async function POST(request: Request) {
     const { url } = await request.json();
     const user = await getCurrentUser();
     
     // Create scan document
     const scanId = await createScanDocument(url, user.id);
     
     // Determine priority based on plan
     const priority = {
       enterprise: 1,
       business: 2,
       pro: 3,
       free: 4,
     }[user.plan];
     
     // Add job to queue
     await scanQueue.add('scan', {
       scanId,
       url,
       userId: user.id,
       plan: user.plan,
       options: {},
     }, {
       priority,
       jobId: scanId, // Use scanId as jobId for easy lookup
     });
     
     return NextResponse.json({
       scanId,
       status: 'queued',
       estimatedTime: getEstimatedTime(user.plan),
     });
   }
   ```

5. Create progress tracking API (client/src/app/api/scan/[id]/progress/route.ts):
   ```typescript
   import { scanQueue } from '@/lib/queue/scanQueue';
   
   export async function GET(request: Request, { params }) {
     const { id } = params;
     const job = await scanQueue.getJob(id);
     
     if (!job) {
       return NextResponse.json({ status: 'not_found' }, { status: 404 });
     }
     
     const state = await job.getState();
     const progress = job.progress;
     const logs = await job.getLogsAsync();
     
     return NextResponse.json({
       status: state,
       progress,
       logs: logs.logs,
       position: await job.getPosition(),
     });
   }
   ```

6. Add real-time progress UI component:
   ```typescript
   // client/src/components/dashboard/ScanProgress.tsx
   export function ScanProgress({ scanId }: { scanId: string }) {
     const [progress, setProgress] = useState(0);
     const [status, setStatus] = useState('queued');
     const [logs, setLogs] = useState<string[]>([]);
     
     useEffect(() => {
       const interval = setInterval(async () => {
         const response = await fetch(`/api/scan/${scanId}/progress`);
         const data = await response.json();
         
         setProgress(data.progress);
         setStatus(data.status);
         setLogs(data.logs);
         
         if (data.status === 'completed' || data.status === 'failed') {
           clearInterval(interval);
         }
       }, 2000); // Poll every 2 seconds
       
       return () => clearInterval(interval);
     }, [scanId]);
     
     return (
       <div>
         <Progress value={progress} />
         <p>Status: {status}</p>
         <div>
           {logs.map((log, i) => <p key={i}>{log}</p>)}
         </div>
       </div>
     );
   }
   ```

7. Add queue monitoring dashboard (client/src/app/admin/queues/page.tsx):
   - Show active jobs
   - Show failed jobs with retry button
   - Show queue statistics
   - Pause/resume queue
   - Clean old jobs

8. Set up worker deployment:
   - Create separate worker process or use Next.js API route
   - For production: Deploy worker as separate service
   - For dev: Run worker locally with `npm run worker`
   
   Add to package.json:
   ```json
   {
     "scripts": {
       "worker": "tsx worker/scanWorker.ts"
     }
   }
   ```

TESTING:
1. Create a test scan
2. Verify job appears in queue
3. Verify progress updates work
4. Verify scan completes
5. Verify retry on failure
6. Test with multiple scans

Start with the queue setup and basic worker, then add progress tracking.
```

---

### Prompt 10: Email System with Resend

```
Implement a comprehensive email notification system using Resend.

TASKS:

1. Install and configure Resend:
   ```bash
   npm install resend
   npm install react-email @react-email/components
   ```
   
   Sign up for Resend and add to .env:
   ```
   RESEND_API_KEY=your_key_here
   RESEND_FROM_EMAIL=noreply@shieldscan.com
   ```

2. Create email service (client/src/lib/email/resend.ts):
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   export async function sendEmail({
     to,
     subject,
     react,
   }: {
     to: string;
     subject: string;
     react: React.ReactElement;
   }) {
     const { data, error } = await resend.emails.send({
       from: process.env.RESEND_FROM_EMAIL!,
       to,
       subject,
       react,
     });
     
     if (error) {
       console.error('Email error:', error);
       throw error;
     }
     
     return data;
   }
   ```

3. Create email templates using React Email:
   
   A. Welcome Email (client/src/lib/email/templates/WelcomeEmail.tsx):
   ```tsx
   import {
     Html, Head, Body, Container, Heading, Text, Button, Hr
   } from '@react-email/components';
   
   export function WelcomeEmail({ name }: { name: string }) {
     return (
       <Html>
         <Head />
         <Body style={{ fontFamily: 'sans-serif' }}>
           <Container>
             <Heading>Welcome to ShieldScan! 🛡️</Heading>
             <Text>Hi {name},</Text>
             <Text>
               Thanks for signing up! We're excited to help you secure your websites.
             </Text>
             <Button href="https://shieldscan.com/dashboard">
               Start Your First Scan
             </Button>
             <Hr />
             <Text style={{ color: '#666', fontSize: '12px' }}>
               ShieldScan - Website Security Scanning
             </Text>
           </Container>
         </Body>
       </Html>
     );
   }
   ```
   
   B. Scan Complete Email (client/src/lib/email/templates/ScanCompleteEmail.tsx):
   - Show security score
   - List critical vulnerabilities
   - Link to full report
   - Call-to-action button
   
   C. Weekly Report Email (client/src/lib/email/templates/WeeklyReportEmail.tsx):
   - Summary of scans this week
   - Overall security trend
   - New vulnerabilities detected
   - Recommendations
   
   D. Critical Vulnerability Alert (client/src/lib/email/templates/CriticalAlertEmail.tsx):
   - Urgent notification
   - Vulnerability details
   - Immediate action required
   - Red/warning styling
   
   E. Upgrade Reminder (client/src/lib/email/templates/UpgradeEmail.tsx):
   - Benefits of upgrading
   - Feature comparison
   - Special offer if applicable
   
   F. Scheduled Scan Alert (client/src/lib/email/templates/ScheduledScanEmail.tsx):
   - Scan completed as scheduled
   - Changes since last scan
   - Action items

4. Create email utilities (client/src/lib/email/utils.ts):
   ```typescript
   export async function sendWelcomeEmail(user: User) {
     return sendEmail({
       to: user.email,
       subject: 'Welcome to ShieldScan!',
       react: <WelcomeEmail name={user.name} />,
     });
   }
   
   export async function sendScanCompleteEmail(
     user: User,
     scan: ScanResult
   ) {
     return sendEmail({
       to: user.email,
       subject: `Scan Complete: ${scan.url} - Score: ${scan.score}`,
       react: <ScanCompleteEmail user={user} scan={scan} />,
     });
   }
   
   // Add more email senders...
   ```

5. Add email triggers:
   
   A. After user signup (client/src/app/api/auth/signup/route.ts):
   ```typescript
   await sendWelcomeEmail(newUser);
   ```
   
   B. After scan completion (in scan worker):
   ```typescript
   await sendScanCompleteEmail(user, scanResult);
   ```
   
   C. For critical vulnerabilities:
   ```typescript
   if (hasCriticalVulnerability(scanResult)) {
     await sendCriticalAlertEmail(user, scanResult);
   }
   ```

6. Add email preferences:
   
   A. Create preferences schema:
   ```typescript
   interface EmailPreferences {
     scanComplete: boolean;
     weeklyReport: boolean;
     criticalAlerts: boolean;
     productUpdates: boolean;
     marketing: boolean;
   }
   ```
   
   B. Add preferences UI (client/src/app/settings/notifications/page.tsx):
   - Toggle for each email type
   - Save preferences to Firestore
   - Unsubscribe from all option

7. Add unsubscribe functionality:
   - Include unsubscribe link in all emails
   - Create unsubscribe page (client/src/app/unsubscribe/page.tsx)
   - Respect user preferences

8. Add email scheduling for weekly reports:
   - Use cron job or scheduled function
   - Send every Monday at 9 AM user's timezone
   - Include weekly summary

9. Test emails in development:
   - Use Resend test mode
   - Preview emails with React Email preview
   - Test all templates

IMPORTANT:
- Always check email preferences before sending
- Add unsubscribe link to all marketing emails
- Use responsive email design
- Test on multiple email clients
- Monitor bounce rates
- Handle email failures gracefully

Start with the welcome email and scan complete email first.
```

---

## 🟡 P2 - MEDIUM PRIORITY

### Prompt 11: Homepage Additional Sections

```
Add engaging sections to the homepage to improve conversion and user engagement.

TASKS:

1. "How It Works" Section (client/src/components/landing/HowItWorksSection.tsx):
   ```tsx
   Create a 3-step process visualization:
   
   Step 1: Enter URL
   - Icon: Link/Globe icon
   - Description: "Simply paste your website URL"
   
   Step 2: AI-Powered Scan
   - Icon: Shield with scan icon
   - Description: "Our AI scans for 50+ vulnerabilities"
   
   Step 3: Get Report & Fix
   - Icon: Document/Checklist icon
   - Description: "Receive actionable recommendations"
   
   Design:
   - Use gradient cards with hover effects
   - Add step numbers (1, 2, 3)
   - Include animations (fade in on scroll)
   - Add a decorative connecting line between steps
   - Mobile responsive (stack vertically on mobile)
   ```

2. Security Threat Statistics Section (client/src/components/landing/ThreatStatsSection.tsx):
   ```tsx
   Create animated counters showing:
   
   - "2.5M+ websites hacked daily"
   - "43% of cyberattacks target small businesses"
   - "$4.35M average cost of a data breach"
   - "95% of breaches caused by human error"
   
   Features:
   - Count-up animation on scroll into view
   - Use large, bold numbers
   - Add sources in small text
   - Dark background with gradient
   - Icons for each statistic
   ```

3. Security Checks Showcase (client/src/components/landing/SecurityChecksSection.tsx):
   ```tsx
   Create a grid showing all security checks:
   
   Categories:
   - SSL/TLS (6 checks)
   - Security Headers (8 checks)
   - DNS Security (5 checks)
   - Vulnerabilities (15+ checks)
   - Performance (4 checks)
   
   Design:
   - Icon grid layout (6 columns on desktop, 2 on mobile)
   - Hover effect shows check description
   - Color code by category
   - Add "Pro" or "Enterprise" badges for premium checks
   ```

4. FAQ Section (client/src/components/landing/FAQSection.tsx):
   ```tsx
   Create accordion FAQ with these questions:
   
   - What is ShieldScan?
   - How does the scanning work?
   - Is my website data secure?
   - What vulnerabilities do you detect?
   - How often should I scan my website?
   - Can I automate scans?
   - What's the difference between plans?
   - Do you offer a free trial?
   - Can I cancel anytime?
   - Do you offer refunds?
   
   Features:
   - Accordion UI (expand/collapse)
   - Smooth animations
   - Search functionality (filter questions)
   - "Still have questions? Contact us" CTA at bottom
   ```

5. Add all sections to homepage (client/src/app/page.tsx):
   ```tsx
   Order:
   1. Hero
   2. How It Works ← NEW
   3. Features
   4. Security Checks Showcase ← NEW
   5. Threat Statistics ← NEW
   6. Testimonials
   7. Cost Savings
   8. FAQ ← NEW
   9. Pricing
   10. Final CTA
   ```

6. Add scroll animations:
   - Use Framer Motion or CSS animations
   - Fade in on scroll
   - Stagger animations for list items
   - Smooth transitions

DESIGN REQUIREMENTS:
- Consistent with existing design system
- Mobile-first responsive
- Accessible (ARIA labels, keyboard navigation)
- Fast loading (code split if needed)
- SEO optimized (semantic HTML)

Implement these sections one at a time, starting with "How It Works".
```

---

### Prompt 12: Global Search Functionality

```
Implement comprehensive search across scans, users, blog posts, and documentation.

TASKS:

1. Choose search solution:
   - Option A: Algolia (recommended, generous free tier)
   - Option B: Meilisearch (open-source, self-hosted)
   - Option C: Typesense (open-source, cloud option)
   
   For this implementation, use Algolia:
   ```bash
   npm install algoliasearch react-instantsearch
   ```

2. Set up Algolia:
   - Create account at algolia.com
   - Create app and get API keys
   - Add to .env:
   ```
   NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
   NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
   ALGOLIA_ADMIN_KEY=your_admin_key
   ```

3. Create Algolia indexes:
   - scans
   - users (admin only)
   - blog_posts
   - documentation

4. Sync data to Algolia:
   
   A. Create sync utility (client/src/lib/search/algolia.ts):
   ```typescript
   import algoliasearch from 'algoliasearch';
   
   const client = algoliasearch(
     process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
     process.env.ALGOLIA_ADMIN_KEY!
   );
   
   export async function indexScan(scan: ScanResult) {
     const index = client.initIndex('scans');
     await index.saveObject({
       objectID: scan.id,
       url: scan.url,
       score: scan.score,
       timestamp: scan.timestamp,
       userId: scan.userId,
       vulnerabilities: scan.vulnerabilities.map(v => v.type),
     });
   }
   ```
   
   B. Sync on data changes:
   - After scan completion
   - After blog post publish
   - Use Firestore triggers or manual sync

5. Create global search component (client/src/components/GlobalSearch.tsx):
   ```tsx
   import { InstantSearch, SearchBox, Hits, Configure } from 'react-instantsearch';
   
   export function GlobalSearch() {
     return (
       <InstantSearch
         searchClient={searchClient}
         indexName="scans"
       >
         <SearchBox
           placeholder="Search scans, blog posts..."
           classNames={{
             input: 'w-full px-4 py-2 border rounded-lg',
           }}
         />
         
         <div className="mt-4">
           <Hits hitComponent={SearchHit} />
         </div>
         
         <Configure hitsPerPage={10} />
       </InstantSearch>
     );
   }
   ```

6. Create search UI with tabs:
   - All Results
   - Scans
   - Blog Posts
   - Documentation
   
   Show results grouped by type

7. Add search modal (Cmd/Ctrl + K):
   ```tsx
   // Open with keyboard shortcut
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
         e.preventDefault();
         setIsOpen(true);
       }
     };
     
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, []);
   ```

8. Add autocomplete suggestions:
   - Recent searches
   - Popular searches
   - Query suggestions

9. Add advanced filters:
   - Date range
   - Security score range
   - Vulnerability types
   - Status (active, fixed, ignored)

10. Add search history:
    - Store recent searches (local storage)
    - Quick access to recent queries
    - Clear history option

FILES TO CREATE:
- client/src/lib/search/algolia.ts
- client/src/components/GlobalSearch.tsx
- client/src/components/SearchModal.tsx
- client/src/components/SearchHit.tsx
- client/src/app/api/search/sync/route.ts

Implement the basic search first, then add advanced features.
```

---

## 📚 ADDITIONAL HELPFUL PROMPTS

### Code Refactoring Prompt

```
Review and refactor the codebase for better maintainability and performance.

TASKS:
1. Identify code duplication and extract to shared utilities
2. Split large components into smaller, reusable pieces
3. Improve TypeScript types (remove 'any', add strict types)
4. Add JSDoc comments to complex functions
5. Extract magic numbers/strings to constants
6. Improve error handling consistency
7. Add input validation to all API routes
8. Optimize re-renders (use React.memo, useMemo, useCallback where needed)

Start by analyzing the codebase and showing me the top 5 refactoring opportunities.
```

---

### Testing Setup Prompt

```
Set up comprehensive testing for the ShieldScan application.

TASKS:
1. Install testing libraries:
   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
   ```

2. Configure Jest for Next.js

3. Create tests for:
   - Scanning algorithms (unit tests)
   - API routes (integration tests)
   - React components (component tests)
   - User flows (E2E with Playwright)

4. Add test scripts to package.json

5. Set up CI/CD to run tests on every PR

Start with scanner unit tests as they're critical to app functionality.
```

---

### Accessibility Audit Prompt

```
Perform a comprehensive accessibility audit and fix all issues.

TASKS:
1. Install axe-core for automated testing
2. Check all components for:
   - Proper ARIA labels
   - Keyboard navigation
   - Focus management
   - Color contrast (WCAG AA minimum)
   - Screen reader compatibility
3. Add skip navigation links
4. Ensure all interactive elements are keyboard accessible
5. Test with actual screen reader (NVDA/JAWS)
6. Create accessibility test suite

Start by auditing the main dashboard and scan results pages.
```

---

## 🎯 QUICK START RECOMMENDATION

If you're using Cursor AI and want to start immediately, I recommend this order:

1. **Start with Image Optimization** (Quick win, huge impact)
   - Copy Prompt 1
   - Run in Cursor AI
   - Test the changes
   - Commit

2. **Then SEO** (Another quick win)
   - Copy Prompt 2
   - Implement step by step
   - Verify with Google Rich Results Test

3. **Then React Query** (Reduces costs, better UX)
   - Copy Prompt 5
   - Start with one hook as example
   - Gradually migrate all data fetching

4. **Then Enhanced Scanning** (Core feature improvement)
   - Copy Prompt 4
   - This is complex, do it carefully
   - Test thoroughly

This gives you maximum impact with manageable complexity!