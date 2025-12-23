'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import { Book, Search, Code, Shield, Zap, Settings, FileText, ChevronRight, Copy, Check, Clock, Sparkles, ArrowRight, X } from 'lucide-react';

// Coming Soon Modal
function ComingSoonModal({ isOpen, onClose, section }: {
  isOpen: boolean;
  onClose: () => void;
  section: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-dark-secondary border border-dark-accent rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{section}</h2>
            <p className="text-sm text-blue-400">Coming Soon</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">
          We're working hard on comprehensive documentation for this section. 
          In the meantime, check out our existing guides or reach out for help.
        </p>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold text-sm">What's Coming</span>
          </div>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• In-depth tutorials with examples</li>
            <li>• Video walkthroughs</li>
            <li>• Interactive code samples</li>
            <li>• Best practices guides</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href="/help"
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors text-center text-sm"
          >
            Visit Help Center
          </Link>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-dark-accent rounded-lg text-white hover:border-gray-500 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [comingSoonModal, setComingSoonModal] = useState<{ isOpen: boolean; section: string }>({ 
    isOpen: false, 
    section: '' 
  });

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Zap, available: true },
    { id: 'api', title: 'API Reference', icon: Code, available: false },
    { id: 'security-checks', title: 'Security Checks', icon: Shield, available: true },
    { id: 'integrations', title: 'Integrations', icon: Settings, available: true },
    { id: 'guides', title: 'Guides & Tutorials', icon: Book, available: false },
  ];

  const handleSectionClick = (section: typeof sections[0]) => {
    if (section.available) {
      setActiveSection(section.id);
    } else {
      setComingSoonModal({ isOpen: true, section: section.title });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-6">
              <Book className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Documentation
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              Comprehensive guides, API references, and examples to help you secure your websites.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-secondary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-dark-secondary border border-dark-accent rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id && section.available;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                            : section.available
                              ? 'text-gray-400 hover:text-white hover:bg-dark-primary'
                              : 'text-gray-500 hover:bg-dark-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{section.title}</span>
                        </div>
                        {!section.available && (
                          <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">Soon</span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Quick Links */}
                <div className="mt-6 pt-6 border-t border-dark-accent">
                  <h4 className="text-sm text-gray-500 mb-3">Quick Links</h4>
                  <div className="space-y-2">
                    <Link href="/developers" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                      <Code className="w-4 h-4" />
                      Developer Portal
                    </Link>
                    <Link href="/help" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                      <Shield className="w-4 h-4" />
                      Help Center
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 font-heading">Getting Started</h2>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      Welcome to ShieldScan! This guide will help you get started with scanning your websites for security vulnerabilities.
                    </p>
                  </div>

                  <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      Quick Start
                    </h3>
                    <ol className="space-y-4 text-gray-300 ml-6 list-decimal">
                      <li>
                        <strong className="text-white">Create an Account:</strong> Sign up for a free ShieldScan account
                      </li>
                      <li>
                        <strong className="text-white">Navigate to Dashboard:</strong> Access your dashboard from the navigation menu
                      </li>
                      <li>
                        <strong className="text-white">Start Your First Scan:</strong> Click "Start New Scan" and enter a website URL
                      </li>
                      <li>
                        <strong className="text-white">Review Results:</strong> View detailed security analysis and recommendations
                      </li>
                    </ol>
                  </section>

                  <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Understanding Scan Results</h3>
                    <div className="space-y-4 text-gray-300">
                      <p>
                        Each scan provides a comprehensive security assessment including:
                      </p>
                      <ul className="space-y-2 ml-6 list-disc">
                        <li><strong className="text-white">Security Score:</strong> Overall rating from 0-100</li>
                        <li><strong className="text-white">SSL/TLS Status:</strong> Certificate validity and configuration</li>
                        <li><strong className="text-white">Security Headers:</strong> Presence and configuration of protective headers</li>
                        <li><strong className="text-white">Vulnerabilities:</strong> Identified security issues and their severity</li>
                        <li><strong className="text-white">Recommendations:</strong> Actionable steps to improve security</li>
                      </ul>
                    </div>
                  </section>

                  {/* Video Tutorial Placeholder */}
                  <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Video Tutorials Coming Soon</h3>
                        <p className="text-gray-400 mb-4">
                          We're creating step-by-step video guides to help you get the most out of ShieldScan.
                        </p>
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                          Sign up for updates <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Security Checks */}
              {activeSection === 'security-checks' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 font-heading">Security Checks</h2>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      ShieldScan performs comprehensive security assessments across multiple categories.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { title: 'SSL/TLS Validation', description: 'Certificate validity, expiration, and protocol support', tier: 'Free' },
                      { title: 'Security Headers', description: 'CSP, HSTS, X-Frame-Options, and other protective headers', tier: 'Free' },
                      { title: 'XSS Testing', description: 'Cross-site scripting vulnerability detection', tier: 'Pro' },
                      { title: 'SQL Injection', description: 'Database injection attack vectors', tier: 'Pro' },
                      { title: 'DNS Security', description: 'DNSSEC, CAA records, and DNS configuration', tier: 'Free' },
                      { title: 'Email Security', description: 'SPF, DMARC, DKIM, and BIMI records', tier: 'Pro' },
                      { title: 'Mixed Content', description: 'HTTP resources on HTTPS pages', tier: 'Free' },
                      { title: 'Cookie Security', description: 'Secure flags, SameSite, and HttpOnly attributes', tier: 'Pro' },
                    ].map((check, idx) => (
                      <div key={idx} className="bg-dark-secondary border border-dark-accent rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <Shield className="w-6 h-6 text-blue-500" />
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            check.tier === 'Free' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {check.tier}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">{check.title}</h3>
                        <p className="text-gray-400 text-sm">{check.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations */}
              {activeSection === 'integrations' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 font-heading">Integrations</h2>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      Connect ShieldScan with your favorite tools and workflows.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
                      { name: 'GitHub Actions', description: 'Scan on every push and pull request', available: true },
                      { name: 'GitLab CI/CD', description: 'Automated security checks in your pipeline', available: true },
                      { name: 'Slack', description: 'Receive scan notifications in your workspace', available: false },
                      { name: 'Webhooks', description: 'Custom integrations via HTTP callbacks', available: true },
                    ].map((integration, idx) => (
                      <div key={idx} className="bg-dark-secondary border border-dark-accent rounded-xl p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                              <Settings className="w-5 h-5 text-blue-500" />
                              {integration.name}
                              {!integration.available && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Coming Soon</span>
                              )}
                            </h3>
                            <p className="text-gray-400">{integration.description}</p>
                          </div>
                          {integration.available && (
                            <Link
                              href="/developers"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                            >
                              Setup Guide
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Start scanning your websites today and get comprehensive security insights in minutes.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
              >
                Start Scanning
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-dark-primary border border-dark-accent rounded-lg font-semibold hover:border-blue-500/50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonModal.isOpen}
        onClose={() => setComingSoonModal({ isOpen: false, section: '' })}
        section={comingSoonModal.section}
      />
    </div>
  );
}
