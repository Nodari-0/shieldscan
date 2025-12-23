/**
 * DNS Security Scanner Module
 * 
 * Analyzes DNS configuration including:
 * - SPF, DKIM, DMARC records
 * - DNSSEC validation
 * - CAA records
 * - CDN detection
 */

import * as dns from 'dns';
import { promisify } from 'util';
import type {
  DNSScanResult,
  MXRecord,
  EmailSecurityResult,
  SPFResult,
  DMARCResult,
  DKIMResult,
  BIMIResult,
  SubdomainRisk,
} from './types';

// Promisify DNS functions
const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveCaa = promisify(dns.resolveCaa);

// Known CDN IP ranges and headers
const CDN_PATTERNS = {
  'Cloudflare': [/cloudflare/i, /104\.1[6-9]\./],
  'AWS CloudFront': [/cloudfront/i, /d[0-9a-z]+\.cloudfront\.net/],
  'Akamai': [/akamai/i, /akamaitechnologies/i],
  'Fastly': [/fastly/i],
  'Google Cloud CDN': [/google/i, /1e100\.net/],
  'Microsoft Azure CDN': [/azureedge/i, /msedge/i],
  'StackPath': [/stackpath/i, /highwinds/i],
  'KeyCDN': [/keycdn/i],
  'Bunny CDN': [/bunny/i, /b-cdn/i],
};

// Common DKIM selectors to check
const COMMON_DKIM_SELECTORS = [
  'default', 'dkim', 'selector1', 'selector2', 's1', 's2',
  'google', 'k1', 'mail', 'email', 'smtp'
];

/**
 * Scan DNS configuration of a domain
 */
export async function scanDNS(
  domain: string,
  timeout: number = 15000
): Promise<DNSScanResult> {
  const result: DNSScanResult = {
    resolved: false,
    ipAddresses: [],
    ipv6Addresses: [],
    mxRecords: [],
    nsRecords: [],
    txtRecords: [],
    caaRecords: [],
    hasCDN: false,
    cdnProvider: null,
    hasDNSSEC: false,
    dnssecValid: false,
    emailSecurity: {
      spf: { present: false, valid: false, issues: [] },
      dmarc: { present: false, valid: false, issues: [] },
      dkim: { present: false, selectors: [], valid: false },
      bimi: { present: false },
    },
    subdomainRisks: [],
  };

  try {
    // Resolve IPv4 addresses
    try {
      result.ipAddresses = await resolve4(domain);
      result.resolved = result.ipAddresses.length > 0;
    } catch {
      // IPv4 resolution failed
    }

    // Resolve IPv6 addresses
    try {
      result.ipv6Addresses = await resolve6(domain);
    } catch {
      // IPv6 not configured
    }

    // Get MX records
    try {
      const mx = await resolveMx(domain);
      result.mxRecords = mx.map(r => ({
        exchange: r.exchange,
        priority: r.priority,
      }));
    } catch {
      // No MX records
    }

    // Get NS records
    try {
      result.nsRecords = await resolveNs(domain);
    } catch {
      // NS resolution failed
    }

    // Get TXT records
    try {
      const txt = await resolveTxt(domain);
      result.txtRecords = txt.map(r => r.join(''));
    } catch {
      // No TXT records
    }

    // Get CAA records
    try {
      const caa = await resolveCaa(domain);
      result.caaRecords = caa.map(r => `${r.critical ? 'critical ' : ''}${r.tag || r.issue || ''} ${r.value || ''}`);
    } catch {
      // No CAA records or not supported
    }

    // Check for CDN
    const cdnResult = detectCDN(result.ipAddresses, result.txtRecords);
    result.hasCDN = cdnResult.detected;
    result.cdnProvider = cdnResult.provider;

    // Check DNSSEC (basic check via TXT records with dnssec indicator)
    result.hasDNSSEC = checkDNSSEC(result.txtRecords);

    // Analyze email security
    result.emailSecurity = await analyzeEmailSecurity(domain, result.txtRecords);

  } catch (error) {
    // DNS scan partially failed
  }

  return result;
}

/**
 * Detect CDN provider
 */
function detectCDN(
  ipAddresses: string[],
  txtRecords: string[]
): { detected: boolean; provider: string | null } {
  const allRecords = [...ipAddresses, ...txtRecords].join(' ');

  for (const [provider, patterns] of Object.entries(CDN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(allRecords)) {
        return { detected: true, provider };
      }
    }
  }

  return { detected: false, provider: null };
}

/**
 * Basic DNSSEC check
 */
function checkDNSSEC(txtRecords: string[]): boolean {
  // This is a simplified check - real DNSSEC validation requires
  // checking DS/DNSKEY records and chain of trust
  return txtRecords.some(r => 
    r.toLowerCase().includes('dnssec') ||
    r.toLowerCase().includes('dnskey')
  );
}

/**
 * Analyze email security records
 */
async function analyzeEmailSecurity(
  domain: string,
  txtRecords: string[]
): Promise<EmailSecurityResult> {
  return {
    spf: analyzeSPF(txtRecords),
    dmarc: await analyzeDMARC(domain),
    dkim: await analyzeDKIM(domain),
    bimi: await analyzeBIMI(domain),
  };
}

/**
 * Analyze SPF record
 */
function analyzeSPF(txtRecords: string[]): SPFResult {
  const spfRecord = txtRecords.find(r => r.startsWith('v=spf1'));

  if (!spfRecord) {
    return {
      present: false,
      valid: false,
      issues: ['No SPF record found. Email spoofing is possible.'],
    };
  }

  const issues: string[] = [];
  let valid = true;

  // Check for common issues
  if (spfRecord.includes('+all')) {
    issues.push('SPF uses +all which allows any server to send email');
    valid = false;
  }

  if (spfRecord.includes('?all')) {
    issues.push('SPF uses ?all (neutral) which provides weak protection');
  }

  // Count mechanisms (too many can cause DNS lookups to exceed limit)
  const mechanisms = (spfRecord.match(/\b(include:|a:|mx:|ptr:|ip4:|ip6:|exists:)/g) || []).length;
  if (mechanisms > 10) {
    issues.push(`SPF has ${mechanisms} mechanisms, may exceed DNS lookup limit of 10`);
  }

  // Check for recommended -all or ~all
  if (!spfRecord.includes('-all') && !spfRecord.includes('~all')) {
    issues.push('SPF should end with -all (hard fail) or ~all (soft fail)');
  }

  // Determine policy
  let policy: string | undefined;
  if (spfRecord.includes('-all')) policy = 'reject';
  else if (spfRecord.includes('~all')) policy = 'softfail';
  else if (spfRecord.includes('?all')) policy = 'neutral';
  else if (spfRecord.includes('+all')) policy = 'pass';

  return {
    present: true,
    record: spfRecord,
    valid,
    policy,
    issues,
  };
}

/**
 * Analyze DMARC record
 */
async function analyzeDMARC(domain: string): Promise<DMARCResult> {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const txt = await resolveTxt(dmarcDomain);
    const records = txt.map(r => r.join(''));
    const dmarcRecord = records.find(r => r.startsWith('v=DMARC1'));

    if (!dmarcRecord) {
      return {
        present: false,
        valid: false,
        issues: ['No DMARC record found. Email authentication is incomplete.'],
      };
    }

    const issues: string[] = [];
    let valid = true;

    // Parse policy
    let policy: 'none' | 'quarantine' | 'reject' | undefined;
    const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/i);
    if (policyMatch) {
      policy = policyMatch[1].toLowerCase() as any;
      if (policy === 'none') {
        issues.push('DMARC policy is set to none (monitoring only, no enforcement)');
      }
    } else {
      issues.push('DMARC policy (p=) not specified');
      valid = false;
    }

    // Check for rua (aggregate reports)
    if (!dmarcRecord.includes('rua=')) {
      issues.push('No aggregate report address (rua=) configured');
    }

    // Check for subdomain policy
    if (!dmarcRecord.includes('sp=')) {
      issues.push('No subdomain policy (sp=) specified, inherits parent policy');
    }

    return {
      present: true,
      record: dmarcRecord,
      valid,
      policy,
      issues,
    };
  } catch {
    return {
      present: false,
      valid: false,
      issues: ['Could not retrieve DMARC record'],
    };
  }
}

/**
 * Analyze DKIM records
 */
async function analyzeDKIM(domain: string): Promise<DKIMResult> {
  const foundSelectors: string[] = [];

  // Try common selectors
  for (const selector of COMMON_DKIM_SELECTORS) {
    try {
      const dkimDomain = `${selector}._domainkey.${domain}`;
      const txt = await resolveTxt(dkimDomain);
      if (txt && txt.length > 0) {
        foundSelectors.push(selector);
      }
    } catch {
      // Selector not found
    }
  }

  return {
    present: foundSelectors.length > 0,
    selectors: foundSelectors,
    valid: foundSelectors.length > 0,
  };
}

/**
 * Analyze BIMI record
 */
async function analyzeBIMI(domain: string): Promise<BIMIResult> {
  try {
    const bimiDomain = `default._bimi.${domain}`;
    const txt = await resolveTxt(bimiDomain);
    const records = txt.map(r => r.join(''));
    const bimiRecord = records.find(r => r.startsWith('v=BIMI1'));

    if (bimiRecord) {
      const logoMatch = bimiRecord.match(/l=([^;]+)/);
      return {
        present: true,
        record: bimiRecord,
        logoUrl: logoMatch ? logoMatch[1] : undefined,
      };
    }

    return { present: false };
  } catch {
    return { present: false };
  }
}

export default scanDNS;

