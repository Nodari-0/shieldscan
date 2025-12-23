'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/landing/Navigation';
import { ArrowLeft, DollarSign, Users, Zap, Clock, TrendingDown, CheckCircle2, Shield, BarChart3, Target } from 'lucide-react';

export default function SavingsPage() {
  const manualScanCost = 350; // Average cost per manual scan: $200-$500
  const proScanCost = 99 / 40; // $99/month for 40 scans = $2.48/scan
  const businessScanCost = 199 / 100; // $199/month for 100 scans = $1.99/scan
  
  const annualSavingsPro = (manualScanCost - proScanCost) * 40;
  const annualSavingsBusiness = (manualScanCost - businessScanCost) * 100;

  const comparisonData = [
    {
      category: 'Cost per Scan',
      manual: `$${manualScanCost}+`,
      shieldscan: `$${proScanCost.toFixed(2)}`,
      savings: `${((manualScanCost / proScanCost).toFixed(0))}x cheaper`,
    },
    {
      category: 'Time to Results',
      manual: '2-5 Days',
      shieldscan: '2-5 Minutes',
      savings: '99% faster',
    },
    {
      category: 'Availability',
      manual: 'Business Hours',
      shieldscan: '24/7 Automated',
      savings: 'Always available',
    },
    {
      category: 'Annual Cost (40 scans)',
      manual: `$${(manualScanCost * 40).toLocaleString()}`,
      shieldscan: '$99',
      savings: `$${annualSavingsPro.toLocaleString()} saved`,
    },
    {
      category: 'Scalability',
      manual: 'Limited by availability',
      shieldscan: 'Unlimited capacity',
      savings: 'Scale instantly',
    },
    {
      category: 'Historical Tracking',
      manual: 'Manual documentation',
      shieldscan: 'Automatic tracking',
      savings: 'Full audit trail',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-2xl mb-6">
              <TrendingDown className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
              Why ShieldScan Saves You <span className="text-green-500">Thousands</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Discover why thousands of companies choose automated security scanning over expensive manual audits.
            </p>
          </div>

          {/* Hero Image Section */}
          <div className="mb-16">
            <div className="relative rounded-2xl overflow-hidden border border-green-500/30">
              <div className="relative w-full aspect-[16/9] max-h-[500px]">
                <Image
                  src="/images/humanAiVr.jpg"
                  alt="AI-powered security scanning replacing manual processes"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-green-500/30 pointer-events-none" />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-6 z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-dark-secondary/90 backdrop-blur-md border border-green-500/30 rounded-lg mb-4">
                      <Zap className="w-6 h-6 text-green-500" />
                      <span className="text-xl font-bold text-white">
                        Automated Security Scanning
                      </span>
                    </div>
                    <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                      AI-powered technology replaces expensive manual security audits, delivering faster results at a fraction of the cost.
                    </p>
                  </div>
                </div>

                {/* Corner Stats */}
                <div className="absolute top-6 right-6 bg-dark-secondary/95 backdrop-blur-md border border-green-500/30 rounded-lg p-4 shadow-xl z-10">
                  <p className="text-xs text-gray-400 mb-1">Cost Per Scan</p>
                  <p className="text-3xl font-bold text-green-500">${proScanCost.toFixed(2)}</p>
                </div>

                <div className="absolute bottom-6 left-6 bg-dark-secondary/95 backdrop-blur-md border border-green-500/30 rounded-lg p-4 shadow-xl z-10">
                  <p className="text-xs text-gray-400 mb-1">Results in</p>
                  <p className="text-3xl font-bold text-green-400">2-5 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Manual Scanning */}
            <div className="bg-dark-secondary border border-red-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-heading">Manual Security Scans</h2>
                  <p className="text-gray-400 text-sm">Hiring Security Professionals</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-primary rounded-lg border border-dark-accent">
                  <div className="text-4xl font-bold text-red-400 mb-2">${manualScanCost}+</div>
                  <div className="text-gray-400 text-sm">Average cost per scan</div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>Requires scheduling and coordination</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>2-5 days to receive results</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>Limited to business hours</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>No historical tracking</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>Difficult to scale</span>
                  </li>
                </ul>

                <div className="pt-6 border-t border-dark-accent">
                  <div className="text-3xl font-bold text-white mb-1">${(manualScanCost * 40).toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Annual cost for 40 scans</div>
                </div>
              </div>
            </div>

            {/* ShieldScan */}
            <div className="bg-dark-secondary border border-green-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-heading">ShieldScan Automated</h2>
                  <p className="text-gray-400 text-sm">AI-Powered Security Scanning</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-primary rounded-lg border border-green-500/30">
                  <div className="text-4xl font-bold text-green-500 mb-2">${proScanCost.toFixed(2)}</div>
                  <div className="text-gray-400 text-sm">Cost per scan (Pro Plan)</div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Instant, on-demand scanning</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Results in 2-5 minutes</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Available 24/7, no waiting</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Full scan history & trends</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Scales with your needs</span>
                  </li>
                </ul>

                <div className="pt-6 border-t border-green-500/20">
                  <div className="text-3xl font-bold text-white mb-1">$99</div>
                  <div className="text-gray-400 text-sm">Annual cost for 40 scans (Pro Plan)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-dark-secondary border border-dark-accent rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 font-heading text-center">
              Side-by-Side Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-accent">
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 text-red-400 font-semibold">Manual Scans</th>
                    <th className="text-center py-4 px-4 text-yellow-400 font-semibold">ShieldScan</th>
                    <th className="text-center py-4 px-4 text-green-400 font-semibold">Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr key={index} className="border-b border-dark-accent/50">
                      <td className="py-4 px-4 text-white font-medium">{item.category}</td>
                      <td className="py-4 px-4 text-center text-gray-300">{item.manual}</td>
                      <td className="py-4 px-4 text-center text-gray-300">{item.shieldscan}</td>
                      <td className="py-4 px-4 text-center text-green-400 font-semibold">{item.savings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Savings Breakdown */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-500/10 to-purple-500/10 border border-green-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-bold text-white font-heading">Pro Plan Savings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    ${(annualSavingsPro / 1000).toFixed(0)}K+
                  </div>
                  <div className="text-gray-400">Annual savings (40 scans)</div>
                </div>
                <div className="pt-4 border-t border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Manual cost:</span>
                    <span className="text-white font-semibold">${(manualScanCost * 40).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">ShieldScan cost:</span>
                    <span className="text-white font-semibold">$99</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                    <span className="text-yellow-400 font-semibold">You save:</span>
                    <span className="text-green-500 text-xl font-bold">${annualSavingsPro.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-green-500/10 border border-purple-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white font-heading">Business Plan Savings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    ${(annualSavingsBusiness / 1000).toFixed(0)}K+
                  </div>
                  <div className="text-gray-400">Annual savings (100 scans)</div>
                </div>
                <div className="pt-4 border-t border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Manual cost:</span>
                    <span className="text-white font-semibold">${(manualScanCost * 100).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">ShieldScan cost:</span>
                    <span className="text-white font-semibold">$199</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                    <span className="text-purple-400 font-semibold">You save:</span>
                    <span className="text-purple-400 text-xl font-bold">${annualSavingsBusiness.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Automated Section */}
          <div className="bg-dark-secondary border border-dark-accent rounded-2xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 font-heading text-center">
              Why Automated Scanning Wins
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
                <p className="text-gray-400 text-sm">
                  Get security insights in minutes, not days. Make decisions faster and fix issues immediately.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Cost Effective</h3>
                <p className="text-gray-400 text-sm">
                  Save 99% on security scanning costs. Same quality results at a fraction of the price.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Consistent Quality</h3>
                <p className="text-gray-400 text-sm">
                  Automated scans ensure consistent, thorough security checks every time. No human error.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-green-500/10 via-purple-500/10 to-green-500/10 border border-green-500/30 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4 font-heading">
              Ready to Start Saving?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of companies that have switched to automated security scanning and saved thousands of dollars.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-black rounded-lg font-semibold text-lg hover:bg-yellow-400 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                View Pricing Plans
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-dark-secondary border border-dark-accent rounded-lg text-white hover:border-green-500/50 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Start Free Scan
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

