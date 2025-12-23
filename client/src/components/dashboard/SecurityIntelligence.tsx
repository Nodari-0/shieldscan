'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, TrendingUp, TrendingDown, Activity, Globe, AlertTriangle,
  Target, Zap, ChevronRight, BarChart3, Award, Clock, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  calculateSecurityPosture, getPostureHistory, calculateAttackSurface,
  calculateRiskVelocity, getBenchmark, predictRisk, INDUSTRY_BENCHMARKS,
  saveBenchmarkIndustry, getBenchmarkIndustry,
  type SecurityPosture, type AttackSurface, type RiskVelocity,
  type IndustryBenchmark, type PredictiveRisk
} from '@/lib/security-intelligence';

export default function SecurityIntelligence() {
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [surface, setSurface] = useState<AttackSurface | null>(null);
  const [velocity, setVelocity] = useState<RiskVelocity | null>(null);
  const [benchmark, setBenchmark] = useState<IndustryBenchmark | null>(null);
  const [prediction, setPrediction] = useState<PredictiveRisk | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('technology');

  useEffect(() => {
    const industry = getBenchmarkIndustry();
    setSelectedIndustry(industry);
    loadData(industry);
  }, []);

  const loadData = (industry: string) => {
    setPosture(calculateSecurityPosture());
    setSurface(calculateAttackSurface());
    setVelocity(calculateRiskVelocity());
    setBenchmark(getBenchmark(industry));
    setPrediction(predictRisk());
  };

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
    saveBenchmarkIndustry(industry);
    setBenchmark(getBenchmark(industry));
  };

  if (!posture) {
    return <div className="text-gray-500">Loading intelligence data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Intelligence</h2>
            <p className="text-sm text-gray-500">Posture analysis, risk velocity & benchmarking</p>
          </div>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security Score */}
        <ScoreCard
          title="Security Posture"
          score={posture.score}
          previousScore={posture.previousScore}
          trend={posture.trend}
          icon={Shield}
          color="purple"
        />

        {/* Risk Velocity */}
        {velocity && (
          <MetricCard
            title="Risk Velocity"
            value={`${velocity.current}/day`}
            subtitle={`${velocity.trend} trend`}
            icon={Zap}
            color={velocity.trend === 'accelerating' ? 'red' : velocity.trend === 'decelerating' ? 'green' : 'yellow'}
            trend={velocity.trend === 'decelerating' ? 'down' : velocity.trend === 'accelerating' ? 'up' : undefined}
          />
        )}

        {/* Attack Surface */}
        {surface && (
          <MetricCard
            title="Attack Surface"
            value={surface.totalAssets.toString()}
            subtitle={`${surface.exposedEndpoints} endpoints`}
            icon={Globe}
            color="cyan"
            badge={surface.growth.netChange > 0 ? `+${surface.growth.netChange}` : undefined}
          />
        )}

        {/* Industry Percentile */}
        {benchmark && (
          <MetricCard
            title="Industry Rank"
            value={`${benchmark.percentile}th`}
            subtitle={`vs ${benchmark.industry}`}
            icon={Award}
            color={benchmark.percentile >= 75 ? 'green' : benchmark.percentile >= 50 ? 'yellow' : 'red'}
          />
        )}
      </div>

      {/* Detailed sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posture Breakdown */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Security Posture Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(posture.breakdown).map(([key, value]) => (
              <PostureBar 
                key={key} 
                label={formatLabel(key)} 
                value={value} 
              />
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        {surface && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Risk Distribution
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <RiskBadge label="Critical" count={surface.riskDistribution.critical} color="red" />
              <RiskBadge label="High" count={surface.riskDistribution.high} color="orange" />
              <RiskBadge label="Medium" count={surface.riskDistribution.medium} color="yellow" />
              <RiskBadge label="Low" count={surface.riskDistribution.low} color="green" />
            </div>
            <div className="text-xs text-gray-500">
              <div className="flex items-center justify-between py-1 border-t border-gray-800">
                <span>Technologies detected</span>
                <span className="text-gray-400">{surface.technologies.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Open ports</span>
                <span className="text-gray-400">{surface.openPorts}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Subdomains</span>
                <span className="text-gray-400">{surface.subdomains}</span>
              </div>
            </div>
          </div>
        )}

        {/* Industry Benchmark */}
        {benchmark && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Industry Benchmark
              </h3>
              <select
                value={selectedIndustry}
                onChange={(e) => handleIndustryChange(e.target.value)}
                className="text-xs bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-400"
              >
                {Object.keys(INDUSTRY_BENCHMARKS).map((ind) => (
                  <option key={ind} value={ind}>
                    {ind.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Percentile visualization */}
            <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-3xl font-bold text-white">{benchmark.percentile}th</div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {benchmark.percentile >= 75 ? 'Top Quartile' : 
                     benchmark.percentile >= 50 ? 'Above Average' : 
                     benchmark.percentile >= 25 ? 'Below Average' : 'Bottom Quartile'}
                  </div>
                  <div className={`text-xs ${benchmark.yourScore >= benchmark.averageScore ? 'text-green-400' : 'text-red-400'}`}>
                    {benchmark.yourScore >= benchmark.averageScore ? '+' : ''}{benchmark.yourScore - benchmark.averageScore} vs industry avg
                  </div>
                </div>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full">
                <div 
                  className={`absolute h-full rounded-full ${
                    benchmark.percentile >= 75 ? 'bg-green-500' :
                    benchmark.percentile >= 50 ? 'bg-blue-500' :
                    benchmark.percentile >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${benchmark.percentile}%` }}
                />
              </div>
            </div>

            {/* Category comparison */}
            <div className="space-y-2">
              {benchmark.comparison.map((comp) => (
                <div key={comp.category} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{comp.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{comp.industry} avg</span>
                    <span className={`font-medium ${comp.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {comp.delta >= 0 ? '+' : ''}{comp.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictive Risk */}
        {prediction && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              Predictive Risk Assessment
            </h3>

            {/* Risk level */}
            <div className={`p-3 rounded-lg mb-4 ${
              prediction.riskLevel === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
              prediction.riskLevel === 'high' ? 'bg-orange-500/10 border border-orange-500/30' :
              prediction.riskLevel === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              'bg-green-500/10 border border-green-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-lg font-bold uppercase ${
                  prediction.riskLevel === 'critical' ? 'text-red-400' :
                  prediction.riskLevel === 'high' ? 'text-orange-400' :
                  prediction.riskLevel === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {prediction.riskLevel} Risk
                </div>
                <div className="text-sm text-gray-400">{prediction.probability}% probability</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{prediction.recommendation}</p>
            </div>

            {/* Risk factors */}
            <div className="space-y-2">
              {prediction.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {factor.impact === 'negative' ? (
                    <ArrowUp className="w-3 h-3 text-red-400 mt-0.5" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-green-400 mt-0.5" />
                  )}
                  <div>
                    <span className="text-gray-300">{factor.name}</span>
                    <span className="text-gray-600 ml-1">({factor.impact === 'negative' ? '+' : '-'}{factor.weight}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Posture History Chart */}
      <PostureHistoryChart />
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function ScoreCard({ 
  title, 
  score, 
  previousScore, 
  trend,
  icon: Icon,
  color
}: { 
  title: string;
  score: number;
  previousScore?: number;
  trend: 'improving' | 'stable' | 'degrading';
  icon: any;
  color: string;
}) {
  const colors: Record<string, string> = {
    purple: 'from-purple-500/20 to-blue-500/20 text-purple-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    red: 'from-red-500/20 to-orange-500/20 text-red-400',
  };

  return (
    <div className={`rounded-xl border border-gray-800 bg-gradient-to-br ${colors[color]} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        {trend !== 'stable' && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'improving' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'improving' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {previousScore && Math.abs(score - previousScore)}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{score}</div>
      <div className="text-xs text-gray-500">{title}</div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  color,
  badge,
  trend
}: { 
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
  badge?: string;
  trend?: 'up' | 'down';
}) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
            {badge}
          </span>
        )}
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function PostureBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {value}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${getColor(value)}`}
        />
      </div>
    </div>
  );
}

function RiskBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
  };

  return (
    <div className={`p-2 rounded-lg border text-center ${colors[color]}`}>
      <div className="text-xl font-bold">{count}</div>
      <div className="text-[10px] uppercase">{label}</div>
    </div>
  );
}

function PostureHistoryChart() {
  const history = getPostureHistory();
  const maxScore = 100;
  const chartHeight = 120;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        Security Posture Over Time (30 Days)
      </h3>
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <line
              key={v}
              x1="0"
              y1={chartHeight - (v / maxScore) * chartHeight}
              x2="100%"
              y2={chartHeight - (v / maxScore) * chartHeight}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            points={history.map((h, i) => {
              const x = (i / (history.length - 1)) * 100;
              const y = chartHeight - (h.score / maxScore) * chartHeight;
              return `${x}%,${y}`;
            }).join(' ')}
          />
          
          {/* Area fill */}
          <polygon
            fill="url(#gradient)"
            fillOpacity="0.2"
            points={`0,${chartHeight} ${history.map((h, i) => {
              const x = (i / (history.length - 1)) * 100;
              const y = chartHeight - (h.score / maxScore) * chartHeight;
              return `${x}%,${y}`;
            }).join(' ')} 100%,${chartHeight}`}
          />
          
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-600 -ml-6">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>
      
      {/* X-axis */}
      <div className="flex justify-between text-[10px] text-gray-600 mt-2">
        <span>{history[0]?.date.split('-').slice(1).join('/')}</span>
        <span>{history[Math.floor(history.length / 2)]?.date.split('-').slice(1).join('/')}</span>
        <span>{history[history.length - 1]?.date.split('-').slice(1).join('/')}</span>
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

