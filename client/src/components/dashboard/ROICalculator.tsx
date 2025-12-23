'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, DollarSign, Clock, Users, Shield, TrendingUp,
  CheckCircle, AlertTriangle, Zap, Download, ChevronRight
} from 'lucide-react';

interface ROIInputs {
  numAssets: number;
  currentPentestCost: number;
  pentestsPerYear: number;
  securityTeamSize: number;
  avgHourlyRate: number;
  hoursPerWeekSecurity: number;
  incidentCostEstimate: number;
  currentToolsCost: number;
}

interface ROIResults {
  annualSavings: number;
  timeSaved: number;
  incidentReduction: number;
  paybackPeriod: number;
  threeYearROI: number;
  breakdownItems: { label: string; value: number; description: string }[];
}

const DEFAULT_INPUTS: ROIInputs = {
  numAssets: 10,
  currentPentestCost: 15000,
  pentestsPerYear: 2,
  securityTeamSize: 2,
  avgHourlyRate: 75,
  hoursPerWeekSecurity: 10,
  incidentCostEstimate: 50000,
  currentToolsCost: 500,
};

const SHIELDSCAN_PRICING = {
  essential: 130 * 12,
  cloud: 260 * 12,
  pro: 434 * 12,
};

export default function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_INPUTS);
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'cloud' | 'pro'>('cloud');
  const [showDetails, setShowDetails] = useState(false);

  const results = useMemo(() => calculateROI(inputs, selectedPlan), [inputs, selectedPlan]);

  const handleInputChange = (key: keyof ROIInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Calculator className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">ROI Calculator</h2>
            <p className="text-sm text-gray-500">See how much ShieldScan can save your organization</p>
          </div>
        </div>
        <button
          onClick={() => exportROIReport(inputs, results, selectedPlan)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Your Organization
          </h3>

          <div className="space-y-4">
            <InputSlider
              label="Number of assets/domains"
              value={inputs.numAssets}
              min={1}
              max={100}
              onChange={(v) => handleInputChange('numAssets', v)}
            />
            
            <InputSlider
              label="Security team size"
              value={inputs.securityTeamSize}
              min={1}
              max={20}
              onChange={(v) => handleInputChange('securityTeamSize', v)}
            />

            <InputSlider
              label="Hours/week on security testing"
              value={inputs.hoursPerWeekSecurity}
              min={1}
              max={40}
              onChange={(v) => handleInputChange('hoursPerWeekSecurity', v)}
            />

            <InputSlider
              label="Average hourly rate (€)"
              value={inputs.avgHourlyRate}
              min={30}
              max={200}
              step={5}
              prefix="€"
              onChange={(v) => handleInputChange('avgHourlyRate', v)}
            />
          </div>

          <h3 className="text-sm font-medium text-white mt-6 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            Current Costs
          </h3>

          <div className="space-y-4">
            <InputSlider
              label="Pentest cost per engagement (€)"
              value={inputs.currentPentestCost}
              min={5000}
              max={50000}
              step={1000}
              prefix="€"
              onChange={(v) => handleInputChange('currentPentestCost', v)}
            />

            <InputSlider
              label="Pentests per year"
              value={inputs.pentestsPerYear}
              min={0}
              max={12}
              onChange={(v) => handleInputChange('pentestsPerYear', v)}
            />

            <InputSlider
              label="Current security tools cost/month (€)"
              value={inputs.currentToolsCost}
              min={0}
              max={5000}
              step={50}
              prefix="€"
              onChange={(v) => handleInputChange('currentToolsCost', v)}
            />

            <InputSlider
              label="Est. cost per security incident (€)"
              value={inputs.incidentCostEstimate}
              min={10000}
              max={500000}
              step={5000}
              prefix="€"
              onChange={(v) => handleInputChange('incidentCostEstimate', v)}
            />
          </div>

          {/* Plan selector */}
          <h3 className="text-sm font-medium text-white mt-6 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            ShieldScan Plan
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {(['essential', 'cloud', 'pro'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedPlan === plan
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="text-sm font-medium text-white capitalize">{plan}</div>
                <div className="text-xs text-gray-500">€{SHIELDSCAN_PRICING[plan] / 12}/mo</div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Main savings */}
          <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
            <div className="text-sm text-green-400 mb-2">Annual Savings</div>
            <div className="text-4xl font-bold text-white mb-1">
              €{results.annualSavings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              per year with ShieldScan {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <div className="text-2xl font-bold text-white">{results.timeSaved}</div>
                <div className="text-xs text-gray-500">hours saved/year</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{results.incidentReduction}%</div>
                <div className="text-xs text-gray-500">incident reduction</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{results.threeYearROI}%</div>
                <div className="text-xs text-gray-500">3-year ROI</div>
              </div>
            </div>
          </div>

          {/* Payback period */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Payback Period</span>
              </div>
              <div className="text-lg font-bold text-white">
                {results.paybackPeriod} {results.paybackPeriod === 1 ? 'month' : 'months'}
              </div>
            </div>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (12 / results.paybackPeriod) * 100)}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Savings Breakdown
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>

            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 space-y-3"
              >
                {results.breakdownItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-t border-gray-800">
                    <div>
                      <div className="text-sm text-gray-300">{item.label}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                    <div className={`text-sm font-medium ${item.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.value >= 0 ? '+' : ''}€{item.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Value props */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h4 className="text-sm font-medium text-white mb-3">What you get with ShieldScan</h4>
            <div className="space-y-2">
              {[
                'Continuous security scanning vs annual pentests',
                'Automated vulnerability detection in minutes',
                'Evidence-based findings reduce false positives',
                'Developer-friendly fixes accelerate remediation',
                'Compliance mapping saves audit preparation time',
                'Real-time alerts catch issues before incidents',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
            <div className="text-lg font-bold text-white mb-1">
              Start saving €{Math.round(results.annualSavings / 12).toLocaleString()}/month
            </div>
            <div className="text-sm text-green-100 mb-3">
              14-day free trial • No credit card required
            </div>
            <button className="px-6 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CALCULATION LOGIC
// ==========================================

function calculateROI(inputs: ROIInputs, plan: 'essential' | 'cloud' | 'pro'): ROIResults {
  const shieldScanCost = SHIELDSCAN_PRICING[plan];
  
  // Current costs
  const currentPentestCosts = inputs.currentPentestCost * inputs.pentestsPerYear;
  const currentToolsCostAnnual = inputs.currentToolsCost * 12;
  const currentLaborCost = inputs.securityTeamSize * inputs.hoursPerWeekSecurity * inputs.avgHourlyRate * 52;
  
  // Estimated incident cost (assuming 1 incident every 2 years without proper tooling)
  const expectedIncidentCost = inputs.incidentCostEstimate * 0.5; // Per year average
  
  // With ShieldScan
  // - Reduce pentest frequency by 50% (still need some manual testing)
  const reducedPentestCosts = currentPentestCosts * 0.5;
  // - Reduce security labor by 40% with automation
  const reducedLaborCost = currentLaborCost * 0.6;
  // - Replace current tools
  const toolsSavings = currentToolsCostAnnual;
  // - Reduce incident probability by 60%
  const reducedIncidentCost = expectedIncidentCost * 0.4;
  
  // Calculate savings
  const pentestSavings = currentPentestCosts - reducedPentestCosts;
  const laborSavings = currentLaborCost - reducedLaborCost;
  const incidentSavings = expectedIncidentCost - reducedIncidentCost;
  
  const totalCurrentCost = currentPentestCosts + currentToolsCostAnnual + currentLaborCost + expectedIncidentCost;
  const totalWithShieldScan = reducedPentestCosts + shieldScanCost + reducedLaborCost + reducedIncidentCost;
  
  const annualSavings = Math.round(totalCurrentCost - totalWithShieldScan);
  
  // Time saved (hours)
  const timeSaved = Math.round(inputs.securityTeamSize * inputs.hoursPerWeekSecurity * 52 * 0.4);
  
  // Incident reduction percentage
  const incidentReduction = 60;
  
  // Payback period (months)
  const monthlySavings = annualSavings / 12;
  const paybackPeriod = Math.max(1, Math.round(shieldScanCost / 12 / (monthlySavings > 0 ? monthlySavings : 1)));
  
  // 3-year ROI
  const threeYearSavings = annualSavings * 3;
  const threeYearCost = shieldScanCost * 3;
  const threeYearROI = Math.round(((threeYearSavings - threeYearCost) / threeYearCost) * 100);
  
  const breakdownItems = [
    {
      label: 'Pentest cost reduction',
      value: Math.round(pentestSavings),
      description: 'Fewer manual pentests needed with continuous scanning',
    },
    {
      label: 'Security team efficiency',
      value: Math.round(laborSavings),
      description: 'Automated scanning reduces manual testing time',
    },
    {
      label: 'Tool consolidation',
      value: Math.round(toolsSavings),
      description: 'Replace multiple point solutions',
    },
    {
      label: 'Incident prevention',
      value: Math.round(incidentSavings),
      description: 'Catch vulnerabilities before exploitation',
    },
    {
      label: 'ShieldScan investment',
      value: -shieldScanCost,
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan annual cost`,
    },
  ];

  return {
    annualSavings: Math.max(0, annualSavings),
    timeSaved,
    incidentReduction,
    paybackPeriod,
    threeYearROI: Math.max(0, threeYearROI),
    breakdownItems,
  };
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function InputSlider({
  label,
  value,
  min,
  max,
  step = 1,
  prefix = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <span className="text-sm font-medium text-white">
          {prefix}{value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
    </div>
  );
}

function exportROIReport(inputs: ROIInputs, results: ROIResults, plan: string) {
  const report = {
    title: 'ShieldScan ROI Analysis',
    generatedAt: new Date().toISOString(),
    inputs,
    selectedPlan: plan,
    results: {
      annualSavings: results.annualSavings,
      timeSavedHours: results.timeSaved,
      incidentReductionPercent: results.incidentReduction,
      paybackPeriodMonths: results.paybackPeriod,
      threeYearROIPercent: results.threeYearROI,
      breakdown: results.breakdownItems,
    },
    recommendation: results.annualSavings > 0 
      ? `Based on your inputs, ShieldScan would save your organization €${results.annualSavings.toLocaleString()} annually with a payback period of ${results.paybackPeriod} months.`
      : 'Contact our sales team for a customized analysis.',
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shieldscan_roi_analysis_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

