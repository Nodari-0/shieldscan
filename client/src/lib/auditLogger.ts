/**
 * Security Audit Logger
 * Logs all security-relevant events for compliance and monitoring
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

export type AuditEventType =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password.reset'
  | 'auth.2fa.enabled'
  | 'auth.2fa.disabled'
  | 'scan.initiated'
  | 'scan.completed'
  | 'scan.failed'
  | 'scan.limit.reached'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'admin.action'
  | 'api.access'
  | 'api.rate.limit.exceeded'
  | 'suspicious.activity'
  | 'data.exported'
  | 'profile.updated'
  | 'payment.processed'
  | 'payment.failed';

export interface AuditLog {
  id?: string;
  userId?: string;
  userEmail?: string;
  eventType: AuditEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  result: 'success' | 'failure' | 'blocked';
  message: string;
  timestamp?: Date;
  createdAt?: Date;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: Omit<AuditLog, 'id' | 'createdAt' | 'timestamp'>): Promise<void> {
  try {
    const auditRef = collection(db, 'auditLogs');
    
    await addDoc(auditRef, {
      ...event,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should never break the app
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  eventType: 'auth.login.success' | 'auth.login.failure' | 'auth.logout' | 'auth.register',
  userId: string | undefined,
  userEmail: string | undefined,
  metadata?: Record<string, any>
): Promise<void> {
  const severity = eventType.includes('failure') ? 'warning' : 'info';
  const result = eventType.includes('failure') ? 'failure' : 'success';

  await logAuditEvent({
    userId,
    userEmail,
    eventType,
    severity,
    result,
    message: `${eventType.replace('auth.', '').replace('.', ' ')} ${result}`,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log scan events
 */
export async function logScanEvent(
  eventType: 'scan.initiated' | 'scan.completed' | 'scan.failed' | 'scan.limit.reached',
  userId: string,
  userEmail: string,
  url: string,
  metadata?: Record<string, any>
): Promise<void> {
  const severity = eventType === 'scan.limit.reached' ? 'warning' : 'info';
  const result = eventType.includes('failed') || eventType === 'scan.limit.reached' ? 'failure' : 'success';

  await logAuditEvent({
    userId,
    userEmail,
    eventType,
    severity,
    result,
    message: `Scan ${eventType.replace('scan.', '')}: ${url}`,
    metadata: {
      url,
      ...metadata,
    },
  });
}

/**
 * Log admin actions
 */
export async function logAdminAction(
  adminUserId: string,
  adminEmail: string,
  action: string,
  targetUserId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId: adminUserId,
    userEmail: adminEmail,
    eventType: 'admin.action',
    severity: 'warning', // Admin actions are always logged as warnings for visibility
    result: 'success',
    message: `Admin action: ${action}`,
    metadata: {
      action,
      targetUserId,
      ...metadata,
    },
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  userEmail: string | undefined,
  activity: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    userEmail,
    eventType: 'suspicious.activity',
    severity: 'critical',
    result: 'blocked',
    message: `Suspicious activity detected: ${activity}`,
    metadata: {
      activity,
      ...metadata,
    },
  });
}

/**
 * Get audit logs for a user (admin only)
 */
export async function getUserAuditLogs(userId: string, limitCount: number = 100): Promise<AuditLog[]> {
  try {
    const auditRef = collection(db, 'auditLogs');
    const q = query(
      auditRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get recent suspicious activities (admin only)
 */
export async function getSuspiciousActivities(limitCount: number = 50): Promise<AuditLog[]> {
  try {
    const auditRef = collection(db, 'auditLogs');
    const q = query(
      auditRef,
      where('eventType', '==', 'suspicious.activity'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Failed to fetch suspicious activities:', error);
    return [];
  }
}

