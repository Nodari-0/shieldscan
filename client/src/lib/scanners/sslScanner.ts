/**
 * SSL/TLS Scanner Module
 * 
 * Comprehensive SSL/TLS analysis including:
 * - Certificate validation
 * - TLS version detection
 * - Cipher suite analysis
 * - Known vulnerability checks
 */

import * as tls from 'tls';
import * as https from 'https';
import { URL } from 'url';
import type { 
  SSLScanResult, 
  SSLGrade, 
  CertificateInfo, 
  TLSVersionInfo, 
  SSLVulnerability,
  Severity 
} from './types';

// Known weak ciphers
const WEAK_CIPHERS = [
  'RC4', 'DES', '3DES', 'MD5', 'NULL', 'EXPORT', 'ANON',
  'RC2', 'IDEA', 'SEED', 'CAMELLIA128'
];

// Perfect Forward Secrecy ciphers
const PFS_CIPHERS = ['ECDHE', 'DHE'];

// Recommended minimum TLS version
const MIN_TLS_VERSION = 'TLSv1.2';

/**
 * Scan SSL/TLS configuration of a website
 */
export async function scanSSL(
  hostname: string,
  port: number = 443,
  timeout: number = 15000
): Promise<SSLScanResult> {
  const result: SSLScanResult = {
    valid: false,
    grade: 'F',
    issuer: '',
    subject: '',
    validFrom: '',
    validTo: '',
    daysUntilExpiry: 0,
    protocol: '',
    cipher: '',
    selfSigned: false,
    certificateChain: [],
    tlsVersions: [],
    vulnerabilities: [],
    errors: [],
  };

  try {
    // Get certificate details
    const certDetails = await getCertificateDetails(hostname, port, timeout);
    
    if (certDetails) {
      result.valid = certDetails.valid;
      result.issuer = certDetails.issuer;
      result.subject = certDetails.subject;
      result.validFrom = certDetails.validFrom;
      result.validTo = certDetails.validTo;
      result.daysUntilExpiry = certDetails.daysUntilExpiry;
      result.protocol = certDetails.protocol;
      result.cipher = certDetails.cipher;
      result.selfSigned = certDetails.selfSigned;
      result.certificateChain = certDetails.chain;
    }

    // Check TLS versions supported
    result.tlsVersions = await checkTLSVersions(hostname, port, timeout);

    // Check for known vulnerabilities
    result.vulnerabilities = await checkSSLVulnerabilities(
      hostname,
      port,
      result.tlsVersions,
      result.cipher
    );

    // Calculate grade
    result.grade = calculateSSLGrade(result);

  } catch (error: any) {
    result.errors.push(error.message || 'SSL scan failed');
  }

  return result;
}

/**
 * Get certificate details
 */
async function getCertificateDetails(
  hostname: string,
  port: number,
  timeout: number
): Promise<{
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  selfSigned: boolean;
  chain: CertificateInfo[];
} | null> {
  return new Promise((resolve) => {
    const options: tls.ConnectionOptions = {
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: false, // We want to inspect even invalid certs
      timeout: timeout,
    };

    const socket = tls.connect(options, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();

        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          resolve(null);
          return;
        }

        // Parse issuer and subject
        const issuer = formatCertificateName(cert.issuer);
        const subject = formatCertificateName(cert.subject);

        // Check if self-signed
        const selfSigned = issuer === subject || 
          (cert.issuerCertificate && cert.issuerCertificate.fingerprint === cert.fingerprint);

        // Calculate days until expiry
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Build certificate chain
        const chain: CertificateInfo[] = [];
        let currentCert = cert;
        let depth = 0;
        const maxDepth = 10;

        while (currentCert && depth < maxDepth) {
          chain.push({
            subject: formatCertificateName(currentCert.subject),
            issuer: formatCertificateName(currentCert.issuer),
            validFrom: currentCert.valid_from || '',
            validTo: currentCert.valid_to || '',
            serialNumber: currentCert.serialNumber || '',
            fingerprint: currentCert.fingerprint || '',
          });

          if (currentCert.issuerCertificate && 
              currentCert.issuerCertificate.fingerprint !== currentCert.fingerprint) {
            currentCert = currentCert.issuerCertificate;
            depth++;
          } else {
            break;
          }
        }

        socket.destroy();

        resolve({
          valid: socket.authorized,
          issuer,
          subject,
          validFrom: cert.valid_from || '',
          validTo: cert.valid_to || '',
          daysUntilExpiry,
          protocol: protocol || 'unknown',
          cipher: cipher ? `${cipher.name} (${cipher.version})` : 'unknown',
          selfSigned,
          chain,
        });
      } catch (error) {
        socket.destroy();
        resolve(null);
      }
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });

    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Format certificate name object to string
 */
function formatCertificateName(nameObj: any): string {
  if (!nameObj) return 'Unknown';
  
  const parts: string[] = [];
  
  if (nameObj.CN) parts.push(`CN=${nameObj.CN}`);
  if (nameObj.O) parts.push(`O=${nameObj.O}`);
  if (nameObj.OU) parts.push(`OU=${nameObj.OU}`);
  if (nameObj.C) parts.push(`C=${nameObj.C}`);
  if (nameObj.ST) parts.push(`ST=${nameObj.ST}`);
  if (nameObj.L) parts.push(`L=${nameObj.L}`);
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

/**
 * Check which TLS versions are supported
 */
async function checkTLSVersions(
  hostname: string,
  port: number,
  timeout: number
): Promise<TLSVersionInfo[]> {
  const versions: TLSVersionInfo[] = [
    { version: 'TLSv1.3', supported: false, secure: true },
    { version: 'TLSv1.2', supported: false, secure: true },
    { version: 'TLSv1.1', supported: false, secure: false },
    { version: 'TLSv1.0', supported: false, secure: false },
    { version: 'SSLv3', supported: false, secure: false },
  ];

  // Test TLS 1.2+ by connecting (most common)
  try {
    const protocol = await testTLSVersion(hostname, port, timeout);
    if (protocol) {
      const versionEntry = versions.find(v => v.version === protocol);
      if (versionEntry) {
        versionEntry.supported = true;
      }
      
      // If TLS 1.3 works, TLS 1.2 likely does too
      if (protocol === 'TLSv1.3') {
        const tls12 = versions.find(v => v.version === 'TLSv1.2');
        if (tls12) tls12.supported = true;
      }
    }
  } catch {
    // Connection failed
  }

  return versions;
}

/**
 * Test if a specific TLS version is supported
 */
async function testTLSVersion(
  hostname: string,
  port: number,
  timeout: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: timeout,
    }, () => {
      const protocol = socket.getProtocol();
      socket.destroy();
      resolve(protocol);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });

    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Check for known SSL vulnerabilities
 */
async function checkSSLVulnerabilities(
  hostname: string,
  port: number,
  tlsVersions: TLSVersionInfo[],
  cipher: string
): Promise<SSLVulnerability[]> {
  const vulnerabilities: SSLVulnerability[] = [];

  // Check for deprecated TLS versions
  const tls10 = tlsVersions.find(v => v.version === 'TLSv1.0');
  const tls11 = tlsVersions.find(v => v.version === 'TLSv1.1');
  const sslv3 = tlsVersions.find(v => v.version === 'SSLv3');

  if (sslv3?.supported) {
    vulnerabilities.push({
      name: 'SSLv3 Enabled (POODLE)',
      vulnerable: true,
      severity: 'critical',
      description: 'SSLv3 is vulnerable to POODLE attack and should be disabled.',
    });
  }

  if (tls10?.supported) {
    vulnerabilities.push({
      name: 'TLS 1.0 Enabled',
      vulnerable: true,
      severity: 'high',
      description: 'TLS 1.0 is deprecated and has known vulnerabilities. Upgrade to TLS 1.2 or higher.',
    });
  }

  if (tls11?.supported) {
    vulnerabilities.push({
      name: 'TLS 1.1 Enabled',
      vulnerable: true,
      severity: 'medium',
      description: 'TLS 1.1 is deprecated. Consider using only TLS 1.2 and TLS 1.3.',
    });
  }

  // Check for weak ciphers
  const cipherUpper = cipher.toUpperCase();
  for (const weakCipher of WEAK_CIPHERS) {
    if (cipherUpper.includes(weakCipher)) {
      vulnerabilities.push({
        name: `Weak Cipher: ${weakCipher}`,
        vulnerable: true,
        severity: weakCipher === 'NULL' || weakCipher === 'EXPORT' ? 'critical' : 'high',
        description: `Weak cipher ${weakCipher} is being used. Use strong ciphers only.`,
      });
      break;
    }
  }

  // Check for lack of Perfect Forward Secrecy
  const hasPFS = PFS_CIPHERS.some(pfs => cipherUpper.includes(pfs));
  if (!hasPFS && cipher !== 'unknown') {
    vulnerabilities.push({
      name: 'No Perfect Forward Secrecy',
      vulnerable: true,
      severity: 'medium',
      description: 'Perfect Forward Secrecy (PFS) is not enabled. Use ECDHE or DHE cipher suites.',
    });
  }

  // Check if only TLS 1.3 is supported (good!)
  const tls13 = tlsVersions.find(v => v.version === 'TLSv1.3');
  if (tls13?.supported) {
    vulnerabilities.push({
      name: 'TLS 1.3 Supported',
      vulnerable: false,
      severity: 'info',
      description: 'TLS 1.3 is supported, providing the best security and performance.',
    });
  }

  return vulnerabilities;
}

/**
 * Calculate SSL grade based on configuration
 */
function calculateSSLGrade(result: SSLScanResult): SSLGrade {
  let score = 100;

  // Certificate validity
  if (!result.valid) score -= 40;
  if (result.selfSigned) score -= 30;
  
  // Days until expiry
  if (result.daysUntilExpiry < 0) score -= 50; // Expired
  else if (result.daysUntilExpiry < 7) score -= 30;
  else if (result.daysUntilExpiry < 30) score -= 15;
  else if (result.daysUntilExpiry < 60) score -= 5;

  // TLS versions
  const tls13Supported = result.tlsVersions.find(v => v.version === 'TLSv1.3')?.supported;
  const tls12Supported = result.tlsVersions.find(v => v.version === 'TLSv1.2')?.supported;
  const tls10Supported = result.tlsVersions.find(v => v.version === 'TLSv1.0')?.supported;
  const sslv3Supported = result.tlsVersions.find(v => v.version === 'SSLv3')?.supported;

  if (!tls12Supported && !tls13Supported) score -= 30;
  if (tls10Supported) score -= 15;
  if (sslv3Supported) score -= 30;

  // Vulnerabilities
  for (const vuln of result.vulnerabilities) {
    if (vuln.vulnerable) {
      switch (vuln.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
  }

  // Bonus for TLS 1.3
  if (tls13Supported) score += 5;

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Convert score to grade
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export default scanSSL;

