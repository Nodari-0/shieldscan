/**
 * Application Constants
 * Centralized constants to avoid magic numbers and strings
 */

// =============================================================================
// SCAN LIMITS & THRESHOLDS
// =============================================================================

export const SCAN_LIMITS = {
  FREE: 1,
  PRO: 100,
  BUSINESS: 500,
  ENTERPRISE: -1, // unlimited
} as const;

export const RISK_SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  FAIR: 60,
  POOR: 40,
  CRITICAL: 20,
} as const;

export const GRADE_THRESHOLDS = {
  A_PLUS: 95,
  A: 90,
  B: 80,
  C: 60,
  D: 40,
  F: 0,
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  SCAN_HISTORY_LIMIT: 20,
  LOCAL_STORAGE_LIMIT: 100,
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SCAN_LINE_DELAY: 100,
  SCAN_SECTION_DELAY: 200,
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// =============================================================================
// API CONSTANTS
// =============================================================================

export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  SCAN: 60000, // 60 seconds for scans
  UPLOAD: 120000, // 2 minutes for uploads
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 60,
  SCANS_PER_MINUTE: 10,
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const VALIDATION = {
  URL_MAX_LENGTH: 2048,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS_PER_SCAN: 10,
  PASSWORD_MIN_LENGTH: 8,
  DISPLAY_NAME_MAX_LENGTH: 100,
} as const;

// =============================================================================
// SSL/SECURITY CONSTANTS
// =============================================================================

export const SSL_EXPIRY_WARNINGS = {
  CRITICAL: 7, // days
  WARNING: 30, // days
  NOTICE: 60, // days
} as const;

export const SECURITY_HEADERS = [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Referrer-Policy',
  'Permissions-Policy',
] as const;

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  SCAN_RESULTS: 'shieldscan_results',
  USER_PREFERENCES: 'shieldscan_preferences',
  COOKIE_CONSENT: 'shieldscan_cookie_consent',
  THEME: 'shieldscan_theme',
} as const;

// =============================================================================
// DATE/TIME FORMATS
// =============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  RELATIVE_THRESHOLD: 7, // days before showing absolute date
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_SESSION_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',
  
  // Scan
  SCAN_LIMIT_REACHED: 'SCAN_001',
  SCAN_INVALID_URL: 'SCAN_002',
  SCAN_TIMEOUT: 'SCAN_003',
  SCAN_FAILED: 'SCAN_004',
  
  // API
  API_RATE_LIMITED: 'API_001',
  API_INVALID_REQUEST: 'API_002',
  API_SERVER_ERROR: 'API_003',
  
  // Payment
  PAYMENT_FAILED: 'PAY_001',
  PAYMENT_CANCELLED: 'PAY_002',
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  SCHEDULED_SCANS: false, // Coming soon
  API_ACCESS: true,
  PDF_REPORTS: true,
  EMAIL_NOTIFICATIONS: false, // Coming soon
  TEAM_MANAGEMENT: false, // Coming soon
  WHITE_LABEL: false, // Coming soon
} as const;

// =============================================================================
// EXTERNAL URLS
// =============================================================================

export const EXTERNAL_URLS = {
  DOCUMENTATION: '/documentation',
  API_DOCS: '/api-docs',
  SUPPORT: '/help',
  PRICING: '/pricing',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

