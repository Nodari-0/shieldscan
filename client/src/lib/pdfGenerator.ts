/**
 * Enhanced PDF Report Generator for Scan Results
 * Supports white-label branding for Business plans
 */

import jsPDF from 'jspdf';
import type { ScanResult, ScanCheck, StoredScanResult } from '@/types/scan';

interface PDFOptions {
  whiteLabel?: boolean;
  companyName?: string;
  logoBase64?: string;
  primaryColor?: string;
  hideShieldScanBranding?: boolean;
}

// Default colors
const COLORS = {
  primary: '#22c55e', // Green
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  dark: '#0a0a0a',
  darkSecondary: '#1a1a1a',
  text: '#e5e5e5',
  textMuted: '#737373',
  border: '#262626',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

export async function generateScanPDF(
  scanResult: ScanResult | StoredScanResult,
  userPlan?: string,
  options: PDFOptions = {}
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  const isWhiteLabel = options.whiteLabel || (userPlan === 'business' || userPlan === 'enterprise');
  const brandName = isWhiteLabel && options.companyName ? options.companyName : 'ShieldScan';
  const primaryColor = options.primaryColor || COLORS.primary;
  const primaryRgb = hexToRgb(primaryColor);

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = 25;
      return true;
    }
    return false;
  };

  // === HEADER ===
  // Dark background header
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Primary color accent line
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 15, 22);
  
  // Report title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('SECURITY SCAN REPORT', 15, 32);

  // Timestamp on right
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date(scanResult.timestamp).toLocaleString()}`, pageWidth - 15, 22, { align: 'right' });
  doc.text(`Report ID: ${scanResult.url.replace(/https?:\/\//, '').substring(0, 20)}...`, pageWidth - 15, 30, { align: 'right' });

  yPosition = 60;

  // === SCORE SECTION ===
  // Dark card background
  doc.setFillColor(26, 26, 26);
  doc.roundedRect(15, yPosition, pageWidth - 30, 55, 4, 4, 'F');

  // Score circle background
  const scoreColor = scanResult.score >= 80 ? COLORS.success : scanResult.score >= 60 ? COLORS.warning : COLORS.danger;
  const scoreRgb = hexToRgb(scoreColor);
  
  doc.setFillColor(scoreRgb.r, scoreRgb.g, scoreRgb.b);
  doc.circle(50, yPosition + 28, 20, 'F');
  
  // Score text
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(scanResult.score.toString(), 50, yPosition + 32, { align: 'center' });
  
  // Grade
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Grade: ${scanResult.grade}`, 50, yPosition + 50, { align: 'center' });

  // Target URL
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Target URL', 85, yPosition + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text(scanResult.url.substring(0, 60) + (scanResult.url.length > 60 ? '...' : ''), 85, yPosition + 22);

  // Stats row
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  
  const statsY = yPosition + 38;
  doc.text('Passed', 85, statsY);
  doc.text('Warnings', 120, statsY);
  doc.text('Failed', 155, statsY);
  doc.text('Duration', 185, statsY);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.success).r, hexToRgb(COLORS.success).g, hexToRgb(COLORS.success).b);
  doc.text(scanResult.summary.passed.toString(), 85, statsY + 12);
  
  doc.setTextColor(hexToRgb(COLORS.warning).r, hexToRgb(COLORS.warning).g, hexToRgb(COLORS.warning).b);
  doc.text(scanResult.summary.warnings.toString(), 120, statsY + 12);
  
  doc.setTextColor(hexToRgb(COLORS.danger).r, hexToRgb(COLORS.danger).g, hexToRgb(COLORS.danger).b);
  doc.text(scanResult.summary.failed.toString(), 155, statsY + 12);
  
  doc.setTextColor(150, 150, 150);
  doc.text(`${scanResult.scanDuration}ms`, 185, statsY + 12);

  yPosition += 70;

  // === SSL/TLS SECTION ===
  if (scanResult.ssl) {
    checkPageBreak(45);
    
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(15, yPosition, pageWidth - 30, 40, 4, 4, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SSL/TLS Certificate', 25, yPosition + 12);
    
    const sslValid = scanResult.ssl.valid;
    const sslStatusRgb = hexToRgb(sslValid ? COLORS.success : COLORS.danger);
    doc.setFillColor(sslStatusRgb.r, sslStatusRgb.g, sslStatusRgb.b);
    doc.roundedRect(pageWidth - 55, yPosition + 5, 40, 12, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(10, 10, 10);
    doc.text(sslValid ? 'VALID' : 'INVALID', pageWidth - 35, yPosition + 12.5, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Issuer: ${scanResult.ssl.issuer || 'Unknown'}`, 25, yPosition + 24);
    doc.text(`Protocol: ${scanResult.ssl.protocol || 'Unknown'}`, 100, yPosition + 24);
    doc.text(`Expires: ${scanResult.ssl.validTo || 'Unknown'} (${scanResult.ssl.daysUntilExpiry || '?'} days)`, 25, yPosition + 34);
    
    yPosition += 50;
  }

  // === DNS SECTION ===
  if (scanResult.dns && scanResult.dns.resolved) {
    checkPageBreak(35);
    
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(15, yPosition, pageWidth - 30, 30, 4, 4, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DNS Information', 25, yPosition + 12);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const ips = scanResult.dns.ipAddresses.length > 0 ? scanResult.dns.ipAddresses.slice(0, 3).join(', ') : 'Resolved';
    doc.text(`IP Addresses: ${ips}`, 25, yPosition + 24);
    
    if (scanResult.dns.hasCDN) {
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(`CDN: ${scanResult.dns.cdnProvider || 'Detected'}`, 130, yPosition + 24);
    }
    
    yPosition += 40;
  }

  // === SECURITY CHECKS ===
  checkPageBreak(30);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Security Checks', 15, yPosition);
  yPosition += 10;

  // Group checks by category
  const checksByCategory: Record<string, ScanCheck[]> = {};
  scanResult.checks.forEach(check => {
    if (!checksByCategory[check.category]) {
      checksByCategory[check.category] = [];
    }
    checksByCategory[check.category].push(check);
  });

  for (const [category, checks] of Object.entries(checksByCategory)) {
    checkPageBreak(25 + checks.length * 18);
    
    // Category header
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(15, yPosition, pageWidth - 30, 18, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(category, 25, yPosition + 12);
    
    // Category stats
    const catPassed = checks.filter(c => c.status === 'passed').length;
    const catWarnings = checks.filter(c => c.status === 'warning').length;
    const catFailed = checks.filter(c => c.status === 'failed').length;
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${catPassed} passed | ${catWarnings} warnings | ${catFailed} failed`, pageWidth - 25, yPosition + 12, { align: 'right' });
    
    yPosition += 22;

    // Individual checks
    for (const check of checks) {
      checkPageBreak(18);
      
      // Status indicator
      const statusColor = check.status === 'passed' ? COLORS.success : check.status === 'warning' ? COLORS.warning : COLORS.danger;
      const statusRgb = hexToRgb(statusColor);
      doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
      doc.circle(22, yPosition + 4, 3, 'F');
      
      // Check name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(229, 229, 229);
      doc.text(check.name, 30, yPosition + 6);
      
      // Status badge
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
      const statusText = check.status.toUpperCase();
      const statusWidth = doc.getTextWidth(statusText) + 6;
      doc.roundedRect(pageWidth - statusWidth - 20, yPosition, statusWidth, 10, 2, 2, 'F');
      doc.text(statusText, pageWidth - statusWidth / 2 - 20, yPosition + 6.5, { align: 'center' });
      
      // Check message
      if (check.message) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(115, 115, 115);
        const message = check.message.substring(0, 80) + (check.message.length > 80 ? '...' : '');
        doc.text(message, 30, yPosition + 14);
        yPosition += 18;
      } else {
        yPosition += 12;
      }
    }
    
    yPosition += 8;
  }

  // === VULNERABILITIES ===
  if (scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0) {
    checkPageBreak(40);
    
    doc.setFillColor(hexToRgb(COLORS.danger).r, hexToRgb(COLORS.danger).g, hexToRgb(COLORS.danger).b);
    doc.rect(15, yPosition, 3, 20 + scanResult.vulnerabilities.length * 20, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(COLORS.danger).r, hexToRgb(COLORS.danger).g, hexToRgb(COLORS.danger).b);
    doc.text(`Security Vulnerabilities Found (${scanResult.vulnerabilities.length})`, 25, yPosition + 10);
    yPosition += 20;

    for (const vuln of scanResult.vulnerabilities) {
      checkPageBreak(25);
      
      doc.setFillColor(38, 38, 38);
      doc.roundedRect(20, yPosition, pageWidth - 40, 20, 3, 3, 'F');
      
      // Severity badge
      const sevColor = vuln.severity === 'critical' ? '#dc2626' : vuln.severity === 'high' ? '#ea580c' : vuln.severity === 'medium' ? '#ca8a04' : '#2563eb';
      const sevRgb = hexToRgb(sevColor);
      doc.setFillColor(sevRgb.r, sevRgb.g, sevRgb.b);
      doc.roundedRect(25, yPosition + 4, 45, 12, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(vuln.severity.toUpperCase(), 47.5, yPosition + 11.5, { align: 'center' });
      
      // Vulnerability info
      doc.setFontSize(10);
      doc.setTextColor(229, 229, 229);
      doc.text(vuln.type, 75, yPosition + 10);
      
      doc.setFontSize(8);
      doc.setTextColor(115, 115, 115);
      doc.text(vuln.details.substring(0, 50), 75, yPosition + 17);
      
      yPosition += 25;
    }
  }

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(38, 38, 38);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    // Branding (unless white-label with hidden branding)
    if (!options.hideShieldScanBranding) {
      doc.text(isWhiteLabel && options.companyName ? `Powered by ShieldScan` : 'ShieldScan Security Scanner', pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
    
    // Timestamp
    doc.text(new Date().toISOString().split('T')[0], 15, pageHeight - 8);
  }

  return doc.output('blob');
}

/**
 * Export scan data to JSON
 */
export function exportToJSON(scanResult: ScanResult | StoredScanResult): string {
  return JSON.stringify(scanResult, null, 2);
}

/**
 * Export scan data to CSV
 */
export function exportToCSV(scanResult: ScanResult | StoredScanResult): string {
  const rows: string[] = [];
  
  // Header info
  rows.push('ShieldScan Security Report');
  rows.push(`URL,${scanResult.url}`);
  rows.push(`Score,${scanResult.score}`);
  rows.push(`Grade,${scanResult.grade}`);
  rows.push(`Timestamp,${scanResult.timestamp}`);
  rows.push(`Duration,${scanResult.scanDuration}ms`);
  rows.push('');
  
  // Summary
  rows.push('Summary');
  rows.push('Status,Count');
  rows.push(`Passed,${scanResult.summary.passed}`);
  rows.push(`Warnings,${scanResult.summary.warnings}`);
  rows.push(`Failed,${scanResult.summary.failed}`);
  rows.push(`Total,${scanResult.summary.total}`);
  rows.push('');
  
  // Security Checks
  rows.push('Security Checks');
  rows.push('Category,Name,Status,Message,Severity');
  
  for (const check of scanResult.checks) {
    const escapedMessage = (check.message || '').replace(/"/g, '""');
    rows.push(`"${check.category}","${check.name}","${check.status}","${escapedMessage}","${check.severity || ''}"`);
  }
  rows.push('');
  
  // Vulnerabilities
  if (scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0) {
    rows.push('Vulnerabilities');
    rows.push('Type,Severity,Details');
    
    for (const vuln of scanResult.vulnerabilities) {
      const escapedDetails = vuln.details.replace(/"/g, '""');
      rows.push(`"${vuln.type}","${vuln.severity}","${escapedDetails}"`);
    }
  }
  
  return rows.join('\n');
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string = 'shieldscan-report.pdf'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download JSON file
 */
export function downloadJSON(data: string, filename: string = 'shieldscan-report.json'): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV file
 */
export function downloadCSV(data: string, filename: string = 'shieldscan-report.csv'): void {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
