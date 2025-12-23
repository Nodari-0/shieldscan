/**
 * Sentry Utilities
 * 
 * Helper functions for Sentry error tracking and monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set user context for better error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string | null;
  displayName?: string | null;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.displayName || undefined,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'custom',
    message: eventName,
    data,
    level: 'info',
  });
}

/**
 * Track scan events
 */
export const scanEvents = {
  initiated: (url: string, userId?: string) => {
    trackEvent('scan_initiated', { url, userId });
  },
  completed: (url: string, score: number, duration: number) => {
    trackEvent('scan_completed', { url, score, duration });
  },
  failed: (url: string, error: string) => {
    trackEvent('scan_failed', { url, error });
    Sentry.captureMessage(`Scan failed for ${url}: ${error}`, 'warning');
  },
};

/**
 * Track payment events
 */
export const paymentEvents = {
  initiated: (plan: string, userId: string) => {
    trackEvent('payment_initiated', { plan, userId });
  },
  succeeded: (plan: string, amount: number) => {
    trackEvent('payment_succeeded', { plan, amount });
  },
  failed: (plan: string, error: string) => {
    trackEvent('payment_failed', { plan, error });
    Sentry.captureMessage(`Payment failed for ${plan}: ${error}`, 'error');
  },
};

/**
 * Capture API errors with context
 */
export function captureApiError(
  error: Error,
  context: {
    route: string;
    method?: string;
    userId?: string;
    requestBody?: any;
  }
) {
  Sentry.captureException(error, {
    tags: {
      api_route: context.route,
      http_method: context.method || 'GET',
    },
    extra: {
      userId: context.userId,
      requestBody: context.requestBody,
    },
  });
}

/**
 * Performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    trackEvent(`${name}_completed`, { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    trackEvent(`${name}_failed`, { duration, error: String(error) });
    throw error;
  }
}

