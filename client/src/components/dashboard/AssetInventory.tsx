'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Server, Search, Plus, Filter, MoreVertical, Edit3, Trash2,
  Shield, AlertTriangle, Check, Clock, ExternalLink, Tag, ChevronDown
} from 'lucide-react';
import { 
  getOrganization, addAsset, updateAsset, removeAsset, initDemoOrganization,
  type Asset, type AssetType 
} from '@/lib/organization';

export default function AssetInventory() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{
    type?: AssetType;
    environment?: string;
    criticality?: string;
  }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const org = getOrganization() || initDemoOrganization();
    setAssets(org.assets);
  }, []);

  const refreshAssets = () => {
    const org = getOrganization();
    if (org) setAssets(org.assets);
  };

  const filteredAssets = assets.filter(asset => {
    if (search && !asset.url.toLowerCase().includes(search.toLowerCase()) && 
        !asset.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter.type && asset.type !== filter.type) return false;
    if (filter.environment && asset.environment !== filter.environment) return false;
    if (filter.criticality && asset.criticality !== filter.criticality) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this asset?')) {
      removeAsset(id);
      refreshAssets();
    }
  };

  // Group by criticality for summary
  const criticalCount = assets.filter(a => a.criticality === 'critical').length;
  const highCount = assets.filter(a => a.criticality === 'high').length;
  const needsAttention = assets.filter(a => !a.lastScanAt || 
    new Date().getTime() - new Date(a.lastScanAt).getTime() > 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Asset Inventory</h2>
            <p className="text-sm text-gray-500">{assets.length} assets tracked</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-500"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Globe className="w-3 h-3" />
            Total Assets
          </div>
          <div className="text-2xl font-bold text-white">{assets.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
            <AlertTriangle className="w-3 h-3" />
            Critical
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
            <Shield className="w-3 h-3" />
            High Priority
          </div>
          <div className="text-2xl font-bold text-orange-400">{highCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
            <Clock className="w-3 h-3" />
            Needs Scan
          </div>
          <div className="text-2xl font-bold text-yellow-400">{needsAttention}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-700"
          />
        </div>

        <FilterDropdown
          label="Type"
          value={filter.type}
          options={[
            { value: '', label: 'All Types' },
            { value: 'website', label: 'Website' },
            { value: 'api', label: 'API' },
            { value: 'webapp', label: 'Web App' },
            { value: 'mobile_api', label: 'Mobile API' },
            { value: 'internal', label: 'Internal' },
          ]}
          onChange={(value) => setFilter({ ...filter, type: value as AssetType })}
        />

        <FilterDropdown
          label="Environment"
          value={filter.environment}
          options={[
            { value: '', label: 'All Environments' },
            { value: 'production', label: 'Production' },
            { value: 'staging', label: 'Staging' },
            { value: 'development', label: 'Development' },
          ]}
          onChange={(value) => setFilter({ ...filter, environment: value })}
        />

        <FilterDropdown
          label="Criticality"
          value={filter.criticality}
          options={[
            { value: '', label: 'All Levels' },
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          onChange={(value) => setFilter({ ...filter, criticality: value })}
        />
      </div>

      {/* Asset list */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No assets found</p>
            <p className="text-xs text-gray-600 mt-1">
              {search || Object.keys(filter).length > 0 
                ? 'Try adjusting your filters' 
                : 'Add your first asset to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredAssets.map((asset) => (
              <AssetRow 
                key={asset.id} 
                asset={asset}
                onEdit={() => setEditingAsset(asset)}
                onDelete={() => handleDelete(asset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingAsset) && (
          <AssetModal
            asset={editingAsset || undefined}
            onClose={() => { setShowAddModal(false); setEditingAsset(null); }}
            onSaved={refreshAssets}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// ASSET ROW
// ==========================================

function AssetRow({ 
  asset, 
  onEdit, 
  onDelete 
}: { 
  asset: Asset;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const criticalityConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    low: { color: 'text-green-400', bg: 'bg-green-500/10' },
  };

  const envConfig = {
    production: { color: 'text-red-400', label: 'PROD' },
    staging: { color: 'text-yellow-400', label: 'STG' },
    development: { color: 'text-blue-400', label: 'DEV' },
  };

  const typeIcons: Record<AssetType, string> = {
    website: '🌐',
    api: '⚡',
    webapp: '💻',
    mobile_api: '📱',
    internal: '🔒',
  };

  const config = criticalityConfig[asset.criticality];
  const env = envConfig[asset.environment];
  const needsScan = !asset.lastScanAt || 
    new Date().getTime() - new Date(asset.lastScanAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-gray-800/30 group">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-xl">
        {typeIcons[asset.type]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{asset.name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${env.color} bg-gray-900`}>
            {env.label}
          </span>
          {needsScan && (
            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px]">
              Needs Scan
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <span className="truncate">{asset.url}</span>
        </div>
        {asset.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]">
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px] text-gray-600">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Criticality */}
      <div className={`px-2 py-1 rounded ${config.bg} ${config.color} text-[10px] font-medium uppercase`}>
        {asset.criticality}
      </div>

      {/* Score */}
      {asset.lastScore !== undefined && (
        <div className={`text-sm font-medium ${
          asset.lastScore >= 80 ? 'text-green-400' :
          asset.lastScore >= 60 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {asset.lastScore}
        </div>
      )}

      {/* Last scan */}
      <div className="text-xs text-gray-500 w-24 text-right">
        {asset.lastScanAt 
          ? new Date(asset.lastScanAt).toLocaleDateString()
          : 'Never scanned'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-500 hover:text-white rounded"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-white rounded">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// FILTER DROPDOWN
// ==========================================

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400 hover:border-gray-700"
      >
        <Filter className="w-3 h-3" />
        {selected?.label || label}
        <ChevronDown className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 ${
                    value === option.value ? 'text-cyan-400' : 'text-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// ASSET MODAL
// ==========================================

function AssetModal({
  asset,
  onClose,
  onSaved,
}: {
  asset?: Asset;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState(asset?.url || '');
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<AssetType>(asset?.type || 'website');
  const [environment, setEnvironment] = useState<Asset['environment']>(asset?.environment || 'production');
  const [criticality, setCriticality] = useState<Asset['criticality']>(asset?.criticality || 'medium');
  const [tags, setTags] = useState<string>(asset?.tags.join(', ') || '');

  const handleSave = () => {
    if (!url || !name) return;

    const assetData = {
      url,
      name,
      type,
      environment,
      criticality,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdBy: 'current_user',
    };

    if (asset) {
      updateAsset(asset.id, assetData);
    } else {
      addAsset(assetData);
    }

    onSaved();
    onClose();
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
          <h3 className="text-lg font-semibold text-white">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Website"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="website">Website</option>
                <option value="api">API</option>
                <option value="webapp">Web App</option>
                <option value="mobile_api">Mobile API</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as Asset['environment'])}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as Asset['criticality'])}
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="public, customer-facing, api-v2"
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!url || !name}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {asset ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

