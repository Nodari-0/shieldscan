'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Key, Lock, Cookie,
  Check, X, AlertCircle, Eye, EyeOff, Shield
} from 'lucide-react';
import type { AuthProfile, CookieAuthProfile, BearerAuthProfile, JWTAuthProfile } from '@/types/auth-profiles';

interface LoginRecorderProps {
  onSaveProfile: (profile: AuthProfile) => void;
  onClose: () => void;
}

interface CapturedCredentials {
  type: 'cookie' | 'bearer' | 'jwt' | 'api-key';
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  token?: string;
  headers?: Record<string, string>;
  loginUrl?: string;
}

// Auth type configuration
const AUTH_TYPES = [
  { id: 'bearer', label: 'Bearer Token', icon: Key, placeholder: 'eyJhbGciOiJIUzI1NiIs...' },
  { id: 'jwt', label: 'JWT Token', icon: Shield, placeholder: 'eyJhbGciOiJIUzI1NiIs...' },
  { id: 'cookie', label: 'Session Cookie', icon: Cookie, placeholder: 'session_id=abc123; auth=xyz789' },
  { id: 'api-key', label: 'API Key', icon: Key, placeholder: 'sk_live_...' },
] as const;

export default function LoginRecorder({ onSaveProfile, onClose }: LoginRecorderProps) {
  const [step, setStep] = useState<'type' | 'input' | 'save'>('type');
  const [selectedType, setSelectedType] = useState<'bearer' | 'jwt' | 'cookie' | 'api-key'>('bearer');
  const [captured, setCaptured] = useState<CapturedCredentials | null>(null);
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // Input values
  const [tokenValue, setTokenValue] = useState('');
  const [cookieValue, setCookieValue] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [curlCommand, setCurlCommand] = useState('');
  const [inputMode, setInputMode] = useState<'manual' | 'curl'>('manual');

  // Parse curl command
  const parseCurlCommand = (curl: string): CapturedCredentials | null => {
    try {
      const headers: Record<string, string> = {};
      const cookies: Array<{ name: string; value: string }> = [];

      const headerMatches = curl.matchAll(/-H\s+["']([^"']+)["']/gi);
      for (const match of headerMatches) {
        const [key, ...valueParts] = match[1].split(':');
        if (key && valueParts.length) {
          headers[key.trim()] = valueParts.join(':').trim();
        }
      }

      if (headers['Cookie']) {
        const cookieParts = headers['Cookie'].split(';');
        for (const part of cookieParts) {
          const [name, ...valueParts] = part.split('=');
          if (name && valueParts.length) {
            cookies.push({ name: name.trim(), value: valueParts.join('=').trim() });
          }
        }
      }

      if (headers['Authorization']) {
        const authValue = headers['Authorization'];
        if (authValue.toLowerCase().startsWith('bearer ')) {
          return { type: 'bearer', token: authValue.substring(7), headers };
        }
      }

      if (cookies.length > 0) {
        return { type: 'cookie', cookies, headers };
      }

      const authHeaders = ['x-api-key', 'api-key', 'x-auth-token', 'authorization'];
      const hasAuthHeader = Object.keys(headers).some(h => authHeaders.includes(h.toLowerCase()));
      if (hasAuthHeader) {
        return { type: 'api-key', headers };
      }

      return null;
    } catch {
      return null;
    }
  };

  // Capture credentials
  const handleCapture = () => {
    setError(null);

    if (inputMode === 'curl') {
      const parsed = parseCurlCommand(curlCommand);
      if (!parsed) {
        setError('Could not extract auth from cURL');
        return;
      }
      setCaptured(parsed);
      setStep('save');
      return;
    }

    if (selectedType === 'bearer' || selectedType === 'jwt') {
      if (!tokenValue.trim()) {
        setError('Enter a token');
        return;
      }
      setCaptured({ type: selectedType, token: tokenValue.trim() });
    } else if (selectedType === 'cookie') {
      if (!cookieValue.trim()) {
        setError('Enter cookie string');
        return;
      }
      const cookies: Array<{ name: string; value: string }> = [];
      cookieValue.split(';').forEach(part => {
        const [name, ...vals] = part.split('=');
        if (name && vals.length) {
          cookies.push({ name: name.trim(), value: vals.join('=').trim() });
        }
      });
      if (cookies.length === 0) {
        setError('Invalid format: name=value; name2=value2');
        return;
      }
      setCaptured({ type: 'cookie', cookies });
    } else if (selectedType === 'api-key') {
      if (!apiKeyValue.trim()) {
        setError('Enter API key');
        return;
      }
      setCaptured({
        type: 'api-key',
        token: apiKeyValue.trim(),
        headers: { [headerName]: apiKeyValue.trim() },
      });
    }
    setStep('save');
  };

  // Save profile
  const saveProfile = () => {
    if (!captured || !profileName.trim()) {
      setError('Enter a profile name');
      return;
    }

    const base = {
      id: `auth_${Date.now()}`,
      name: profileName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let profile: AuthProfile;

    switch (captured.type) {
      case 'bearer':
        profile = { ...base, type: 'bearer', config: { token: captured.token! } } as BearerAuthProfile;
        break;
      case 'jwt':
        profile = { ...base, type: 'jwt', config: { token: captured.token!, headerName: 'Authorization', prefix: 'Bearer' } } as JWTAuthProfile;
        break;
      case 'cookie':
        profile = { ...base, type: 'cookie', config: { cookies: captured.cookies! } } as CookieAuthProfile;
        break;
      case 'api-key':
        profile = { ...base, type: 'api-key', config: { key: captured.token!, headerName, location: 'header' } };
        break;
      default:
        return;
    }

    onSaveProfile(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden"
      >
        {/* Header - Terminal Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" onClick={onClose}></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 font-mono text-sm">auth — credentials</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/30 px-4 py-2"
            >
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-4">
          {/* Step 1: Select Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Add Authentication</h2>
                <p className="text-xs text-gray-500 mt-1">Scan protected endpoints with credentials</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {AUTH_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-800 hover:border-gray-700 bg-black'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-green-400' : 'text-gray-500'}`} />
                      <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {type.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep('input')}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Enter Credentials */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Input mode tabs */}
              <div className="flex gap-1 p-1 bg-black rounded-lg">
                <button
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                    inputMode === 'manual' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setInputMode('curl')}
                  className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                    inputMode === 'curl' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Import cURL
                </button>
              </div>

              {inputMode === 'manual' ? (
                <div className="space-y-3">
                  {/* Token input */}
                  {(selectedType === 'bearer' || selectedType === 'jwt') && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-mono">
                        {selectedType.toUpperCase()}_TOKEN
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={tokenValue}
                          onChange={(e) => setTokenValue(e.target.value)}
                          className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-green-400 font-mono placeholder-gray-700 focus:outline-none focus:border-green-500"
                          placeholder={AUTH_TYPES.find(t => t.id === selectedType)?.placeholder}
                        />
                        <button
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cookie input */}
                  {selectedType === 'cookie' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-mono">COOKIES</label>
                      <textarea
                        value={cookieValue}
                        onChange={(e) => setCookieValue(e.target.value)}
                        className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-green-400 font-mono placeholder-gray-700 focus:outline-none focus:border-green-500 h-24 resize-none"
                        placeholder="session=abc123; auth_token=xyz789"
                      />
                    </div>
                  )}

                  {/* API Key input */}
                  {selectedType === 'api-key' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-mono">API_KEY</label>
                        <div className="relative">
                          <input
                            type={showSecret ? 'text' : 'password'}
                            value={apiKeyValue}
                            onChange={(e) => setApiKeyValue(e.target.value)}
                            className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-green-400 font-mono placeholder-gray-700 focus:outline-none focus:border-green-500"
                            placeholder="sk_live_..."
                          />
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                          >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-mono">HEADER_NAME</label>
                        <input
                          type="text"
                          value={headerName}
                          onChange={(e) => setHeaderName(e.target.value)}
                          className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-green-500"
                          placeholder="X-API-Key"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-mono">CURL_COMMAND</label>
                  <textarea
                    value={curlCommand}
                    onChange={(e) => setCurlCommand(e.target.value)}
                    className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-green-400 font-mono placeholder-gray-700 focus:outline-none focus:border-green-500 h-32 resize-none"
                    placeholder={`curl 'https://api.example.com' \\
  -H 'Authorization: Bearer eyJ...'`}
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    DevTools → Network → Right-click → Copy as cURL
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('type')}
                  className="flex-1 py-3 bg-gray-800 text-gray-400 font-medium rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleCapture}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500"
                >
                  Capture
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Save Profile */}
          {step === 'save' && captured && (
            <div className="space-y-4">
              {/* Success indicator */}
              <div className="text-center py-4">
                <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-2">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Credentials Captured</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {captured.type === 'cookie' ? `${captured.cookies?.length} cookie(s)` : `${captured.type} token`}
                </p>
              </div>

              {/* Preview */}
              <div className="p-3 bg-black rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-600 font-mono uppercase">Preview</span>
                  <button onClick={() => setShowSecret(!showSecret)} className="text-xs text-gray-600 hover:text-gray-400">
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <pre className="text-xs text-gray-500 font-mono overflow-x-auto">
                  {showSecret
                    ? JSON.stringify(captured, null, 2)
                    : JSON.stringify({ ...captured, token: '••••••••', cookies: captured.cookies?.map(c => ({ ...c, value: '••••' })) }, null, 2)}
                </pre>
              </div>

              {/* Profile name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">PROFILE_NAME</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-green-500"
                  placeholder="Production API"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('input'); setCaptured(null); }}
                  className="flex-1 py-3 bg-gray-800 text-gray-400 font-medium rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500"
                >
                  Save Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 bg-[#111]">
          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
            <Lock className="w-3 h-3" />
            <span>stored locally • never sent to servers • encrypted at rest</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

