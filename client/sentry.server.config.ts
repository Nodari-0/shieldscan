/**
 * Sentry Server Configuration
 * 
 * This file configures the initialization of Sentry on the server side.
 * The config you add here will be used whenever the server handles a request.
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is provided
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Adjust this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Filter errors
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry server event (dev):', event);
        return null;
      }

      return event;
    },
  });
}

