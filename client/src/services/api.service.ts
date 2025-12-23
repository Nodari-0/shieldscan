/**
 * API Service
 * Centralized API communication layer with error handling and retry logic
 */

import * as Sentry from '@sentry/nextjs';
import { API_TIMEOUTS, RETRY_CONFIG, ERROR_CODES } from '@/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface ApiError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;
}

interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class ApiServiceError extends Error implements ApiError {
  code: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiServiceError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function createApiError(
  message: string,
  code: string,
  status?: number,
  details?: Record<string, unknown>
): ApiServiceError {
  const error = new ApiServiceError(message, code, status, details);
  
  // Log to Sentry for non-user errors
  if (status && status >= 500) {
    Sentry.captureException(error, {
      tags: { api_error: true, error_code: code },
      extra: details,
    });
  }
  
  return error;
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.INITIAL_DELAY;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiServiceError && error.status && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.BACKOFF_MULTIPLIER, RETRY_CONFIG.MAX_DELAY);
      }
    }
  }

  throw lastError;
}

// =============================================================================
// REQUEST HELPERS
// =============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  if (!response.ok) {
    const errorData = isJson ? await response.json() : { error: response.statusText };
    
    throw createApiError(
      errorData.error || `Request failed with status ${response.status}`,
      errorData.errorCode || ERROR_CODES.API_SERVER_ERROR,
      response.status,
      errorData
    );
  }

  if (!isJson) {
    return { success: true } as ApiResponse<T>;
  }

  const data = await response.json();
  return {
    success: true,
    data: data.data || data,
  };
}

// =============================================================================
// API SERVICE CLASS
// =============================================================================

class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...customHeaders,
    };
  }

  async get<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_TIMEOUTS.DEFAULT, retries = 0, headers } = config;

    return withRetry(async () => {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'GET',
          headers: this.getHeaders(headers),
        },
        timeout
      );
      return handleResponse<T>(response);
    }, retries);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_TIMEOUTS.DEFAULT, retries = 0, headers } = config;

    return withRetry(async () => {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: this.getHeaders(headers),
          body: data ? JSON.stringify(data) : undefined,
        },
        timeout
      );
      return handleResponse<T>(response);
    }, retries);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_TIMEOUTS.DEFAULT, retries = 0, headers } = config;

    return withRetry(async () => {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'PUT',
          headers: this.getHeaders(headers),
          body: data ? JSON.stringify(data) : undefined,
        },
        timeout
      );
      return handleResponse<T>(response);
    }, retries);
  }

  async delete<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_TIMEOUTS.DEFAULT, retries = 0, headers } = config;

    return withRetry(async () => {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(headers),
        },
        timeout
      );
      return handleResponse<T>(response);
    }, retries);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const apiService = new ApiService();
export default apiService;

