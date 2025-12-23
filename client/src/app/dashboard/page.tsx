'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Search, FileText, LogOut, User, Clock, 
  CheckCircle, AlertTriangle, XCircle, Globe, Zap, Lock, Crown, 
  Star, Key, Plus, ChevronRight, BarChart3, ShieldAlert, 
  KeyRound, Menu, Settings, Bot, Calendar, Command
} from 'lucide-react';
import { getUserScans, ScanRecord } from '@/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { SkeletonScanCard } from '@/components/ui/Skeleton';
import type { StoredScanResult } from '@/types/scan';
import ScanModal from '@/components/dashboard/ScanModal';
import ScanHistoryChart from '@/components/dashboard/ScanHistoryChart';
import EmailBreachChecker from '@/components/dashboard/EmailBreachChecker';
import PasswordStrengthChecker from '@/components/dashboard/PasswordStrengthChecker';
import DashboardSidebar, { DashboardSection } from '@/components/dashboard/DashboardSidebar';
import ReportsView from '@/components/dashboard/ReportsView';
import ScanDetailView from '@/components/dashboard/ScanDetailView';
import ScheduledScans from '@/components/dashboard/ScheduledScans';
import AskAI from '@/components/dashboard/AskAI';
import DashboardSearch from '@/components/dashboard/DashboardSearch';
import APISecurityScanner from '@/components/dashboard/APISecurityScanner';
import AttackSurfaceScanner from '@/components/dashboard/AttackSurfaceScanner';
import DashboardSettings, { useDashboardSettings, FontSize } from '@/components/dashboard/DashboardSettings';
import { isAdmin as checkIsAdmin } from '@/config/admin';
import { logError } from '@/lib/logger';

// Helper to safely convert Firestore timestamps to ISO strings
function toISOString(date: Timestamp | Date | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  if (date instanceof Timestamp) return date.toDate().toISOString();
  if (typeof (date as { toDate?: () => Date }).toDate === 'function') {
    return (date as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

// Convert ScanRecord from Firestore to StoredScanResult
function scanRecordToStoredResult(record: ScanRecord, localScan?: StoredScanResult): StoredScanResult {
  return {
    id: record.id || '',
    url: record.url,
    timestamp: toISOString(record.createdAt),
    score: record.score,
    grade: record.grade,
    summary: { total: record.checksCount, passed: record.passed, warnings: record.warnings, failed: record.failed },
    checks: localScan?.checks || [],
    vulnerabilities: localScan?.vulnerabilities || [],
    scanDuration: record.duration,
    server: localScan?.server || { server: null, technology: [] },
    dns: localScan?.dns || { resolved: true, ipAddresses: [], hasCDN: false, cdnProvider: null },
    ssl: localScan?.ssl || { valid: false, issuer: '', validTo: '', daysUntilExpiry: 0, protocol: '' },
    headers: localScan?.headers || { raw: {}, security: {} },
    tags: record.tags || localScan?.tags || [],
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const { planInfo, canScan, recordScan } = useScanLimits();
  const [mounted, setMounted] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState<StoredScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<StoredScanResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const isAdmin = checkIsAdmin(user?.email);
  const getStorageKey = () => user?.uid ? `shieldscan_results_${user.uid}` : null;
  const { fontSize, setFontSize } = useDashboardSettings();

  // Font size scale mapping - explicit object lookup
  const FONT_SCALE_CLASSES: Record<FontSize, string> = {
    small: 'dashboard-text-small',
    medium: 'dashboard-text-medium',
    large: 'dashboard-text-large',
  };
  const fontScaleClass = FONT_SCALE_CLASSES[fontSize] || 'dashboard-text-medium';

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const loadScanHistory = async () => {
      if (!user?.uid) { setScanHistory([]); setIsLoadingHistory(false); return; }
      const storageKey = getStorageKey();
      
      if (storageKey) {
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
          try {
            const localScans = JSON.parse(savedHistory) as StoredScanResult[];
            setScanHistory(localScans);
            setIsLoadingHistory(false);
          } catch { logError('Failed to parse localStorage scan history', undefined, { component: 'dashboard' }); }
        }
      }

      setIsLoadingHistory(true);
      try {
        const firestoreScans = await getUserScans(user.uid, 20);
        const localStorageMap = new Map<string, StoredScanResult>();
        
        if (storageKey) {
          const savedHistory = localStorage.getItem(storageKey);
          if (savedHistory) {
            try {
              (JSON.parse(savedHistory) as StoredScanResult[]).forEach(scan => { if (scan.id) localStorageMap.set(scan.id, scan); });
            } catch { logError('Failed to parse localStorage scan history', undefined, { component: 'dashboard' }); }
          }
        }
        
        const history: StoredScanResult[] = [];
        firestoreScans.forEach(firestoreScan => {
          const existingLocal = localStorageMap.get(firestoreScan.id || '');
          history.push(scanRecordToStoredResult(firestoreScan, existingLocal));
        });
        
        localStorageMap.forEach((localScan, id) => {
          if (!firestoreScans.find(fs => fs.id === id)) history.push(localScan);
        });
        
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setScanHistory(history);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        logError('Failed to load scan history from Firestore', error, { component: 'dashboard' });
        if (storageKey) {
          const savedHistory = localStorage.getItem(storageKey);
          if (savedHistory) {
            try { const history = JSON.parse(savedHistory) as StoredScanResult[]; setScanHistory(history); } 
            catch { setScanHistory([]); }
          }
        }
      } finally { setIsLoadingHistory(false); }
    };
    loadScanHistory();
  }, [user?.uid]);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) router.push('/login');
  }, [mounted, loading, isAuthenticated, router]);

  const handleSignOut = async () => { await signOut(); router.push('/'); };

  const handleStartScan = () => {
    if (!canScan && !isAdmin) { toast.error('Scan limit reached. Upgrade to continue!'); return; }
    setIsScanModalOpen(true);
  };

  const handleScanComplete = async (result: StoredScanResult) => {
    const storageKey = getStorageKey();
    const newScan: StoredScanResult = {
      ...result,
      id: result.id || `local-${Date.now()}`,
    };
    
    setScanHistory(prev => {
      const exists = prev.some(s => s.id === newScan.id);
      if (exists) return prev;
      const updated = [newScan, ...prev].slice(0, 100);
      return updated;
    });
    
    if (storageKey) {
      try {
        const savedHistory = localStorage.getItem(storageKey);
        const localHistory = savedHistory ? JSON.parse(savedHistory) as StoredScanResult[] : [];
        const exists = localHistory.some(s => s.id === newScan.id);
        if (!exists) {
          const updated = [newScan, ...localHistory].slice(0, 100);
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
      } catch (e) {
        logError('Failed to save to localStorage', e, { component: 'dashboard' });
      }
    }
    
    recordScan();
    toast.success('Scan completed!');
    setSelectedScan(newScan);
    setActiveSection('reports');
  };

  const handleSelectScan = (scan: StoredScanResult) => { 
    setSelectedScan(scan);
    setActiveSection('reports');
  };

  const handleNavigate = (section: DashboardSection) => {
    if (section === 'new-scan') {
      handleStartScan();
      return;
    }
    // Only clear selectedScan when navigating away from reports
    if (section !== 'reports') {
      setSelectedScan(null);
    }
    setActiveSection(section);
    setMobileSidebarOpen(false);
  };

  const handleAskAI = () => {
    setActiveSection('ask-ai');
  };

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const getGradeBg = (grade: string) => grade.startsWith('A') ? 'bg-green-500/20 text-green-400' : grade === 'B' ? 'bg-blue-500/20 text-blue-400' : grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const avgScore = scanHistory.length > 0 ? Math.round(scanHistory.reduce((sum, s) => sum + s.score, 0) / scanHistory.length) : 0;

  return (
    <div className="h-screen bg-[#050507] flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <DashboardSidebar
          isAdmin={isAdmin}
          currentPlan={planInfo.id}
          onNavigate={handleNavigate}
          activeSection={activeSection}
        />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <DashboardSidebar
                isAdmin={isAdmin}
                currentPlan={planInfo.id}
                onNavigate={handleNavigate}
                activeSection={activeSection}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-11 bg-[#0a0a0f] border-b border-gray-800/50 flex items-center justify-between px-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-800 rounded text-gray-400"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">
              {activeSection === 'reports' && selectedScan ? 'Report' : activeSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
              <kbd className="flex items-center gap-0.5 px-1 py-0.5 bg-gray-900 rounded text-[10px]">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
            
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-1.5 hover:bg-gray-800 rounded text-gray-400"
            >
              <Search className="w-4 h-4" />
            </button>

            <DashboardSettings onFontSizeChange={setFontSize} />

            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-[10px] font-medium hover:bg-yellow-500/20">
                <Crown className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            
            <button
              onClick={() => handleNavigate('account')}
              className="flex items-center gap-1.5 px-1.5 py-1 hover:bg-gray-800 rounded transition-colors"
            >
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="" width={20} height={20} className="rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className="text-xs text-gray-400 hidden md:inline max-w-[80px] truncate">{user?.displayName || user?.email?.split('@')[0]}</span>
            </button>
            
            <button onClick={handleSignOut} className="p-1.5 text-gray-500 hover:text-white transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 p-3 md:p-4 overflow-y-auto scrollbar-hide ${fontScaleClass}`}>
          <AnimatePresence mode="popLayout">
            {/* Overview */}
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Welcome */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Welcome, {user?.displayName || user?.email?.split('@')[0]}</h2>
                    <p className="text-gray-500 text-xs">Security dashboard</p>
                  </div>
                  <button 
                    onClick={handleStartScan}
                    disabled={!canScan && !isAdmin}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                      canScan || isAdmin
                        ? 'bg-green-600 text-white hover:bg-green-500' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canScan || isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    New Scan
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-[10px] text-gray-500">Scans</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-white">{planInfo.scansUsed}</span>
                      <span className="text-[10px] text-gray-500">/ {planInfo.scanLimit === -1 ? '∞' : planInfo.scanLimit}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleNavigate('reports')}
                    className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3 text-left hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[10px] text-gray-500">Reports</span>
                    </div>
                    <span className="text-xl font-bold text-white">{scanHistory.length}</span>
                  </button>
                  
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[10px] text-gray-500">Avg Score</span>
                    </div>
                    <span className={`text-xl font-bold ${getScoreColor(avgScore)}`}>{avgScore || '-'}</span>
                  </div>
                  
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[10px] text-gray-500">Plan</span>
                    </div>
                    <span className={`text-sm font-medium ${isAdmin ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {isAdmin ? 'Admin' : planInfo.name}
                    </span>
                  </div>
                </div>

                {/* Chart */}
                {scanHistory.length > 0 && (
                  <ScanHistoryChart 
                    scans={scanHistory.map(s => ({
                      id: s.id, userId: user?.uid || '', userEmail: user?.email || '', url: s.url, score: s.score, grade: s.grade,
                      checksCount: s.summary.total, passed: s.summary.passed, warnings: s.summary.warnings, failed: s.summary.failed,
                      duration: s.scanDuration, tags: s.tags || [], createdAt: new Date(s.timestamp),
                    }))}
                    height={160}
                  />
                )}

                {/* Recent Scans */}
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-gray-800/50 flex items-center justify-between">
                    <h3 className="text-white text-sm font-medium">Recent Scans</h3>
                    {scanHistory.length > 0 && (
                      <button onClick={() => handleNavigate('reports')} className="text-[10px] text-yellow-500 hover:text-yellow-400">
                        View All
                      </button>
                    )}
                  </div>
                  
                  {isLoadingHistory ? (
                    <div className="p-3 space-y-2">
                      {[1,2,3].map(i => <SkeletonScanCard key={i} />)}
                    </div>
                  ) : scanHistory.length === 0 ? (
                    <div className="p-6 text-center">
                      <Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs mb-2">No scans yet</p>
                      <button onClick={handleStartScan} disabled={!canScan && !isAdmin} className="px-3 py-1.5 bg-yellow-500 text-black rounded text-xs font-medium hover:bg-yellow-400 disabled:opacity-50">
                        Start Scan
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800/50">
                      {scanHistory.slice(0, 4).map((scan) => (
                        <button
                          key={scan.id}
                          onClick={() => { setSelectedScan(scan); setActiveSection('reports'); }}
                          className="w-full p-2.5 hover:bg-gray-800/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${scan.score >= 80 ? 'bg-green-500/10' : scan.score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                              <span className={`text-xs font-bold ${getScoreColor(scan.score)}`}>{scan.score}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white text-xs font-mono truncate">{scan.url}</span>
                                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${getGradeBg(scan.grade)}`}>{scan.grade}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(scan.timestamp).toLocaleDateString()}
                                </span>
                                <span className="text-green-500">{scan.summary.passed}✓</span>
                                <span className="text-yellow-500">{scan.summary.warnings}⚠</span>
                                <span className="text-red-500">{scan.summary.failed}✗</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button onClick={() => handleNavigate('scheduled-scans')} className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors text-left">
                    <Calendar className="w-4 h-4 text-gray-500 mb-1.5" />
                    <p className="text-white text-xs font-medium">Schedule</p>
                    <p className="text-gray-600 text-[10px]">Auto scans</p>
                  </button>
                  <button onClick={() => handleNavigate('ask-ai')} className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors text-left">
                    <Bot className="w-4 h-4 text-gray-500 mb-1.5" />
                    <p className="text-white text-xs font-medium">Ask AI</p>
                    <p className="text-gray-600 text-[10px]">Get advice</p>
                  </button>
                  <button onClick={() => handleNavigate('email-breach')} className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors text-left">
                    <ShieldAlert className="w-4 h-4 text-gray-500 mb-1.5" />
                    <p className="text-white text-xs font-medium">Breach</p>
                    <p className="text-gray-600 text-[10px]">Check email</p>
                  </button>
                  <button onClick={() => handleNavigate('password-checker')} className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors text-left">
                    <KeyRound className="w-4 h-4 text-gray-500 mb-1.5" />
                    <p className="text-white text-xs font-medium">Password</p>
                    <p className="text-gray-600 text-[10px]">Test strength</p>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Reports */}
            {activeSection === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {selectedScan ? (
                  <ScanDetailView 
                    scan={selectedScan} 
                    onBack={() => setSelectedScan(null)}
                    onAskAI={handleAskAI}
                  />
                ) : (
                  <ReportsView 
                    scans={scanHistory} 
                    onSelectScan={handleSelectScan}
                  />
                )}
              </motion.div>
            )}

            {/* Website Scanner */}
            {activeSection === 'website-scanner' && (
              <motion.div
                key="website-scanner"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Website Scanner</h2>
                      <p className="text-gray-500 text-xs">Comprehensive vulnerability scanning</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartScan}
                    disabled={!canScan && !isAdmin}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                      canScan || isAdmin
                        ? 'bg-yellow-500 text-black hover:bg-yellow-400' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canScan || isAdmin ? 'Start New Scan' : 'Upgrade to Scan'}
                  </button>
                </div>

                {scanHistory.length > 0 && (
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-gray-800/50">
                      <h3 className="text-white text-sm font-medium">Recent Scans</h3>
                    </div>
                    <div className="divide-y divide-gray-800/50">
                      {scanHistory.slice(0, 5).map((scan) => (
                        <button
                          key={scan.id}
                          onClick={() => { setSelectedScan(scan); setActiveSection('reports'); }}
                          className="w-full p-3 hover:bg-gray-800/30 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${
                              scan.score >= 80 ? 'bg-green-500/10' : scan.score >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'
                            }`}>
                              <span className={`text-xs font-bold ${getScoreColor(scan.score)}`}>{scan.score}</span>
                            </div>
                            <div className="text-left">
                              <p className="text-white font-mono text-xs">{scan.url}</p>
                              <p className="text-gray-500 text-[10px]">{new Date(scan.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-yellow-500">View →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Email Breach */}
            {activeSection === 'email-breach' && (
              <motion.div key="email-breach" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <EmailBreachChecker userEmail={user?.email || undefined} />
                </div>
              </motion.div>
            )}

            {/* Password Checker */}
            {activeSection === 'password-checker' && (
              <motion.div key="password-checker" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <PasswordStrengthChecker />
                </div>
              </motion.div>
            )}

            {/* Scheduled Scans */}
            {activeSection === 'scheduled-scans' && (
              <motion.div key="scheduled-scans" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <ScheduledScans userId={user?.uid} canSchedule={canScan || isAdmin} />
              </motion.div>
            )}

            {/* Ask AI */}
            {activeSection === 'ask-ai' && (
              <motion.div key="ask-ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="h-[calc(100vh-80px)]">
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 h-full">
                  <AskAI />
                </div>
              </motion.div>
            )}

            {/* Analytics */}
            {activeSection === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    Analytics
                  </h2>
                  <p className="text-gray-500 text-xs">Track security trends</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Total Scans</p>
                    <p className="text-3xl font-bold text-white">{scanHistory.length}</p>
                  </div>
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Avg Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore || '-'}</p>
                  </div>
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">Issues</p>
                    <p className="text-3xl font-bold text-red-500">{scanHistory.reduce((sum, s) => sum + s.summary.failed, 0)}</p>
                  </div>
                </div>

                {scanHistory.length > 0 && (
                  <ScanHistoryChart 
                    scans={scanHistory.map(s => ({
                      id: s.id, userId: user?.uid || '', userEmail: user?.email || '', url: s.url, score: s.score, grade: s.grade,
                      checksCount: s.summary.total, passed: s.summary.passed, warnings: s.summary.warnings, failed: s.summary.failed,
                      duration: s.scanDuration, tags: s.tags || [], createdAt: new Date(s.timestamp),
                    }))}
                    height={250}
                  />
                )}
              </motion.div>
            )}

            {/* API Keys */}
            {activeSection === 'api-keys' && (
              <motion.div key="api-keys" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    API Keys
                  </h2>
                  <p className="text-gray-500 text-xs">Manage API access</p>
                </div>

                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-6 text-center">
                  <Key className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-3">API access for Pro plans</p>
                  {!isAdmin && planInfo.id === 'essential' && (
                    <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black rounded text-xs font-medium hover:bg-yellow-400">
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {/* Account */}
            {activeSection === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Account
                  </h2>
                </div>

                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {user?.photoURL ? (
                      <Image src={user.photoURL} alt="" width={48} height={48} className="rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{user?.displayName || 'User'}</p>
                      <p className="text-gray-500 text-xs">{user?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-800/50 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verified</span>
                      <span className={user?.emailVerified ? 'text-green-500' : 'text-yellow-500'}>{user?.emailVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan</span>
                      <span className="text-white">{isAdmin ? 'Admin' : planInfo.name}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-800/50 pt-3">
                    <Link href="/account" className="flex items-center justify-center gap-1.5 w-full py-2 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                      Full Settings
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* API Security */}
            {activeSection === 'api-security' && (
              <motion.div key="api-security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <APISecurityScanner />
                </div>
              </motion.div>
            )}

            {/* Cloud Security */}
            {activeSection === 'cloud-security' && (
              <motion.div key="cloud-security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Cloud Security (CSPM)</h2>
                    <p className="text-gray-500 text-xs">Monitor cloud infrastructure misconfigurations</p>
                  </div>
                </div>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-4">Continuous monitoring of your cloud environments for security misconfigurations and compliance violations.</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">AWS</p>
                      <p className="text-[10px] text-gray-500">Supported</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">Azure</p>
                      <p className="text-[10px] text-gray-500">Supported</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">GCP</p>
                      <p className="text-[10px] text-gray-500">Supported</p>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-400 transition-colors">
                    Connect Cloud Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* Internal Scanning */}
            {activeSection === 'internal-scanning' && (
              <motion.div key="internal-scanning" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Internal Network Scanning</h2>
                    <p className="text-gray-500 text-xs">Scan internal networks and devices</p>
                  </div>
                </div>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-4">Deploy our lightweight agent to scan internal infrastructure, including servers, databases, and network devices.</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Network vulnerability scanning</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Internal asset discovery</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Configuration compliance checks</div>
                  </div>
                  <button className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-400 transition-colors">
                    Download Agent
                  </button>
                </div>
              </motion.div>
            )}

            {/* DAST */}
            {activeSection === 'dast' && (
              <motion.div key="dast" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Dynamic Application Security Testing</h2>
                    <p className="text-gray-500 text-xs">Active vulnerability scanning for web applications</p>
                  </div>
                </div>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-4">DAST actively tests your running applications for vulnerabilities by simulating real-world attacks.</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> SQL Injection detection</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Cross-Site Scripting (XSS)</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Authentication bypass testing</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Business logic flaws</div>
                  </div>
                  <button onClick={handleStartScan} className="w-full py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-400 transition-colors">
                    Start DAST Scan
                  </button>
                </div>
              </motion.div>
            )}

            {/* Attack Surface */}
            {activeSection === 'attack-surface' && (
              <motion.div key="attack-surface" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                <AttackSurfaceScanner />
              </motion.div>
            )}

            {/* Compliance */}
            {activeSection === 'compliance' && (
              <motion.div key="compliance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Compliance Automation</h2>
                    <p className="text-gray-500 text-xs">Track compliance with security frameworks</p>
                  </div>
                </div>
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR'].map((framework) => (
                      <div key={framework} className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <p className="text-sm font-bold text-white">{framework}</p>
                        <p className="text-[10px] text-gray-500">0% Complete</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs mb-4">Automate compliance checks and generate audit-ready reports for major security frameworks.</p>
                  <button className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-400 transition-colors">
                    Start Compliance Scan
                  </button>
                </div>
              </motion.div>
            )}

            {/* Threat Detection - Coming Soon */}
            {activeSection === 'threat-detection' && (
              <motion.div key="threat-detection" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex items-center justify-center min-h-[300px]">
                <div className="text-center max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h2 className="text-base font-semibold text-white mb-1">Threat Detection</h2>
                  <p className="text-gray-500 text-xs mb-4">Real-time threat monitoring and alerting. Coming soon!</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <ScanModal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} onScanComplete={handleScanComplete} />
      <DashboardSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        scans={scanHistory}
        onNavigate={handleNavigate}
        onSelectScan={(scan) => { setSelectedScan(scan); setActiveSection('reports'); }}
      />
    </div>
  );
}
