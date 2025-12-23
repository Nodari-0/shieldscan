'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, TrendingUp, TrendingDown, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Zap, Plus, History, RefreshCw
} from 'lucide-react';
import {
  getCreditUsage, getUsagePercentage, getDaysUntilReset,
  checkMonthlyReset, CREDIT_COSTS, CREDIT_PLANS,
  type CreditUsage, type CreditTransaction
} from '@/lib/credits';

interface CreditsUsageProps {
  compact?: boolean;
  onUpgrade?: () => void;
}

export default function CreditsUsagePanel({ compact = false, onUpgrade }: CreditsUsageProps) {
  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  useEffect(() => {
    // Check for monthly reset
    checkMonthlyReset();
    setUsage(getCreditUsage());
  }, []);

  if (!usage) {
    return null; // No credit tracking
  }

  const percentage = getUsagePercentage();
  const daysLeft = getDaysUntilReset();
  const plan = CREDIT_PLANS.find(p => p.id === usage.planId);
  const isUnlimited = usage.monthlyAllowance === -1;
  const isLow = percentage >= 80;
  const isWarning = percentage >= 90;

  // Compact view for header/sidebar
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
        <Coins className="w-4 h-4 text-yellow-500" />
        {isUnlimited ? (
          <span className="text-sm text-gray-400">Unlimited</span>
        ) : (
          <>
            <span className={`text-sm font-medium ${isWarning ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white'}`}>
              {usage.remaining + usage.rolloverCredits}
            </span>
            <span className="text-xs text-gray-500">credits</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Scan Credits</h3>
              <p className="text-xs text-gray-500">{plan?.name || 'Free'} Plan</p>
            </div>
          </div>
          {!isUnlimited && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Resets in</div>
              <div className="text-lg font-semibold text-white">{daysLeft} days</div>
            </div>
          )}
        </div>
      </div>

      {/* Main stats */}
      <div className="p-4">
        {isUnlimited ? (
          <div className="text-center py-4">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">Unlimited Scans</div>
            <p className="text-sm text-gray-500">Enterprise plan</p>
          </div>
        ) : (
          <>
            {/* Credits display */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-white">
                  {usage.remaining + usage.rolloverCredits}
                </div>
                <div className="text-sm text-gray-500">credits remaining</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {usage.used} / {usage.monthlyAllowance} used
                </div>
                {usage.rolloverCredits > 0 && (
                  <div className="text-xs text-blue-400">
                    +{usage.rolloverCredits} rollover
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  isWarning ? 'bg-red-500' :
                  isLow ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
              />
              {usage.rolloverCredits > 0 && (
                <div
                  className="absolute top-0 h-full bg-blue-500/30"
                  style={{
                    left: `${(usage.monthlyAllowance / (usage.monthlyAllowance + usage.rolloverCredits)) * 100}%`,
                    width: `${(usage.rolloverCredits / (usage.monthlyAllowance + usage.rolloverCredits)) * 100}%`,
                  }}
                />
              )}
            </div>

            {/* Warning */}
            {isLow && (
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                isWarning ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${isWarning ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className={`text-sm ${isWarning ? 'text-red-400' : 'text-yellow-400'}`}>
                  {isWarning ? 'Credits almost exhausted!' : 'Running low on credits'}
                </span>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                <div className="text-lg font-semibold text-white">{usage.monthlyAllowance}</div>
                <div className="text-[10px] text-gray-500">Monthly</div>
              </div>
              <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-400">{usage.remaining}</div>
                <div className="text-[10px] text-gray-500">Remaining</div>
              </div>
              <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-400">{usage.rolloverCredits}</div>
                <div className="text-[10px] text-gray-500">Rollover</div>
              </div>
            </div>
          </>
        )}

        {/* Credit costs toggle */}
        <button
          onClick={() => setShowCosts(!showCosts)}
          className="w-full flex items-center justify-between p-3 bg-gray-900/30 rounded-lg text-sm text-gray-400 hover:text-white"
        >
          <span>Credit Costs</span>
          {showCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showCosts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                {Object.entries(CREDIT_COSTS).map(([key, cost]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-2 bg-gray-900/30 rounded">
                    <span className="text-xs text-gray-400">{cost.label}</span>
                    <span className="text-xs font-medium text-yellow-400">{cost.credits} credits</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History toggle */}
        {usage.history.length > 0 && (
          <>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-3 bg-gray-900/30 rounded-lg text-sm text-gray-400 hover:text-white mt-2"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Recent Activity</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 max-h-48 overflow-y-auto">
                    {usage.history.slice(0, 10).map((txn) => (
                      <TransactionItem key={txn.id} transaction={txn} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Actions */}
      {!isUnlimited && (
        <div className="p-4 bg-gray-900/30 border-t border-gray-800">
          <button
            onClick={onUpgrade}
            className="w-full py-2 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Get More Credits
          </button>
        </div>
      )}
    </div>
  );
}

// Transaction item component
function TransactionItem({ transaction }: { transaction: CreditTransaction }) {
  const isPositive = transaction.credits > 0;
  const date = new Date(transaction.timestamp);
  
  return (
    <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
        <div>
          <div className="text-xs text-gray-300">{transaction.description}</div>
          <div className="text-[10px] text-gray-600">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{transaction.credits}
      </span>
    </div>
  );
}

// Mini credits badge for scan modal
export function CreditsBadge({ scanType, className = '' }: { scanType: string; className?: string }) {
  const cost = CREDIT_COSTS[scanType];
  if (!cost) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs ${className}`}>
      <Coins className="w-3 h-3" />
      {cost.credits} credit{cost.credits !== 1 ? 's' : ''}
    </span>
  );
}

// Credit estimation preview
export function CreditEstimate({ 
  isDeep,
  isAuthenticated,
  isAPI,
  apiEndpoints,
  isIncremental
}: {
  isDeep?: boolean;
  isAuthenticated?: boolean;
  isAPI?: boolean;
  apiEndpoints?: number;
  isIncremental?: boolean;
}) {
  let total = 0;
  const items: Array<{ label: string; credits: number }> = [];

  if (isIncremental) {
    items.push({ label: 'Incremental', credits: 0.25 });
    total += 0.25;
  } else if (isDeep) {
    items.push({ label: 'Deep Scan', credits: 3 });
    total += 3;
  } else {
    items.push({ label: 'Basic Scan', credits: 1 });
    total += 1;
  }

  if (isAuthenticated) {
    items.push({ label: 'Auth', credits: 2 });
    total += 2;
  }

  if (isAPI && apiEndpoints) {
    const apiCost = apiEndpoints * 0.5;
    items.push({ label: `${apiEndpoints} endpoints`, credits: apiCost });
    total += apiCost;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Coins className="w-3 h-3 text-yellow-500" />
      <span className="text-gray-500">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && ' + '}
            <span className="text-gray-400">{item.label}</span>
          </span>
        ))}
      </span>
      <span className="text-yellow-400 font-medium">= {total} credits</span>
    </div>
  );
}

