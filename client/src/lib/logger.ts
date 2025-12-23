/**
 * Logger Utility
 * Centralized logging with Sentry integration
 * Replaces direct console.error calls for better error tracking
 */

import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const isDevelopment = process.env.NODE_ENV === 'development';

// Map log levels to Sentry severity
const SENTRY_LEVELS: Record<LogLevel, Sentry.SeverityLevel> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  private context: LogContext = {};

  /**
   * Set persistent context for all log messages
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear logger context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, data?: LogContext): void {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, { ...this.context, ...data });
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: LogContext): void {
    const context = { ...this.context, ...data };
    
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
    
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: context.component || 'app',
      message,
      level: 'info',
      data: context,
    });
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: LogContext): void {
    const context = { ...this.context, ...data };
    
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
    
    // Add breadcrumb and capture message for warnings
    Sentry.addBreadcrumb({
      category: context.component || 'app',
      message,
      level: 'warning',
      data: context,
    });
    
    // Only send warnings to Sentry in production for important issues
    if (!isDevelopment && context.sendToSentry) {
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: {
          component: context.component,
          action: context.action,
        },
        extra: context,
      });
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, data?: LogContext): void {
    const context = { ...this.context, ...data };
    
    // Always log to console in development
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    }
    
    // Capture exception in Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          component: context.component,
          action: context.action,
        },
        extra: {
          message,
          ...context,
        },
      });
    } else {
      // If not an Error object, capture as message with context
      Sentry.captureMessage(message, {
        level: 'error',
        tags: {
          component: context.component,
          action: context.action,
        },
        extra: {
          originalError: error,
          ...context,
        },
      });
    }
  }

  /**
   * Log API errors specifically
   */
  apiError(
    endpoint: string,
    method: string,
    error: Error | unknown,
    data?: LogContext
  ): void {
    this.error(`API Error: ${method} ${endpoint}`, error, {
      ...data,
      component: 'api',
      action: `${method}_${endpoint}`,
      endpoint,
      method,
    });
  }

  /**
   * Log scan-related events
   */
  scanEvent(
    event: 'started' | 'completed' | 'failed',
    url: string,
    data?: LogContext
  ): void {
    const message = `Scan ${event}: ${url}`;
    
    if (event === 'failed') {
      this.error(message, undefined, {
        ...data,
        component: 'scanner',
        action: `scan_${event}`,
        url,
      });
    } else {
      this.info(message, {
        ...data,
        component: 'scanner',
        action: `scan_${event}`,
        url,
      });
    }
  }

  /**
   * Log authentication events
   */
  authEvent(
    event: 'signin' | 'signout' | 'signup' | 'error',
    userId?: string,
    data?: LogContext
  ): void {
    const message = `Auth ${event}${userId ? `: ${userId}` : ''}`;
    
    if (event === 'error') {
      this.warn(message, {
        ...data,
        component: 'auth',
        action: `auth_${event}`,
        userId,
      });
    } else {
      this.info(message, {
        ...data,
        component: 'auth',
        action: `auth_${event}`,
        userId,
      });
    }
  }

  /**
   * Log payment events
   */
  paymentEvent(
    event: 'started' | 'completed' | 'failed' | 'cancelled',
    plan: string,
    data?: LogContext
  ): void {
    const message = `Payment ${event}: ${plan}`;
    
    if (event === 'failed') {
      this.error(message, undefined, {
        ...data,
        component: 'payment',
        action: `payment_${event}`,
        plan,
        sendToSentry: true,
      });
    } else {
      this.info(message, {
        ...data,
        component: 'payment',
        action: `payment_${event}`,
        plan,
      });
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const logger = new Logger();
export default logger;

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick error logging for catch blocks
 * Use instead of console.error
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  logger.error(message, error, context);
}

/**
 * Quick warning logging
 * Use instead of console.warn
 */
export function logWarn(message: string, context?: LogContext): void {
  logger.warn(message, context);
}

/**
 * Quick info logging
 * Use instead of console.log for important events
 */
export function logInfo(message: string, context?: LogContext): void {
  logger.info(message, context);
}

