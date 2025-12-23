'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  FileText,
  Globe,
  Cloud,
  Server,
  Code,
  BarChart3,
  Key,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  Zap,
  Lock,
  ShieldAlert,
  KeyRound,
  Radar,
  FileCheck,
  Calendar,
  Bot,
} from 'lucide-react';

export type DashboardSection = 
  | 'overview' 
  | 'new-scan' 
  | 'reports' 
  | 'website-scanner' 
  | 'api-security' 
  | 'cloud-security' 
  | 'internal-scanning' 
  | 'dast' 
  | 'email-breach' 
  | 'password-checker' 
  | 'threat-detection' 
  | 'attack-surface' 
  | 'analytics' 
  | 'compliance'
  | 'scheduled-scans'
  | 'ask-ai'
  | 'api-keys'
  | 'account';

interface DashboardSidebarProps {
  isAdmin?: boolean;
  currentPlan?: string;
  onNavigate?: (section: DashboardSection) => void;
  activeSection?: DashboardSection;
}

export default function DashboardSidebar({
  isAdmin = false,
  currentPlan = 'essential',
  onNavigate,
  activeSection = 'overview',
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main', 'scanning', 'security', 'monitoring']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  interface NavItem {
    id: DashboardSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredPlan?: string[];
  }

  interface NavGroup {
    id: string;
    label?: string;
    items: NavItem[];
  }

  // Admin has access to everything
  const isPlanAllowed = (requiredPlans?: string[]) => {
    if (isAdmin) return true;
    if (!requiredPlans) return true;
    return requiredPlans.includes(currentPlan);
  };

  const navGroups: NavGroup[] = [
    {
      id: 'main',
      items: [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'new-scan', label: 'New Scan', icon: Search },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'scheduled-scans', label: 'Scheduled Scans', icon: Calendar },
        { id: 'ask-ai', label: 'Ask AI', icon: Bot },
      ],
    },
    {
      id: 'scanning',
      label: 'Scanning',
      items: [
        { id: 'website-scanner', label: 'Website Scanner', icon: Globe },
        { id: 'api-security', label: 'API Security', icon: Code, requiredPlan: ['cloud', 'pro', 'enterprise'] },
        { id: 'cloud-security', label: 'Cloud Security', icon: Cloud, requiredPlan: ['cloud', 'pro', 'enterprise'] },
        { id: 'internal-scanning', label: 'Internal Scanning', icon: Server, requiredPlan: ['pro', 'enterprise'] },
        { id: 'dast', label: 'DAST', icon: Zap, requiredPlan: ['pro', 'enterprise'] },
      ],
    },
    {
      id: 'security',
      label: 'Security Tools',
      items: [
        { id: 'email-breach', label: 'Email Breach', icon: ShieldAlert },
        { id: 'password-checker', label: 'Password Check', icon: KeyRound },
        { id: 'threat-detection', label: 'Threat Detection', icon: ShieldAlert, requiredPlan: ['pro', 'enterprise'] },
        { id: 'attack-surface', label: 'Attack Surface', icon: Radar, requiredPlan: ['pro', 'enterprise'] },
      ],
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'compliance', label: 'Compliance', icon: FileCheck, requiredPlan: ['enterprise'] },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [
        { id: 'api-keys', label: 'API Keys', icon: Key },
        { id: 'account', label: 'Account', icon: User },
      ],
    },
  ];

  return (
    <motion.aside
      className={`bg-[#0a0a0f] border-r border-gray-800/50 h-full flex flex-col transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
      initial={false}
      animate={{ width: isCollapsed ? 56 : 224 }}
    >
      {/* Logo */}
      <div className="p-3 border-b border-gray-800/50 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/ShieldScanLogo.png" alt="Logo" width={24} height={24} />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="text-sm font-bold text-yellow-500"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                ShieldScan
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-500 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.id} className="mb-1">
            {group.label && !isCollapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-medium text-gray-600 uppercase tracking-wider hover:text-gray-400"
              >
                <span>{group.label}</span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${
                    expandedGroups.includes(group.id) ? 'rotate-90' : ''
                  }`}
                />
              </button>
            )}
            
            <AnimatePresence>
              {(isCollapsed || !group.label || expandedGroups.includes(group.id)) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {group.items.map((item: NavItem) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const isLocked = !isPlanAllowed(item.requiredPlan);

                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => !isLocked && onNavigate?.(item.id)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all relative group ${
                          isActive
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : isLocked
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                        }`}
                        whileTap={!isLocked ? { scale: 0.98 } : {}}
                      >
                        <div className="relative flex-shrink-0">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-500' : ''}`} />
                          {isLocked && (
                            <Lock className="w-2 h-2 absolute -top-0.5 -right-0.5 text-gray-600" />
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.div
                              className="flex items-center justify-between flex-1 min-w-0"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                            >
                              <span className={`text-xs truncate ${isLocked ? 'text-gray-700' : ''}`}>
                                {item.label}
                              </span>
                              {isLocked && (
                                <span className="px-1 py-0.5 text-[9px] bg-gray-800/50 text-gray-600 rounded">
                                  Pro
                                </span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            {item.label}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Plan Badge - Only show upgrade for non-admin essential users */}
      <div className="p-2 border-t border-gray-800/50 flex-shrink-0">
        <div className={`p-2 rounded-lg ${isAdmin ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-gray-800/30'}`}>
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${isAdmin ? 'text-yellow-500' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium ${isAdmin ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {isAdmin ? 'Admin' : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                </div>
                {!isAdmin && currentPlan === 'essential' && (
                  <Link
                    href="/pricing"
                    className="text-[10px] px-2 py-0.5 bg-yellow-500 text-black font-medium rounded hover:bg-yellow-400 transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <Shield className={`w-4 h-4 ${isAdmin ? 'text-yellow-500' : 'text-gray-500'}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
