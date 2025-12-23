/**
 * Email Breach Checker Library
 * Uses Have I Been Pwned API to check for email breaches
 * Includes password suggestions for future password vault feature
 */

import type { BreachInfo, EmailBreachResult, PasswordSuggestion } from '@/types/scan';

const HIBP_API_URL = 'https://haveibeenpwned.com/api/v3';
const RATE_LIMIT_DELAY = 1600; // 1.6 seconds between requests (HIBP rate limit)

// Cache for breach details to reduce API calls
const breachDetailsCache = new Map<string, BreachInfo>();
const emailCheckCache = new Map<string, { result: EmailBreachResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Sensitive data classes that indicate high risk
const SENSITIVE_DATA_CLASSES = [
  'Passwords',
  'Password hints',
  'Credit cards',
  'Bank account numbers',
  'Social security numbers',
  'Government issued IDs',
  'Security questions and answers',
  'Auth tokens',
  'Private keys',
];

// Common business email prefixes for domain checking
const COMMON_BUSINESS_EMAILS = [
  'admin',
  'info',
  'contact',
  'support',
  'sales',
  'hello',
  'noreply',
  'postmaster',
  'webmaster',
  'security',
  'billing',
  'hr',
  'careers',
  'press',
  'media',
];

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  // Check for disposable email domains (basic check)
  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'guerrillamail.com', 
    'mailinator.com', '10minutemail.com', 'temp-mail.org'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not supported' };
  }

  return { valid: true };
}

/**
 * Generate common business emails for a domain
 */
export function generateDomainEmails(domain: string): string[] {
  return COMMON_BUSINESS_EMAILS.map(prefix => `${prefix}@${domain}`);
}

/**
 * Check if an email has been breached using HIBP API
 */
export async function checkEmailBreach(
  email: string, 
  apiKey: string
): Promise<BreachInfo[]> {
  // Check cache first
  const cached = emailCheckCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result.breaches;
  }

  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(
      `${HIBP_API_URL}/breachedaccount/${encodedEmail}?truncateResponse=false`,
      {
        method: 'GET',
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'ShieldScan-Security-Scanner',
        },
      }
    );

    if (response.status === 404) {
      // No breaches found
      return [];
    }

    if (response.status === 401) {
      throw new Error('Invalid HIBP API key');
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const breaches: BreachInfo[] = await response.json();
    return breaches.map(breach => ({
      name: breach.name || breach.Name,
      title: breach.title || breach.Title || breach.name || breach.Name,
      domain: breach.domain || breach.Domain || '',
      breachDate: breach.breachDate || breach.BreachDate || '',
      addedDate: breach.addedDate || breach.AddedDate || '',
      modifiedDate: breach.modifiedDate || breach.ModifiedDate || '',
      pwnCount: breach.pwnCount || breach.PwnCount || 0,
      description: breach.description || breach.Description || '',
      dataClasses: breach.dataClasses || breach.DataClasses || [],
      isVerified: breach.isVerified ?? breach.IsVerified ?? false,
      isFabricated: breach.isFabricated ?? breach.IsFabricated ?? false,
      isSensitive: breach.isSensitive ?? breach.IsSensitive ?? false,
      isRetired: breach.isRetired ?? breach.IsRetired ?? false,
      isSpamList: breach.isSpamList ?? breach.IsSpamList ?? false,
      logoPath: breach.logoPath || breach.LogoPath,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to check email breach status');
  }
}

/**
 * Calculate risk level based on breaches
 */
export function calculateRiskLevel(breaches: BreachInfo[]): EmailBreachResult['riskLevel'] {
  if (breaches.length === 0) {
    return 'none';
  }

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

  let hasSensitiveData = false;
  let hasRecentBreach = false;
  let hasVeryRecentBreach = false;

  for (const breach of breaches) {
    // Check for sensitive data
    const sensitiveData = breach.dataClasses.filter(dc => 
      SENSITIVE_DATA_CLASSES.some(sdc => 
        dc.toLowerCase().includes(sdc.toLowerCase())
      )
    );
    if (sensitiveData.length > 0) {
      hasSensitiveData = true;
    }

    // Check breach recency
    const breachDate = new Date(breach.breachDate);
    if (breachDate > oneYearAgo) {
      hasVeryRecentBreach = true;
    } else if (breachDate > twoYearsAgo) {
      hasRecentBreach = true;
    }
  }

  // Critical: Sensitive data + recent breach
  if (hasSensitiveData && hasVeryRecentBreach) {
    return 'critical';
  }

  // High: Sensitive data OR very recent breach
  if (hasSensitiveData || hasVeryRecentBreach) {
    return 'high';
  }

  // Medium: Recent breach with non-sensitive data
  if (hasRecentBreach) {
    return 'medium';
  }

  // Low: Old breaches
  return 'low';
}

/**
 * Generate recommendations based on breaches
 */
export function generateRecommendations(breaches: BreachInfo[], riskLevel: string): string[] {
  const recommendations: string[] = [];

  if (breaches.length === 0) {
    recommendations.push('No breaches found. Continue practicing good security hygiene.');
    return recommendations;
  }

  // Check for password breaches
  const hasPasswordBreach = breaches.some(b => 
    b.dataClasses.some(dc => dc.toLowerCase().includes('password'))
  );

  // Check for email breaches
  const hasEmailBreach = breaches.some(b => 
    b.dataClasses.some(dc => dc.toLowerCase().includes('email'))
  );

  // Critical/High risk recommendations
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('⚠️ URGENT: Change all passwords immediately for accounts using this email');
    if (hasPasswordBreach) {
      recommendations.push('🔐 Enable two-factor authentication (2FA) on all accounts');
      recommendations.push('🔑 Use a password manager to generate unique, strong passwords');
    }
    recommendations.push('👀 Monitor your accounts for suspicious activity');
    recommendations.push('💳 Check your credit reports for unauthorized activity');
  }

  // Medium risk recommendations
  if (riskLevel === 'medium') {
    recommendations.push('Change passwords for sensitive accounts (banking, email, social media)');
    if (hasPasswordBreach) {
      recommendations.push('Enable 2FA where available');
    }
    recommendations.push('Review recent account activity for anomalies');
  }

  // Low risk recommendations
  if (riskLevel === 'low') {
    recommendations.push('Consider changing passwords for important accounts');
    recommendations.push('Enable 2FA on critical accounts if not already done');
  }

  // General recommendations
  if (hasEmailBreach) {
    recommendations.push('📧 Be extra cautious of phishing emails');
    recommendations.push('🎣 Verify sender identity before clicking links');
  }

  recommendations.push('🔍 Use ShieldScan regularly to monitor your security posture');

  return recommendations;
}

/**
 * Generate password suggestions for future password vault
 */
export function generatePasswordSuggestions(
  breaches: BreachInfo[], 
  riskLevel: string
): PasswordSuggestion[] {
  const suggestions: PasswordSuggestion[] = [];

  const hasPasswordBreach = breaches.some(b => 
    b.dataClasses.some(dc => dc.toLowerCase().includes('password'))
  );

  // Immediate actions
  if (hasPasswordBreach || riskLevel === 'critical' || riskLevel === 'high') {
    suggestions.push({
      type: 'immediate',
      title: 'Change Compromised Passwords Now',
      description: 'Your password was exposed in a data breach. Change it immediately on all sites where you used this email/password combination.',
      priority: 1,
    });
  }

  if (breaches.length > 0) {
    suggestions.push({
      type: 'immediate',
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security by enabling 2FA/MFA on accounts linked to this email. This protects you even if your password is compromised.',
      priority: 2,
    });
  }

  // Recommended actions
  suggestions.push({
    type: 'recommended',
    title: 'Use Unique Passwords',
    description: 'Never reuse passwords across different websites. Each account should have its own unique password.',
    priority: 3,
  });

  suggestions.push({
    type: 'recommended',
    title: 'Use a Password Manager',
    description: 'Store and generate strong, unique passwords securely. Consider using ShieldScan\'s upcoming Password Vault feature.',
    priority: 4,
  });

  // Best practices
  suggestions.push({
    type: 'best_practice',
    title: 'Create Strong Passwords',
    description: 'Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Avoid personal information like birthdays or names.',
    priority: 5,
  });

  suggestions.push({
    type: 'best_practice',
    title: 'Use Passphrases',
    description: 'Consider using memorable passphrases like "correct-horse-battery-staple" which are both strong and easier to remember.',
    priority: 6,
  });

  suggestions.push({
    type: 'best_practice',
    title: 'Regular Password Rotation',
    description: 'Change passwords periodically, especially for critical accounts like email, banking, and work systems.',
    priority: 7,
  });

  if (breaches.length > 3) {
    suggestions.push({
      type: 'best_practice',
      title: 'Consider Email Aliases',
      description: 'Use different email addresses or aliases for different services to limit exposure in future breaches.',
      priority: 8,
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Full email breach check with all details
 */
export async function fullEmailBreachCheck(
  email: string,
  apiKey: string
): Promise<EmailBreachResult> {
  const validation = validateEmail(email);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid email');
  }

  // Check cache
  const cached = emailCheckCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const breaches = await checkEmailBreach(email, apiKey);
  const riskLevel = calculateRiskLevel(breaches);
  const recommendations = generateRecommendations(breaches, riskLevel);
  const passwordSuggestions = generatePasswordSuggestions(breaches, riskLevel);

  // Find the most recent breach date
  let lastBreachDate: string | undefined;
  if (breaches.length > 0) {
    const dates = breaches
      .map(b => new Date(b.breachDate))
      .filter(d => !isNaN(d.getTime()));
    if (dates.length > 0) {
      const mostRecent = new Date(Math.max(...dates.map(d => d.getTime())));
      lastBreachDate = mostRecent.toISOString().split('T')[0];
    }
  }

  const result: EmailBreachResult = {
    email,
    breached: breaches.length > 0,
    breachCount: breaches.length,
    breaches,
    lastBreachDate,
    riskLevel,
    recommendations,
    passwordSuggestions,
  };

  // Cache the result
  emailCheckCache.set(email, { result, timestamp: Date.now() });

  return result;
}

/**
 * Check multiple emails for a domain with rate limiting
 */
export async function checkDomainEmails(
  domain: string,
  apiKey: string,
  customEmails?: string[]
): Promise<{
  domain: string;
  emailsChecked: number;
  emailsBreached: number;
  results: EmailBreachResult[];
}> {
  const emails = customEmails || generateDomainEmails(domain);
  const results: EmailBreachResult[] = [];

  for (let i = 0; i < emails.length; i++) {
    try {
      // Rate limiting delay
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      const result = await fullEmailBreachCheck(emails[i], apiKey);
      results.push(result);
    } catch (error) {
      // Continue with other emails if one fails
      console.error(`Error checking ${emails[i]}:`, error);
      results.push({
        email: emails[i],
        breached: false,
        breachCount: 0,
        breaches: [],
        riskLevel: 'none',
        recommendations: ['Unable to check this email. Please try again later.'],
        passwordSuggestions: [],
      });
    }
  }

  const emailsBreached = results.filter(r => r.breached).length;

  return {
    domain,
    emailsChecked: results.length,
    emailsBreached,
    results,
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-blue-500';
    default:
      return 'text-green-500';
  }
}

/**
 * Get risk level background color for UI
 */
export function getRiskLevelBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-500/20 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/30';
    default:
      return 'bg-green-500/20 border-green-500/30';
  }
}

/**
 * Format breach count for display
 */
export function formatPwnCount(count: number): string {
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Hash email for logging (privacy)
 */
export function hashEmailForLogging(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const localPart = parts[0];
  const domain = parts[1];
  const maskedLocal = localPart.length > 2 
    ? `${localPart[0]}***${localPart[localPart.length - 1]}`
    : '***';
  return `${maskedLocal}@${domain}`;
}

