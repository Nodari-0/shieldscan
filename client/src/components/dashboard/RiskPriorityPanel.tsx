'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Clock, ChevronRight, Zap, Target, TrendingUp, Info } from 'lucide-react';
import type { RiskScore } from '@/lib/riskScoring';

interface RiskPriorityPanelProps {
  items: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    riskScore: RiskScore;
  }>;
  onItemClick?: (id: string) => void;
}

export default function RiskPriorityPanel({ items, onItemClick }: RiskPriorityPanelProps) {
  // Sort by risk score (highest first)
  const sortedItems = [...items].sort((a, b) => b.riskScore.score - a.riskScore.score);
  
  // Get top critical/high priority items
  const criticalItems = sortedItems.filter(item => 
    item.riskScore.priority === 'critical' || item.riskScore.priority === 'high'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
      case 'high': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
      case 'medium': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'low': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Zap className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
        <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <h3 className="text-white font-medium mb-1">No Issues to Prioritize</h3>
        <p className="text-sm text-gray-500">All security checks passed or no critical issues found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-red-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Fix This First</h3>
              <p className="text-xs text-gray-500">Risk-prioritized security issues</p>
            </div>
          </div>
          {criticalItems.length > 0 && (
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="text-xs font-medium text-red-400">
                {criticalItems.length} urgent
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Priority items list */}
      <div className="divide-y divide-gray-800">
        {sortedItems.slice(0, 5).map((item, index) => {
          const colors = getPriorityColor(item.riskScore.priority);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
              onClick={() => onItemClick?.(item.id)}
            >
              <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0`}>
                  {getPriorityIcon(item.riskScore.priority)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {item.riskScore.priority}
                    </span>
                  </div>
                  
                  {/* Risk score bar */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.riskScore.score >= 90 ? 'bg-red-500' :
                          item.riskScore.score >= 70 ? 'bg-orange-500' :
                          item.riskScore.score >= 50 ? 'bg-yellow-500' :
                          item.riskScore.score >= 25 ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${item.riskScore.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{item.riskScore.score}</span>
                  </div>

                  {/* Fix urgency */}
                  <p className="text-xs text-gray-400">{item.riskScore.fixUrgency}</p>
                  
                  {/* Reasoning (first item only) */}
                  {item.riskScore.reasoning.length > 0 && (
                    <div className="mt-2 text-[10px] text-gray-500">
                      {item.riskScore.reasoning[0]}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View all link */}
      {sortedItems.length > 5 && (
        <div className="p-3 bg-gray-900/30 border-t border-gray-800">
          <button className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors">
            View all {sortedItems.length} prioritized issues
          </button>
        </div>
      )}

      {/* Summary footer */}
      <div className="p-3 bg-gray-900/50 border-t border-gray-800 grid grid-cols-4 gap-2">
        {['critical', 'high', 'medium', 'low'].map((priority) => {
          const count = sortedItems.filter(i => i.riskScore.priority === priority).length;
          const colors = getPriorityColor(priority);
          return (
            <div key={priority} className="text-center">
              <div className={`text-lg font-semibold ${colors.text}`}>{count}</div>
              <div className="text-[10px] text-gray-500 capitalize">{priority}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact risk badge
export function RiskBadge({ score, priority }: { score: number; priority: string }) {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    informational: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${colors}`}>
      <span>{score}</span>
      <span className="text-[10px] opacity-75">risk</span>
    </span>
  );
}

// Mini risk indicator
export function RiskIndicator({ score }: { score: number }) {
  const color = 
    score >= 90 ? 'bg-red-500' :
    score >= 70 ? 'bg-orange-500' :
    score >= 50 ? 'bg-yellow-500' :
    score >= 25 ? 'bg-blue-500' :
    'bg-gray-500';

  return (
    <div className="flex items-center gap-1.5" title={`Risk Score: ${score}`}>
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">{score}</span>
    </div>
  );
}

