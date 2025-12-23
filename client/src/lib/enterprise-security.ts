// ==========================================
// ENTERPRISE SECURITY ENGINE
// ==========================================
// BYOK, Data Sovereignty, Encryption, Evidence Chain

import {
  generateKeyId,
  sha256Sync as sha256,
  generateSignatureSync as generateSignature,
  hashString
} from './crypto';
import { EncryptionError, logError } from './errors';

export interface EncryptionConfig {
  id: string;
  organizationId: string;
  provider: EncryptionProvider;
  status: 'active' | 'rotating' | 'disabled';
  keyId: string;
  keyAlgorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  createdAt: string;
  lastRotatedAt?: string;
  rotationPolicy: RotationPolicy;
  region: DataRegion;
}

export type EncryptionProvider = 
  | 'shieldscan_managed'
  | 'aws_kms'
  | 'azure_keyvault'
  | 'gcp_kms'
  | 'hashicorp_vault'
  | 'customer_hsm';

export interface RotationPolicy {
  enabled: boolean;
  intervalDays: number;
  lastRotation?: string;
  nextRotation?: string;
  notifyDaysBefore: number;
}

export type DataRegion = 'us-east' | 'us-west' | 'eu-west' | 'eu-central' | 'ap-southeast' | 'ap-northeast';

export interface DataSovereigntyConfig {
  primaryRegion: DataRegion;
  allowedRegions: DataRegion[];
  dataResidency: 'strict' | 'flexible';
  crossBorderTransfer: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  scannerRegionLock: boolean;
}

export interface EvidenceChain {
  id: string;
  findingId: string;
  scanId: string;
  createdAt: string;
  hash: string; // SHA-256
  previousHash?: string; // For chain integrity
  timestampAuthority?: TimestampAuthority;
  immutable: boolean;
  exportable: boolean;
  evidenceBundle: EvidenceBundle;
}

export interface TimestampAuthority {
  provider: 'rfc3161' | 'blockchain' | 'internal';
  timestamp: string;
  signature: string;
  certificate?: string;
}

export interface EvidenceBundle {
  finding: any;
  request?: any;
  response?: any;
  screenshot?: string;
  reproductionSteps?: string[];
  environmentInfo: {
    scannerVersion: string;
    scanDate: string;
    targetUrl: string;
    scanType: string;
  };
  manifest: {
    files: Array<{ name: string; hash: string; size: number }>;
    totalSize: number;
    createdAt: string;
  };
}

// Storage keys
const ENCRYPTION_KEY = 'shieldscan_encryption_config';
const SOVEREIGNTY_KEY = 'shieldscan_sovereignty_config';
const EVIDENCE_CHAIN_KEY = 'shieldscan_evidence_chain';

// ==========================================
// ENCRYPTION MANAGEMENT
// ==========================================

export function getEncryptionConfig(): EncryptionConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ENCRYPTION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    logError({
      level: 'error',
      error: new EncryptionError('Failed to parse encryption config', { source: 'localStorage' }),
      additionalContext: { originalError: String(error) }
    });
    return null;
  }
}

export function setEncryptionConfig(config: EncryptionConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENCRYPTION_KEY, JSON.stringify(config));
}

export function initializeEncryption(
  provider: EncryptionProvider,
  region: DataRegion,
  keyId?: string
): EncryptionConfig {
  const config: EncryptionConfig = {
    id: `enc_${Date.now()}`,
    organizationId: 'current_org',
    provider,
    status: 'active',
    keyId: keyId || generateKeyId(),
    keyAlgorithm: 'AES-256-GCM',
    createdAt: new Date().toISOString(),
    rotationPolicy: {
      enabled: true,
      intervalDays: 90,
      notifyDaysBefore: 14,
    },
    region,
  };

  setEncryptionConfig(config);
  return config;
}

export function rotateEncryptionKey(): EncryptionConfig | null {
  const config = getEncryptionConfig();
  if (!config) return null;

  config.keyId = generateKeyId();
  config.lastRotatedAt = new Date().toISOString();
  config.status = 'active';
  
  if (config.rotationPolicy.enabled) {
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + config.rotationPolicy.intervalDays);
    config.rotationPolicy.nextRotation = nextRotation.toISOString();
  }

  setEncryptionConfig(config);
  return config;
}

// ==========================================
// DATA SOVEREIGNTY
// ==========================================

export function getDataSovereigntyConfig(): DataSovereigntyConfig {
  if (typeof window === 'undefined') {
    return getDefaultSovereigntyConfig();
  }
  try {
    const stored = localStorage.getItem(SOVEREIGNTY_KEY);
    return stored ? JSON.parse(stored) : getDefaultSovereigntyConfig();
  } catch (error) {
    logError({
      level: 'warn',
      error: new EncryptionError('Failed to parse sovereignty config, using defaults', { source: 'localStorage' }),
      additionalContext: { originalError: String(error) }
    });
    return getDefaultSovereigntyConfig();
  }
}

export function setDataSovereigntyConfig(config: DataSovereigntyConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOVEREIGNTY_KEY, JSON.stringify(config));
}

function getDefaultSovereigntyConfig(): DataSovereigntyConfig {
  return {
    primaryRegion: 'eu-west',
    allowedRegions: ['eu-west', 'eu-central'],
    dataResidency: 'strict',
    crossBorderTransfer: false,
    encryptionAtRest: true,
    encryptionInTransit: true,
    scannerRegionLock: true,
  };
}

// ==========================================
// EVIDENCE CHAIN (Legal-Grade)
// ==========================================

export function getEvidenceChain(): EvidenceChain[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVIDENCE_CHAIN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError({
      level: 'error',
      error: new EncryptionError('Failed to parse evidence chain - data may be corrupted', { source: 'localStorage' }),
      additionalContext: { originalError: String(error) }
    });
    return [];
  }
}

export function addToEvidenceChain(
  findingId: string,
  scanId: string,
  evidenceBundle: Omit<EvidenceBundle, 'manifest'>
): EvidenceChain {
  const chain = getEvidenceChain();
  const previousHash = chain.length > 0 ? chain[chain.length - 1].hash : undefined;

  // Create manifest
  const files: Array<{ name: string; hash: string; size: number }> = [];
  let totalSize = 0;

  const findingJson = JSON.stringify(evidenceBundle.finding);
  files.push({ name: 'finding.json', hash: hashString(findingJson), size: findingJson.length });
  totalSize += findingJson.length;

  if (evidenceBundle.request) {
    const reqJson = JSON.stringify(evidenceBundle.request);
    files.push({ name: 'request.json', hash: hashString(reqJson), size: reqJson.length });
    totalSize += reqJson.length;
  }

  if (evidenceBundle.response) {
    const resJson = JSON.stringify(evidenceBundle.response);
    files.push({ name: 'response.json', hash: hashString(resJson), size: resJson.length });
    totalSize += resJson.length;
  }

  const bundle: EvidenceBundle = {
    ...evidenceBundle,
    manifest: {
      files,
      totalSize,
      createdAt: new Date().toISOString(),
    },
  };

  // Calculate SHA-256 hash of entire bundle
  const bundleHash = sha256(JSON.stringify(bundle) + (previousHash || ''));

  const evidence: EvidenceChain = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    findingId,
    scanId,
    createdAt: new Date().toISOString(),
    hash: bundleHash,
    previousHash,
    timestampAuthority: {
      provider: 'internal',
      timestamp: new Date().toISOString(),
      signature: generateSignature(bundleHash),
    },
    immutable: true,
    exportable: true,
    evidenceBundle: bundle,
  };

  chain.push(evidence);
  
  if (typeof window !== 'undefined') {
    // Keep last 1000 evidence entries
    localStorage.setItem(EVIDENCE_CHAIN_KEY, JSON.stringify(chain.slice(-1000)));
  }

  return evidence;
}

export function verifyEvidenceChain(): { valid: boolean; errors: string[] } {
  const chain = getEvidenceChain();
  const errors: string[] = [];

  for (let i = 0; i < chain.length; i++) {
    const evidence = chain[i];
    
    // Verify hash integrity
    const expectedHash = sha256(JSON.stringify(evidence.evidenceBundle) + (evidence.previousHash || ''));
    if (evidence.hash !== expectedHash) {
      errors.push(`Evidence ${evidence.id}: Hash mismatch - possible tampering`);
    }

    // Verify chain continuity
    if (i > 0 && evidence.previousHash !== chain[i - 1].hash) {
      errors.push(`Evidence ${evidence.id}: Chain broken - missing link`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function exportEvidenceBundle(evidenceId: string): Blob | null {
  const chain = getEvidenceChain();
  const evidence = chain.find(e => e.id === evidenceId);
  if (!evidence) return null;

  const exportData = {
    evidence,
    verification: {
      chainIntegrity: verifyEvidenceChain(),
      exportedAt: new Date().toISOString(),
      exportedBy: 'ShieldScan Security Platform',
    },
  };

  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}

// ==========================================
// SCANNER ISOLATION
// ==========================================

export interface ScannerIsolation {
  mode: 'shared' | 'dedicated' | 'ephemeral';
  region: DataRegion;
  ipPool: string[];
  timeout: number;
  maxConcurrency: number;
  networkPolicy: 'standard' | 'restricted' | 'isolated';
}

export function getScannerIsolationConfig(): ScannerIsolation {
  return {
    mode: 'ephemeral',
    region: getDataSovereigntyConfig().primaryRegion,
    ipPool: ['185.199.108.0/24', '185.199.109.0/24'], // Example scanner IPs
    timeout: 300000, // 5 minutes
    maxConcurrency: 5,
    networkPolicy: 'restricted',
  };
}


// ==========================================
// REGION INFO
// ==========================================

export const REGION_INFO: Record<DataRegion, { name: string; flag: string; location: string }> = {
  'us-east': { name: 'US East', flag: '🇺🇸', location: 'Virginia' },
  'us-west': { name: 'US West', flag: '🇺🇸', location: 'Oregon' },
  'eu-west': { name: 'EU West', flag: '🇪🇺', location: 'Ireland' },
  'eu-central': { name: 'EU Central', flag: '🇪🇺', location: 'Frankfurt' },
  'ap-southeast': { name: 'Asia Pacific', flag: '🇸🇬', location: 'Singapore' },
  'ap-northeast': { name: 'Asia Pacific', flag: '🇯🇵', location: 'Tokyo' },
};

export const PROVIDER_INFO: Record<EncryptionProvider, { name: string; icon: string; enterprise: boolean }> = {
  'shieldscan_managed': { name: 'ShieldScan Managed', icon: '🛡️', enterprise: false },
  'aws_kms': { name: 'AWS KMS', icon: '☁️', enterprise: true },
  'azure_keyvault': { name: 'Azure Key Vault', icon: '🔷', enterprise: true },
  'gcp_kms': { name: 'Google Cloud KMS', icon: '🌐', enterprise: true },
  'hashicorp_vault': { name: 'HashiCorp Vault', icon: '🔐', enterprise: true },
  'customer_hsm': { name: 'Customer HSM', icon: '🏢', enterprise: true },
};

