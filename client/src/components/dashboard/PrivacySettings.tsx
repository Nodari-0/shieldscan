'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Eye, EyeOff, Trash2, Download, Clock,
  AlertTriangle, Check, ChevronDown, ChevronUp, X, Info
} from 'lucide-react';
import {
  getPrivacySettings, savePrivacySettings, exportUserData,
  deleteAllUserData, cleanupExpiredData, type PrivacySettings as PrivacySettingsType
} from '@/lib/privacy';

interface PrivacySettingsProps {
  onClose?: () => void;
}

export default function PrivacySettingsPanel({ onClose }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('retention');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; types: string[] } | null>(null);

  useEffect(() => {
    setSettings(getPrivacySettings());
  }, []);

  const handleSave = (updates: Partial<PrivacySettingsType>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    savePrivacySettings(updates);
  };

  const handleRetentionChange = (key: keyof PrivacySettingsType['dataRetention'], value: number | boolean) => {
    if (!settings) return;
    const newRetention = { ...settings.dataRetention, [key]: value };
    handleSave({ dataRetention: newRetention });
  };

  const handleRedactionChange = (key: keyof PrivacySettingsType['redaction'], value: boolean) => {
    if (!settings) return;
    const newRedaction = { ...settings.redaction, [key]: value };
    handleSave({ redaction: newRedaction });
  };

  const handleConsentChange = (key: keyof PrivacySettingsType['consent'], value: boolean) => {
    if (!settings) return;
    const newConsent = { ...settings.consent, [key]: value };
    handleSave({ consent: newConsent });
  };

  const handleExportData = () => {
    const data = exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shieldscan-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = () => {
    const result = deleteAllUserData();
    setDeleteResult({
      success: result.success,
      message: result.success 
        ? `Successfully deleted ${result.keysDeleted.length} data items`
        : 'Failed to delete some data',
    });
    setShowDeleteConfirm(false);
    // Reset settings to defaults after delete
    setTimeout(() => {
      setSettings(getPrivacySettings());
    }, 1000);
  };

  const handleCleanup = () => {
    const result = cleanupExpiredData();
    setCleanupResult(result);
    setTimeout(() => setCleanupResult(null), 5000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!settings) {
    return <div className="p-4 text-center text-gray-500">Loading privacy settings...</div>;
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Privacy Settings</h3>
              <p className="text-xs text-gray-500">Control your data and privacy preferences</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* GDPR Mode Badge */}
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Lock className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">GDPR Mode Active</span>
          <span className="text-xs text-gray-500 ml-auto">EU data protection compliant</span>
        </div>
      </div>

      {/* Results notifications */}
      <AnimatePresence>
        {deleteResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-3 ${deleteResult.success ? 'bg-green-500/10' : 'bg-red-500/10'} border-b border-gray-800`}
          >
            <div className={`flex items-center gap-2 text-sm ${deleteResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {deleteResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {deleteResult.message}
            </div>
          </motion.div>
        )}
        {cleanupResult && cleanupResult.deleted > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-blue-500/10 border-b border-gray-800"
          >
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Check className="w-4 h-4" />
              Cleaned up {cleanupResult.deleted} expired item(s)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sections */}
      <div className="divide-y divide-gray-800">
        {/* Data Retention Section */}
        <div>
          <button
            onClick={() => toggleSection('retention')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Data Retention</span>
            </div>
            {expandedSection === 'retention' ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'retention' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-xs text-gray-400">Auto-delete expired data</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dataRetention.autoDeleteOnExpiry}
                        onChange={(e) => handleRetentionChange('autoDeleteOnExpiry', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Scan History (days)</label>
                      <select
                        value={settings.dataRetention.scanHistoryDays}
                        onChange={(e) => handleRetentionChange('scanHistoryDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                      >
                        <option value="0">No retention</option>
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Evidence Data (days)</label>
                      <select
                        value={settings.dataRetention.evidenceDays}
                        onChange={(e) => handleRetentionChange('evidenceDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                      >
                        <option value="0">No retention</option>
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCleanup}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg hover:bg-gray-700"
                  >
                    Run cleanup now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Redaction Section */}
        <div>
          <button
            onClick={() => toggleSection('redaction')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30"
          >
            <div className="flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Data Redaction</span>
            </div>
            {expandedSection === 'redaction' ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'redaction' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-gray-500 mb-3">
                    Automatically redact sensitive data in scan reports and evidence
                  </p>

                  {[
                    { key: 'redactPasswords', label: 'Passwords & secrets' },
                    { key: 'redactApiKeys', label: 'API keys' },
                    { key: 'redactTokens', label: 'Auth tokens (JWT, Bearer)' },
                    { key: 'redactCookies', label: 'Session cookies' },
                    { key: 'redactEmails', label: 'Email addresses' },
                    { key: 'redactIPs', label: 'IP addresses' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                      <span className="text-xs text-gray-400">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.redaction[key as keyof typeof settings.redaction] as boolean}
                          onChange={(e) => handleRedactionChange(key as keyof PrivacySettingsType['redaction'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Consent Section */}
        <div>
          <button
            onClick={() => toggleSection('consent')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30"
          >
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Consent Preferences</span>
            </div>
            {expandedSection === 'consent' ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'consent' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {[
                    { key: 'scanDataStorageConsent', label: 'Store scan data locally', required: true },
                    { key: 'analyticsConsent', label: 'Anonymous usage analytics' },
                    { key: 'thirdPartyIntegrationConsent', label: 'Third-party integrations' },
                    { key: 'marketingConsent', label: 'Product updates & news' },
                  ].map(({ key, label, required }) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{label}</span>
                        {required && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Required</span>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.consent[key as keyof typeof settings.consent] as boolean}
                          onChange={(e) => !required && handleConsentChange(key as keyof PrivacySettingsType['consent'], e.target.checked)}
                          disabled={required}
                          className="sr-only peer"
                        />
                        <div className={`w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 ${required ? 'opacity-50' : ''}`}></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-900/30 border-t border-gray-800 space-y-2">
        <button
          onClick={handleExportData}
          className="w-full py-2 px-4 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export My Data (GDPR)
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2 px-4 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete All My Data
        </button>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="mx-4 p-6 bg-gray-900 border border-gray-800 rounded-xl max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete All Data?</h3>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                This will permanently delete all your scan history, authentication profiles, 
                and settings. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

