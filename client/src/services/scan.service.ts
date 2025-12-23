/**
 * Scan Service
 * Handles all scan-related API operations
 */

import * as Sentry from '@sentry/nextjs';
import { apiService, ApiResponse, ApiServiceError } from './api.service';
import { API_TIMEOUTS, ERROR_CODES } from '@/constants';
import type { ScanResult, StoredScanResult } from '@/types/scan';

// =============================================================================
// TYPES
// =============================================================================

export interface ScanRequest {
  url: string;
  plan: string;
  userEmail: string;
  userId: string | null;
  tags?: string[];
}

export interface ScanResponse {
  success: boolean;
  data?: ScanResult;
  error?: string;
  limitReached?: boolean;
  resetDate?: string;
}

export interface ScanHistoryParams {
  userId: string;
  limit?: number;
  offset?: number;
  tag?: string;
}

// =============================================================================
// SCAN SERVICE
// =============================================================================

class ScanService {
  /**
   * Perform a security scan on a URL
   */
  async performScan(request: ScanRequest): Promise<ScanResponse> {
    try {
      // Track scan initiation
      Sentry.addBreadcrumb({
        category: 'scan',
        message: `Scan initiated for ${request.url}`,
        level: 'info',
        data: { plan: request.plan },
      });

      const response = await apiService.post<ScanResult>('/api/scan', request, {
        timeout: API_TIMEOUTS.SCAN,
        retries: 1,
      });

      if (!response.success || !response.data) {
        throw new ApiServiceError(
          'Scan failed to return data',
          ERROR_CODES.SCAN_FAILED
        );
      }

      // Track successful scan
      Sentry.addBreadcrumb({
        category: 'scan',
        message: `Scan completed for ${request.url}`,
        level: 'info',
        data: {
          score: response.data.score,
          grade: response.data.grade,
          duration: response.data.scanDuration,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Handle specific error cases
      if (error instanceof ApiServiceError) {
        // Check for limit reached
        if (error.status === 403 || error.details?.limitReached) {
          return {
            success: false,
            error: error.message,
            limitReached: true,
            resetDate: error.details?.resetDate as string | undefined,
          };
        }

        return {
          success: false,
          error: error.message,
        };
      }

      // Log unexpected errors to Sentry
      Sentry.captureException(error, {
        tags: { service: 'scan', operation: 'performScan' },
        extra: { url: request.url, plan: request.plan },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      };
    }
  }

  /**
   * Get scan history for a user
   */
  async getScanHistory(params: ScanHistoryParams): Promise<ApiResponse<StoredScanResult[]>> {
    try {
      const queryParams = new URLSearchParams({
        limit: String(params.limit || 20),
        offset: String(params.offset || 0),
      });

      if (params.tag) {
        queryParams.set('tag', params.tag);
      }

      return await apiService.get<StoredScanResult[]>(
        `/api/v1/scans?${queryParams.toString()}`,
        { retries: 2 }
      );
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'scan', operation: 'getScanHistory' },
        extra: params,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scan history',
      };
    }
  }

  /**
   * Get a specific scan by ID
   */
  async getScanById(scanId: string): Promise<ApiResponse<StoredScanResult>> {
    try {
      return await apiService.get<StoredScanResult>(`/api/v1/scan/${scanId}`, {
        retries: 2,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'scan', operation: 'getScanById' },
        extra: { scanId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scan',
      };
    }
  }

  /**
   * Update scan tags
   */
  async updateScanTags(scanId: string, tags: string[]): Promise<ApiResponse<void>> {
    try {
      return await apiService.put(`/api/v1/scan/${scanId}`, { tags });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'scan', operation: 'updateScanTags' },
        extra: { scanId, tags },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tags',
      };
    }
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete(`/api/v1/scan/${scanId}`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'scan', operation: 'deleteScan' },
        extra: { scanId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete scan',
      };
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const scanService = new ScanService();
export default scanService;

