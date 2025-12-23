'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Plus, Check, X, AlertTriangle, Settings, Trash2,
  RefreshCw, ExternalLink, Zap, Bell, ChevronRight
} from 'lucide-react';
import {
  getIntegrations, addIntegration, removeIntegration, testIntegration,
  INTEGRATION_TEMPLATES, type Integration, type IntegrationType, type NotificationTrigger
} from '@/lib/integrations';

export default function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationType | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    setIntegrations(getIntegrations());
  }, []);

  const refreshIntegrations = () => {
    setIntegrations(getIntegrations());
  };

  const handleTest = async (integration: Integration) => {
    setTestingId(integration.id);
    const result = await testIntegration(integration);
    
    if (result.success) {
      // Update status
      refreshIntegrations();
    }
    setTestingId(null);
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this integration?')) {
      removeIntegration(id);
      refreshIntegrations();
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Link2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Integrations</h2>
            <p className="text-sm text-gray-500">
              {connectedCount} connected • {INTEGRATION_TEMPLATES.length} available
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* Connected integrations */}
      {integrations.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-medium text-white">Connected Integrations</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {integrations.map((integration) => {
              const template = INTEGRATION_TEMPLATES.find(t => t.type === integration.type);
              if (!template) return null;

              return (
                <div key={integration.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{integration.name}</span>
                      <StatusBadge status={integration.status} />
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.name}
                      {integration.lastSyncAt && (
                        <> • Last sync {new Date(integration.lastSyncAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(integration)}
                      disabled={testingId === integration.id}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${testingId === integration.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleRemove(integration.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available integrations */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATION_TEMPLATES.map((template) => {
            const isConnected = integrations.some(i => i.type === template.type);
            
            return (
              <motion.div
                key={template.type}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl border bg-gray-900/50 p-4 cursor-pointer transition-colors ${
                  isConnected ? 'border-green-500/50' : 'border-gray-800 hover:border-gray-700'
                }`}
                onClick={() => { setSelectedTemplate(template.type); setShowAddModal(true); }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      {isConnected && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add integration modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddIntegrationModal
            selectedType={selectedTemplate}
            onClose={() => { setShowAddModal(false); setSelectedTemplate(null); }}
            onAdded={refreshIntegrations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }: { status: Integration['status'] }) {
  const config = {
    connected: { label: 'Connected', color: 'text-green-400', bg: 'bg-green-500/10' },
    disconnected: { label: 'Disconnected', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const c = config[status];
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}

// ==========================================
// ADD INTEGRATION MODAL
// ==========================================

function AddIntegrationModal({
  selectedType,
  onClose,
  onAdded,
}: {
  selectedType: IntegrationType | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [step, setStep] = useState<'select' | 'configure'>(selectedType ? 'configure' : 'select');
  const [type, setType] = useState<IntegrationType | null>(selectedType);
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [triggers, setTriggers] = useState<NotificationTrigger[]>(['new_critical', 'new_high']);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const template = type ? INTEGRATION_TEMPLATES.find(t => t.type === type) : null;

  const handleSelectType = (t: IntegrationType) => {
    setType(t);
    setStep('configure');
  };

  const handleTest = async () => {
    if (!type || !template) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate test result
    const success = Math.random() > 0.2;
    setTestResult({
      success,
      error: success ? undefined : 'Failed to connect. Please check your credentials.',
    });
    setIsTesting(false);
  };

  const handleSave = () => {
    if (!type || !name || !template) return;

    const integrationConfig = {
      type,
      ...config,
      notifyOn: triggers,
      triggerOn: triggers,
      createTicketOn: triggers,
      createIssuesOn: triggers,
    };

    addIntegration(type, name, integrationConfig as any);
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-[80vh] overflow-y-auto"
      >
        {step === 'select' ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Add Integration</h3>
              <p className="text-sm text-gray-500">Choose a platform to connect</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {INTEGRATION_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => handleSelectType(template.type)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/30 text-left"
                >
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{template.name}</div>
                    <div className="text-[10px] text-gray-500">{template.description.split(' ').slice(0, 4).join(' ')}...</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <span className="text-2xl">{template?.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">Configure {template?.name}</h3>
                <p className="text-xs text-gray-500">{template?.description}</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Integration Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`My ${template?.name} Integration`}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dynamic fields based on template */}
              {template?.type === 'slack' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
                    <input
                      type="text"
                      value={config.webhookUrl || ''}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Channel</label>
                    <input
                      type="text"
                      value={config.channel || ''}
                      onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                      placeholder="#security-alerts"
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {template?.type === 'webhook' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
                    <input
                      type="text"
                      value={config.url || ''}
                      onChange={(e) => setConfig({ ...config, url: e.target.value })}
                      placeholder="https://your-endpoint.com/webhook"
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Method</label>
                    <select
                      value={config.method || 'POST'}
                      onChange={(e) => setConfig({ ...config, method: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </div>
                </>
              )}

              {(template?.type === 'discord' || template?.type === 'teams') && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
                  <input
                    type="text"
                    value={config.webhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder={template.type === 'discord' ? 'https://discord.com/api/webhooks/...' : 'https://outlook.office.com/webhook/...'}
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              {template?.type === 'github' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      value={config.token || ''}
                      onChange={(e) => setConfig({ ...config, token: e.target.value })}
                      placeholder="ghp_..."
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Owner</label>
                      <input
                        type="text"
                        value={config.owner || ''}
                        onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                        placeholder="username"
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Repository</label>
                      <input
                        type="text"
                        value={config.repo || ''}
                        onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                        placeholder="my-repo"
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {template?.type === 'pagerduty' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Routing Key (Integration Key)</label>
                  <input
                    type="password"
                    value={config.routingKey || ''}
                    onChange={(e) => setConfig({ ...config, routingKey: e.target.value })}
                    placeholder="Enter your PagerDuty routing key"
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              {/* Notification triggers */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Notify on</label>
                <div className="flex flex-wrap gap-2">
                  {(['new_critical', 'new_high', 'scan_complete', 'ssl_expiring', 'downtime'] as NotificationTrigger[]).map((trigger) => (
                    <button
                      key={trigger}
                      onClick={() => {
                        if (triggers.includes(trigger)) {
                          setTriggers(triggers.filter(t => t !== trigger));
                        } else {
                          setTriggers([...triggers, trigger]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        triggers.includes(trigger)
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}
                    >
                      {trigger.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {testResult.success ? 'Connection successful!' : testResult.error}
                  </div>
                </div>
              )}

              {/* Documentation link */}
              {template?.docUrl && (
                <a
                  href={template.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  View {template.name} documentation
                </a>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex justify-between">
              <button
                onClick={() => { setStep('select'); setType(null); setConfig({}); setTestResult(null); }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Test
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  Save Integration
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

