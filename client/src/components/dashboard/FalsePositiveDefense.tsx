'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Check, X, Filter, Plus, Settings,
  TrendingDown, Eye, Trash2, ChevronRight, ChevronDown, Brain, Zap
} from 'lucide-react';
import {
  getFPRules, addFPRule, deleteFPRule, getDismissedFindings,
  getFPMetrics, getAlertFatigueReduction, calculateFPScore,
  DISMISSAL_REASONS, type FalsePositiveRule, type DismissedFinding,
  type DismissalReason, type FPMetrics
} from '@/lib/false-positive-engine';

export default function FalsePositiveDefense() {
  const [rules, setRules] = useState<FalsePositiveRule[]>([]);
  const [dismissed, setDismissed] = useState<DismissedFinding[]>([]);
  const [metrics, setMetrics] = useState<FPMetrics | null>(null);
  const [fatigueReduction, setFatigueReduction] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'dismissed'>('overview');
  const [showAddRule, setShowAddRule] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRules(getFPRules());
    setDismissed(getDismissedFindings());
    setMetrics(getFPMetrics());
    setFatigueReduction(getAlertFatigueReduction());
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Delete this suppression rule?')) {
      deleteFPRule(ruleId);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Shield className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">False Positive Defense</h2>
            <p className="text-sm text-gray-500">Reduce noise, increase signal</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Alert fatigue metric */}
      <div className="rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">Alert Fatigue Reduction</span>
            </div>
            <div className="text-4xl font-bold text-white">{fatigueReduction}%</div>
            <div className="text-sm text-gray-500 mt-1">
              Less noise compared to standard scanning
            </div>
          </div>
          <div className="w-24 h-24 relative">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#374151"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#22C55E"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${fatigueReduction * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Dismissed" value={metrics.totalDismissed} icon={X} color="gray" />
          <StatCard label="Auto-Suppressed" value={metrics.autoSuppressed} icon={Zap} color="blue" />
          <StatCard label="Manual Reviews" value={metrics.manuallyDismissed} icon={Eye} color="purple" />
          <StatCard label="Reinstated" value={metrics.reinstated} icon={Check} color="green" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900/50 rounded-lg border border-gray-800">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'rules', label: `Rules (${rules.length})` },
          { id: 'dismissed', label: `Dismissed (${dismissed.length})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {activeTab === 'overview' && metrics && (
          <OverviewTab metrics={metrics} />
        )}
        {activeTab === 'rules' && (
          <RulesTab rules={rules} onDelete={handleDeleteRule} />
        )}
        {activeTab === 'dismissed' && (
          <DismissedTab dismissed={dismissed} onRefresh={loadData} />
        )}
      </div>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddRule && (
          <AddRuleModal
            onClose={() => setShowAddRule(false)}
            onAdded={() => { loadData(); setShowAddRule(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// TAB COMPONENTS
// ==========================================

function OverviewTab({ metrics }: { metrics: FPMetrics }) {
  const reasonCounts = Object.entries(metrics.byReason)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 space-y-6">
      {/* By reason breakdown */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Dismissals by Reason</h3>
        {reasonCounts.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No dismissals yet. Findings will appear here as you review them.
          </div>
        ) : (
          <div className="space-y-2">
            {reasonCounts.map(([reason, count]) => {
              const info = DISMISSAL_REASONS[reason as DismissalReason];
              const percentage = Math.round((count / metrics.totalDismissed) * 100);
              return (
                <div key={reason} className="flex items-center gap-3">
                  <span className="text-lg">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{info.label}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-400 mb-2">🎯 Tips for reducing false positives</h4>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>• Create rules for known patterns in your tech stack</li>
          <li>• Use asset-specific rules for third-party integrations</li>
          <li>• Review dismissed findings monthly for accuracy</li>
          <li>• Enable ML scoring for automatic FP detection</li>
        </ul>
      </div>
    </div>
  );
}

function RulesTab({ rules, onDelete }: { rules: FalsePositiveRule[]; onDelete: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rules.length === 0) {
    return (
      <div className="p-8 text-center">
        <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No suppression rules</p>
        <p className="text-xs text-gray-600 mt-1">Create rules to automatically filter known false positives</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {rules.map((rule) => (
        <div key={rule.id}>
          <div
            className="p-4 flex items-center gap-4 hover:bg-gray-800/30 cursor-pointer"
            onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
          >
            <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{rule.name}</div>
              <div className="text-xs text-gray-500">{rule.description || 'No description'}</div>
            </div>
            <div className="text-xs text-gray-600">
              {rule.matchCount} matches
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              rule.action === 'suppress' ? 'bg-red-500/20 text-red-400' :
              rule.action === 'downgrade' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {rule.action}
            </span>
            {expandedId === rule.id ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </div>

          <AnimatePresence>
            {expandedId === rule.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pl-10 space-y-2 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">Type:</span>
                    <span className="text-gray-400">{rule.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">Condition:</span>
                    <code className="text-orange-400 bg-gray-800 px-2 py-0.5 rounded">
                      {rule.condition.field} {rule.condition.operator} "{rule.condition.value}"
                    </code>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-400">{new Date(rule.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(rule.id); }}
                      className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function DismissedTab({ dismissed, onRefresh }: { dismissed: DismissedFinding[]; onRefresh: () => void }) {
  if (dismissed.length === 0) {
    return (
      <div className="p-8 text-center">
        <Check className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500">No dismissed findings</p>
        <p className="text-xs text-gray-600 mt-1">Dismissed findings will appear here for review</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {dismissed.slice(0, 20).map((item) => {
        const reasonInfo = DISMISSAL_REASONS[item.reason];
        return (
          <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
            <span className="text-lg">{reasonInfo.icon}</span>
            <div className="flex-1">
              <div className="text-sm text-white">{item.findingId}</div>
              <div className="text-xs text-gray-500">
                {reasonInfo.label} • {new Date(item.dismissedAt).toLocaleDateString()}
              </div>
              {item.notes && (
                <div className="text-xs text-gray-600 mt-1">Note: {item.notes}</div>
              )}
            </div>
            {item.reviewRequired && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px]">
                Review needed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-500/10 text-gray-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function AddRuleModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('category');
  const [operator, setOperator] = useState<'equals' | 'contains'>('contains');
  const [value, setValue] = useState('');
  const [action, setAction] = useState<'suppress' | 'downgrade' | 'flag_review'>('suppress');

  const handleSubmit = () => {
    if (!name || !value) return;

    addFPRule({
      organizationId: 'current',
      name,
      description,
      type: 'pattern_match',
      scope: {},
      condition: { field, operator, value },
      action,
      enabled: true,
      createdBy: 'current_user',
    });

    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Add Suppression Rule</h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Suppress CDN headers"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this rule exists"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Field</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="category">Category</option>
                <option value="name">Name</option>
                <option value="url">URL</option>
                <option value="severity">Severity</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Operator</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as 'equals' | 'contains')}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="matches">matches</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="cdn."
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'suppress', label: 'Suppress', color: 'red' },
                { value: 'downgrade', label: 'Downgrade', color: 'yellow' },
                { value: 'flag_review', label: 'Flag for Review', color: 'blue' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value as typeof action)}
                  className={`p-2 rounded-lg border text-xs font-medium ${
                    action === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-500/10 text-${opt.color}-400`
                      : 'border-gray-800 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !value}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500 disabled:opacity-50"
          >
            Add Rule
          </button>
        </div>
      </motion.div>
    </div>
  );
}

