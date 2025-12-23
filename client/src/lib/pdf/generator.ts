/**
 * PDF Report Generator
 * Generates professional security reports based on user plan
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PlanTier } from '@/config/security-checks';
import { format } from 'date-fns';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface ScanData {
  url: string;
  score: number;
  grade: string;
  createdAt: Date | string;
  duration?: number;
  checks?: any[];
  passed?: number;
  warnings?: number;
  failed?: number;
  vulnerabilities?: any[];
  recommendations?: any[];
  ssl?: any;
  headers?: any;
  dns?: any;
}

interface PDFOptions {
  scan: ScanData;
  userPlan: PlanTier;
  userName?: string;
  companyName?: string;
}

// Colors
const COLORS = {
  primary: [30, 41, 59] as [number, number, number], // slate-800
  secondary: [15, 23, 42] as [number, number, number], // slate-900
  accent: [234, 179, 8] as [number, number, number], // yellow-500
  success: [16, 185, 129] as [number, number, number], // green-500
  warning: [245, 158, 11] as [number, number, number], // amber-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  text: [255, 255, 255] as [number, number, number],
  textMuted: [156, 163, 175] as [number, number, number], // gray-400
};

/**
 * Check if user's plan allows PDF generation
 */
export function canGeneratePDF(plan: PlanTier): boolean {
  return plan !== 'free';
}

/**
 * Get score color based on score value
 */
function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
}

/**
 * Generate PDF security report
 */
export async function generatePDFReport(options: PDFOptions): Promise<Blob | null> {
  const { scan, userPlan, userName, companyName } = options;

  // Free users cannot generate PDFs
  if (!canGeneratePDF(userPlan)) {
    return null;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ============ HEADER ============
  // Dark header background
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo/Title
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ShieldScan', margin, 25);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Security Assessment Report', margin, 35);

  // Plan badge (Business/Enterprise only)
  if (userPlan === 'business' || userPlan === 'enterprise') {
    const badgeText = userPlan.toUpperCase();
    const badgeWidth = doc.getTextWidth(badgeText) + 10;
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(pageWidth - margin - badgeWidth, 15, badgeWidth, 20, 3, 3, 'F');
    doc.setTextColor(...COLORS.secondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(badgeText, pageWidth - margin - badgeWidth + 5, 28);
  }

  // Date
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const reportDate = format(new Date(), 'MMMM dd, yyyy HH:mm');
  doc.text(reportDate, pageWidth - margin - doc.getTextWidth(reportDate), 40);

  yPos = 65;

  // ============ SCAN OVERVIEW ============
  doc.setFillColor(248, 250, 252); // Light gray
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Scan Overview', margin + 10, yPos + 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`URL: ${scan.url}`, margin + 10, yPos + 28);
  
  const scanDate = typeof scan.createdAt === 'string' 
    ? format(new Date(scan.createdAt), 'MMM dd, yyyy HH:mm')
    : format(scan.createdAt, 'MMM dd, yyyy HH:mm');
  doc.text(`Scan Date: ${scanDate}`, margin + 10, yPos + 38);

  if (scan.duration) {
    doc.text(`Duration: ${scan.duration}ms`, pageWidth / 2, yPos + 38);
  }

  yPos += 55;

  // ============ SECURITY SCORE ============
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 50, 3, 3, 'F');

  // Score circle simulation
  const scoreColor = getScoreColor(scan.score);
  const centerX = margin + 40;
  const centerY = yPos + 25;
  
  doc.setFillColor(...scoreColor);
  doc.circle(centerX, centerY, 18, 'F');
  
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(String(scan.score), centerX - 10, centerY + 7);

  // Grade
  doc.setFontSize(28);
  doc.text(scan.grade, centerX + 35, centerY + 10);

  // Summary stats
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Results Summary', centerX + 80, yPos + 15);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.success);
  doc.text(`✓ ${scan.passed || 0} Passed`, centerX + 80, yPos + 28);
  
  doc.setTextColor(...COLORS.warning);
  doc.text(`⚠ ${scan.warnings || 0} Warnings`, centerX + 80, yPos + 38);
  
  doc.setTextColor(...COLORS.danger);
  doc.text(`✗ ${scan.failed || 0} Failed`, centerX + 80, yPos + 48);

  yPos += 60;

  // ============ VULNERABILITIES TABLE ============
  if (scan.vulnerabilities && scan.vulnerabilities.length > 0) {
    addNewPageIfNeeded(50);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vulnerabilities Found', margin, yPos);
    yPos += 10;

    const vulnData = scan.vulnerabilities.slice(0, 10).map((v: any) => [
      v.type || 'Unknown',
      (v.severity || 'Medium').toUpperCase(),
      v.details?.substring(0, 50) || 'No details',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Type', 'Severity', 'Details']],
      body: vulnData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.text,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 'auto' },
      },
      didParseCell: (data: any) => {
        if (data.column.index === 1) {
          const severity = data.cell.raw?.toLowerCase();
          if (severity === 'critical' || severity === 'high') {
            data.cell.styles.textColor = COLORS.danger;
          } else if (severity === 'medium') {
            data.cell.styles.textColor = COLORS.warning;
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // ============ RECOMMENDATIONS (Business/Enterprise) ============
  if ((userPlan === 'business' || userPlan === 'enterprise') && scan.recommendations && scan.recommendations.length > 0) {
    addNewPageIfNeeded(100);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', margin, yPos);
    yPos += 10;

    const recData = scan.recommendations.slice(0, 8).map((r: any, i: number) => [
      String(i + 1),
      r.title || 'Recommendation',
      (r.severity || 'Medium').toUpperCase(),
      r.effort || 'Medium',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['#', 'Recommendation', 'Priority', 'Effort']],
      body: recData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.text,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // ============ DETAILED ANALYSIS (Business/Enterprise) ============
  if (userPlan === 'business' || userPlan === 'enterprise') {
    // SSL Details
    if (scan.ssl) {
      addNewPageIfNeeded(60);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SSL/TLS Analysis', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Valid: ${scan.ssl.valid ? 'Yes' : 'No'}`, margin, yPos += 8);
      if (scan.ssl.issuer) doc.text(`Issuer: ${scan.ssl.issuer}`, margin, yPos += 6);
      if (scan.ssl.grade) doc.text(`Grade: ${scan.ssl.grade}`, margin, yPos += 6);
      if (scan.ssl.daysUntilExpiry !== undefined) {
        doc.text(`Days Until Expiry: ${scan.ssl.daysUntilExpiry}`, margin, yPos += 6);
      }
      yPos += 10;
    }

    // Headers Details
    if (scan.headers) {
      addNewPageIfNeeded(60);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Security Headers', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (scan.headers.grade) doc.text(`Grade: ${scan.headers.grade}`, margin, yPos += 8);
      if (scan.headers.score !== undefined) doc.text(`Score: ${scan.headers.score}/100`, margin, yPos += 6);
      yPos += 10;
    }
  }

  // ============ FOOTER ============
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `Generated by ShieldScan | Page ${i} of ${totalPages} | ${format(new Date(), 'MMM dd, yyyy')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Return as Blob
  return doc.output('blob');
}

/**
 * Download PDF report
 */
export async function downloadPDFReport(options: PDFOptions): Promise<boolean> {
  try {
    const blob = await generatePDFReport(options);
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedUrl = options.scan.url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 30);
    
    link.download = `shieldscan-report-${sanitizedUrl}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

