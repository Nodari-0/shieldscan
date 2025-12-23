// ==========================================
// ENTERPRISE DATA PERSISTENCE
// ==========================================
// Server-side persistence for security-critical data
// Replaces localStorage for enterprise features

import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// ==========================================
// TYPES
// ==========================================

export interface OrganizationData {
  id: string;
  ownerId: string;
  name: string;
  encryptionConfig?: EncryptionConfigData;
  sovereigntyConfig?: SovereigntyConfigData;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface EncryptionConfigData {
  provider: string;
  status: 'active' | 'rotating' | 'disabled';
  keyId: string;
  keyAlgorithm: string;
  region: string;
  rotationEnabled: boolean;
  rotationIntervalDays: number;
  lastRotatedAt?: string;
}

export interface SovereigntyConfigData {
  primaryRegion: string;
  allowedRegions: string[];
  dataResidency: 'strict' | 'flexible';
  crossBorderTransfer: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  scannerRegionLock: boolean;
}

export interface EvidenceRecord {
  id?: string;
  organizationId: string;
  scanId: string;
  findingId: string;
  hash: string;
  previousHash?: string;
  timestamp: string;
  signature: string;
  bundle: object;
  createdAt: Timestamp | Date;
}

export interface FalsePositiveRuleData {
  id?: string;
  organizationId: string;
  name: string;
  description?: string;
  type: string;
  condition: object;
  action: string;
  enabled: boolean;
  matchCount: number;
  createdBy: string;
  createdAt: Timestamp | Date;
  lastMatchedAt?: Timestamp | Date;
}

export interface DismissedFindingData {
  id?: string;
  organizationId: string;
  findingId: string;
  scanId: string;
  reason: string;
  notes?: string;
  dismissedBy: string;
  dismissedAt: Timestamp | Date;
  expiresAt?: Timestamp | Date;
}

export interface ComplianceStateData {
  id?: string;
  organizationId: string;
  framework: string;
  status: string;
  controlsTotal: number;
  controlsPassed: number;
  lastAssessedAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AuditLogEntry {
  id?: string;
  organizationId: string;
  actor: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp | Date;
}

// ==========================================
// ORGANIZATION
// ==========================================

export async function getOrganization(orgId: string): Promise<OrganizationData | null> {
  try {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as OrganizationData;
    }
    return null;
  } catch (error) {
    console.error('Failed to get organization:', error);
    throw new Error('Failed to retrieve organization data');
  }
}

export async function getOrganizationByOwner(ownerId: string): Promise<OrganizationData | null> {
  try {
    const q = query(
      collection(db, 'organizations'),
      where('ownerId', '==', ownerId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as OrganizationData;
    }
    return null;
  } catch (error) {
    console.error('Failed to get organization by owner:', error);
    return null;
  }
}

export async function createOrganization(data: Omit<OrganizationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'organizations'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw new Error('Failed to create organization');
  }
}

export async function updateOrganization(orgId: string, data: Partial<OrganizationData>): Promise<void> {
  try {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update organization:', error);
    throw new Error('Failed to update organization');
  }
}

// ==========================================
// ENCRYPTION CONFIG
// ==========================================

export async function saveEncryptionConfig(orgId: string, config: EncryptionConfigData): Promise<void> {
  try {
    await updateOrganization(orgId, { encryptionConfig: config });
    await writeAuditLog(orgId, {
      action: 'encryption_config_updated',
      resource: 'encryption',
      details: { provider: config.provider, region: config.region },
    });
  } catch (error) {
    console.error('Failed to save encryption config:', error);
    throw new Error('Failed to save encryption configuration');
  }
}

export async function getEncryptionConfig(orgId: string): Promise<EncryptionConfigData | null> {
  try {
    const org = await getOrganization(orgId);
    return org?.encryptionConfig || null;
  } catch (error) {
    console.error('Failed to get encryption config:', error);
    return null;
  }
}

// ==========================================
// SOVEREIGNTY CONFIG
// ==========================================

export async function saveSovereigntyConfig(orgId: string, config: SovereigntyConfigData): Promise<void> {
  try {
    await updateOrganization(orgId, { sovereigntyConfig: config });
    await writeAuditLog(orgId, {
      action: 'sovereignty_config_updated',
      resource: 'sovereignty',
      details: { primaryRegion: config.primaryRegion, dataResidency: config.dataResidency },
    });
  } catch (error) {
    console.error('Failed to save sovereignty config:', error);
    throw new Error('Failed to save sovereignty configuration');
  }
}

export async function getSovereigntyConfig(orgId: string): Promise<SovereigntyConfigData | null> {
  try {
    const org = await getOrganization(orgId);
    return org?.sovereigntyConfig || null;
  } catch (error) {
    console.error('Failed to get sovereignty config:', error);
    return null;
  }
}

// ==========================================
// EVIDENCE CHAIN
// ==========================================

export async function saveEvidence(evidence: Omit<EvidenceRecord, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'evidence'), {
      ...evidence,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to save evidence:', error);
    throw new Error('Failed to save evidence record');
  }
}

export async function getEvidenceChain(orgId: string, scanId?: string): Promise<EvidenceRecord[]> {
  try {
    let q = query(
      collection(db, 'evidence'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'asc')
    );
    
    if (scanId) {
      q = query(
        collection(db, 'evidence'),
        where('organizationId', '==', orgId),
        where('scanId', '==', scanId),
        orderBy('createdAt', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EvidenceRecord));
  } catch (error) {
    console.error('Failed to get evidence chain:', error);
    return [];
  }
}

export async function getLastEvidence(orgId: string): Promise<EvidenceRecord | null> {
  try {
    const q = query(
      collection(db, 'evidence'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as EvidenceRecord;
    }
    return null;
  } catch (error) {
    console.error('Failed to get last evidence:', error);
    return null;
  }
}

// ==========================================
// FALSE POSITIVE RULES
// ==========================================

export async function saveFPRule(rule: Omit<FalsePositiveRuleData, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'fpRules'), {
      ...rule,
      createdAt: serverTimestamp(),
    });
    await writeAuditLog(rule.organizationId, {
      action: 'fp_rule_created',
      resource: 'fpRules',
      resourceId: docRef.id,
      details: { name: rule.name, type: rule.type },
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to save FP rule:', error);
    throw new Error('Failed to save false positive rule');
  }
}

export async function getFPRules(orgId: string): Promise<FalsePositiveRuleData[]> {
  try {
    const q = query(
      collection(db, 'fpRules'),
      where('organizationId', '==', orgId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FalsePositiveRuleData));
  } catch (error) {
    console.error('Failed to get FP rules:', error);
    return [];
  }
}

export async function updateFPRule(ruleId: string, updates: Partial<FalsePositiveRuleData>): Promise<void> {
  try {
    const docRef = doc(db, 'fpRules', ruleId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Failed to update FP rule:', error);
    throw new Error('Failed to update false positive rule');
  }
}

export async function deleteFPRule(orgId: string, ruleId: string): Promise<void> {
  try {
    const docRef = doc(db, 'fpRules', ruleId);
    // Soft delete by setting enabled = false and adding deletedAt
    await updateDoc(docRef, {
      enabled: false,
      deletedAt: serverTimestamp(),
    });
    await writeAuditLog(orgId, {
      action: 'fp_rule_deleted',
      resource: 'fpRules',
      resourceId: ruleId,
    });
  } catch (error) {
    console.error('Failed to delete FP rule:', error);
    throw new Error('Failed to delete false positive rule');
  }
}

// ==========================================
// DISMISSED FINDINGS
// ==========================================

export async function dismissFinding(data: Omit<DismissedFindingData, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'dismissedFindings'), {
      ...data,
      dismissedAt: serverTimestamp(),
    });
    await writeAuditLog(data.organizationId, {
      action: 'finding_dismissed',
      resource: 'findings',
      resourceId: data.findingId,
      details: { reason: data.reason, scanId: data.scanId },
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to dismiss finding:', error);
    throw new Error('Failed to dismiss finding');
  }
}

export async function getDismissedFindings(orgId: string): Promise<DismissedFindingData[]> {
  try {
    const q = query(
      collection(db, 'dismissedFindings'),
      where('organizationId', '==', orgId),
      orderBy('dismissedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DismissedFindingData));
  } catch (error) {
    console.error('Failed to get dismissed findings:', error);
    return [];
  }
}

// ==========================================
// COMPLIANCE STATE
// ==========================================

export async function saveComplianceState(state: Omit<ComplianceStateData, 'id'>): Promise<string> {
  try {
    // Check if exists
    const q = query(
      collection(db, 'complianceStates'),
      where('organizationId', '==', state.organizationId),
      where('framework', '==', state.framework),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = doc(db, 'complianceStates', snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...state,
        updatedAt: serverTimestamp(),
      });
      return snapshot.docs[0].id;
    } else {
      const docRef = await addDoc(collection(db, 'complianceStates'), {
        ...state,
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Failed to save compliance state:', error);
    throw new Error('Failed to save compliance state');
  }
}

export async function getComplianceStates(orgId: string): Promise<ComplianceStateData[]> {
  try {
    const q = query(
      collection(db, 'complianceStates'),
      where('organizationId', '==', orgId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplianceStateData));
  } catch (error) {
    console.error('Failed to get compliance states:', error);
    return [];
  }
}

// ==========================================
// AUDIT LOG (Append-Only, Immutable)
// ==========================================

interface AuditLogParams {
  action: string;
  resource: string;
  resourceId?: string;
  details?: object;
  actor?: string;
  actorEmail?: string;
}

export async function writeAuditLog(orgId: string, params: AuditLogParams): Promise<void> {
  try {
    // Audit logs are append-only - no update or delete operations
    await addDoc(collection(db, 'auditLogs'), {
      organizationId: orgId,
      ...params,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Audit log failures should not break operations, but should be logged
    console.error('Failed to write audit log:', error);
  }
}

export async function getAuditLogs(
  orgId: string, 
  options?: { limit?: number; action?: string; resource?: string }
): Promise<AuditLogEntry[]> {
  try {
    let q = query(
      collection(db, 'auditLogs'),
      where('organizationId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(options?.limit || 100)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

// ==========================================
// MIGRATION HELPER
// ==========================================

/**
 * Migrates data from localStorage to Firestore
 * Run once per organization during upgrade
 */
export async function migrateFromLocalStorage(orgId: string, userId: string): Promise<{
  migrated: string[];
  errors: string[];
}> {
  const migrated: string[] = [];
  const errors: string[] = [];

  if (typeof window === 'undefined') {
    return { migrated, errors };
  }

  const keysToMigrate = [
    'shieldscan_encryption_config',
    'shieldscan_sovereignty_config',
    'shieldscan_evidence_chain',
    'shieldscan_fp_rules',
    'shieldscan_dismissed_findings',
  ];

  for (const key of keysToMigrate) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;

      const parsed = JSON.parse(data);
      
      switch (key) {
        case 'shieldscan_encryption_config':
          await saveEncryptionConfig(orgId, parsed);
          migrated.push(key);
          break;
        case 'shieldscan_sovereignty_config':
          await saveSovereigntyConfig(orgId, parsed);
          migrated.push(key);
          break;
        // Add other migrations as needed
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(key);
    } catch (error) {
      errors.push(`${key}: ${error}`);
    }
  }

  await writeAuditLog(orgId, {
    action: 'data_migrated',
    resource: 'migration',
    actor: userId,
    details: { migrated, errors },
  });

  return { migrated, errors };
}

