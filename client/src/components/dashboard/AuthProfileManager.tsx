'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, KeyRound, Cookie, Shield, User, Settings, Plus, Trash2,
  Edit2, Check, X, Copy, Eye, EyeOff, RefreshCw, Clock,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import type {
  AuthProfile, AuthType, JWTAuthProfile, OAuth2AuthProfile,
  CookieAuthProfile, APIKeyAuthProfile, BasicAuthProfile,
  BearerAuthProfile, CustomAuthProfile,
  getAuthTypeInfo, isTokenExpired
} from '@/types/auth-profiles';

interface AuthProfileManagerProps {
  onSelectProfile?: (profile: AuthProfile | null) => void;
  selectedProfileId?: string | null;
  compact?: boolean;
}

// Auth type icons
const AUTH_ICONS: Record<AuthType, React.ReactNode> = {
  'jwt': <KeyRound className="w-4 h-4" />,
  'oauth2': <Key className="w-4 h-4" />,
  'cookie': <Cookie className="w-4 h-4" />,
  'api-key': <Shield className="w-4 h-4" />,
  'basic': <User className="w-4 h-4" />,
  'bearer': <Key className="w-4 h-4" />,
  'custom': <Settings className="w-4 h-4" />,
};

// Auth type colors
const AUTH_COLORS: Record<AuthType, { bg: string; text: string; border: string }> = {
  'jwt': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'oauth2': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'cookie': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'api-key': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'basic': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  'bearer': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'custom': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
};

const AUTH_TYPE_INFO: Record<AuthType, { label: string; description: string }> = {
  'jwt': { label: 'JWT Token', description: 'JSON Web Token with optional refresh' },
  'oauth2': { label: 'OAuth 2.0', description: 'OAuth 2.0 access token' },
  'cookie': { label: 'Session Cookie', description: 'Cookie-based authentication' },
  'api-key': { label: 'API Key', description: 'API key in header or query' },
  'basic': { label: 'Basic Auth', description: 'Username and password' },
  'bearer': { label: 'Bearer Token', description: 'Simple bearer token' },
  'custom': { label: 'Custom Headers', description: 'Custom authentication headers' },
};

// Storage key
const STORAGE_KEY = 'shieldscan_auth_profiles';

export default function AuthProfileManager({ 
  onSelectProfile, 
  selectedProfileId,
  compact = false 
}: AuthProfileManagerProps) {
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProfileType, setNewProfileType] = useState<AuthType>('bearer');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});

  // Load profiles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfiles(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load auth profiles:', e);
      }
    }
  }, []);

  // Save profiles to localStorage
  const saveProfiles = (newProfiles: AuthProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
  };

  // Create new profile
  const createProfile = (type: AuthType) => {
    const baseProfile = {
      id: `auth_${Date.now()}`,
      name: `New ${AUTH_TYPE_INFO[type].label}`,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let newProfile: AuthProfile;

    switch (type) {
      case 'jwt':
        newProfile = {
          ...baseProfile,
          type: 'jwt',
          config: {
            token: '',
            headerName: 'Authorization',
            prefix: 'Bearer',
          },
        } as JWTAuthProfile;
        break;
      case 'oauth2':
        newProfile = {
          ...baseProfile,
          type: 'oauth2',
          config: {
            accessToken: '',
            grantType: 'client_credentials',
          },
        } as OAuth2AuthProfile;
        break;
      case 'cookie':
        newProfile = {
          ...baseProfile,
          type: 'cookie',
          config: {
            cookies: [{ name: '', value: '' }],
          },
        } as CookieAuthProfile;
        break;
      case 'api-key':
        newProfile = {
          ...baseProfile,
          type: 'api-key',
          config: {
            key: '',
            headerName: 'X-API-Key',
            location: 'header',
          },
        } as APIKeyAuthProfile;
        break;
      case 'basic':
        newProfile = {
          ...baseProfile,
          type: 'basic',
          config: {
            username: '',
            password: '',
          },
        } as BasicAuthProfile;
        break;
      case 'bearer':
        newProfile = {
          ...baseProfile,
          type: 'bearer',
          config: {
            token: '',
          },
        } as BearerAuthProfile;
        break;
      case 'custom':
        newProfile = {
          ...baseProfile,
          type: 'custom',
          config: {
            headers: {},
          },
        } as CustomAuthProfile;
        break;
      default:
        return;
    }

    saveProfiles([...profiles, newProfile]);
    setEditingId(newProfile.id);
    setIsCreating(false);
  };

  // Update profile
  const updateProfile = (id: string, updates: Partial<AuthProfile>) => {
    const newProfiles = profiles.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        } as AuthProfile;
      }
      return p;
    });
    saveProfiles(newProfiles);
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    saveProfiles(profiles.filter(p => p.id !== id));
    if (selectedProfileId === id) {
      onSelectProfile?.(null);
    }
  };

  // Select profile
  const selectProfile = (profile: AuthProfile | null) => {
    onSelectProfile?.(profile);
  };

  // Toggle secret visibility
  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Mask secret value
  const maskValue = (value: string, show: boolean) => {
    if (show || !value) return value;
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  // Render profile form based on type
  const renderProfileForm = (profile: AuthProfile) => {
    const colors = AUTH_COLORS[profile.type];

    return (
      <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
        {/* Name Input */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Profile Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="My API Profile"
          />
        </div>

        {/* Type-specific fields */}
        {profile.type === 'bearer' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bearer Token</label>
            <div className="flex gap-2">
              <input
                type={showSecrets[profile.id] ? 'text' : 'password'}
                value={(profile as BearerAuthProfile).config.token}
                onChange={(e) => updateProfile(profile.id, { 
                  config: { token: e.target.value } 
                } as Partial<BearerAuthProfile>)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
              />
              <button
                onClick={() => toggleSecret(profile.id)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                {showSecrets[profile.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {profile.type === 'jwt' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">JWT Token</label>
              <div className="flex gap-2">
                <input
                  type={showSecrets[profile.id] ? 'text' : 'password'}
                  value={(profile as JWTAuthProfile).config.token}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as JWTAuthProfile).config, token: e.target.value } 
                  } as Partial<JWTAuthProfile>)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                />
                <button
                  onClick={() => toggleSecret(profile.id)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
                >
                  {showSecrets[profile.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Header Name</label>
                <input
                  type="text"
                  value={(profile as JWTAuthProfile).config.headerName}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as JWTAuthProfile).config, headerName: e.target.value } 
                  } as Partial<JWTAuthProfile>)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Authorization"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                <input
                  type="text"
                  value={(profile as JWTAuthProfile).config.prefix}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as JWTAuthProfile).config, prefix: e.target.value } 
                  } as Partial<JWTAuthProfile>)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Bearer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Refresh Token (Optional)</label>
              <input
                type={showSecrets[`${profile.id}_refresh`] ? 'text' : 'password'}
                value={(profile as JWTAuthProfile).config.refreshToken || ''}
                onChange={(e) => updateProfile(profile.id, { 
                  config: { ...(profile as JWTAuthProfile).config, refreshToken: e.target.value } 
                } as Partial<JWTAuthProfile>)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Refresh token for auto-renewal"
              />
            </div>
          </>
        )}

        {profile.type === 'api-key' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showSecrets[profile.id] ? 'text' : 'password'}
                  value={(profile as APIKeyAuthProfile).config.key}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as APIKeyAuthProfile).config, key: e.target.value } 
                  } as Partial<APIKeyAuthProfile>)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="sk-..."
                />
                <button
                  onClick={() => toggleSecret(profile.id)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
                >
                  {showSecrets[profile.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Header Name</label>
                <input
                  type="text"
                  value={(profile as APIKeyAuthProfile).config.headerName}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as APIKeyAuthProfile).config, headerName: e.target.value } 
                  } as Partial<APIKeyAuthProfile>)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="X-API-Key"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <select
                  value={(profile as APIKeyAuthProfile).config.location}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as APIKeyAuthProfile).config, location: e.target.value as 'header' | 'query' } 
                  } as Partial<APIKeyAuthProfile>)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="header">Header</option>
                  <option value="query">Query Parameter</option>
                </select>
              </div>
            </div>
          </>
        )}

        {profile.type === 'basic' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Username</label>
              <input
                type="text"
                value={(profile as BasicAuthProfile).config.username}
                onChange={(e) => updateProfile(profile.id, { 
                  config: { ...(profile as BasicAuthProfile).config, username: e.target.value } 
                } as Partial<BasicAuthProfile>)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <div className="flex gap-2">
                <input
                  type={showSecrets[profile.id] ? 'text' : 'password'}
                  value={(profile as BasicAuthProfile).config.password}
                  onChange={(e) => updateProfile(profile.id, { 
                    config: { ...(profile as BasicAuthProfile).config, password: e.target.value } 
                  } as Partial<BasicAuthProfile>)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => toggleSecret(profile.id)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
                >
                  {showSecrets[profile.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {profile.type === 'cookie' && (
          <div className="space-y-2">
            <label className="block text-xs text-gray-500 mb-1">Session Cookies</label>
            {(profile as CookieAuthProfile).config.cookies.map((cookie, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={cookie.name}
                  onChange={(e) => {
                    const cookies = [...(profile as CookieAuthProfile).config.cookies];
                    cookies[idx] = { ...cookies[idx], name: e.target.value };
                    updateProfile(profile.id, { config: { cookies } } as Partial<CookieAuthProfile>);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Cookie name"
                />
                <input
                  type={showSecrets[`${profile.id}_${idx}`] ? 'text' : 'password'}
                  value={cookie.value}
                  onChange={(e) => {
                    const cookies = [...(profile as CookieAuthProfile).config.cookies];
                    cookies[idx] = { ...cookies[idx], value: e.target.value };
                    updateProfile(profile.id, { config: { cookies } } as Partial<CookieAuthProfile>);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Cookie value"
                />
                <button
                  onClick={() => toggleSecret(`${profile.id}_${idx}`)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
                >
                  {showSecrets[`${profile.id}_${idx}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {(profile as CookieAuthProfile).config.cookies.length > 1 && (
                  <button
                    onClick={() => {
                      const cookies = (profile as CookieAuthProfile).config.cookies.filter((_, i) => i !== idx);
                      updateProfile(profile.id, { config: { cookies } } as Partial<CookieAuthProfile>);
                    }}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const cookies = [...(profile as CookieAuthProfile).config.cookies, { name: '', value: '' }];
                updateProfile(profile.id, { config: { cookies } } as Partial<CookieAuthProfile>);
              }}
              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-3 h-3" />
              Add Cookie
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setEditingId(null)}
            className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  if (compact) {
    // Compact dropdown view
    return (
      <div className="relative">
        <select
          value={selectedProfileId || ''}
          onChange={(e) => {
            const profile = profiles.find(p => p.id === e.target.value);
            selectProfile(profile || null);
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">No Authentication</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>
              {AUTH_TYPE_INFO[p.type].label}: {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Authentication Profiles</h3>
              <p className="text-xs text-gray-500">Manage credentials for authenticated scanning</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Profile
          </button>
        </div>
      </div>

      {/* Create new profile */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-800 overflow-hidden"
          >
            <div className="p-4 bg-gray-900/30">
              <p className="text-sm text-gray-400 mb-3">Select authentication type:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(AUTH_TYPE_INFO) as AuthType[]).map((type) => {
                  const colors = AUTH_COLORS[type];
                  const info = AUTH_TYPE_INFO[type];
                  return (
                    <button
                      key={type}
                      onClick={() => createProfile(type)}
                      className={`p-3 rounded-lg border ${colors.border} ${colors.bg} hover:opacity-80 transition-opacity text-left`}
                    >
                      <div className={`flex items-center gap-2 ${colors.text} mb-1`}>
                        {AUTH_ICONS[type]}
                        <span className="text-xs font-medium">{info.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{info.description}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="mt-3 text-xs text-gray-500 hover:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profiles list */}
      <div className="divide-y divide-gray-800">
        {profiles.length === 0 && !isCreating && (
          <div className="p-8 text-center">
            <Key className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No authentication profiles</p>
            <p className="text-gray-600 text-xs mt-1">Create a profile to scan authenticated endpoints</p>
          </div>
        )}

        {profiles.map((profile) => {
          const colors = AUTH_COLORS[profile.type];
          const info = AUTH_TYPE_INFO[profile.type];
          const isSelected = selectedProfileId === profile.id;
          const isEditing = editingId === profile.id;

          return (
            <div key={profile.id} className={`${isSelected ? 'bg-blue-500/5' : ''}`}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Selection checkbox */}
                    <button
                      onClick={() => selectProfile(isSelected ? null : profile)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Profile info */}
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <span className={colors.text}>{AUTH_ICONS[profile.type]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{profile.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {info.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Updated {new Date(profile.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(isEditing ? null : profile.id)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      {renderProfileForm(profile)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      {profiles.length > 0 && (
        <div className="p-3 bg-gray-900/30 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Select a profile to use authentication during scans</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export compact selector component
export function AuthProfileSelector({ 
  onSelect, 
  selectedId 
}: { 
  onSelect: (profile: AuthProfile | null) => void;
  selectedId?: string | null;
}) {
  return (
    <AuthProfileManager 
      onSelectProfile={onSelect}
      selectedProfileId={selectedId}
      compact={true}
    />
  );
}

