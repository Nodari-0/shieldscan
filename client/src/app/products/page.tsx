'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  title: string;
  shortDesc: string;
  icon: JSX.Element;
  color: string;
  features: string[];
  modalContent: {
    emoji: string;
    headline: string;
    description: string;
    benefits: { icon: string; text: string }[];
    howItWorks: string[];
  };
}

const products: Product[] = [
  {
    id: 'website-scanner',
    title: 'Website Scanner',
    shortDesc: 'Comprehensive vulnerability scanning with SSL checks, security headers analysis, and risk scoring.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'green',
    features: ['SSL Certificate Validation', 'Security Headers Analysis', 'XSS & SQL Injection Tests'],
    modalContent: {
      emoji: '🛡️',
      headline: 'Your First Line of Defense',
      description: 'Our Website Scanner uses advanced algorithms to analyze your website\'s security posture. It performs deep scans to identify potential vulnerabilities before hackers can exploit them.',
      benefits: [
        { icon: '🔒', text: 'Validates SSL certificates and encryption strength' },
        { icon: '🔍', text: 'Analyzes security headers for best practices' },
        { icon: '⚡', text: 'Instant vulnerability detection' },
        { icon: '📊', text: 'Risk score from 0-100 for easy understanding' },
      ],
      howItWorks: [
        'Enter your website URL',
        'Our system performs comprehensive analysis',
        'Receive detailed results within seconds',
        'Get actionable recommendations to improve security',
      ],
    },
  },
  {
    id: 'api-security',
    title: 'API Security',
    shortDesc: 'Secure your APIs with endpoint scanning, authentication checks, and rate limiting analysis.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'purple',
    features: ['Endpoint Discovery', 'Authentication Testing', 'Rate Limit Analysis'],
    modalContent: {
      emoji: '🔌',
      headline: 'Protect Your Digital Backbone',
      description: 'APIs are the backbone of modern applications. Our API Security scanner ensures your endpoints are protected against unauthorized access and common attack vectors.',
      benefits: [
        { icon: '🎯', text: 'Discovers exposed API endpoints automatically' },
        { icon: '🔐', text: 'Tests authentication mechanisms for weaknesses' },
        { icon: '🚦', text: 'Analyzes rate limiting configurations' },
        { icon: '📝', text: 'Documents potential security gaps' },
      ],
      howItWorks: [
        'Provide your API base URL',
        'Our scanner maps available endpoints',
        'Security tests are performed safely',
        'Receive a comprehensive security report',
      ],
    },
  },
  {
    id: 'cloud-security',
    title: 'Cloud Security',
    shortDesc: 'Protect your cloud infrastructure with CSPM for AWS, Azure, and Google Cloud environments.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    color: 'blue',
    features: ['AWS Security Scanning', 'Azure Configuration Checks', 'GCP Vulnerability Assessment'],
    modalContent: {
      emoji: '☁️',
      headline: 'Secure Your Cloud Infrastructure',
      description: 'Our Cloud Security Posture Management (CSPM) solution continuously monitors your AWS, Azure, and Google Cloud environments to identify misconfigurations and compliance violations.',
      benefits: [
        { icon: '🔐', text: 'Multi-cloud security from a single dashboard' },
        { icon: '📋', text: 'Daily configuration checks for misconfigurations' },
        { icon: '⚡', text: 'Instant alerts for security drifts' },
        { icon: '✅', text: 'Compliance mapping for SOC 2, ISO, HIPAA' },
      ],
      howItWorks: [
        'Connect your cloud accounts securely',
        'We scan your infrastructure daily',
        'Identify misconfigurations and risks',
        'Get prioritized remediation guidance',
      ],
    },
  },
  {
    id: 'internal-scanning',
    title: 'Internal Scanning',
    shortDesc: 'Secure employee devices and internal networks with agent-based vulnerability scanning.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: 'pink',
    features: ['Agent-based Scanning', 'Endpoint Protection', 'Network Vulnerability Detection'],
    modalContent: {
      emoji: '🖥️',
      headline: 'Protect Your Internal Infrastructure',
      description: 'Our Internal Scanning solution helps you identify vulnerabilities within your organization\'s network, including workstations, servers, and internal services.',
      benefits: [
        { icon: '💻', text: 'Scan employee workstations and servers' },
        { icon: '🔍', text: 'Detect internal network vulnerabilities' },
        { icon: '📊', text: 'Mass deployment options for large organizations' },
        { icon: '🔄', text: 'Continuous monitoring for new threats' },
      ],
      howItWorks: [
        'Deploy lightweight agents to your devices',
        'Agents report vulnerabilities securely',
        'View consolidated results in your dashboard',
        'Prioritize and remediate internal risks',
      ],
    },
  },
  {
    id: 'threat-intelligence',
    title: 'Threat Intelligence',
    shortDesc: 'Real-time threat detection and intelligence to keep your infrastructure secure.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'yellow',
    features: ['Real-time Monitoring', 'Threat Alerts', 'Risk Assessment'],
    modalContent: {
      emoji: '⚡',
      headline: 'Stay Ahead of Threats',
      description: 'Our Threat Intelligence system continuously monitors the cybersecurity landscape to identify emerging threats that could affect your systems.',
      benefits: [
        { icon: '👁️', text: 'Real-time threat monitoring 24/7' },
        { icon: '🚨', text: 'Instant alerts when threats are detected' },
        { icon: '📈', text: 'Trend analysis for proactive protection' },
        { icon: '🌐', text: 'Global threat database integration' },
      ],
      howItWorks: [
        'Connect your assets to our platform',
        'We continuously monitor for threats',
        'Receive alerts for potential risks',
        'Take action with our recommendations',
      ],
    },
  },
  {
    id: 'port-scanner',
    title: 'Port Scanner',
    shortDesc: 'Identify open ports and services running on your servers with safe scanning methods.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'purple',
    features: ['Common Port Detection', 'Service Identification', 'Risk Analysis'],
    modalContent: {
      emoji: '🔓',
      headline: 'Know Your Attack Surface',
      description: 'Open ports can be entry points for attackers. Our Port Scanner identifies which ports are open and what services are running, helping you minimize your attack surface.',
      benefits: [
        { icon: '🚪', text: 'Identifies all open ports on your server' },
        { icon: '🏷️', text: 'Detects services running on each port' },
        { icon: '⚠️', text: 'Flags potentially dangerous configurations' },
        { icon: '✅', text: 'Safe, non-intrusive scanning methods' },
      ],
      howItWorks: [
        'Enter your server IP or domain',
        'Select scan intensity (quick or deep)',
        'Our scanner checks common ports safely',
        'Review results with risk indicators',
      ],
    },
  },
  {
    id: 'cms-detection',
    title: 'CMS Detection',
    shortDesc: 'Automatically detect content management systems and their versions for vulnerability assessment.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'yellow',
    features: ['WordPress Detection', 'Version Identification', 'Vulnerability Mapping'],
    modalContent: {
      emoji: '🔎',
      headline: 'Identify Your CMS Risks',
      description: 'Content Management Systems like WordPress, Drupal, and Joomla have known vulnerabilities. Our CMS Detection identifies what you\'re running and checks for security issues.',
      benefits: [
        { icon: '📦', text: 'Detects WordPress, Drupal, Joomla & more' },
        { icon: '🔢', text: 'Identifies exact version numbers' },
        { icon: '🐛', text: 'Maps known vulnerabilities for your version' },
        { icon: '🔄', text: 'Recommends updates and patches' },
      ],
      howItWorks: [
        'Provide your website URL',
        'We analyze page signatures and headers',
        'CMS type and version are identified',
        'Security recommendations are generated',
      ],
    },
  },
  {
    id: 'pdf-reports',
    title: 'PDF Reports',
    shortDesc: 'Generate professional, detailed security reports in PDF format for stakeholders and compliance.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'red',
    features: ['Professional Formatting', 'Risk Score Visualization', 'Export & Share'],
    modalContent: {
      emoji: '📄',
      headline: 'Professional Documentation',
      description: 'Share your security findings with stakeholders, management, or compliance teams with our professionally formatted PDF reports.',
      benefits: [
        { icon: '🎨', text: 'Beautiful, branded report design' },
        { icon: '📊', text: 'Visual charts and risk scores' },
        { icon: '📋', text: 'Executive summary for quick overview' },
        { icon: '💼', text: 'Perfect for compliance audits' },
      ],
      howItWorks: [
        'Complete a security scan',
        'Click "Generate PDF Report"',
        'Customize report sections (optional)',
        'Download and share with your team',
      ],
    },
  },
];

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle hash in URL to auto-open product modal
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const product = products.find(p => p.id === hash);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, []);

  const closeModal = () => {
    setSelectedProduct(null);
    // Clear the hash from URL
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleGetStarted = () => {
    closeModal();
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-heading">
              Our <span className="text-yellow-500">Products</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive cybersecurity solutions designed to protect your digital assets.
              Click on any product to learn more! 👇
            </p>
          </div>

          {/* Product Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const colorMap = {
                yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', hover: 'hover:border-yellow-500/50' },
                purple: { bg: 'bg-purple-500/20', text: 'text-purple-500', hover: 'hover:border-purple-500/50' },
                green: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', hover: 'hover:border-yellow-500/50' },
                red: { bg: 'bg-red-500/20', text: 'text-red-500', hover: 'hover:border-red-500/50' },
                blue: { bg: 'bg-blue-500/20', text: 'text-blue-500', hover: 'hover:border-blue-500/50' },
                pink: { bg: 'bg-pink-500/20', text: 'text-pink-500', hover: 'hover:border-pink-500/50' },
              };
              const colorClasses = colorMap[product.color as keyof typeof colorMap] || colorMap.yellow;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`bg-dark-secondary border border-dark-accent rounded-2xl p-8 ${colorClasses.hover} transition-all cursor-pointer transform hover:scale-105 group`}
                >
                  <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center mb-6`}>
                    <div className={colorClasses.text}>
                      {product.icon}
                    </div>
                  </div>
                  <h3 className={`text-2xl font-bold text-white mb-4 group-hover:${colorClasses.text} transition-colors`}>
                    {product.title}
                  </h3>
                  <p className="text-gray-300 mb-6">{product.shortDesc}</p>
                  <ul className="space-y-2 text-gray-400">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className={`${colorClasses.text} mr-2`}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-6 text-sm ${colorClasses.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Click to learn more →
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Modal */}
      {selectedProduct && (() => {
        const modalColorMap = {
          yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', btn: 'bg-yellow-500 text-black hover:bg-yellow-400', step: 'bg-yellow-500' },
          purple: { bg: 'bg-purple-500/20', text: 'text-purple-500', btn: 'bg-purple-500 text-white hover:bg-purple-400', step: 'bg-purple-500' },
          green: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', btn: 'bg-yellow-500 text-black hover:bg-yellow-400', step: 'bg-yellow-500' },
          red: { bg: 'bg-red-500/20', text: 'text-red-500', btn: 'bg-red-500 text-white hover:bg-red-400', step: 'bg-red-500' },
          blue: { bg: 'bg-blue-500/20', text: 'text-blue-500', btn: 'bg-blue-500 text-white hover:bg-blue-400', step: 'bg-blue-500' },
          pink: { bg: 'bg-pink-500/20', text: 'text-pink-500', btn: 'bg-pink-500 text-white hover:bg-pink-400', step: 'bg-pink-500' },
        };
        const modalColors = modalColorMap[selectedProduct.color as keyof typeof modalColorMap] || modalColorMap.yellow;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" />
            
            {/* Modal Content */}
            <div 
              className="relative bg-dark-secondary border border-dark-accent rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-dark-accent/50 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-accent transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="p-8 pb-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 ${modalColors.bg} rounded-2xl flex items-center justify-center`}>
                    <span className="text-4xl">{selectedProduct.modalContent.emoji}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white font-heading">{selectedProduct.title}</h2>
                    <p className={`${modalColors.text} font-medium`}>
                      {selectedProduct.modalContent.headline}
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {selectedProduct.modalContent.description}
                </p>
              </div>

              {/* Benefits */}
              <div className="px-8 py-6 bg-dark-primary/50">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>✨</span> Key Benefits
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {selectedProduct.modalContent.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-dark-secondary/50 rounded-xl p-4">
                      <span className="text-2xl">{benefit.icon}</span>
                      <span className="text-gray-300 text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="p-8 pt-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🔧</span> How It Works
                </h3>
                <div className="space-y-3">
                  {selectedProduct.modalContent.howItWorks.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${modalColors.step} text-black font-bold flex items-center justify-center text-sm`}>
                        {idx + 1}
                      </div>
                      <span className="text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handleGetStarted}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${modalColors.btn}`}
                  >
                    {isAuthenticated ? 'Go to Dashboard 🚀' : 'Get Started 🚀'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 rounded-xl font-semibold bg-dark-accent text-white hover:bg-dark-tertiary transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
