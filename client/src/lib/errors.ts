// ==========================================
// ERROR HANDLING MODULE
// ==========================================
// Structured errors for security-critical operations

/**
 * Base class for ShieldScan errors
 */
export class ShieldScanError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ShieldScanError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ShieldScanError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Encryption-related errors
 */
export class EncryptionError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ENCRYPTION_ERROR', context);
    this.name = 'EncryptionError';
  }
}

/**
 * Evidence chain errors
 */
export class EvidenceChainError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'EVIDENCE_CHAIN_ERROR', context);
    this.name = 'EvidenceChainError';
  }
}

/**
 * Compliance-related errors
 */
export class ComplianceError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'COMPLIANCE_ERROR', context);
    this.name = 'ComplianceError';
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'AuthError';
  }
}

/**
 * Organization-related errors
 */
export class OrganizationError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ORGANIZATION_ERROR', context);
    this.name = 'OrganizationError';
  }
}

/**
 * Scan execution errors
 */
export class ScanError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SCAN_ERROR', context);
    this.name = 'ScanError';
  }
}

/**
 * Billing/Plan errors
 */
export class BillingError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'BILLING_ERROR', context);
    this.name = 'BillingError';
  }
}

/**
 * Integration errors
 */
export class IntegrationError extends ShieldScanError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INTEGRATION_ERROR', context);
    this.name = 'IntegrationError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ShieldScanError {
  public readonly field?: string;
  
  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', { ...context, field });
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ==========================================
// ERROR LOGGING
// ==========================================

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface ErrorLogEntry {
  level: LogLevel;
  error: ShieldScanError | Error;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Structured error logger
 */
export function logError(entry: ErrorLogEntry): void {
  const { level, error, userId, organizationId, requestId, additionalContext } = entry;
  
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    error: error instanceof ShieldScanError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    userId,
    organizationId,
    requestId,
    ...additionalContext,
  };

  // In production, this would send to a logging service
  // For now, use structured console logging
  switch (level) {
    case 'error':
      console.error('[ShieldScan Error]', JSON.stringify(logData, null, 2));
      break;
    case 'warn':
      console.warn('[ShieldScan Warning]', JSON.stringify(logData, null, 2));
      break;
    case 'info':
      console.info('[ShieldScan Info]', JSON.stringify(logData, null, 2));
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ShieldScan Debug]', JSON.stringify(logData, null, 2));
      }
      break;
  }
}

// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: { operation: string; userId?: string; organizationId?: string }
): Promise<T> {
  return fn().catch((error: Error) => {
    logError({
      level: 'error',
      error,
      userId: context?.userId,
      organizationId: context?.organizationId,
      additionalContext: { operation: context?.operation },
    });
    throw error;
  });
}

/**
 * Safely executes a function and returns a result object
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue?: T
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      data: defaultValue, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Type guard for ShieldScanError
 */
export function isShieldScanError(error: unknown): error is ShieldScanError {
  return error instanceof ShieldScanError;
}

/**
 * Converts unknown errors to ShieldScanError
 */
export function normalizeError(error: unknown, defaultCode: string = 'UNKNOWN_ERROR'): ShieldScanError {
  if (error instanceof ShieldScanError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ShieldScanError(error.message, defaultCode, { originalError: error.name });
  }
  
  return new ShieldScanError(String(error), defaultCode);
}

