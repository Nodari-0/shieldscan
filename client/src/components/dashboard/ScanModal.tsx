'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Shield, Globe, Loader2, CheckCircle, AlertTriangle, XCircle, ChevronRight, Key, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import { saveScanRecord } from '@/firebase/firestore';
import TagInput from '@/components/ui/TagInput';
import UpgradeModal from './UpgradeModal';
import LoginRecorder from './LoginRecorder';
import type { ScanResult, StoredScanResult } from '@/types/scan';
import type { AuthProfile } from '@/types/auth-profiles';
import { generateAuthHeaders, generateCookieString } from '@/types/auth-profiles';

interface TerminalLine {
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'divider';
  text: string;
  timestamp?: string;
}

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (result: StoredScanResult) => void;
}

const API_URL = '/api/scan';

// Auth type labels
const AUTH_TYPE_LABELS: Record<string, string> = {
  'jwt': 'JWT Token',
  'oauth2': 'OAuth 2.0',
  'cookie': 'Cookie',
  'api-key': 'API Key',
  'basic': 'Basic Auth',
  'bearer': 'Bearer Token',
  'custom': 'Custom',
};

// Storage key for auth profiles
const AUTH_STORAGE_KEY = 'shieldscan_auth_profiles';

export default function ScanModal({ isOpen, onClose, onScanComplete }: ScanModalProps) {
  const { user } = useAuth();
  const { planInfo, isAdmin } = useScanLimits();
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitError, setLimitError] = useState<{ message: string; resetDate?: string } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auth profile state
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>([]);
  const [selectedAuthProfile, setSelectedAuthProfile] = useState<AuthProfile | null>(null);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showLoginRecorder, setShowLoginRecorder] = useState(false);

  // Load auth profiles
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setAuthProfiles(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load auth profiles:', e);
      }
    }
  }, [isOpen]);

  // Save new auth profile
  const handleSaveAuthProfile = (profile: AuthProfile) => {
    const updated = [...authProfiles, profile];
    setAuthProfiles(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setSelectedAuthProfile(profile);
  };

  // Timer effect for scanning
  useEffect(() => {
    if (isScanning) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 100);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isScanning]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${Math.floor(milliseconds / 100)}s`;
  };

  useEffect(() => {
    if (!isOpen) {
      setTags([]);
      setUrl('');
      setShowAuthDropdown(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  };

  const addLine = (type: TerminalLine['type'], text: string) => {
    const timestamp = type !== 'divider' ? getTimestamp() : undefined;
    setTerminalLines(prev => [...prev, { type, text, timestamp }]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const performRealScan = async (targetUrl: string) => {
    setIsScanning(true);
    setScanComplete(false);
    setTerminalLines([]);
    setScanResult(null);

    addLine('system', 'SHIELDSCAN SECURITY SCANNER v2.1');
    addLine('divider', '─'.repeat(60));
    await delay(100);
    
    addLine('info', `Target: ${targetUrl}`);
    addLine('info', `Plan: ${planInfo.name}`);
    await delay(100);
    
    addLine('divider', '─'.repeat(60));
    addLine('system', 'Initializing scan modules...');
    await delay(200);
    
    addLine('info', '→ DNS Resolution');
    addLine('info', '→ SSL/TLS Validation');
    addLine('info', '→ Security Headers');
    addLine('info', '→ Vulnerability Scan');
    await delay(200);
    
    addLine('divider', '─'.repeat(60));
    addLine('system', 'Scanning target...');

    try {
      // Build auth config if profile is selected
      let authHeaders: Record<string, string> = {};
      let authCookies: string | undefined;
      
      if (selectedAuthProfile) {
        addLine('info', `[AUTH] Using profile: ${selectedAuthProfile.name}`);
        authHeaders = generateAuthHeaders(selectedAuthProfile);
        if (selectedAuthProfile.type === 'cookie') {
          authCookies = generateCookieString(selectedAuthProfile);
        }
        await delay(100);
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          plan: planInfo.id,
          userEmail: user?.email || '',
          userId: user?.uid || null,
          auth: selectedAuthProfile ? {
            headers: authHeaders,
            cookies: authCookies,
            profileName: selectedAuthProfile.name,
            profileType: selectedAuthProfile.type,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if ((data.limitReached || response.status === 403) && !isAdmin) {
          setLimitError({ message: data.error || 'Monthly scan limit reached', resetDate: data.resetDate });
          setShowUpgradeModal(true);
          setIsScanning(false);
          return;
        }
        throw new Error(data.error || `Scan failed: ${response.statusText}`);
      }

      const result: ScanResult = data.data;
      await delay(200);

      addLine('divider', '─'.repeat(60));
      
      // DNS
      if (result.dns?.resolved) {
        const ips = result.dns.ipAddresses.length > 0 ? result.dns.ipAddresses.slice(0, 2).join(', ') : 'OK';
        addLine('success', `[DNS] Resolved: ${ips}`);
        if (result.dns.hasCDN) {
          addLine('info', `[CDN] ${result.dns.cdnProvider || 'Detected'}`);
        }
      } else {
        addLine('error', '[DNS] Resolution failed');
      }
      await delay(100);

      // SSL
      if (result.ssl?.valid) {
        addLine('success', `[SSL] Valid (${result.ssl.issuer || 'Trusted CA'})`);
        addLine('info', `[TLS] ${result.ssl.protocol || 'TLS 1.2+'}`);
      } else if (result.ssl) {
        addLine('error', '[SSL] Invalid certificate');
      }
      await delay(100);

      // Headers summary
      const headerChecks = result.checks.filter(c => c.category === 'Headers');
      const headersPassed = headerChecks.filter(c => c.status === 'passed').length;
      const headersTotal = headerChecks.length;
      if (headersTotal > 0) {
        addLine(headersPassed === headersTotal ? 'success' : 'warning', 
          `[Headers] ${headersPassed}/${headersTotal} security headers`);
      }
      await delay(100);

      // Vulnerabilities
      if (result.vulnerabilities && result.vulnerabilities.length > 0) {
        addLine('error', `[VULN] ${result.vulnerabilities.length} issues found`);
      } else {
        addLine('success', '[VULN] No critical vulnerabilities');
      }

      addLine('divider', '─'.repeat(60));
      await delay(200);

      // Final score
      const scoreType = result.score >= 80 ? 'success' : result.score >= 60 ? 'warning' : 'error';
      addLine(scoreType, `SCORE: ${result.score}/100 (Grade: ${result.grade})`);
      addLine('info', `Passed: ${result.summary.passed} | Warnings: ${result.summary.warnings} | Failed: ${result.summary.failed}`);
      addLine('info', `Scan completed in ${result.scanDuration}ms`);

      setScanResult(result);
      setIsScanning(false);
      setScanComplete(true);

      // Save scan
      if (user?.uid && user?.email) {
        try {
          // Build scan record - only include tags if not empty (Firestore doesn't accept undefined)
          const scanRecord: Parameters<typeof saveScanRecord>[0] = {
            userId: user.uid,
            userEmail: user.email,
            url: result.url,
            score: result.score,
            grade: result.grade,
            checksCount: result.summary.total,
            passed: result.summary.passed,
            warnings: result.summary.warnings,
            failed: result.summary.failed,
            duration: result.scanDuration,
          };
          if (tags.length > 0) {
            scanRecord.tags = tags;
          }
          
          const scanId = await saveScanRecord(scanRecord);
          
          const storedResult: StoredScanResult = { ...result, id: scanId, tags: tags.length > 0 ? tags : [] };
          
          const storageKey = `shieldscan_results_${user.uid}`;
          const existingHistory = localStorage.getItem(storageKey);
          const history = existingHistory ? JSON.parse(existingHistory) : [];
          history.unshift(storedResult);
          localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 100)));
          
          onScanComplete?.(storedResult);
        } catch (err) {
          console.error('Failed to save scan:', err);
          onScanComplete?.({ ...result, id: `temp-${Date.now()}`, tags: tags.length > 0 ? tags : [] } as StoredScanResult);
        }
      } else {
        onScanComplete?.({ ...result, id: `anon-${Date.now()}`, tags: tags.length > 0 ? tags : [] } as StoredScanResult);
      }

    } catch (error) {
      console.error('Scan error:', error);
      addLine('error', `ERROR: ${error instanceof Error ? error.message : 'Scan failed'}`);
      setIsScanning(false);
    }
  };

  const handleStartScan = () => {
    if (!url.trim()) return;
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    performRealScan(targetUrl);
  };

  const handleClose = () => {
    if (!isScanning) {
      setUrl('');
      setTerminalLines([]);
      setScanComplete(false);
      setScanResult(null);
      onClose();
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-cyan-400';
      case 'system': return 'text-white';
      case 'divider': return 'text-gray-600';
      default: return 'text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={handleClose} />

      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 font-mono text-sm">shieldscan — security scanner</span>
          </div>
          <button onClick={handleClose} disabled={isScanning} className="text-gray-500 hover:text-white disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input */}
        {!isScanning && !scanComplete && (
          <div className="p-6 border-b border-gray-800 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white font-mono placeholder-gray-600 focus:outline-none focus:border-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartScan()}
                />
              </div>
              <button
                onClick={handleStartScan}
                disabled={!url.trim()}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Scan
              </button>
            </div>
            
            {/* Authentication Section */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">Authentication (optional)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-left flex items-center justify-between hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    {selectedAuthProfile ? (
                      <span className="text-white">
                        {selectedAuthProfile.name}
                        <span className="ml-2 text-xs text-gray-500">
                          ({AUTH_TYPE_LABELS[selectedAuthProfile.type]})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500">No authentication</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAuthDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showAuthDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    {/* No auth option */}
                    <button
                      onClick={() => {
                        setSelectedAuthProfile(null);
                        setShowAuthDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-800 flex items-center gap-2 ${
                        !selectedAuthProfile ? 'bg-gray-800' : ''
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                        {!selectedAuthProfile && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      </div>
                      <span className="text-gray-400">No authentication</span>
                    </button>

                    {/* Existing profiles */}
                    {authProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          setSelectedAuthProfile(profile);
                          setShowAuthDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-800 flex items-center gap-2 ${
                          selectedAuthProfile?.id === profile.id ? 'bg-gray-800' : ''
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                          {selectedAuthProfile?.id === profile.id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>
                        <span className="text-white">{profile.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">{AUTH_TYPE_LABELS[profile.type]}</span>
                      </button>
                    ))}

                    {/* Add new profile */}
                    <button
                      onClick={() => {
                        setShowAuthDropdown(false);
                        setShowLoginRecorder(true);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-800 flex items-center gap-2 border-t border-gray-700"
                    >
                      <Plus className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400">Add new credentials</span>
                    </button>
                  </div>
                )}
              </div>
              {selectedAuthProfile && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Scan will use authenticated requests
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Tags (optional)</label>
              <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." maxTags={10} />
            </div>
          </div>
        )}

        {/* Login Recorder Modal */}
        {showLoginRecorder && (
          <LoginRecorder
            onSaveProfile={handleSaveAuthProfile}
            onClose={() => setShowLoginRecorder(false)}
          />
        )}

        {/* Terminal */}
        {(isScanning || scanComplete) && (
          <div className="p-4">
            <div className="relative">
              {/* Timer in corner */}
              {isScanning && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-mono text-sm text-green-400">{formatTime(elapsedTime)}</span>
                </div>
              )}
              <div 
                ref={terminalRef}
                className="bg-black rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm"
                style={{ scrollbarWidth: 'none' }}
              >
                {terminalLines.map((line, idx) => (
                  <div key={idx} className={`${getLineColor(line.type)} leading-relaxed`}>
                    {line.timestamp && <span className="text-gray-600 mr-2">[{line.timestamp}]</span>}
                    {line.text}
                  </div>
                ))}

                {isScanning && (
                  <div className="flex items-center gap-2 text-green-400 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {scanComplete && scanResult && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`font-mono font-bold ${scanResult.score >= 80 ? 'text-green-500' : scanResult.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {scanResult.score}/100
                    </div>
                    <div className="text-gray-500">
                      <span className="text-green-500">{scanResult.summary.passed}</span> passed · 
                      <span className="text-yellow-500 ml-1">{scanResult.summary.warnings}</span> warnings · 
                      <span className="text-red-500 ml-1">{scanResult.summary.failed}</span> failed
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{scanResult.scanDuration}ms</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setScanComplete(false); setTerminalLines([]); setUrl(''); setTags([]); setElapsedTime(0); }}
                    className="flex-1 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    New Scan
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-1"
                  >
                    View Report <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showUpgradeModal && limitError && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => { setShowUpgradeModal(false); setLimitError(null); }}
          currentPlan={planInfo.id as 'free' | 'pro' | 'business' | 'enterprise'}
          scansRemaining={0}
          resetDate={limitError.resetDate ? new Date(limitError.resetDate) : undefined}
        />
      )}
    </div>
  );
}
