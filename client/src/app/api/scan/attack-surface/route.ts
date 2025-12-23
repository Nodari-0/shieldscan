import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveDns = promisify(dns.resolve);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

// Common subdomain prefixes for enumeration
const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'ns2',
  'cpanel', 'whm', 'autodiscover', 'autoconfig', 'api', 'app', 'dev', 'stage',
  'staging', 'test', 'uat', 'admin', 'administrator', 'blog', 'shop', 'store',
  'portal', 'secure', 'login', 'auth', 'sso', 'cdn', 'static', 'assets',
  'images', 'img', 'media', 'video', 'vpn', 'remote', 'gateway', 'proxy',
  'db', 'database', 'mysql', 'postgres', 'redis', 'mongo', 'elastic',
  'kibana', 'grafana', 'jenkins', 'gitlab', 'github', 'bitbucket',
  'docs', 'documentation', 'support', 'help', 'status', 'monitor',
  'mx', 'mx1', 'mx2', 'ns', 'ns3', 'ns4', 'dns', 'dns1', 'dns2',
  'email', 'mail2', 'webdisk', 'server', 'host', 'node', 'cloud',
  'api-v1', 'api-v2', 'v1', 'v2', 'graphql', 'rest', 'web', 'mobile',
  'internal', 'intranet', 'extranet', 'partner', 'customer', 'client',
  'sandbox', 'demo', 'preview', 'beta', 'alpha', 'release', 'prod',
  'production', 'live', 'backup', 'bak', 'old', 'new', 'legacy',
];

// Common ports to check
const COMMON_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 23, service: 'Telnet' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 465, service: 'SMTPS' },
  { port: 587, service: 'SMTP Submission' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 1433, service: 'MSSQL' },
  { port: 3306, service: 'MySQL' },
  { port: 3389, service: 'RDP' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 8080, service: 'HTTP Proxy' },
  { port: 8443, service: 'HTTPS Alt' },
  { port: 27017, service: 'MongoDB' },
];

interface ScanResult {
  subdomains: string[];
  ipAddresses: string[];
  openPorts: { ip: string; port: number; service: string }[];
  technologies: string[];
  dnsRecords: {
    type: string;
    value: string | string[];
  }[];
  sslInfo?: {
    valid: boolean;
    issuer: string;
    expiry: string;
    daysUntilExpiry: number;
  };
  risks: {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    description: string;
    asset: string;
  }[];
  assetsFound: number;
}

async function checkSubdomain(subdomain: string): Promise<string | null> {
  try {
    const ips = await resolve4(subdomain);
    if (ips && ips.length > 0) {
      return subdomain;
    }
  } catch {
    // Subdomain doesn't exist
  }
  return null;
}

async function getDnsRecords(domain: string): Promise<{ type: string; value: string | string[] }[]> {
  const records: { type: string; value: string | string[] }[] = [];

  // A records
  try {
    const aRecords = await resolve4(domain);
    if (aRecords.length > 0) {
      records.push({ type: 'A', value: aRecords });
    }
  } catch { /* ignore */ }

  // AAAA records
  try {
    const aaaaRecords = await resolve6(domain);
    if (aaaaRecords.length > 0) {
      records.push({ type: 'AAAA', value: aaaaRecords });
    }
  } catch { /* ignore */ }

  // MX records
  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length > 0) {
      records.push({ type: 'MX', value: mxRecords.map(mx => `${mx.priority} ${mx.exchange}`) });
    }
  } catch { /* ignore */ }

  // NS records
  try {
    const nsRecords = await resolveNs(domain);
    if (nsRecords.length > 0) {
      records.push({ type: 'NS', value: nsRecords });
    }
  } catch { /* ignore */ }

  // TXT records
  try {
    const txtRecords = await resolveTxt(domain);
    if (txtRecords.length > 0) {
      records.push({ type: 'TXT', value: txtRecords.flat() });
    }
  } catch { /* ignore */ }

  // CNAME records
  try {
    const cnameRecords = await resolveCname(domain);
    if (cnameRecords.length > 0) {
      records.push({ type: 'CNAME', value: cnameRecords });
    }
  } catch { /* ignore */ }

  return records;
}

async function checkPort(ip: string, port: number, timeout: number = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // We can't directly check TCP ports from serverless, so we use HTTP probing for common web ports
      if ([80, 443, 8080, 8443].includes(port)) {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const response = await fetch(`${protocol}://${ip}:${port}`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return true;
      }
      clearTimeout(timeoutId);
      return false;
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Connection refused means port is closed, timeout might mean filtered
      if (error.code === 'ECONNREFUSED') return false;
      if (error.code === 'ENOTFOUND') return false;
      // For other errors, we can't determine the state
      return false;
    }
  } catch {
    return false;
  }
}

async function getSSLInfo(domain: string): Promise<ScanResult['sslInfo']> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
    });

    // We can't get detailed SSL info from fetch, but we can confirm it's valid
    if (response.ok || response.status < 500) {
      return {
        valid: true,
        issuer: 'Unknown (requires TLS inspection)',
        expiry: 'Unknown',
        daysUntilExpiry: -1,
      };
    }
  } catch (error: any) {
    if (error.cause?.code === 'CERT_HAS_EXPIRED') {
      return {
        valid: false,
        issuer: 'Unknown',
        expiry: 'Expired',
        daysUntilExpiry: 0,
      };
    }
  }
  return undefined;
}

async function detectTechnologies(domain: string): Promise<string[]> {
  const technologies: string[] = [];

  try {
    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ShieldScan Attack Surface Scanner/1.0',
      },
    });

    const headers = response.headers;

    // Server header
    const server = headers.get('server');
    if (server) {
      technologies.push(server);
      if (server.toLowerCase().includes('nginx')) technologies.push('Nginx');
      if (server.toLowerCase().includes('apache')) technologies.push('Apache');
      if (server.toLowerCase().includes('cloudflare')) technologies.push('Cloudflare');
      if (server.toLowerCase().includes('microsoft')) technologies.push('Microsoft IIS');
    }

    // X-Powered-By
    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) {
      technologies.push(poweredBy);
      if (poweredBy.toLowerCase().includes('php')) technologies.push('PHP');
      if (poweredBy.toLowerCase().includes('asp.net')) technologies.push('ASP.NET');
      if (poweredBy.toLowerCase().includes('express')) technologies.push('Express.js');
    }

    // CDN detection
    if (headers.get('x-cache')) technologies.push('CDN');
    if (headers.get('cf-ray')) technologies.push('Cloudflare CDN');
    if (headers.get('x-amz-cf-id')) technologies.push('AWS CloudFront');
    if (headers.get('x-served-by')?.includes('cache')) technologies.push('Varnish/Fastly');

    // Security headers
    if (headers.get('strict-transport-security')) technologies.push('HSTS Enabled');
    if (headers.get('content-security-policy')) technologies.push('CSP Enabled');

    // Try to get HTML for more detection
    if (response.ok) {
      const html = await response.text();
      
      // Framework detection
      if (html.includes('_next') || html.includes('__NEXT_DATA__')) technologies.push('Next.js');
      if (html.includes('react')) technologies.push('React');
      if (html.includes('vue')) technologies.push('Vue.js');
      if (html.includes('angular')) technologies.push('Angular');
      if (html.includes('wp-content') || html.includes('wordpress')) technologies.push('WordPress');
      if (html.includes('shopify')) technologies.push('Shopify');
      if (html.includes('wix')) technologies.push('Wix');
      if (html.includes('squarespace')) technologies.push('Squarespace');
      
      // Analytics/Tracking
      if (html.includes('google-analytics') || html.includes('gtag')) technologies.push('Google Analytics');
      if (html.includes('googletagmanager')) technologies.push('Google Tag Manager');
      if (html.includes('facebook.net')) technologies.push('Facebook Pixel');
      if (html.includes('hotjar')) technologies.push('Hotjar');
      
      // jQuery
      if (html.includes('jquery')) technologies.push('jQuery');
    }
  } catch {
    // Try HTTP if HTTPS fails
    try {
      const response = await fetch(`http://${domain}`, {
        method: 'HEAD',
      });
      const server = response.headers.get('server');
      if (server) technologies.push(server);
    } catch {
      // Domain might not be accessible
    }
  }

  // Remove duplicates and clean up
  return [...new Set(technologies)].slice(0, 20);
}

function analyzeRisks(
  domain: string,
  subdomains: string[],
  openPorts: { ip: string; port: number; service: string }[],
  technologies: string[],
  dnsRecords: { type: string; value: string | string[] }[],
  sslInfo?: ScanResult['sslInfo']
): ScanResult['risks'] {
  const risks: ScanResult['risks'] = [];

  // Check for exposed admin/dev subdomains
  const sensitiveSubdomains = subdomains.filter(sub => 
    sub.startsWith('admin.') || sub.startsWith('dev.') || sub.startsWith('test.') ||
    sub.startsWith('staging.') || sub.startsWith('internal.') || sub.startsWith('vpn.')
  );
  if (sensitiveSubdomains.length > 0) {
    risks.push({
      type: 'Exposed Sensitive Subdomains',
      severity: 'high',
      description: `Found ${sensitiveSubdomains.length} potentially sensitive subdomains that could expose internal systems`,
      asset: sensitiveSubdomains.join(', '),
    });
  }

  // Check for dangerous open ports
  const dangerousPorts = openPorts.filter(p => 
    [22, 23, 3306, 5432, 6379, 27017, 3389, 1433].includes(p.port)
  );
  if (dangerousPorts.length > 0) {
    risks.push({
      type: 'Exposed Database/Admin Ports',
      severity: 'critical',
      description: `Critical services (${dangerousPorts.map(p => p.service).join(', ')}) are exposed to the internet`,
      asset: dangerousPorts.map(p => `${p.ip}:${p.port}`).join(', '),
    });
  }

  // Check for RDP exposure
  if (openPorts.some(p => p.port === 3389)) {
    risks.push({
      type: 'RDP Exposed',
      severity: 'critical',
      description: 'Remote Desktop Protocol (RDP) is exposed to the internet - high risk of brute force attacks',
      asset: openPorts.filter(p => p.port === 3389).map(p => p.ip).join(', '),
    });
  }

  // Check for SSH exposure
  if (openPorts.some(p => p.port === 22)) {
    risks.push({
      type: 'SSH Exposed',
      severity: 'high',
      description: 'SSH service is exposed to the internet - ensure strong authentication is configured',
      asset: openPorts.filter(p => p.port === 22).map(p => p.ip).join(', '),
    });
  }

  // SSL/TLS issues
  if (!sslInfo) {
    risks.push({
      type: 'No HTTPS',
      severity: 'high',
      description: 'Domain does not support HTTPS or SSL certificate could not be verified',
      asset: domain,
    });
  } else if (!sslInfo.valid) {
    risks.push({
      type: 'Invalid SSL Certificate',
      severity: 'critical',
      description: 'SSL certificate is invalid or expired',
      asset: domain,
    });
  }

  // Check for missing SPF/DMARC
  const txtRecords = dnsRecords.find(r => r.type === 'TXT');
  const txtValues = txtRecords?.value || [];
  const txtArray = Array.isArray(txtValues) ? txtValues : [txtValues];
  
  const hasSpf = txtArray.some(v => v.includes('v=spf1'));
  const hasDmarc = txtArray.some(v => v.includes('v=DMARC1'));
  
  if (!hasSpf) {
    risks.push({
      type: 'Missing SPF Record',
      severity: 'medium',
      description: 'No SPF record found - domain may be vulnerable to email spoofing',
      asset: domain,
    });
  }
  
  if (!hasDmarc) {
    risks.push({
      type: 'Missing DMARC Record',
      severity: 'medium',
      description: 'No DMARC record found - email authentication policies not enforced',
      asset: domain,
    });
  }

  // Check for outdated technologies
  const outdatedTech = technologies.filter(t => 
    t.toLowerCase().includes('php/5') || 
    t.toLowerCase().includes('apache/2.2') ||
    t.toLowerCase().includes('nginx/1.1')
  );
  if (outdatedTech.length > 0) {
    risks.push({
      type: 'Outdated Technology',
      severity: 'medium',
      description: `Potentially outdated technology detected: ${outdatedTech.join(', ')}`,
      asset: domain,
    });
  }

  // Too many subdomains (large attack surface)
  if (subdomains.length > 20) {
    risks.push({
      type: 'Large Attack Surface',
      severity: 'low',
      description: `${subdomains.length} subdomains found - consider consolidating to reduce attack surface`,
      asset: `${subdomains.length} subdomains`,
    });
  }

  return risks;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    const result: ScanResult = {
      subdomains: [],
      ipAddresses: [],
      openPorts: [],
      technologies: [],
      dnsRecords: [],
      risks: [],
      assetsFound: 0,
    };

    // 1. Get DNS records for main domain
    result.dnsRecords = await getDnsRecords(cleanDomain);

    // 2. Get IP addresses
    try {
      const ipv4 = await resolve4(cleanDomain);
      result.ipAddresses.push(...ipv4);
    } catch { /* ignore */ }

    try {
      const ipv6 = await resolve6(cleanDomain);
      result.ipAddresses.push(...ipv6);
    } catch { /* ignore */ }

    // 3. Subdomain enumeration (parallel with batching)
    const subdomainPromises = COMMON_SUBDOMAINS.map(sub => 
      checkSubdomain(`${sub}.${cleanDomain}`)
    );
    
    const subdomainResults = await Promise.all(subdomainPromises);
    result.subdomains = subdomainResults.filter((sub): sub is string => sub !== null);

    // Add main domain
    result.subdomains.unshift(cleanDomain);

    // 4. Port scanning (limited for serverless)
    const webPorts = [80, 443, 8080, 8443];
    for (const ip of result.ipAddresses.slice(0, 2)) {
      for (const portInfo of COMMON_PORTS.filter(p => webPorts.includes(p.port))) {
        const isOpen = await checkPort(ip, portInfo.port);
        if (isOpen) {
          result.openPorts.push({
            ip,
            port: portInfo.port,
            service: portInfo.service,
          });
        }
      }
    }

    // 5. Technology detection
    result.technologies = await detectTechnologies(cleanDomain);

    // 6. SSL info
    result.sslInfo = await getSSLInfo(cleanDomain);

    // 7. Analyze risks
    result.risks = analyzeRisks(
      cleanDomain,
      result.subdomains,
      result.openPorts,
      result.technologies,
      result.dnsRecords,
      result.sslInfo
    );

    // 8. Calculate total assets
    result.assetsFound = 
      result.subdomains.length + 
      result.ipAddresses.length + 
      result.openPorts.length;

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Attack surface scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Scan failed' },
      { status: 500 }
    );
  }
}

