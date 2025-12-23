'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code, Play, Loader2, CheckCircle, XCircle, AlertTriangle,
  Key, Lock, Shield, Server, Zap, FileJson, Globe, Clock,
  ChevronDown, ChevronRight, Copy, Check, AlertOctagon, Info,
  History, Trash2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseOpenAPISpec, parseOpenAPISpecFromString } from '@/lib/scanners/openapiParser';

interface APIEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  authType?: 'none' | 'bearer' | 'api-key' | 'basic';
  authValue?: string;
}

interface APISecurityCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'warning' | 'info' | 'pending';
  description: string;
  details?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface APIScanResult {
  id: string;
  endpoint: string;
  method: string;
  timestamp: string;
  score: number;
  responseTime: number;
  statusCode: number;
  checks: APISecurityCheck[];
  headers: Record<string, string>;
  vulnerabilities: {
    name: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const AUTH_TYPES = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
];

const STORAGE_KEY = 'shieldscan_api_scans';

export default function APISecurityScanner() {
  const [endpoint, setEndpoint] = useState<APIEndpoint>({
    url: '',
    method: 'GET',
    authType: 'none',
  });
  const [customHeaders, setCustomHeaders] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<APIScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<APIScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'results' | 'history'>('config');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['authentication', 'security-headers', 'vulnerabilities']);
  const [copied, setCopied] = useState(false);
  const [openApiInput, setOpenApiInput] = useState('');
  const [importedEndpoints, setImportedEndpoints] = useState<APIEndpoint[]>([]);

  // Load scan history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScanHistory(parsed);
      } catch {
        console.error('Failed to parse API scan history');
      }
    }
  }, []);

  // Save scan history to localStorage
  const saveScanHistory = (scans: APIScanResult[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    setScanHistory(scans);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const importOpenApi = async () => {
    const input = openApiInput.trim();
    if (!input) {
      toast.error('Paste OpenAPI JSON or a URL');
      return;
    }

    try {
      let spec: any;
      if (input.startsWith('http')) {
        const res = await fetch(input);
        spec = await res.json();
      } else {
        // Try JSON, then YAML
        try {
          spec = JSON.parse(input);
        } catch {
          const parsed = await parseOpenAPISpecFromString(input);
          if (parsed.length) {
            const mapped: APIEndpoint[] = parsed.map((p) => ({
              url: p.url,
              method: p.method,
              headers: p.headers,
              body: p.body,
              authType: 'none',
            }));
            setImportedEndpoints(mapped);
            setEndpoint(mapped[0]);
            toast.success(`Imported ${mapped.length} endpoints`);
            return;
          }
          throw new Error('Failed to parse spec');
        }
      }

      const parsed = parseOpenAPISpec(spec);
      if (!parsed.length) {
        toast.error('No endpoints found in spec');
        return;
      }

      const mapped: APIEndpoint[] = parsed.map((p) => ({
        url: p.url,
        method: p.method,
        headers: p.headers,
        body: p.body,
        authType: 'none',
      }));

      setImportedEndpoints(mapped);
      setEndpoint(mapped[0]);
      toast.success(`Imported ${mapped.length} endpoints`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse OpenAPI spec');
    }
  };

  const runAPIScan = async () => {
    if (!endpoint.url) {
      toast.error('Please enter an API endpoint URL');
      return;
    }

    // Validate URL
    try {
      new URL(endpoint.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      // Parse custom headers
      let headers: Record<string, string> = {};
      if (customHeaders.trim()) {
        try {
          headers = JSON.parse(customHeaders);
        } catch {
          // Try parsing as key: value format
          customHeaders.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
              headers[key.trim()] = valueParts.join(':').trim();
            }
          });
        }
      }

      // Add auth headers
      if (endpoint.authType === 'bearer' && endpoint.authValue) {
        headers['Authorization'] = `Bearer ${endpoint.authValue}`;
      } else if (endpoint.authType === 'api-key' && endpoint.authValue) {
        headers['X-API-Key'] = endpoint.authValue;
      } else if (endpoint.authType === 'basic' && endpoint.authValue) {
        headers['Authorization'] = `Basic ${btoa(endpoint.authValue)}`;
      }

      const startTime = Date.now();

      // Build endpoints payload (single or imported batch)
      const baseHeaders = headers;
      const endpointsPayload = (importedEndpoints.length ? importedEndpoints : [endpoint]).map((ep) => ({
        url: ep.url,
        method: ep.method,
        headers: { ...(ep.headers || {}), ...baseHeaders },
        body: ep.body,
        authType: ep.authType,
        authValue: ep.authValue,
      }));

      // Make the API request to the new API scanning route
      const response = await fetch('/api/scan/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: endpointsPayload,
        }),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!data.success || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error(data.error || 'API scan failed');
      }

      const now = Date.now();
      const newScans: APIScanResult[] = (data.data as APIScanResult[]).map((result, idx) => ({
        ...result,
        id: `api-${now}-${idx}`,
        responseTime: result.responseTime ?? responseTime,
        timestamp: result.timestamp || new Date().toISOString(),
      }));

      setScanResult(newScans[0]);
      
      // Add all to history (keep last 20)
      const updatedHistory = [...newScans, ...scanHistory].slice(0, 20);
      saveScanHistory(updatedHistory);
      
      setActiveTab('results');
      toast.success('API scan completed!');
    } catch (error: any) {
      console.error('API scan error:', error);
      toast.error(error.message || 'Failed to scan API');
    } finally {
      setIsScanning(false);
    }
  };

  const loadScanFromHistory = (scan: APIScanResult) => {
    setScanResult(scan);
    setActiveTab('results');
  };

  const deleteScanFromHistory = (scanId: string) => {
    const updated = scanHistory.filter(s => s.id !== scanId);
    saveScanHistory(updated);
    if (scanResult?.id === scanId) {
      setScanResult(null);
    }
    toast.success('Scan removed from history');
  };

  const clearHistory = () => {
    saveScanHistory([]);
    setScanResult(null);
    toast.success('History cleared');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const copyAsCode = () => {
    const curlCommand = `curl -X ${endpoint.method} "${endpoint.url}" ${
      endpoint.authType === 'bearer' && endpoint.authValue 
        ? `-H "Authorization: Bearer ${endpoint.authValue}"` 
        : ''
    } ${
      requestBody ? `-d '${requestBody}'` : ''
    }`.trim();
    
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('cURL command copied!');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500';
      case 'POST': return 'text-blue-500';
      case 'PUT': return 'text-yellow-500';
      case 'DELETE': return 'text-red-500';
      case 'PATCH': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const groupedChecks = scanResult?.checks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, APISecurityCheck[]>) || {};

  return (
    <div className="space-y-4">
        {/* OpenAPI Import */}
        <div className="border border-gray-800 rounded-lg p-3 bg-black/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <FileJson className="w-4 h-4" />
              Import OpenAPI / Swagger
            </div>
            <button
              onClick={importOpenApi}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Import
            </button>
          </div>
          <textarea
            value={openApiInput}
            onChange={(e) => setOpenApiInput(e.target.value)}
            placeholder="Paste OpenAPI JSON or a URL to a JSON spec"
            className="w-full bg-gray-900/70 border border-gray-800 rounded p-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            rows={4}
          />
          {importedEndpoints.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Imported {importedEndpoints.length} endpoints. First endpoint selected.
            </div>
          )}
        </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">API Security Scanner</h2>
            <p className="text-gray-500 text-xs">Test your API endpoints for vulnerabilities</p>
          </div>
        </div>
        {scanHistory.length > 0 && (
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded">
            {scanHistory.length} recent scan{scanHistory.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-2 text-xs font-medium transition-colors relative ${
            activeTab === 'config' ? 'text-blue-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          Configuration
          {activeTab === 'config' && (
            <motion.div layoutId="apiTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-3 py-2 text-xs font-medium transition-colors relative ${
            activeTab === 'results' ? 'text-blue-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          Results
          {scanResult && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${getScoreColor(scanResult.score)} bg-current/10`}>
              {scanResult.score}
            </span>
          )}
          {activeTab === 'results' && (
            <motion.div layoutId="apiTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 text-xs font-medium transition-colors relative flex items-center gap-1 ${
            activeTab === 'history' ? 'text-blue-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          <History className="w-3 h-3" />
          History
          {scanHistory.length > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[9px] text-gray-400">
              {scanHistory.length}
            </span>
          )}
          {activeTab === 'history' && (
            <motion.div layoutId="apiTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* URL Input */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
              <label className="text-xs text-gray-500 mb-1 block">Endpoint URL</label>
              <div className="flex gap-2">
                <select
                  value={endpoint.method}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, method: e.target.value as any }))}
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  {HTTP_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="url"
                  value={endpoint.url}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/v1/users"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Examples */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-gray-500">Try:</span>
              {[
                'https://jsonplaceholder.typicode.com/posts/1',
                'https://httpbin.org/get',
                'https://reqres.in/api/users/1',
              ].map(url => (
                <button
                  key={url}
                  onClick={() => setEndpoint(prev => ({ ...prev, url }))}
                  className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {new URL(url).hostname}
                </button>
              ))}
            </div>

            {/* Authentication */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
              <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
                <Key className="w-3 h-3" /> Authentication
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {AUTH_TYPES.map(auth => (
                  <button
                    key={auth.value}
                    onClick={() => setEndpoint(prev => ({ ...prev, authType: auth.value as any }))}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      endpoint.authType === auth.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {auth.label}
                  </button>
                ))}
              </div>
              {endpoint.authType !== 'none' && (
                <input
                  type="password"
                  value={endpoint.authValue || ''}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, authValue: e.target.value }))}
                  placeholder={
                    endpoint.authType === 'bearer' ? 'Enter Bearer token...' :
                    endpoint.authType === 'api-key' ? 'Enter API key...' :
                    'username:password'
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            {/* Headers */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <FileJson className="w-3 h-3" /> Custom Headers (JSON or key: value)
              </label>
              <textarea
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                placeholder={'{\n  "Content-Type": "application/json"\n}'}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Request Body */}
            {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
              <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <Code className="w-3 h-3" /> Request Body (JSON)
                </label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {/* Security Checks Info */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
              <h3 className="text-xs font-medium text-white mb-2 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" /> Security Checks
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {['Authentication', 'Authorization', 'Rate Limiting', 'Input Validation', 'Security Headers', 'Data Exposure', 'CORS', 'Error Handling'].map(check => (
                  <div key={check} className="flex items-center gap-1 text-gray-400">
                    <CheckCircle className="w-3 h-3 text-green-500" /> {check}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={runAPIScan}
                disabled={isScanning || !endpoint.url}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isScanning || !endpoint.url
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start API Scan
                  </>
                )}
              </button>
              <button
                onClick={copyAsCode}
                className="px-3 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                title="Copy as cURL"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {!scanResult ? (
              <div className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-lg">
                <Code className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No scan results yet</p>
                <p className="text-gray-600 text-xs">Configure and run a scan to see results</p>
              </div>
            ) : (
              <>
                {/* Score Overview */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-lg ${getScoreBg(scanResult.score)} flex items-center justify-center`}>
                        <span className={`text-2xl font-bold ${getScoreColor(scanResult.score)}`}>
                          {scanResult.score}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">API Security Score</p>
                        <p className="text-gray-500 text-xs font-mono truncate max-w-[200px]">{scanResult.endpoint}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {scanResult.responseTime}ms
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                        scanResult.statusCode >= 200 && scanResult.statusCode < 300 
                          ? 'bg-green-500/20 text-green-400'
                          : scanResult.statusCode >= 400
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {scanResult.statusCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <p className="text-green-500 text-lg font-bold">
                        {scanResult.checks.filter(c => c.status === 'passed').length}
                      </p>
                      <p className="text-[10px] text-gray-500">Passed</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <p className="text-yellow-500 text-lg font-bold">
                        {scanResult.checks.filter(c => c.status === 'warning').length}
                      </p>
                      <p className="text-[10px] text-gray-500">Warnings</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <p className="text-red-500 text-lg font-bold">
                        {scanResult.checks.filter(c => c.status === 'failed').length}
                      </p>
                      <p className="text-[10px] text-gray-500">Failed</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <p className="text-gray-400 text-lg font-bold">
                        {scanResult.vulnerabilities.length}
                      </p>
                      <p className="text-[10px] text-gray-500">Vulns</p>
                    </div>
                  </div>
                </div>

                {/* Vulnerabilities */}
                {scanResult.vulnerabilities.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <h3 className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4" />
                      Vulnerabilities ({scanResult.vulnerabilities.length})
                    </h3>
                    <div className="space-y-2">
                      {scanResult.vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="bg-gray-900/50 rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getSeverityColor(vuln.severity)}`}>
                              {vuln.severity.toUpperCase()}
                            </span>
                            <span className="text-white text-xs font-medium">{vuln.name}</span>
                          </div>
                          <p className="text-gray-400 text-[10px] mb-1">{vuln.description}</p>
                          <p className="text-blue-400 text-[10px]">
                            <strong>Fix:</strong> {vuln.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Checks by Category */}
                <div className="space-y-2">
                  {Object.entries(groupedChecks).map(([category, checks]) => (
                    <div key={category} className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium capitalize">
                            {category.replace(/-/g, ' ')}
                          </span>
                          <span className="text-gray-500 text-[10px]">({checks.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 text-[10px]">
                            {checks.filter(c => c.status === 'passed').length}✓
                          </span>
                          <span className="text-red-500 text-[10px]">
                            {checks.filter(c => c.status === 'failed').length}✗
                          </span>
                          {expandedCategories.includes(category) 
                            ? <ChevronDown className="w-4 h-4 text-gray-500" />
                            : <ChevronRight className="w-4 h-4 text-gray-500" />
                          }
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedCategories.includes(category) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-800"
                          >
                            <div className="p-2 space-y-1">
                              {checks.map((check) => (
                                <div
                                  key={check.id}
                                  className={`flex items-start gap-2 p-2 rounded ${
                                    check.status === 'failed' ? 'bg-red-500/5' :
                                    check.status === 'warning' ? 'bg-yellow-500/5' :
                                    'bg-gray-800/30'
                                  }`}
                                >
                                  {getStatusIcon(check.status)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs">{check.name}</p>
                                    <p className="text-gray-500 text-[10px]">{check.description}</p>
                                    {check.details && (
                                      <p className="text-gray-600 text-[10px] mt-0.5 font-mono truncate">{check.details}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Response Headers */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
                  <h3 className="text-white text-xs font-medium mb-2 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-gray-500" /> Response Headers
                  </h3>
                  <div className="bg-gray-800/50 rounded p-2 max-h-32 overflow-y-auto scrollbar-hide">
                    <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">
                      {Object.entries(scanResult.headers || {}).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-blue-400">{key}:</span> {value}
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

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
                <History className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No scan history yet</p>
                <p className="text-gray-600 text-xs">Your API scans will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Recent API scans</p>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className="bg-gray-900/30 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getScoreBg(scan.score)} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-sm font-bold ${getScoreColor(scan.score)}`}>{scan.score}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold ${getMethodColor(scan.method)}`}>
                              {scan.method}
                            </span>
                            <span className="text-white text-xs font-mono truncate">{scan.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(scan.timestamp).toLocaleString()}
                            </span>
                            <span>{scan.responseTime}ms</span>
                            <span className="text-green-500">{scan.checks.filter(c => c.status === 'passed').length}✓</span>
                            <span className="text-red-500">{scan.checks.filter(c => c.status === 'failed').length}✗</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => loadScanFromHistory(scan)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteScanFromHistory(scan.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
