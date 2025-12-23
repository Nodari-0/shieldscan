/**
 * Sentry Client Configuration
 * 
 * This file configures the initialization of Sentry on the client side.
 * The config you add here will be used whenever a users loads a page in their browser.
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Session Replay
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    replaysSessionSampleRate: 0.1, // Capture 10% of all sessions

    // Additional integrations
    integrations: [
      // Capture console errors
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly wanted
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event (dev):', event);
        return null;
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors that are expected
        if (error.message.includes('Network Error')) {
          return null;
        }
        // Ignore cancelled requests
        if (error.message.includes('AbortError')) {
          return null;
        }
      }

      return event;
    },

    // Don't send PII
    sendDefaultPii: false,

    // Ignore specific errors
    ignoreErrors: [
      // Network errors
      'Network Error',
      'Failed to fetch',
      'Load failed',
      // Browser extensions
      'Extension context invalidated',
      // Safari specific
      'cancelled',
      // Firebase auth errors (handled in app)
      'auth/popup-closed-by-user',
    ],

    // Ignore URLs
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
    ],
  });
}

