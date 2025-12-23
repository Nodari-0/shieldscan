/**
 * Email Service
 * Handles email sending via Resend
 */

import * as Sentry from '@sentry/nextjs';
import { logError, logInfo } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

class EmailService {
  private apiKey: string | undefined;
  private fromEmail: string;
  private replyTo: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'ShieldScan <noreply@shieldscan.com>';
    this.replyTo = process.env.RESEND_REPLY_TO || 'support@shieldscan.com';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send an email via Resend API
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.isConfigured()) {
      logInfo('Email service not configured - skipping email send', { 
        component: 'email',
        subject: options.subject 
      });
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const toEmails = recipients.map(r => r.email);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: toEmails,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo || this.replyTo,
          tags: options.tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      logInfo('Email sent successfully', {
        component: 'email',
        emailId: data.id,
        to: toEmails.join(', '),
        subject: options.subject,
      });

      return { success: true, id: data.id };
    } catch (error) {
      logError('Failed to send email', error, {
        component: 'email',
        subject: options.subject,
      });

      Sentry.captureException(error, {
        tags: { service: 'email' },
        extra: { subject: options.subject },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user: { email: string; name?: string }): Promise<EmailResult> {
    const html = generateWelcomeEmailHtml(user.name || 'there');
    
    return this.send({
      to: { email: user.email, name: user.name },
      subject: 'Welcome to ShieldScan! 🛡️',
      html,
      tags: [{ name: 'type', value: 'welcome' }],
    });
  }

  /**
   * Send scan complete notification
   */
  async sendScanCompleteEmail(
    user: { email: string; name?: string },
    scan: { url: string; score: number; grade: string; scanId: string }
  ): Promise<EmailResult> {
    const html = generateScanCompleteEmailHtml(user.name || 'there', scan);
    
    return this.send({
      to: { email: user.email, name: user.name },
      subject: `Scan Complete: ${scan.url} - Grade ${scan.grade}`,
      html,
      tags: [
        { name: 'type', value: 'scan_complete' },
        { name: 'scan_id', value: scan.scanId },
      ],
    });
  }

  /**
   * Send weekly security digest
   */
  async sendWeeklyDigestEmail(
    user: { email: string; name?: string },
    stats: { 
      scansThisWeek: number; 
      avgScore: number; 
      topIssues: string[];
      improvementTip: string;
    }
  ): Promise<EmailResult> {
    const html = generateWeeklyDigestEmailHtml(user.name || 'there', stats);
    
    return this.send({
      to: { email: user.email, name: user.name },
      subject: 'Your Weekly Security Report 📊',
      html,
      tags: [{ name: 'type', value: 'weekly_digest' }],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<EmailResult> {
    const html = generatePasswordResetEmailHtml(resetLink);
    
    return this.send({
      to: { email },
      subject: 'Reset Your ShieldScan Password',
      html,
      tags: [{ name: 'type', value: 'password_reset' }],
    });
  }
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

const emailBaseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: linear-gradient(145deg, #1a1a1a, #0f0f0f); border: 1px solid #333; border-radius: 16px; padding: 32px; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo { font-size: 24px; font-weight: bold; color: #eab308; }
  .content { line-height: 1.6; }
  .button { display: inline-block; background: #eab308; color: #000000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
  .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; color: #666; font-size: 12px; }
  .score { font-size: 48px; font-weight: bold; }
  .score-good { color: #22c55e; }
  .score-warning { color: #eab308; }
  .score-bad { color: #ef4444; }
  .stat-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 8px 0; }
`;

function generateWelcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ShieldScan</title>
  <style>${emailBaseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🛡️ ShieldScan</div>
      </div>
      <div class="content">
        <h1 style="margin-bottom: 16px;">Welcome, ${name}!</h1>
        <p>Thanks for joining ShieldScan. You're now ready to scan your websites for security vulnerabilities.</p>
        
        <h3 style="margin-top: 24px; color: #eab308;">Getting Started</h3>
        <ol style="color: #ccc;">
          <li>Go to your dashboard</li>
          <li>Click "Start New Scan"</li>
          <li>Enter your website URL</li>
          <li>Get your security report in seconds!</li>
        </ol>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://shieldscan.com/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <p style="color: #888; font-size: 14px;">
          Your free plan includes 1 scan per month. Upgrade to Pro for 100 scans and advanced features.
        </p>
      </div>
      <div class="footer">
        <p>ShieldScan - Website Security Scanner</p>
        <p><a href="https://shieldscan.com/unsubscribe" style="color: #666;">Unsubscribe</a> | <a href="https://shieldscan.com/help" style="color: #666;">Help</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateScanCompleteEmailHtml(
  name: string, 
  scan: { url: string; score: number; grade: string; scanId: string }
): string {
  const scoreClass = scan.score >= 80 ? 'score-good' : scan.score >= 60 ? 'score-warning' : 'score-bad';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scan Complete</title>
  <style>${emailBaseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🛡️ ShieldScan</div>
      </div>
      <div class="content">
        <h1 style="margin-bottom: 8px;">Scan Complete!</h1>
        <p style="color: #888; font-size: 14px; font-family: monospace;">${scan.url}</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div class="score ${scoreClass}">${scan.score}</div>
          <div style="font-size: 24px; margin-top: 8px;">Grade: ${scan.grade}</div>
        </div>
        
        <p>Hi ${name}, your security scan has finished. ${
          scan.score >= 80 
            ? 'Great job! Your website has a solid security posture.' 
            : scan.score >= 60 
              ? 'There are some areas that could use improvement.'
              : 'We found several security issues that need attention.'
        }</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://shieldscan.com/dashboard" class="button">View Full Report</a>
        </div>
      </div>
      <div class="footer">
        <p>ShieldScan - Website Security Scanner</p>
        <p><a href="https://shieldscan.com/unsubscribe" style="color: #666;">Unsubscribe from scan notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateWeeklyDigestEmailHtml(
  name: string,
  stats: { scansThisWeek: number; avgScore: number; topIssues: string[]; improvementTip: string }
): string {
  const scoreClass = stats.avgScore >= 80 ? 'score-good' : stats.avgScore >= 60 ? 'score-warning' : 'score-bad';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Security Digest</title>
  <style>${emailBaseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🛡️ ShieldScan</div>
      </div>
      <div class="content">
        <h1 style="margin-bottom: 8px;">Your Weekly Security Report</h1>
        <p style="color: #888;">Hi ${name}, here's your security summary for this week.</p>
        
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div class="stat-card" style="flex: 1; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #eab308;">${stats.scansThisWeek}</div>
            <div style="color: #888; font-size: 12px;">Scans</div>
          </div>
          <div class="stat-card" style="flex: 1; text-align: center;">
            <div class="score ${scoreClass}" style="font-size: 32px;">${stats.avgScore}</div>
            <div style="color: #888; font-size: 12px;">Avg Score</div>
          </div>
        </div>
        
        ${stats.topIssues.length > 0 ? `
        <h3 style="color: #eab308; margin-top: 24px;">Top Issues Found</h3>
        <ul style="color: #ccc;">
          ${stats.topIssues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
        ` : ''}
        
        <div class="stat-card" style="background: linear-gradient(145deg, #eab30810, #eab30805); border-color: #eab30830;">
          <h4 style="color: #eab308; margin: 0 0 8px 0;">💡 Tip of the Week</h4>
          <p style="margin: 0; color: #ccc; font-size: 14px;">${stats.improvementTip}</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://shieldscan.com/dashboard" class="button">View Dashboard</a>
        </div>
      </div>
      <div class="footer">
        <p>ShieldScan - Website Security Scanner</p>
        <p><a href="https://shieldscan.com/account#email-preferences" style="color: #666;">Manage email preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>${emailBaseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🛡️ ShieldScan</div>
      </div>
      <div class="content">
        <h1 style="margin-bottom: 16px;">Reset Your Password</h1>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        
        <p style="color: #888; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="color: #eab308;">${resetLink}</span>
        </p>
      </div>
      <div class="footer">
        <p>ShieldScan - Website Security Scanner</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const emailService = new EmailService();
export default emailService;

