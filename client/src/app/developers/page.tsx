'use client';

import { useState } from 'react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';
import { Clock, Sparkles, Bell, X } from 'lucide-react';

export default function DevelopersPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    install: `npm install @shieldscan/sdk`,
    quickstart: `import { ShieldScan } from '@shieldscan/sdk';

// Initialize with your API key
const scanner = new ShieldScan({
  apiKey: 'your_api_key_here'
});

// Scan a website
const results = await scanner.scan('https://example.com');

console.log('Security Score:', results.score);
console.log('Vulnerabilities:', results.vulnerabilities);`,
    
    cicd: `# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run ShieldScan
        uses: shieldscan/action@v1
        with:
          api-key: \${{ secrets.SHIELDSCAN_API_KEY }}
          target-url: \${{ secrets.TARGET_URL }}
          
      - name: Check Results
        run: |
          if [ "\${{ steps.scan.outputs.score }}" -lt 70 ]; then
            echo "Security score too low!"
            exit 1
          fi`,

    webhook: `// Express.js webhook handler
app.post('/webhooks/shieldscan', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'scan.completed':
      console.log('Scan completed!', data.score);
      // Send notification to your team
      notifyTeam(data);
      break;
      
    case 'vulnerability.detected':
      console.log('New vulnerability!', data.severity);
      // Create issue in your tracker
      createIssue(data);
      break;
  }
  
  res.status(200).send('OK');
});`,

    react: `import { useShieldScan } from '@shieldscan/react';

function SecurityDashboard() {
  const { scan, results, loading, error } = useShieldScan();
  
  const handleScan = async () => {
    await scan('https://mywebsite.com');
  };
  
  return (
    <div>
      <button onClick={handleScan} disabled={loading}>
        {loading ? 'Scanning...' : 'Start Scan'}
      </button>
      
      {results && (
        <div>
          <h2>Score: {results.score}/100</h2>
          <ul>
            {results.vulnerabilities.map(v => (
              <li key={v.id}>{v.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}`,
  };

  const apiEndpoints = [
    { method: 'POST', endpoint: '/api/v1/scan', description: 'Start a new security scan', color: 'green' },
    { method: 'GET', endpoint: '/api/v1/scan/:id', description: 'Get scan results by ID', color: 'blue' },
    { method: 'GET', endpoint: '/api/v1/scans', description: 'List all scans for your account', color: 'blue' },
    { method: 'POST', endpoint: '/api/v1/webhooks', description: 'Register a webhook endpoint', color: 'green' },
    { method: 'DELETE', endpoint: '/api/v1/webhooks/:id', description: 'Remove a webhook', color: 'red' },
    { method: 'GET', endpoint: '/api/v1/reports/:id/pdf', description: 'Download PDF report', color: 'blue' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Coming Soon Banner */}
      {showBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm border-b border-purple-500/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-8 h-8 bg-white/20 rounded-full items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:hidden" />
                  API Preview Mode
                </p>
                <p className="text-white/70 text-xs hidden sm:block">This is a preview of our upcoming Developer API. Documentation is for demonstration purposes.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="hidden sm:flex px-3 py-1.5 bg-white text-purple-600 rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors items-center gap-1">
                <Bell className="w-3 h-3" />
                Get Notified
              </Link>
              <button onClick={() => setShowBanner(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className={`pb-20 px-4 sm:px-6 lg:px-8 ${showBanner ? 'pt-36 sm:pt-32' : 'pt-24'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
              <span className="text-green-500 font-semibold text-sm">👨‍💻 DEVELOPER TOOLS</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-heading">
              Built for <span className="text-green-500">Developers</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Integrate ShieldScan into your workflow with our powerful API, SDKs, and CI/CD integrations. 
              Ship secure code with confidence. 🚀
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">REST</div>
              <div className="text-gray-400 text-sm">API Type</div>
            </div>
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">99.9%</div>
              <div className="text-gray-400 text-sm">Uptime SLA</div>
            </div>
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">&lt;2s</div>
              <div className="text-gray-400 text-sm">Avg Response</div>
            </div>
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">5+</div>
              <div className="text-gray-400 text-sm">SDKs Available</div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="bg-dark-secondary border border-dark-accent rounded-2xl overflow-hidden mb-16">
            {/* Tab Navigation */}
            <div className="flex border-b border-dark-accent overflow-x-auto">
              {[
                { id: 'quickstart', label: '🚀 Quick Start', icon: '🚀' },
                { id: 'api', label: '📡 API Reference', icon: '📡' },
                { id: 'cicd', label: '⚙️ CI/CD', icon: '⚙️' },
                { id: 'webhooks', label: '🔔 Webhooks', icon: '🔔' },
                { id: 'sdks', label: '📦 SDKs', icon: '📦' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-yellow-500 border-b-2 border-yellow-500 bg-dark-primary/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Quick Start Tab */}
              {activeTab === 'quickstart' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">⚡ Get Started in 5 Minutes</h2>
                  
                  <div className="space-y-8">
                    {/* Step 1 */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center">1</div>
                        <h3 className="text-xl font-semibold text-white">Install the SDK</h3>
                      </div>
                      <div className="relative bg-dark-primary rounded-xl p-4 font-mono text-sm">
                        <code className="text-green-400">{codeExamples.install}</code>
                        <button
                          onClick={() => copyToClipboard(codeExamples.install, 'install')}
                          className="absolute top-3 right-3 px-3 py-1 bg-dark-accent rounded text-xs text-gray-400 hover:text-white"
                        >
                          {copiedCode === 'install' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center">2</div>
                        <h3 className="text-xl font-semibold text-white">Run Your First Scan</h3>
                      </div>
                      <div className="relative bg-dark-primary rounded-xl p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-gray-300">{codeExamples.quickstart}</pre>
                        <button
                          onClick={() => copyToClipboard(codeExamples.quickstart, 'quickstart')}
                          className="absolute top-3 right-3 px-3 py-1 bg-dark-accent rounded text-xs text-gray-400 hover:text-white"
                        >
                          {copiedCode === 'quickstart' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center">3</div>
                        <h3 className="text-xl font-semibold text-white">Get Your API Key</h3>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Sign up for a free account and get your API key from the dashboard.
                      </p>
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                      >
                        Get Free API Key →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* API Reference Tab */}
              {activeTab === 'api' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">📡 API Reference</h2>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Base URL</h3>
                    <div className="bg-dark-primary rounded-xl p-4 font-mono text-green-400">
                      https://api.shieldscan.com/v1
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
                    <p className="text-gray-300 mb-4">
                      Include your API key in the Authorization header:
                    </p>
                    <div className="bg-dark-primary rounded-xl p-4 font-mono text-sm text-gray-300">
                      Authorization: Bearer your_api_key_here
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Endpoints</h3>
                    <div className="space-y-3">
                      {apiEndpoints.map((endpoint, idx) => (
                        <div key={idx} className="bg-dark-primary rounded-xl p-4 flex items-center gap-4">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            endpoint.color === 'green' ? 'bg-green-500/20 text-green-500' :
                            endpoint.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-yellow-500 font-mono">{endpoint.endpoint}</code>
                          <span className="text-gray-400 text-sm ml-auto">{endpoint.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CI/CD Tab */}
              {activeTab === 'cicd' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">⚙️ CI/CD Integration</h2>
                  
                  <p className="text-gray-300 mb-8">
                    Automatically scan your deployments for vulnerabilities with our GitHub Actions integration.
                    Block insecure deployments before they reach production! 🛡️
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 text-center">
                      <div className="text-4xl mb-3">🐙</div>
                      <h4 className="font-semibold text-white">GitHub Actions</h4>
                      <span className="text-green-500 text-sm">Available</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 text-center">
                      <div className="text-4xl mb-3">🦊</div>
                      <h4 className="font-semibold text-white">GitLab CI</h4>
                      <span className="text-green-500 text-sm">Available</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 text-center">
                      <div className="text-4xl mb-3">🔵</div>
                      <h4 className="font-semibold text-white">Jenkins</h4>
                      <span className="text-yellow-500 text-sm">Coming Soon</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-4">GitHub Actions Example</h3>
                  <div className="relative bg-dark-primary rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300">{codeExamples.cicd}</pre>
                    <button
                      onClick={() => copyToClipboard(codeExamples.cicd, 'cicd')}
                      className="absolute top-3 right-3 px-3 py-1 bg-dark-accent rounded text-xs text-gray-400 hover:text-white"
                    >
                      {copiedCode === 'cicd' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Webhooks Tab */}
              {activeTab === 'webhooks' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">🔔 Real-Time Webhooks</h2>
                  
                  <p className="text-gray-300 mb-8">
                    Get instant notifications when scans complete or vulnerabilities are detected.
                    Integrate with Slack, Discord, or your own systems! 📬
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-dark-primary border border-green-500/30 rounded-xl p-6">
                      <h4 className="font-semibold text-white mb-2">📌 scan.completed</h4>
                      <p className="text-gray-400 text-sm">Triggered when a scan finishes</p>
                    </div>
                    <div className="bg-dark-primary border border-red-500/30 rounded-xl p-6">
                      <h4 className="font-semibold text-white mb-2">⚠️ vulnerability.detected</h4>
                      <p className="text-gray-400 text-sm">Triggered for new vulnerabilities</p>
                    </div>
                    <div className="bg-dark-primary border border-yellow-500/30 rounded-xl p-6">
                      <h4 className="font-semibold text-white mb-2">📊 report.generated</h4>
                      <p className="text-gray-400 text-sm">Triggered when PDF report is ready</p>
                    </div>
                    <div className="bg-dark-primary border border-purple-500/30 rounded-xl p-6">
                      <h4 className="font-semibold text-white mb-2">🔄 scan.scheduled</h4>
                      <p className="text-gray-400 text-sm">Triggered for scheduled scans</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-4">Webhook Handler Example</h3>
                  <div className="relative bg-dark-primary rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300">{codeExamples.webhook}</pre>
                    <button
                      onClick={() => copyToClipboard(codeExamples.webhook, 'webhook')}
                      className="absolute top-3 right-3 px-3 py-1 bg-dark-accent rounded text-xs text-gray-400 hover:text-white"
                    >
                      {copiedCode === 'webhook' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* SDKs Tab */}
              {activeTab === 'sdks' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">📦 Official SDKs</h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">🟨</div>
                      <h4 className="font-semibold text-white mb-1">JavaScript / Node.js</h4>
                      <code className="text-yellow-500 text-sm">npm install @shieldscan/sdk</code>
                      <span className="block mt-2 text-green-500 text-xs">✓ Available</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">🐍</div>
                      <h4 className="font-semibold text-white mb-1">Python</h4>
                      <code className="text-yellow-500 text-sm">pip install shieldscan</code>
                      <span className="block mt-2 text-green-500 text-xs">✓ Available</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">⚛️</div>
                      <h4 className="font-semibold text-white mb-1">React Hooks</h4>
                      <code className="text-yellow-500 text-sm">npm install @shieldscan/react</code>
                      <span className="block mt-2 text-green-500 text-xs">✓ Available</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">🐹</div>
                      <h4 className="font-semibold text-white mb-1">Go</h4>
                      <code className="text-yellow-500 text-sm">go get shieldscan</code>
                      <span className="block mt-2 text-yellow-500 text-xs">Coming Soon</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">💎</div>
                      <h4 className="font-semibold text-white mb-1">Ruby</h4>
                      <code className="text-yellow-500 text-sm">gem install shieldscan</code>
                      <span className="block mt-2 text-yellow-500 text-xs">Coming Soon</span>
                    </div>
                    <div className="bg-dark-primary border border-dark-accent rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                      <div className="text-4xl mb-3">🐘</div>
                      <h4 className="font-semibold text-white mb-1">PHP</h4>
                      <code className="text-yellow-500 text-sm">composer require shieldscan</code>
                      <span className="block mt-2 text-yellow-500 text-xs">Coming Soon</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-4">React Hook Example</h3>
                  <div className="relative bg-dark-primary rounded-xl p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300">{codeExamples.react}</pre>
                    <button
                      onClick={() => copyToClipboard(codeExamples.react, 'react')}
                      className="absolute top-3 right-3 px-3 py-1 bg-dark-accent rounded text-xs text-gray-400 hover:text-white"
                    >
                      {copiedCode === 'react' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 border border-green-500/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Secure Your Code? 🔐
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Get started with our free tier - 100 API calls per month included!
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors font-semibold"
              >
                Get Free API Key 🚀
              </Link>
              <Link
                href="https://github.com/shieldscan"
                className="px-8 py-3 border border-gray-400/50 rounded-lg text-white hover:border-gray-300 transition-colors font-medium"
              >
                View on GitHub ⭐
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

