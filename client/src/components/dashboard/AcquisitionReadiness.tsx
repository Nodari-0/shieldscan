'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, CheckCircle, AlertTriangle, Clock, DollarSign,
  Users, Shield, FileText, Code, Globe, Server, Lock, Award,
  ChevronRight, ExternalLink, BarChart3
} from 'lucide-react';

interface ReadinessCategory {
  id: string;
  name: string;
  icon: any;
  weight: number;
  items: ReadinessItem[];
}

interface ReadinessItem {
  id: string;
  name: string;
  description: string;
  status: 'complete' | 'in_progress' | 'not_started' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  completedAt?: string;
  notes?: string;
}

const READINESS_CATEGORIES: ReadinessCategory[] = [
  {
    id: 'technical',
    name: 'Technical Due Diligence',
    icon: Code,
    weight: 25,
    items: [
      { id: 'arch_docs', name: 'Architecture documentation', description: 'System design, data flow, and component diagrams', status: 'complete', priority: 'critical' },
      { id: 'code_quality', name: 'Code quality metrics', description: 'Test coverage, linting, type safety', status: 'complete', priority: 'high' },
      { id: 'tech_debt', name: 'Technical debt inventory', description: 'Known issues, TODOs, planned refactors', status: 'in_progress', priority: 'medium' },
      { id: 'scalability', name: 'Scalability assessment', description: 'Load testing results, capacity planning', status: 'in_progress', priority: 'high' },
      { id: 'dependencies', name: 'Dependency audit', description: 'Third-party libraries, licenses, vulnerabilities', status: 'complete', priority: 'critical' },
      { id: 'cicd', name: 'CI/CD pipeline documentation', description: 'Build, test, deploy processes', status: 'complete', priority: 'medium' },
    ],
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    icon: Shield,
    weight: 25,
    items: [
      { id: 'pentest', name: 'Penetration test report', description: 'Third-party security assessment', status: 'complete', priority: 'critical' },
      { id: 'soc2', name: 'SOC 2 certification', description: 'Type II audit completed', status: 'complete', priority: 'critical' },
      { id: 'gdpr', name: 'GDPR compliance', description: 'DPA, privacy policy, data handling', status: 'complete', priority: 'critical' },
      { id: 'encryption', name: 'Encryption standards', description: 'At-rest and in-transit encryption', status: 'complete', priority: 'critical' },
      { id: 'incident_response', name: 'Incident response plan', description: 'Documented procedures and contacts', status: 'complete', priority: 'high' },
      { id: 'access_control', name: 'Access control audit', description: 'RBAC, MFA, audit logs', status: 'complete', priority: 'high' },
    ],
  },
  {
    id: 'business',
    name: 'Business Metrics',
    icon: BarChart3,
    weight: 25,
    items: [
      { id: 'mrr', name: 'MRR/ARR tracking', description: 'Monthly recurring revenue history', status: 'in_progress', priority: 'critical' },
      { id: 'churn', name: 'Churn analysis', description: 'Customer retention metrics', status: 'not_started', priority: 'high' },
      { id: 'cac_ltv', name: 'CAC/LTV calculation', description: 'Customer acquisition cost vs lifetime value', status: 'not_started', priority: 'high' },
      { id: 'usage_metrics', name: 'Usage analytics', description: 'DAU/MAU, feature adoption, engagement', status: 'complete', priority: 'medium' },
      { id: 'pricing', name: 'Pricing model documentation', description: 'Pricing strategy, competitor analysis', status: 'complete', priority: 'medium' },
      { id: 'roadmap', name: 'Product roadmap', description: '12-month feature plan', status: 'complete', priority: 'medium' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal & IP',
    icon: FileText,
    weight: 15,
    items: [
      { id: 'ip_ownership', name: 'IP ownership documentation', description: 'Patents, trademarks, copyrights', status: 'complete', priority: 'critical' },
      { id: 'contracts', name: 'Customer contracts', description: 'Standard terms, enterprise agreements', status: 'complete', priority: 'high' },
      { id: 'vendor_agreements', name: 'Vendor agreements', description: 'Third-party service contracts', status: 'complete', priority: 'medium' },
      { id: 'employment', name: 'Employment agreements', description: 'IP assignment, non-compete clauses', status: 'complete', priority: 'high' },
      { id: 'licenses', name: 'License compliance', description: 'Open source license audit', status: 'complete', priority: 'high' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: Server,
    weight: 10,
    items: [
      { id: 'infrastructure', name: 'Infrastructure documentation', description: 'Cloud setup, costs, redundancy', status: 'complete', priority: 'high' },
      { id: 'monitoring', name: 'Monitoring & alerting', description: 'Uptime, performance, error tracking', status: 'complete', priority: 'high' },
      { id: 'disaster_recovery', name: 'Disaster recovery plan', description: 'Backup, failover, RTO/RPO', status: 'in_progress', priority: 'high' },
      { id: 'runbooks', name: 'Operational runbooks', description: 'Incident handling procedures', status: 'in_progress', priority: 'medium' },
    ],
  },
];

export default function AcquisitionReadiness() {
  const [categories, setCategories] = useState(READINESS_CATEGORIES);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('technical');

  // Calculate overall readiness
  const overallScore = calculateOverallScore(categories);
  const statusCounts = getStatusCounts(categories);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Acquisition Readiness</h2>
            <p className="text-sm text-gray-500">Due diligence checklist & enterprise preparedness</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{overallScore}%</div>
          <div className="text-xs text-gray-500">Overall Ready</div>
        </div>
      </div>

      {/* Progress ring */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-r from-green-500/5 to-emerald-500/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Score ring */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" stroke="#374151" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke={overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#EAB308' : '#EF4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${overallScore * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{overallScore}%</span>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-2">
              <StatusRow icon={CheckCircle} label="Complete" count={statusCounts.complete} color="green" />
              <StatusRow icon={Clock} label="In Progress" count={statusCounts.in_progress} color="yellow" />
              <StatusRow icon={AlertTriangle} label="Not Started" count={statusCounts.not_started} color="gray" />
              {statusCounts.blocked > 0 && (
                <StatusRow icon={AlertTriangle} label="Blocked" count={statusCounts.blocked} color="red" />
              )}
            </div>
          </div>

          {/* Valuation estimate */}
          <div className="text-right p-4 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Estimated Valuation Range</div>
            <div className="text-2xl font-bold text-green-400">€600K - €1M+</div>
            <div className="text-xs text-gray-600 mt-1">
              Based on {overallScore}% readiness
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryScore = calculateCategoryScore(category);
          const isExpanded = expandedCategory === category.id;

          return (
            <div
              key={category.id}
              className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden"
            >
              <button
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-800/30"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <div className={`p-2 rounded-lg ${categoryScore >= 80 ? 'bg-green-500/10' : categoryScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                  <category.icon className={`w-5 h-5 ${categoryScore >= 80 ? 'text-green-400' : categoryScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{category.name}</div>
                  <div className="text-xs text-gray-500">
                    {category.items.filter(i => i.status === 'complete').length} / {category.items.length} items complete
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${categoryScore >= 80 ? 'text-green-400' : categoryScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {categoryScore}%
                    </div>
                    <div className="text-[10px] text-gray-600">{category.weight}% weight</div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="border-t border-gray-800"
                >
                  <div className="divide-y divide-gray-800">
                    {category.items.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          Priority Actions to Increase Valuation
        </h3>
        <div className="space-y-3">
          {getTopPriorities(categories).map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    item.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.priority}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    item.status === 'not_started' ? 'bg-gray-500/20 text-gray-400' :
                    item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer expectations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExpectationCard
          icon={DollarSign}
          title="Financial Buyers Expect"
          items={['ARR > €50K', 'Gross margin > 70%', 'Low churn (< 5%/mo)', 'Clear CAC/LTV']}
        />
        <ExpectationCard
          icon={Shield}
          title="Strategic Buyers Expect"
          items={['SOC 2 certification', 'GDPR compliance', 'Enterprise features', 'API documentation']}
        />
        <ExpectationCard
          icon={Code}
          title="Technical Buyers Expect"
          items={['Clean codebase', 'Test coverage > 60%', 'No critical debt', 'Scalable architecture']}
        />
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatusRow({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-500',
    red: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${colors[color]}`} />
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${colors[color]}`}>{count}</span>
    </div>
  );
}

function ItemRow({ item }: { item: ReadinessItem }) {
  const statusConfig = {
    complete: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    in_progress: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    not_started: { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
    blocked: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-gray-800/30">
      <div className={`p-1.5 rounded-lg ${config.bg}`}>
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1">
        <div className="text-sm text-white">{item.name}</div>
        <div className="text-xs text-gray-500">{item.description}</div>
      </div>
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
        item.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
        item.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
        item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {item.priority}
      </span>
    </div>
  );
}

function ExpectationCard({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-medium text-white">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 text-gray-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==========================================
// CALCULATION HELPERS
// ==========================================

function calculateOverallScore(categories: ReadinessCategory[]): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const category of categories) {
    const categoryScore = calculateCategoryScore(category);
    weightedScore += categoryScore * category.weight;
    totalWeight += category.weight;
  }

  return Math.round(weightedScore / totalWeight);
}

function calculateCategoryScore(category: ReadinessCategory): number {
  const total = category.items.length;
  if (total === 0) return 0;

  let score = 0;
  for (const item of category.items) {
    if (item.status === 'complete') score += 1;
    else if (item.status === 'in_progress') score += 0.5;
  }

  return Math.round((score / total) * 100);
}

function getStatusCounts(categories: ReadinessCategory[]) {
  const counts = { complete: 0, in_progress: 0, not_started: 0, blocked: 0 };
  
  for (const category of categories) {
    for (const item of category.items) {
      counts[item.status]++;
    }
  }

  return counts;
}

function getTopPriorities(categories: ReadinessCategory[]): ReadinessItem[] {
  const incomplete: ReadinessItem[] = [];

  for (const category of categories) {
    for (const item of category.items) {
      if (item.status !== 'complete') {
        incomplete.push(item);
      }
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  incomplete.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return incomplete.slice(0, 5);
}

