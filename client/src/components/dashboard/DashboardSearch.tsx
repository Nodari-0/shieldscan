'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Globe, FileText, Calendar, Bot, Shield, BarChart3,
  ShieldAlert, KeyRound, Code, Cloud, Server, Zap, Key, User,
  Home, ChevronRight, Radar, AlertTriangle, CheckSquare
} from 'lucide-react';
import type { StoredScanResult } from '@/types/scan';
import type { DashboardSection } from './DashboardSidebar';

interface DashboardSearchProps {
  isOpen: boolean;
  onClose: () => void;
  scans: StoredScanResult[];
  onNavigate: (section: DashboardSection) => void;
  onSelectScan: (scan: StoredScanResult) => void;
}

interface SearchResult {
  type: 'page' | 'scan' | 'action';
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: DashboardSection;
  scan?: StoredScanResult;
}

const PAGES: SearchResult[] = [
  { type: 'page', id: 'overview', title: 'Overview', description: 'Dashboard home', icon: Home, section: 'overview' },
  { type: 'page', id: 'reports', title: 'Reports', description: 'View all scan reports', icon: FileText, section: 'reports' },
  { type: 'page', id: 'scheduled-scans', title: 'Scheduled Scans', description: 'Manage scheduled scans', icon: Calendar, section: 'scheduled-scans' },
  { type: 'page', id: 'ask-ai', title: 'Ask AI', description: 'Get security advice', icon: Bot, section: 'ask-ai' },
  { type: 'page', id: 'website-scanner', title: 'Website Scanner', description: 'Scan websites', icon: Globe, section: 'website-scanner' },
  { type: 'page', id: 'api-security', title: 'API Security', description: 'API vulnerability testing', icon: Code, section: 'api-security' },
  { type: 'page', id: 'cloud-security', title: 'Cloud Security', description: 'Cloud configuration checks', icon: Cloud, section: 'cloud-security' },
  { type: 'page', id: 'internal-scanning', title: 'Internal Scanning', description: 'Internal network scans', icon: Server, section: 'internal-scanning' },
  { type: 'page', id: 'dast', title: 'DAST', description: 'Dynamic application testing', icon: Zap, section: 'dast' },
  { type: 'page', id: 'email-breach', title: 'Email Breach Check', description: 'Check for data breaches', icon: ShieldAlert, section: 'email-breach' },
  { type: 'page', id: 'password-checker', title: 'Password Checker', description: 'Test password strength', icon: KeyRound, section: 'password-checker' },
  { type: 'page', id: 'attack-surface', title: 'Attack Surface', description: 'Discover external assets', icon: Radar, section: 'attack-surface' },
  { type: 'page', id: 'threat-detection', title: 'Threat Detection', description: 'Real-time threat monitoring', icon: AlertTriangle, section: 'threat-detection' },
  { type: 'page', id: 'analytics', title: 'Analytics', description: 'View security trends', icon: BarChart3, section: 'analytics' },
  { type: 'page', id: 'compliance', title: 'Compliance', description: 'SOC 2, ISO 27001, HIPAA', icon: CheckSquare, section: 'compliance' },
  { type: 'page', id: 'api-keys', title: 'API Keys', description: 'Manage API access', icon: Key, section: 'api-keys' },
  { type: 'page', id: 'account', title: 'Account Settings', description: 'Profile and preferences', icon: User, section: 'account' },
];

const ACTIONS: SearchResult[] = [
  { type: 'action', id: 'new-scan', title: 'Start New Scan', description: 'Scan a website', icon: Search, section: 'new-scan' },
];

export default function DashboardSearch({ isOpen, onClose, scans, onNavigate, onSelectScan }: DashboardSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter results based on query
  const getResults = useCallback((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    
    if (!q) {
      // Show recent scans and common pages
      const recentScans: SearchResult[] = scans.slice(0, 3).map(scan => ({
        type: 'scan' as const,
        id: scan.id,
        title: scan.url,
        description: `Score: ${scan.score} • ${new Date(scan.timestamp).toLocaleDateString()}`,
        icon: Globe,
        scan,
      }));
      
      return [...ACTIONS, ...recentScans, ...PAGES.slice(0, 5)];
    }

    const results: SearchResult[] = [];

    // Search pages
    PAGES.forEach(page => {
      if (page.title.toLowerCase().includes(q) || page.description?.toLowerCase().includes(q)) {
        results.push(page);
      }
    });

    // Search actions
    ACTIONS.forEach(action => {
      if (action.title.toLowerCase().includes(q) || action.description?.toLowerCase().includes(q)) {
        results.push(action);
      }
    });

    // Search scans
    scans.forEach(scan => {
      if (scan.url.toLowerCase().includes(q)) {
        results.push({
          type: 'scan',
          id: scan.id,
          title: scan.url,
          description: `Score: ${scan.score} • ${scan.grade} • ${new Date(scan.timestamp).toLocaleDateString()}`,
          icon: Globe,
          scan,
        });
      }
    });

    return results.slice(0, 10);
  }, [query, scans]);

  const results = getResults();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'scan' && result.scan) {
      onSelectScan(result.scan);
      onNavigate('reports');
    } else if (result.section) {
      onNavigate(result.section);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-[#0f0f14] border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, scans, or actions..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-gray-800 rounded text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-800 rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-80 overflow-y-auto scrollbar-hide py-2">
                {results.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No results found for "{query}"
                  </div>
                ) : (
                  results.map((result, index) => {
                    const Icon = result.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isSelected ? 'bg-yellow-500/10' : 'hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'action' 
                            ? 'bg-green-500/10' 
                            : result.type === 'scan' 
                            ? 'bg-blue-500/10' 
                            : 'bg-gray-800'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            result.type === 'action' 
                              ? 'text-green-500' 
                              : result.type === 'scan' 
                              ? 'text-blue-500' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isSelected ? 'text-yellow-500' : 'text-white'}`}>
                            {result.title}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">{result.description}</p>
                          )}
                        </div>
                        {result.type === 'page' && (
                          <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Page</span>
                        )}
                        {result.type === 'scan' && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Scan</span>
                        )}
                        {result.type === 'action' && (
                          <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Action</span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-yellow-500' : 'text-gray-600'}`} />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-800 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-800 rounded">↵</kbd>
                    Open
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-800 rounded">⌘</kbd>
                  <kbd className="px-1 py-0.5 bg-gray-800 rounded">K</kbd>
                  to search
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

