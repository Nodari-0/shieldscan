/**
 * Security utilities for the application
 */

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if URL is safe to scan (not internal/private)
 */
export function isSafeToScan(url: string): boolean {
  const blockedPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/0\./,
    /^https?:\/\/\[::1\]/,
    /^https?:\/\/169\.254\./,  // Link-local
    /^file:/i,
    /^javascript:/i,
    /^data:/i,
  ];
  
  return !blockedPatterns.some(pattern => pattern.test(url));
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Mask sensitive data (e.g., email, credit card)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '*';
    
  return `${maskedLocal}@${domain}`;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  // Check for common patterns
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /abc123/i,
  ];
  
  if (commonPatterns.some(p => p.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns');
  }

  return { score: Math.min(score, 5), feedback };
}

/**
 * Log security event (for audit trail)
 */
export function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'scan' | 'admin_action';
  userId?: string;
  userEmail?: string;
  ip?: string;
  details?: string;
  success: boolean;
}) {
  const timestamp = new Date().toISOString();
  
  // In production, send to logging service (e.g., Datadog, Sentry)
  console.log('[SECURITY]', JSON.stringify({
    ...event,
    timestamp,
  }));
  
  // Could also save to Firestore audit log collection
}

