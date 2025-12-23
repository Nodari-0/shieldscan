/**
 * Services Index
 * Re-export all services for easy imports
 */

export { apiService, ApiServiceError } from './api.service';
export type { ApiResponse, ApiError } from './api.service';

export { scanService } from './scan.service';
export type { ScanRequest, ScanResponse, ScanHistoryParams } from './scan.service';

export { emailService } from './email.service';
export type { EmailRecipient, SendEmailOptions, EmailResult } from './email.service';

