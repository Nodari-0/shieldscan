'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Settings, Shield, Mail, MoreVertical,
  Check, X, ChevronDown, Building2, Key, Clock, Crown,
  UserCog, Eye, Edit3, Trash2, Plus, Search, Copy
} from 'lucide-react';
import {
  getOrganization, saveOrganization, inviteMember, updateMemberRole,
  removeMember, createTeam, createAPIKey, revokeAPIKey,
  initDemoOrganization, ROLE_PERMISSIONS,
  type Organization, type OrgMember, type Team, type OrgRole, type APIKey
} from '@/lib/organization';

// ==========================================
// MAIN TEAM MANAGEMENT COMPONENT
// ==========================================

export default function TeamManagement() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'api_keys'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);

  useEffect(() => {
    const organization = getOrganization() || initDemoOrganization();
    setOrg(organization);
  }, []);

  const refreshOrg = () => {
    setOrg(getOrganization());
  };

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading organization...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{org.name}</h2>
            <p className="text-sm text-gray-500">{org.members.length} members • {org.teams.length} teams</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium uppercase">
            {org.plan} Plan
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900/50 rounded-lg border border-gray-800">
        {[
          { id: 'members', label: 'Members', icon: Users, count: org.members.length },
          { id: 'teams', label: 'Teams', icon: Shield, count: org.teams.length },
          { id: 'api_keys', label: 'API Keys', icon: Key, count: org.apiKeys.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {activeTab === 'members' && (
          <MembersList 
            members={org.members} 
            teams={org.teams}
            onInvite={() => setShowInviteModal(true)}
            onRefresh={refreshOrg}
          />
        )}
        {activeTab === 'teams' && (
          <TeamsList 
            teams={org.teams}
            members={org.members}
            onCreateTeam={() => setShowTeamModal(true)}
            onRefresh={refreshOrg}
          />
        )}
        {activeTab === 'api_keys' && (
          <APIKeysList 
            apiKeys={org.apiKeys}
            onCreateKey={() => setShowAPIKeyModal(true)}
            onRefresh={refreshOrg}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteMemberModal
            teams={org.teams}
            onClose={() => setShowInviteModal(false)}
            onInvited={refreshOrg}
          />
        )}
        {showTeamModal && (
          <CreateTeamModal
            onClose={() => setShowTeamModal(false)}
            onCreated={refreshOrg}
          />
        )}
        {showAPIKeyModal && (
          <CreateAPIKeyModal
            onClose={() => setShowAPIKeyModal(false)}
            onCreated={refreshOrg}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// MEMBERS LIST
// ==========================================

function MembersList({ 
  members, 
  teams,
  onInvite,
  onRefresh 
}: { 
  members: OrgMember[];
  teams: Team[];
  onInvite: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredMembers = members.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleConfig = (role: OrgRole) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Crown };
      case 'admin':
        return { label: 'Admin', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Shield };
      case 'manager':
        return { label: 'Manager', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: UserCog };
      case 'analyst':
        return { label: 'Analyst', color: 'text-green-400', bg: 'bg-green-500/10', icon: Eye };
      default:
        return { label: 'Viewer', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Eye };
    }
  };

  const handleRoleChange = (memberId: string, newRole: OrgRole) => {
    updateMemberRole(memberId, newRole);
    setEditingId(null);
    onRefresh();
  };

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMember(memberId);
      onRefresh();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-700"
          />
        </div>
        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-800">
        {filteredMembers.map((member) => {
          const roleConfig = getRoleConfig(member.role);
          const RoleIcon = roleConfig.icon;
          const memberTeams = teams.filter(t => member.teamIds.includes(t.id));

          return (
            <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {member.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{member.name}</span>
                  {member.status === 'invited' && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px]">
                      Pending
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{member.email}</div>
                {memberTeams.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {memberTeams.map(team => (
                      <span 
                        key={team.id}
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{ backgroundColor: `${team.color}20`, color: team.color }}
                      >
                        {team.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="relative">
                <button
                  onClick={() => setEditingId(editingId === member.id ? null : member.id)}
                  disabled={member.role === 'owner'}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded ${roleConfig.bg} ${roleConfig.color} text-xs font-medium ${
                    member.role !== 'owner' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                  {member.role !== 'owner' && <ChevronDown className="w-3 h-3" />}
                </button>

                {/* Role dropdown */}
                <AnimatePresence>
                  {editingId === member.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-36 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden z-10 shadow-xl"
                    >
                      {(['admin', 'manager', 'analyst', 'viewer'] as OrgRole[]).map((role) => {
                        const config = getRoleConfig(role);
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(member.id, role)}
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-800 ${config.color}`}
                          >
                            {config.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// TEAMS LIST
// ==========================================

function TeamsList({ 
  teams, 
  members,
  onCreateTeam,
  onRefresh 
}: { 
  teams: Team[];
  members: OrgMember[];
  onCreateTeam: () => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Teams</h3>
        <button
          onClick={onCreateTeam}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No teams yet</p>
          <p className="text-xs text-gray-600 mt-1">Create teams to organize members and assets</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {teams.map((team) => {
            const teamMembers = members.filter(m => m.teamIds.includes(team.id));
            return (
              <div key={team.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.color}20` }}
                >
                  <Users className="w-5 h-5" style={{ color: team.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{team.name}</div>
                  {team.description && (
                    <div className="text-xs text-gray-500">{team.description}</div>
                  )}
                  <div className="text-xs text-gray-600 mt-0.5">
                    {teamMembers.length} members
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {teamMembers.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-gray-900 flex items-center justify-center text-white text-[10px] font-medium"
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {teamMembers.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-white text-[10px]">
                      +{teamMembers.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// API KEYS LIST
// ==========================================

function APIKeysList({ 
  apiKeys, 
  onCreateKey,
  onRefresh 
}: { 
  apiKeys: APIKey[];
  onCreateKey: () => void;
  onRefresh: () => void;
}) {
  const handleRevoke = (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeAPIKey(keyId);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">API Keys</h3>
        <button
          onClick={onCreateKey}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="p-8 text-center">
          <Key className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No API keys</p>
          <p className="text-xs text-gray-600 mt-1">Create API keys for programmatic access</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {apiKeys.map((key) => (
            <div key={key.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
              <div className={`p-2 rounded-lg ${key.enabled ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Key className={`w-5 h-5 ${key.enabled ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{key.name}</span>
                  {!key.enabled && (
                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <code className="font-mono">{key.keyPrefix}•••</code>
                  <span>•</span>
                  <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                  {key.lastUsedAt && (
                    <>
                      <span>•</span>
                      <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              {key.enabled && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// INVITE MEMBER MODAL
// ==========================================

function InviteMemberModal({ 
  teams,
  onClose, 
  onInvited 
}: { 
  teams: Team[];
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('analyst');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!email) return;
    inviteMember(email, role, selectedTeams, 'current_user');
    onInvited();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Teams (Optional)</label>
            <div className="space-y-1">
              {teams.map((team) => (
                <label key={team.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeams([...selectedTeams, team.id]);
                      } else {
                        setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                      }
                    }}
                    className="rounded border-gray-700"
                  />
                  <span className="text-sm text-gray-300">{team.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            Send Invite
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// CREATE TEAM MODAL
// ==========================================

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name) return;
    createTeam(name, description || undefined);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Create Team</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Security"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-green-500 h-20 resize-none"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 disabled:opacity-50"
          >
            Create Team
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// CREATE API KEY MODAL
// ==========================================

function CreateAPIKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name) return;
    const result = createAPIKey(
      name,
      ROLE_PERMISSIONS.analyst,
      60,
      'current_user'
    );
    if (result) {
      setNewKey(result.key);
      onCreated();
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={newKey ? undefined : onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            {newKey ? 'API Key Created' : 'Create API Key'}
          </h3>
        </div>
        
        {newKey ? (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                Copy this key now. You won&apos;t be able to see it again!
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-black rounded-lg border border-gray-800">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">
                {newKey}
              </code>
              <button
                onClick={copyKey}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Key Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline, Monitoring"
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 disabled:opacity-50"
              >
                Create Key
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

