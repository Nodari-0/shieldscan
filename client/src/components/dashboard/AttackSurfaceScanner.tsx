'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Play, Loader2, CheckCircle, XCircle, AlertTriangle,
  Globe, Server, Shield, Lock, Wifi, Clock, Plus, Trash2,
  ChevronDown, ChevronRight, ExternalLink, RefreshCw, Eye,
  AlertOctagon, Database, Search, Filter, Download, Bell,
  Copy, Check, Info, MapPin, Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface DiscoveredAsset {
  id: string;
  type: 'domain' | 'subdomain' | 'ip' | 'port' | 'service';
  value: string;
  parentDomain?: string;
  status: 'active' | 'inactive' | 'unknown';
  risk: 'critical' | 'high' | 'medium' | 'low' | 'info';
  firstSeen: string;
  lastSeen: string;
  metadata?: {
    ipAddresses?: string[];
    openPorts?: number[];
    technologies?: string[];
    sslExpiry?: string;
    httpStatus?: number;
    server?: string;
    location?: string;
  };
}

interface AttackSurfaceScan {
  id: string;
  domain: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  assetsFound: number;
  subdomains: string[];
  ipAddresses: string[];
  openPorts: { ip: string; port: number; service: string }[];
  technologies: string[];
  sslInfo?: {
    valid: boolean;
    issuer: string;
    expiry: string;
    daysUntilExpiry: number;
  };
  risks: {
    type: string;
    severity: string;
    description: string;
    asset: string;
  }[];
}

interface MonitoredDomain {
  domain: string;
  addedAt: string;
  lastScanned?: string;
  assetsCount: number;
  riskScore: number;
  alerts: number;
}

const STORAGE_KEY = 'shieldscan_attack_surface';

export default function AttackSurfaceScanner() {
  const [targetDomain, setTargetDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [currentScan, setCurrentScan] = useState<AttackSurfaceScan | null>(null);
  const [monitoredDomains, setMonitoredDomains] = useState<MonitoredDomain[]>([]);
  const [discoveredAssets, setDiscoveredAssets] = useState<DiscoveredAsset[]>([]);
  const [scanHistory, setScanHistory] = useState<AttackSurfaceScan[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'assets' | 'monitor' | 'history'>('scan');
  const [expandedAssets, setExpandedAssets] = useState<string[]>([]);
  const [assetFilter, setAssetFilter] = useState<'all' | 'domain' | 'subdomain' | 'ip' | 'port'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMonitoredDomains(data.monitoredDomains || []);
        setDiscoveredAssets(data.discoveredAssets || []);
        setScanHistory(data.scanHistory || []);
      } catch {
        console.error('Failed to load attack surface data');
      }
    }
  }, []);

  // Save data to localStorage
  const saveData = (data: {
    monitoredDomains?: MonitoredDomain[];
    discoveredAssets?: DiscoveredAsset[];
    scanHistory?: AttackSurfaceScan[];
  }) => {
    const currentData = {
      monitoredDomains: data.monitoredDomains ?? monitoredDomains,
      discoveredAssets: data.discoveredAssets ?? discoveredAssets,
      scanHistory: data.scanHistory ?? scanHistory,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
  };

  const runAttackSurfaceScan = async () => {
    if (!targetDomain) {
      toast.error('Please enter a domain to scan');
      return;
    }

    // Validate domain
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(targetDomain)) {
      toast.error('Please enter a valid domain (e.g., example.com)');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setCurrentScan(null);

    try {
      // Simulate progressive scanning
      const stages = [
        { progress: 10, status: 'Resolving DNS records...' },
        { progress: 25, status: 'Discovering subdomains...' },
        { progress: 45, status: 'Scanning IP addresses...' },
        { progress: 60, status: 'Detecting open ports...' },
        { progress: 75, status: 'Identifying technologies...' },
        { progress: 85, status: 'Checking SSL certificates...' },
        { progress: 95, status: 'Analyzing risks...' },
      ];

      for (const stage of stages) {
        setScanProgress(stage.progress);
        setScanStatus(stage.status);
        await new Promise(r => setTimeout(r, 800));
      }

      // Make API call
      const response = await fetch('/api/scan/attack-surface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setScanProgress(100);
      setScanStatus('Scan complete!');

      const newScan: AttackSurfaceScan = {
        ...data,
        id: `asm-${Date.now()}`,
        domain: targetDomain,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      setCurrentScan(newScan);

      // Update assets
      const newAssets: DiscoveredAsset[] = [];
      
      // Add main domain
      newAssets.push({
        id: `asset-${Date.now()}-main`,
        type: 'domain',
        value: targetDomain,
        status: 'active',
        risk: data.risks?.length > 0 ? 'medium' : 'low',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        metadata: {
          ipAddresses: data.ipAddresses,
          technologies: data.technologies,
        },
      });

      // Add subdomains
      data.subdomains?.forEach((sub: string, idx: number) => {
        newAssets.push({
          id: `asset-${Date.now()}-sub-${idx}`,
          type: 'subdomain',
          value: sub,
          parentDomain: targetDomain,
          status: 'active',
          risk: 'info',
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      });

      // Add IPs
      data.ipAddresses?.forEach((ip: string, idx: number) => {
        newAssets.push({
          id: `asset-${Date.now()}-ip-${idx}`,
          type: 'ip',
          value: ip,
          parentDomain: targetDomain,
          status: 'active',
          risk: 'info',
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      });

      // Add open ports
      data.openPorts?.forEach((portInfo: any, idx: number) => {
        newAssets.push({
          id: `asset-${Date.now()}-port-${idx}`,
          type: 'port',
          value: `${portInfo.ip}:${portInfo.port}`,
          parentDomain: targetDomain,
          status: 'active',
          risk: portInfo.port === 22 || portInfo.port === 3389 ? 'high' : 'medium',
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          metadata: { server: portInfo.service },
        });
      });

      // Merge with existing assets
      const mergedAssets = [...discoveredAssets];
      newAssets.forEach(newAsset => {
        const existing = mergedAssets.findIndex(a => a.value === newAsset.value && a.type === newAsset.type);
        if (existing >= 0) {
          mergedAssets[existing] = { ...mergedAssets[existing], lastSeen: newAsset.lastSeen };
        } else {
          mergedAssets.push(newAsset);
        }
      });

      setDiscoveredAssets(mergedAssets);

      // Update monitored domains
      const existingDomain = monitoredDomains.find(d => d.domain === targetDomain);
      const updatedDomains = existingDomain
        ? monitoredDomains.map(d => d.domain === targetDomain ? {
            ...d,
            lastScanned: new Date().toISOString(),
            assetsCount: newAssets.length,
            riskScore: data.risks?.length * 10 || 0,
          } : d)
        : [...monitoredDomains, {
            domain: targetDomain,
            addedAt: new Date().toISOString(),
            lastScanned: new Date().toISOString(),
            assetsCount: newAssets.length,
            riskScore: data.risks?.length * 10 || 0,
            alerts: data.risks?.length || 0,
          }];

      setMonitoredDomains(updatedDomains);

      // Update history
      const updatedHistory = [newScan, ...scanHistory].slice(0, 50);
      setScanHistory(updatedHistory);

      // Save all data
      saveData({
        monitoredDomains: updatedDomains,
        discoveredAssets: mergedAssets,
        scanHistory: updatedHistory,
      });

      toast.success(`Found ${newScan.assetsFound} assets!`);
      setActiveTab('assets');

    } catch (error: any) {
      console.error('Attack surface scan error:', error);
      toast.error(error.message || 'Scan failed');
      setScanStatus('Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const removeDomain = (domain: string) => {
    const updated = monitoredDomains.filter(d => d.domain !== domain);
    setMonitoredDomains(updated);
    
    const updatedAssets = discoveredAssets.filter(a => a.parentDomain !== domain && a.value !== domain);
    setDiscoveredAssets(updatedAssets);
    
    saveData({ monitoredDomains: updated, discoveredAssets: updatedAssets });
    toast.success('Domain removed');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportAssets = () => {
    const csv = [
      'Type,Value,Parent Domain,Status,Risk,First Seen,Last Seen',
      ...filteredAssets.map(a => 
        `${a.type},${a.value},${a.parentDomain || ''},${a.status},${a.risk},${a.firstSeen},${a.lastSeen}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-surface-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Assets exported!');
  };

  const toggleAssetExpand = (id: string) => {
    setExpandedAssets(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="w-4 h-4" />;
      case 'subdomain': return <Globe className="w-4 h-4" />;
      case 'ip': return <Server className="w-4 h-4" />;
      case 'port': return <Wifi className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  // Filter assets
  const filteredAssets = discoveredAssets.filter(asset => {
    if (assetFilter !== 'all' && asset.type !== assetFilter) return false;
    if (riskFilter !== 'all' && asset.risk !== riskFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    totalAssets: discoveredAssets.length,
    domains: discoveredAssets.filter(a => a.type === 'domain').length,
    subdomains: discoveredAssets.filter(a => a.type === 'subdomain').length,
    ips: discoveredAssets.filter(a => a.type === 'ip').length,
    ports: discoveredAssets.filter(a => a.type === 'port').length,
    criticalRisks: discoveredAssets.filter(a => a.risk === 'critical').length,
    highRisks: discoveredAssets.filter(a => a.risk === 'high').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Radar className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Attack Surface Management</h2>
            <p className="text-gray-500 text-xs">Discover and monitor your external attack surface</p>
          </div>
        </div>
        {stats.totalAssets > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {stats.totalAssets} assets
            </span>
            {stats.criticalRisks + stats.highRisks > 0 && (
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.criticalRisks + stats.highRisks} risks
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto scrollbar-hide">
        {[
          { id: 'scan', label: 'Scan', icon: Radar },
          { id: 'assets', label: 'Assets', icon: Database, count: stats.totalAssets },
          { id: 'monitor', label: 'Monitor', icon: Eye, count: monitoredDomains.length },
          { id: 'history', label: 'History', icon: Clock, count: scanHistory.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-medium transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id ? 'text-cyan-500' : 'text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[9px] text-gray-400">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div layoutId="asmTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Domain Input */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <label className="text-xs text-gray-500 mb-2 block">Target Domain</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, '').split('/')[0])}
                    placeholder="example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    disabled={isScanning}
                  />
                </div>
                <button
                  onClick={runAttackSurfaceScan}
                  disabled={isScanning || !targetDomain}
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    isScanning || !targetDomain
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Radar className="w-4 h-4" />
                      Discover
                    </>
                  )}
                </button>
              </div>

              {/* Quick examples */}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-gray-500">Examples:</span>
                {['github.com', 'google.com', 'cloudflare.com'].map(domain => (
                  <button
                    key={domain}
                    onClick={() => setTargetDomain(domain)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline"
                    disabled={isScanning}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Progress */}
            {isScanning && (
              <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{scanStatus}</span>
                  <span className="text-xs text-cyan-500 font-mono">{scanProgress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Current Scan Results */}
            {currentScan && !isScanning && (
              <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Scan Complete: {currentScan.domain}
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    {new Date(currentScan.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-cyan-500">{currentScan.assetsFound}</p>
                    <p className="text-[10px] text-gray-500">Total Assets</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-500">{currentScan.subdomains?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Subdomains</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-purple-500">{currentScan.ipAddresses?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">IP Addresses</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-500">{currentScan.openPorts?.length || 0}</p>
                    <p className="text-[10px] text-gray-500">Open Ports</p>
                  </div>
                </div>

                {/* Risks */}
                {currentScan.risks && currentScan.risks.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <h4 className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Security Risks ({currentScan.risks.length})
                    </h4>
                    <div className="space-y-2">
                      {currentScan.risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            risk.severity === 'critical' ? 'bg-red-500 text-white' :
                            risk.severity === 'high' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            {risk.severity.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-white">{risk.type}</p>
                            <p className="text-gray-500 text-[10px]">{risk.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                {currentScan.technologies && currentScan.technologies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Detected Technologies</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentScan.technologies.map((tech, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-[10px]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* What We Scan */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <h3 className="text-xs font-medium text-white mb-3 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-gray-500" /> Discovery Capabilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                {[
                  { icon: Globe, label: 'Subdomain Enumeration' },
                  { icon: Server, label: 'IP Address Discovery' },
                  { icon: Wifi, label: 'Port Scanning' },
                  { icon: Fingerprint, label: 'Technology Detection' },
                  { icon: Lock, label: 'SSL Certificate Check' },
                  { icon: MapPin, label: 'DNS Record Analysis' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-gray-400">
                    <item.icon className="w-3 h-3 text-cyan-500" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <motion.div
            key="assets"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value as any)}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="domain">Domains</option>
                  <option value="subdomain">Subdomains</option>
                  <option value="ip">IP Addresses</option>
                  <option value="port">Open Ports</option>
                </select>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none"
                >
                  <option value="all">All Risks</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {filteredAssets.length > 0 && (
                <button
                  onClick={exportAssets}
                  className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              )}
            </div>

            {/* Assets List */}
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-lg">
                <Database className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No assets discovered yet</p>
                <p className="text-gray-600 text-xs">Run a scan to discover assets</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors"
                  >
                    <button
                      onClick={() => toggleAssetExpand(asset.id)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg ${getRiskColor(asset.risk)} flex items-center justify-center`}>
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-mono truncate">{asset.value}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getRiskColor(asset.risk)}`}>
                            {asset.risk}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span className="capitalize">{asset.type}</span>
                          {asset.parentDomain && <span>• {asset.parentDomain}</span>}
                          <span>• Last seen {new Date(asset.lastSeen).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(asset.value, asset.id); }}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        >
                          {copied === asset.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {expandedAssets.includes(asset.id) 
                          ? <ChevronDown className="w-4 h-4 text-gray-500" />
                          : <ChevronRight className="w-4 h-4 text-gray-500" />
                        }
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedAssets.includes(asset.id) && asset.metadata && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-800 p-3 bg-gray-800/30"
                        >
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {asset.metadata.ipAddresses && (
                              <div>
                                <span className="text-gray-500">IP Addresses:</span>
                                <span className="text-white ml-1 font-mono">{asset.metadata.ipAddresses.join(', ')}</span>
                              </div>
                            )}
                            {asset.metadata.technologies && (
                              <div>
                                <span className="text-gray-500">Technologies:</span>
                                <span className="text-white ml-1">{asset.metadata.technologies.join(', ')}</span>
                              </div>
                            )}
                            {asset.metadata.server && (
                              <div>
                                <span className="text-gray-500">Service:</span>
                                <span className="text-white ml-1">{asset.metadata.server}</span>
                              </div>
                            )}
                            {asset.metadata.openPorts && (
                              <div>
                                <span className="text-gray-500">Open Ports:</span>
                                <span className="text-white ml-1 font-mono">{asset.metadata.openPorts.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Monitor Tab */}
        {activeTab === 'monitor' && (
          <motion.div
            key="monitor"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {monitoredDomains.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-lg">
                <Eye className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No domains being monitored</p>
                <p className="text-gray-600 text-xs">Scan a domain to start monitoring</p>
              </div>
            ) : (
              <div className="space-y-2">
                {monitoredDomains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="bg-gray-900/30 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{domain.domain}</p>
                          <p className="text-gray-500 text-[10px]">
                            Added {new Date(domain.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setTargetDomain(domain.domain); setActiveTab('scan'); }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          title="Rescan"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeDomain(domain.domain)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <p className="text-lg font-bold text-white">{domain.assetsCount}</p>
                        <p className="text-[9px] text-gray-500">Assets</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <p className={`text-lg font-bold ${domain.riskScore > 50 ? 'text-red-500' : domain.riskScore > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {domain.riskScore}
                        </p>
                        <p className="text-[9px] text-gray-500">Risk Score</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <p className="text-lg font-bold text-orange-500">{domain.alerts}</p>
                        <p className="text-[9px] text-gray-500">Alerts</p>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2 text-center">
                        <p className="text-[10px] text-gray-400">
                          {domain.lastScanned ? new Date(domain.lastScanned).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-[9px] text-gray-500">Last Scan</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-lg">
                <Clock className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No scan history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="bg-gray-900/30 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        scan.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {scan.status === 'completed' 
                          ? <CheckCircle className="w-5 h-5 text-green-500" />
                          : <XCircle className="w-5 h-5 text-red-500" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-medium">{scan.domain}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                          <span>{new Date(scan.timestamp).toLocaleString()}</span>
                          <span>{scan.assetsFound} assets</span>
                          {scan.risks?.length > 0 && (
                            <span className="text-orange-500">{scan.risks.length} risks</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setTargetDomain(scan.domain); setActiveTab('scan'); }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300"
                      >
                        Rescan →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

