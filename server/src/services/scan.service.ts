/**
 * Scan Service
 * 
 * Handles website vulnerability scanning operations.
 */

import axios from 'axios';
import { URL } from 'url';
import logger from '../utils/logger.js';
import { getFirestoreDB } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

export interface ScanOptions {
  targetUrl: string;
  userId: string;
  scanTypes?: string[];
}

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string | null;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  errors: string[];
}

export interface SecurityHeaders {
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  contentSecurityPolicy: boolean;
  xXSSProtection: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  missingHeaders: string[];
  score: number;
}

export interface Vulnerability {
  id: string;
  type: 'ssl' | 'headers' | 'xss' | 'sql' | 'cms' | 'ports' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affectedResource: string;
  cveId: string | null;
}

export interface ScanResult {
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: {
    vulnerabilities: Vulnerability[];
    sslInfo: SSLInfo | null;
    openPorts: any[];
    securityHeaders: SecurityHeaders;
    cmsDetection: any;
    xssTests: any[];
    sqlInjectionTests: any[];
  };
  riskScore: number;
}

/**
 * Validate and normalize URL
 */
const normalizeUrl = (url: string): string => {
  try {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    const urlObj = new URL(normalized);
    return urlObj.origin;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Check SSL certificate
 */
const checkSSL = async (url: string): Promise<SSLInfo> => {
  try {
    const urlObj = new URL(url);
    const https = await import('https');
    
    return new Promise((resolve) => {
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        const errors: string[] = [];
        let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
        
        if (!cert.valid) {
          errors.push('Certificate is invalid');
        }
        if (daysUntilExpiry < 0) {
          errors.push('Certificate has expired');
          grade = 'F';
        } else if (daysUntilExpiry < 30) {
          errors.push('Certificate expires soon');
          grade = 'C';
        } else if (daysUntilExpiry < 90) {
          grade = 'B';
        } else {
          grade = res.socket.getProtocol() === 'TLSv1.3' ? 'A+' : 'A';
        }

        resolve({
          valid: cert.valid && daysUntilExpiry > 0,
          issuer: cert.issuer?.CN || 'Unknown',
          validFrom: new Date(cert.valid_from),
          validTo,
          daysUntilExpiry,
          protocol: res.socket.getProtocol() || 'Unknown',
          cipher: res.socket.getCipher()?.name || null,
          grade,
          errors,
        });
      });

      req.on('error', () => {
        resolve({
          valid: false,
          issuer: 'Unknown',
          validFrom: new Date(),
          validTo: new Date(),
          daysUntilExpiry: 0,
          protocol: 'Unknown',
          cipher: null,
          grade: 'F',
          errors: ['Failed to connect'],
        });
      });

      req.end();
    });
  } catch (error: any) {
    logger.error('SSL check failed:', error.message);
    return {
      valid: false,
      issuer: 'Unknown',
      validFrom: new Date(),
      validTo: new Date(),
      daysUntilExpiry: 0,
      protocol: 'Unknown',
      cipher: null,
      grade: 'F',
      errors: [error.message],
    };
  }
};

/**
 * Analyze security headers
 */
const analyzeSecurityHeaders = async (url: string): Promise<SecurityHeaders> => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
    });

    const headers = response.headers;
    const missingHeaders: string[] = [];

    const strictTransportSecurity = !!headers['strict-transport-security'];
    const xFrameOptions = !!headers['x-frame-options'];
    const xContentTypeOptions = !!headers['x-content-type-options'];
    const contentSecurityPolicy = !!headers['content-security-policy'];
    const xXSSProtection = !!headers['x-xss-protection'];
    const referrerPolicy = !!headers['referrer-policy'];
    const permissionsPolicy = !!headers['permissions-policy'];

    if (!strictTransportSecurity) missingHeaders.push('Strict-Transport-Security');
    if (!xFrameOptions) missingHeaders.push('X-Frame-Options');
    if (!xContentTypeOptions) missingHeaders.push('X-Content-Type-Options');
    if (!contentSecurityPolicy) missingHeaders.push('Content-Security-Policy');
    if (!xXSSProtection) missingHeaders.push('X-XSS-Protection');
    if (!referrerPolicy) missingHeaders.push('Referrer-Policy');
    if (!permissionsPolicy) missingHeaders.push('Permissions-Policy');

    const score = Math.round((7 - missingHeaders.length) / 7 * 100);

    return {
      strictTransportSecurity,
      xFrameOptions,
      xContentTypeOptions,
      contentSecurityPolicy,
      xXSSProtection,
      referrerPolicy,
      permissionsPolicy,
      missingHeaders,
      score,
    };
  } catch (error: any) {
    logger.error('Security headers analysis failed:', error.message);
    return {
      strictTransportSecurity: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      contentSecurityPolicy: false,
      xXSSProtection: false,
      referrerPolicy: false,
      permissionsPolicy: false,
      missingHeaders: ['All headers'],
      score: 0,
    };
  }
};

/**
 * Detect CMS
 */
const detectCMS = async (url: string): Promise<any> => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
    });

    const html = response.data;
    const cmsIndicators = {
      wordpress: [
        /wp-content/i,
        /wp-includes/i,
        /wordpress/i,
        /wp-json/i,
      ],
      drupal: [
        /drupal/i,
        /sites\/default/i,
        /core\/misc/i,
      ],
      joomla: [
        /joomla/i,
        /components\/com_/i,
        /administrator/i,
      ],
      magento: [
        /magento/i,
        /static\/version/i,
        /skin\/frontend/i,
      ],
    };

    for (const [cms, patterns] of Object.entries(cmsIndicators)) {
      const matches = patterns.filter(pattern => pattern.test(html));
      if (matches.length >= 2) {
        return {
          detected: true,
          cmsType: cms,
          version: null, // Would need more sophisticated detection
          vulnerabilities: [],
        };
      }
    }

    return {
      detected: false,
      cmsType: null,
      version: null,
      vulnerabilities: [],
    };
  } catch (error: any) {
    logger.error('CMS detection failed:', error.message);
    return {
      detected: false,
      cmsType: null,
      version: null,
      vulnerabilities: [],
    };
  }
};

/**
 * Test for XSS vulnerabilities
 */
const testXSS = async (url: string): Promise<any[]> => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg/onload=alert("XSS")>',
    'javascript:alert("XSS")',
  ];

  const results: any[] = [];

  for (const payload of xssPayloads) {
    try {
      const testUrl = `${url}?q=${encodeURIComponent(payload)}`;
      const response = await axios.get(testUrl, {
        timeout: 5000,
        validateStatus: () => true,
        maxRedirects: 3,
      });

      if (response.data.includes(payload) || response.data.includes('alert')) {
        results.push({
          testType: 'Reflected XSS',
          vulnerable: true,
          payload,
          location: 'Query parameter',
          severity: 'high',
        });
      }
    } catch (error) {
      // Continue to next payload
    }
  }

  return results;
};

/**
 * Test for SQL injection vulnerabilities
 */
const testSQLInjection = async (url: string): Promise<any[]> => {
  const sqlPayloads = [
    "' OR '1'='1",
    "' OR 1=1--",
    "1' UNION SELECT NULL--",
    "admin'--",
  ];

  const results: any[] = [];

  for (const payload of sqlPayloads) {
    try {
      const testUrl = `${url}?id=${encodeURIComponent(payload)}`;
      const response = await axios.get(testUrl, {
        timeout: 5000,
        validateStatus: () => true,
        maxRedirects: 3,
      });

      if (
        response.data.includes('SQL syntax') ||
        response.data.includes('mysql') ||
        response.data.includes('database error')
      ) {
        results.push({
          testType: 'SQL Injection',
          vulnerable: true,
          payload,
          location: 'Query parameter',
          severity: 'critical',
        });
      }
    } catch (error) {
      // Continue to next payload
    }
  }

  return results;
};

/**
 * Scan common ports
 */
const scanPorts = async (url: string): Promise<any[]> => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 3389, 5432, 8080];

  const openPorts: any[] = [];

  // In production, use a proper port scanner library
  // This is a simplified version
  for (const port of commonPorts) {
    try {
      // This would need actual port scanning implementation
      // For now, we'll skip it or use a library
    } catch (error) {
      // Continue
    }
  }

  return openPorts;
};

/**
 * Calculate risk score (0-100)
 */
const calculateRiskScore = (
  sslInfo: SSLInfo | null,
  securityHeaders: SecurityHeaders,
  vulnerabilities: Vulnerability[],
  xssTests: any[],
  sqlTests: any[]
): number => {
  let score = 100;

  // SSL issues
  if (sslInfo) {
    if (!sslInfo.valid) score -= 30;
    else if (sslInfo.grade === 'F') score -= 25;
    else if (sslInfo.grade === 'C') score -= 15;
    else if (sslInfo.grade === 'B') score -= 10;
  }

  // Security headers
  score -= (7 - securityHeaders.missingHeaders.length) * 3;

  // Vulnerabilities
  vulnerabilities.forEach(vuln => {
    if (vuln.severity === 'critical') score -= 20;
    else if (vuln.severity === 'high') score -= 15;
    else if (vuln.severity === 'medium') score -= 10;
    else if (vuln.severity === 'low') score -= 5;
  });

  // XSS vulnerabilities
  if (xssTests.some(test => test.vulnerable)) score -= 15;

  // SQL injection vulnerabilities
  if (sqlTests.some(test => test.vulnerable)) score -= 20;

  return Math.max(0, Math.min(100, score));
};

/**
 * Create a new scan job
 */
export const createScan = async (options: ScanOptions): Promise<string> => {
  logger.info(`Creating scan for ${options.targetUrl}`);
  
  const db = getFirestoreDB();
  const scanId = uuidv4();
  const normalizedUrl = normalizeUrl(options.targetUrl);

  // Check user scan limits (would need to implement)
  
  // Create scan document
  await db.collection('scans').doc(scanId).set({
    scanId,
    userId: options.userId,
    targetUrl: normalizedUrl,
    status: 'pending',
    startedAt: new Date(),
    createdAt: new Date(),
  });

  // Execute scan asynchronously
  executeScan(scanId, normalizedUrl, options.userId).catch(error => {
    logger.error(`Scan ${scanId} failed:`, error);
  });

  return scanId;
};

/**
 * Execute scan operations
 */
export const executeScan = async (
  scanId: string,
  targetUrl: string,
  userId: string
): Promise<void> => {
  logger.info(`Executing scan ${scanId}`);
  
  const db = getFirestoreDB();
  const scanRef = db.collection('scans').doc(scanId);

  try {
    await scanRef.update({ status: 'running' });

    // Run all scans in parallel
    const [sslInfo, securityHeaders, cmsDetection, xssTests, sqlTests] = await Promise.all([
      checkSSL(targetUrl),
      analyzeSecurityHeaders(targetUrl),
      detectCMS(targetUrl),
      testXSS(targetUrl),
      testSQLInjection(targetUrl),
    ]);

    const openPorts = await scanPorts(targetUrl);

    // Build vulnerabilities list
    const vulnerabilities: Vulnerability[] = [];

    // SSL vulnerabilities
    if (sslInfo && !sslInfo.valid) {
      vulnerabilities.push({
        id: uuidv4(),
        type: 'ssl',
        severity: 'critical',
        title: 'Invalid SSL Certificate',
        description: 'The SSL certificate is invalid or expired.',
        recommendation: 'Renew and properly configure SSL certificate.',
        affectedResource: targetUrl,
        cveId: null,
      });
    }

    // Security headers vulnerabilities
    securityHeaders.missingHeaders.forEach(header => {
      vulnerabilities.push({
        id: uuidv4(),
        type: 'headers',
        severity: securityHeaders.missingHeaders.length > 4 ? 'high' : 'medium',
        title: `Missing Security Header: ${header}`,
        description: `The ${header} header is missing, which could expose your site to attacks.`,
        recommendation: `Add the ${header} header to your server configuration.`,
        affectedResource: targetUrl,
        cveId: null,
      });
    });

    // XSS vulnerabilities
    xssTests.filter(test => test.vulnerable).forEach(test => {
      vulnerabilities.push({
        id: uuidv4(),
        type: 'xss',
        severity: 'high',
        title: 'Cross-Site Scripting (XSS) Vulnerability',
        description: `XSS vulnerability detected in ${test.location}.`,
        recommendation: 'Sanitize and validate all user inputs before rendering.',
        affectedResource: targetUrl,
        cveId: null,
      });
    });

    // SQL injection vulnerabilities
    sqlTests.filter(test => test.vulnerable).forEach(test => {
      vulnerabilities.push({
        id: uuidv4(),
        type: 'sql',
        severity: 'critical',
        title: 'SQL Injection Vulnerability',
        description: `SQL injection vulnerability detected in ${test.location}.`,
        recommendation: 'Use parameterized queries and input validation.',
        affectedResource: targetUrl,
        cveId: null,
      });
    });

    // Calculate risk score
    const riskScore = calculateRiskScore(
      sslInfo,
      securityHeaders,
      vulnerabilities,
      xssTests,
      sqlTests
    );

    // Update scan document
    await scanRef.update({
      status: 'completed',
      completedAt: new Date(),
      riskScore,
      findings: {
        vulnerabilities,
        sslInfo,
        openPorts,
        securityHeaders,
        cmsDetection,
        xssTests,
        sqlInjectionTests: sqlTests,
      },
    });

    logger.info(`Scan ${scanId} completed with risk score: ${riskScore}`);
  } catch (error: any) {
    logger.error(`Scan ${scanId} failed:`, error);
    await scanRef.update({
      status: 'failed',
      completedAt: new Date(),
      error: error.message,
    });
  }
};

/**
 * Get scan status
 */
export const getScanStatus = async (scanId: string): Promise<any> => {
  const db = getFirestoreDB();
  const scanDoc = await db.collection('scans').doc(scanId).get();
  
  if (!scanDoc.exists) {
    throw new Error('Scan not found');
  }
  
  return scanDoc.data();
};