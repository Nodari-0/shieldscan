'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, RefreshCw, ChevronDown, ChevronUp, History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import type { ScanDiff, ScanChange } from '@/types/incremental-scan';

interface IncrementalScanBadgeProps {
  scanMode: 'full' | 'incremental' | 'quick';
  reason?: string;
  timeSaved?: number;
  previousScanDate?: string;
  diff?: ScanDiff;
  compact?: boolean;
}

export default function IncrementalScanBadge({
  scanMode,
  reason,
  timeSaved,
  previousScanDate,
  diff,
  compact = false,
}: IncrementalScanBadgeProps) {
  const [showChanges, setShowChanges] = useState(false);

  const modeConfig = {
    quick: {
      label: 'Quick Scan',
      icon: <Zap className="w-3.5 h-3.5" />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      description: 'No changes detected - verified against cached data',
    },
    incremental: {
      label: 'Incremental',
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      description: 'Changes detected - scanning modified areas only',
    },
    full: {
      label: 'Full Scan',
      icon: <Clock className="w-3.5 h-3.5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      description: 'Complete security assessment',
    },
  };

  const config = modeConfig[scanMode];

  const getChangeIcon = (change: ScanChange) => {
    switch (change.changeType) {
      case 'added':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'removed':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      case 'modified':
        return <Minus className="w-3 h-3 text-amber-400" />;
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} border ${config.border}`}>
        <span className={config.color}>{config.icon}</span>
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        {timeSaved && timeSaved > 0 && (
          <span className="text-[10px] text-gray-500">-{Math.round(timeSaved / 1000)}s</span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg ${config.bg} border ${config.border} overflow-hidden`}>
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <div className={`text-sm font-medium ${config.color}`}>{config.label}</div>
              <div className="text-[10px] text-gray-500">{config.description}</div>
            </div>
          </div>

          {/* Time saved */}
          {timeSaved && timeSaved > 0 && (
            <div className="text-right">
              <div className="text-xs text-green-400 font-medium">
                ~{Math.round(timeSaved / 1000)}s saved
              </div>
              <div className="text-[10px] text-gray-500">vs full scan</div>
            </div>
          )}
        </div>

        {/* Previous scan info */}
        {previousScanDate && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <History className="w-3 h-3" />
            <span>Compared to scan from {new Date(previousScanDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Reason */}
        {reason && (
          <div className="mt-2 text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded">
            {reason}
          </div>
        )}
      </div>

      {/* Changes toggle */}
      {diff && diff.changes.length > 0 && (
        <>
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="w-full px-3 py-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 hover:bg-gray-800/50 transition-colors"
          >
            <span>{diff.changes.length} change{diff.changes.length !== 1 ? 's' : ''} detected</span>
            {showChanges ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showChanges && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="p-2 bg-gray-900/50 rounded">
                      <div className="text-sm font-medium text-green-400">+{diff.summary.newEndpoints}</div>
                      <div className="text-[10px] text-gray-500">New</div>
                    </div>
                    <div className="p-2 bg-gray-900/50 rounded">
                      <div className="text-sm font-medium text-amber-400">{diff.summary.headerChanges}</div>
                      <div className="text-[10px] text-gray-500">Headers</div>
                    </div>
                    <div className="p-2 bg-gray-900/50 rounded">
                      <div className="text-sm font-medium text-red-400">-{diff.summary.removedEndpoints}</div>
                      <div className="text-[10px] text-gray-500">Removed</div>
                    </div>
                  </div>

                  {/* Change list */}
                  {diff.changes.slice(0, 10).map((change, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-gray-900/30 rounded text-xs"
                    >
                      {getChangeIcon(change)}
                      <div className="flex-1">
                        <div className="text-gray-300">{change.description}</div>
                        {change.oldValue && change.newValue && (
                          <div className="mt-1 text-[10px] text-gray-500">
                            <span className="text-red-400 line-through">{change.oldValue}</span>
                            {' → '}
                            <span className="text-green-400">{change.newValue}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        change.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        change.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        change.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        change.severity === 'low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {change.severity}
                      </span>
                    </div>
                  ))}

                  {diff.changes.length > 10 && (
                    <div className="text-center text-xs text-gray-500">
                      +{diff.changes.length - 10} more changes
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// Mini badge for scan history
export function IncrementalScanMini({ scanMode }: { scanMode: 'full' | 'incremental' | 'quick' }) {
  const config = {
    quick: { label: 'Q', color: 'text-green-400', bg: 'bg-green-500/20', title: 'Quick Scan' },
    incremental: { label: 'I', color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'Incremental Scan' },
    full: { label: 'F', color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'Full Scan' },
  };
  
  const c = config[scanMode];
  
  return (
    <span
      title={c.title}
      className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded ${c.bg} ${c.color}`}
    >
      {c.label}
    </span>
  );
}

