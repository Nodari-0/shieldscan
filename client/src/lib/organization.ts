// ==========================================
// ORGANIZATION & TEAM MANAGEMENT
// ==========================================
// Multi-user, roles, teams, and collaboration

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  settings: OrgSettings;
  members: OrgMember[];
  teams: Team[];
  assets: Asset[];
  apiKeys: APIKey[];
}

export interface OrgSettings {
  defaultScanDepth: 'basic' | 'standard' | 'deep';
  autoScheduleScans: boolean;
  scanFrequency: 'daily' | 'weekly' | 'monthly';
  alertChannels: string[];
  complianceFrameworks: string[];
  dataRetentionDays: number;
  ssoEnabled: boolean;
  ssoProvider?: 'okta' | 'azure_ad' | 'google' | 'custom';
  ssoConfig?: Record<string, string>;
  ipWhitelist?: string[];
  enforceIpWhitelist: boolean;
  enforceMfa: boolean;
}

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: OrgRole;
  teamIds: string[];
  status: 'active' | 'invited' | 'deactivated';
  joinedAt: string;
  lastActiveAt?: string;
  invitedBy?: string;
  permissions: Permission[];
}

export type OrgRole = 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

export type PermissionResource = 
  | 'scans'
  | 'reports'
  | 'assets'
  | 'integrations'
  | 'settings'
  | 'billing'
  | 'team'
  | 'api_keys';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  memberIds: string[];
  assetIds: string[];
  createdAt: string;
  leaderId?: string;
}

export interface Asset {
  id: string;
  url: string;
  name: string;
  type: AssetType;
  environment: 'production' | 'staging' | 'development';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  teamId?: string;
  tags: string[];
  lastScanAt?: string;
  lastScore?: number;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

export type AssetType = 'website' | 'api' | 'webapp' | 'mobile_api' | 'internal';

export interface APIKey {
  id: string;
  name: string;
  keyPrefix: string; // First 8 chars of key
  keyHash: string;
  permissions: Permission[];
  createdAt: string;
  createdBy: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimit: number; // requests per minute
  enabled: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Role permissions matrix
export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    { resource: 'scans', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { resource: 'reports', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { resource: 'assets', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { resource: 'integrations', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { resource: 'settings', actions: ['view', 'edit', 'manage'] },
    { resource: 'billing', actions: ['view', 'edit', 'manage'] },
    { resource: 'team', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { resource: 'api_keys', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
  ],
  admin: [
    { resource: 'scans', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'reports', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'assets', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'integrations', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'settings', actions: ['view', 'edit'] },
    { resource: 'billing', actions: ['view'] },
    { resource: 'team', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'api_keys', actions: ['view', 'create', 'delete'] },
  ],
  manager: [
    { resource: 'scans', actions: ['view', 'create', 'edit'] },
    { resource: 'reports', actions: ['view', 'create', 'edit'] },
    { resource: 'assets', actions: ['view', 'create', 'edit'] },
    { resource: 'integrations', actions: ['view'] },
    { resource: 'team', actions: ['view'] },
    { resource: 'api_keys', actions: ['view'] },
  ],
  analyst: [
    { resource: 'scans', actions: ['view', 'create'] },
    { resource: 'reports', actions: ['view', 'create'] },
    { resource: 'assets', actions: ['view'] },
    { resource: 'team', actions: ['view'] },
  ],
  viewer: [
    { resource: 'scans', actions: ['view'] },
    { resource: 'reports', actions: ['view'] },
    { resource: 'assets', actions: ['view'] },
  ],
};

// Storage keys
const ORG_KEY = 'shieldscan_organization';
const AUDIT_KEY = 'shieldscan_audit_log';

// ==========================================
// ORGANIZATION CRUD
// ==========================================

export function getOrganization(): Organization | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ORG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveOrganization(org: Organization): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORG_KEY, JSON.stringify(org));
}

export function createOrganization(name: string, ownerEmail: string, ownerId: string): Organization {
  const org: Organization = {
    id: `org_${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    plan: 'pro',
    createdAt: new Date().toISOString(),
    settings: {
      defaultScanDepth: 'standard',
      autoScheduleScans: false,
      scanFrequency: 'weekly',
      alertChannels: [],
      complianceFrameworks: [],
      dataRetentionDays: 90,
      ssoEnabled: false,
      enforceIpWhitelist: false,
      enforceMfa: false,
    },
    members: [
      {
        id: `mem_${Date.now()}`,
        userId: ownerId,
        email: ownerEmail,
        name: ownerEmail.split('@')[0],
        role: 'owner',
        teamIds: [],
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS.owner,
      },
    ],
    teams: [],
    assets: [],
    apiKeys: [],
  };

  saveOrganization(org);
  logAudit(ownerId, ownerEmail, 'organization.created', 'organization', org.id);

  return org;
}

// ==========================================
// MEMBER MANAGEMENT
// ==========================================

export function inviteMember(
  email: string,
  role: OrgRole,
  teamIds: string[],
  invitedBy: string
): OrgMember | null {
  const org = getOrganization();
  if (!org) return null;

  // Check if already exists
  if (org.members.some(m => m.email === email)) {
    return null;
  }

  const member: OrgMember = {
    id: `mem_${Date.now()}`,
    userId: '',
    email,
    name: email.split('@')[0],
    role,
    teamIds,
    status: 'invited',
    joinedAt: new Date().toISOString(),
    invitedBy,
    permissions: ROLE_PERMISSIONS[role],
  };

  org.members.push(member);
  saveOrganization(org);

  return member;
}

export function updateMemberRole(memberId: string, newRole: OrgRole): boolean {
  const org = getOrganization();
  if (!org) return false;

  const member = org.members.find(m => m.id === memberId);
  if (!member) return false;

  // Can't change owner role
  if (member.role === 'owner') return false;

  member.role = newRole;
  member.permissions = ROLE_PERMISSIONS[newRole];

  saveOrganization(org);
  return true;
}

export function removeMember(memberId: string): boolean {
  const org = getOrganization();
  if (!org) return false;

  const member = org.members.find(m => m.id === memberId);
  if (!member || member.role === 'owner') return false;

  org.members = org.members.filter(m => m.id !== memberId);
  
  // Remove from teams
  org.teams.forEach(team => {
    team.memberIds = team.memberIds.filter(id => id !== memberId);
  });

  saveOrganization(org);
  return true;
}

// ==========================================
// TEAM MANAGEMENT
// ==========================================

export function createTeam(name: string, description?: string): Team | null {
  const org = getOrganization();
  if (!org) return null;

  const team: Team = {
    id: `team_${Date.now()}`,
    name,
    description,
    color: getRandomColor(),
    memberIds: [],
    assetIds: [],
    createdAt: new Date().toISOString(),
  };

  org.teams.push(team);
  saveOrganization(org);

  return team;
}

export function addMemberToTeam(teamId: string, memberId: string): boolean {
  const org = getOrganization();
  if (!org) return false;

  const team = org.teams.find(t => t.id === teamId);
  const member = org.members.find(m => m.id === memberId);
  
  if (!team || !member) return false;

  if (!team.memberIds.includes(memberId)) {
    team.memberIds.push(memberId);
  }
  if (!member.teamIds.includes(teamId)) {
    member.teamIds.push(teamId);
  }

  saveOrganization(org);
  return true;
}

// ==========================================
// ASSET MANAGEMENT
// ==========================================

export function addAsset(asset: Omit<Asset, 'id' | 'createdAt'>): Asset | null {
  const org = getOrganization();
  if (!org) return null;

  const newAsset: Asset = {
    ...asset,
    id: `asset_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  org.assets.push(newAsset);
  saveOrganization(org);

  return newAsset;
}

export function updateAsset(assetId: string, updates: Partial<Asset>): Asset | null {
  const org = getOrganization();
  if (!org) return null;

  const asset = org.assets.find(a => a.id === assetId);
  if (!asset) return null;

  Object.assign(asset, updates);
  saveOrganization(org);

  return asset;
}

export function removeAsset(assetId: string): boolean {
  const org = getOrganization();
  if (!org) return false;

  org.assets = org.assets.filter(a => a.id !== assetId);
  saveOrganization(org);

  return true;
}

// ==========================================
// API KEY MANAGEMENT
// ==========================================

export function createAPIKey(
  name: string, 
  permissions: Permission[],
  rateLimit: number,
  createdBy: string,
  expiresInDays?: number
): { key: string; apiKey: APIKey } | null {
  const org = getOrganization();
  if (!org) return null;

  // Generate key
  const key = `sk_live_${generateSecureToken(32)}`;
  const keyPrefix = key.substring(0, 12);
  const keyHash = hashString(key);

  const apiKey: APIKey = {
    id: `apikey_${Date.now()}`,
    name,
    keyPrefix,
    keyHash,
    permissions,
    createdAt: new Date().toISOString(),
    createdBy,
    rateLimit,
    enabled: true,
    expiresAt: expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  org.apiKeys.push(apiKey);
  saveOrganization(org);

  return { key, apiKey };
}

export function revokeAPIKey(keyId: string): boolean {
  const org = getOrganization();
  if (!org) return false;

  const key = org.apiKeys.find(k => k.id === keyId);
  if (!key) return false;

  key.enabled = false;
  saveOrganization(org);

  return true;
}

// ==========================================
// AUDIT LOG
// ==========================================

export function logAudit(
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    details,
  };

  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    const log: AuditLogEntry[] = stored ? JSON.parse(stored) : [];
    log.unshift(entry);
    
    // Keep last 1000 entries
    const trimmed = log.slice(0, 1000);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to log audit entry:', e);
  }
}

export function getAuditLog(limit: number = 100): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    const log = stored ? JSON.parse(stored) : [];
    return log.slice(0, limit);
  } catch {
    return [];
  }
}

// ==========================================
// PERMISSION CHECKING
// ==========================================

export function hasPermission(
  member: OrgMember,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const permission = member.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  return permission.actions.includes(action);
}

export function canManageTeam(member: OrgMember): boolean {
  return member.role === 'owner' || member.role === 'admin';
}

export function canAccessBilling(member: OrgMember): boolean {
  return member.role === 'owner' || member.role === 'admin';
}

// ==========================================
// HELPERS
// ==========================================

function getRandomColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateSecureToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Initialize demo organization
export function initDemoOrganization(): Organization {
  const existing = getOrganization();
  if (existing) return existing;

  const org = createOrganization('Acme Corp', 'admin@acme.com', 'demo_user');
  
  // Add demo team
  const devTeam = createTeam('Development', 'Engineering team');
  const secTeam = createTeam('Security', 'Security operations');
  
  // Add demo assets
  addAsset({
    url: 'https://acme.com',
    name: 'Main Website',
    type: 'website',
    environment: 'production',
    criticality: 'critical',
    teamId: devTeam?.id,
    tags: ['public', 'customer-facing'],
    createdBy: 'demo_user',
  });
  
  addAsset({
    url: 'https://api.acme.com',
    name: 'Public API',
    type: 'api',
    environment: 'production',
    criticality: 'high',
    teamId: devTeam?.id,
    tags: ['api', 'v2'],
    createdBy: 'demo_user',
  });

  return getOrganization()!;
}

