'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, FileText, CheckCircle, ExternalLink, Download,
  Server, Eye, Clock, AlertTriangle, Key, Globe, Users, Database
} from 'lucide-react';

interface TrustDocument {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'compliance' | 'privacy' | 'infrastructure';
  lastUpdated: string;
  downloadable: boolean;
}

const TRUST_DOCUMENTS: TrustDocument[] = [
  {
    id: 'security-whitepaper',
    title: 'Security Whitepaper',
    description: 'Comprehensive overview of our security architecture, threat model, and controls',
    category: 'security',
    lastUpdated: '2024-12-01',
    downloadable: true,
  },
  {
    id: 'penetration-test',
    title: 'Penetration Test Summary',
    description: 'Annual third-party penetration test results and remediation status',
    category: 'security',
    lastUpdated: '2024-11-15',
    downloadable: true,
  },
  {
    id: 'soc2-report',
    title: 'SOC 2 Type II Report',
    description: 'Service Organization Control report covering security, availability, and confidentiality',
    category: 'compliance',
    lastUpdated: '2024-10-01',
    downloadable: true,
  },
  {
    id: 'gdpr-dpa',
    title: 'GDPR Data Processing Agreement',
    description: 'Standard contractual clauses and data processing terms for EU customers',
    category: 'privacy',
    lastUpdated: '2024-09-01',
    downloadable: true,
  },
  {
    id: 'incident-response',
    title: 'Incident Response Policy',
    description: 'Our procedures for detecting, responding to, and recovering from security incidents',
    category: 'security',
    lastUpdated: '2024-11-01',
    downloadable: true,
  },
  {
    id: 'data-retention',
    title: 'Data Retention Policy',
    description: 'How long we retain different types of data and deletion procedures',
    category: 'privacy',
    lastUpdated: '2024-10-15',
    downloadable: true,
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure Security',
    description: 'Cloud security architecture, encryption, and network isolation details',
    category: 'infrastructure',
    lastUpdated: '2024-11-20',
    downloadable: true,
  },
  {
    id: 'subprocessors',
    title: 'Sub-processor List',
    description: 'Third-party services we use and their security certifications',
    category: 'compliance',
    lastUpdated: '2024-12-01',
    downloadable: true,
  },
];

const SECURITY_CONTROLS = [
  {
    icon: Lock,
    title: 'Encryption',
    items: [
      'AES-256 encryption at rest',
      'TLS 1.3 for data in transit',
      'Customer-managed keys (BYOK)',
      'Key rotation every 90 days',
    ],
  },
  {
    icon: Server,
    title: 'Infrastructure',
    items: [
      'SOC 2 certified cloud providers',
      'Multi-region availability',
      'DDoS protection',
      'WAF enabled',
    ],
  },
  {
    icon: Users,
    title: 'Access Control',
    items: [
      'Role-based access (RBAC)',
      'SSO/SAML integration',
      'MFA enforcement',
      'IP allowlisting',
    ],
  },
  {
    icon: Eye,
    title: 'Monitoring',
    items: [
      '24/7 security monitoring',
      'Anomaly detection',
      'Audit logging',
      'Real-time alerting',
    ],
  },
];

const CERTIFICATIONS = [
  { name: 'SOC 2 Type II', status: 'certified', icon: '🔐' },
  { name: 'ISO 27001', status: 'in_progress', icon: '📋' },
  { name: 'GDPR Compliant', status: 'certified', icon: '🇪🇺' },
  { name: 'HIPAA Ready', status: 'available', icon: '🏥' },
  { name: 'PCI-DSS', status: 'in_progress', icon: '💳' },
];

export default function TrustCenter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const categories = [
    { id: 'security', label: 'Security', icon: Shield, color: 'purple' },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle, color: 'green' },
    { id: 'privacy', label: 'Privacy', icon: Eye, color: 'blue' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server, color: 'cyan' },
  ];

  const filteredDocs = selectedCategory
    ? TRUST_DOCUMENTS.filter(d => d.category === selectedCategory)
    : TRUST_DOCUMENTS;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm mb-4">
          <Shield className="w-4 h-4" />
          Trust & Security Center
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Security is our foundation</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          We implement enterprise-grade security controls and maintain rigorous compliance standards.
          Explore our security documentation and certifications below.
        </p>
      </div>

      {/* Certifications */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CERTIFICATIONS.map((cert) => (
          <div
            key={cert.name}
            className={`p-4 rounded-xl border text-center ${
              cert.status === 'certified' 
                ? 'border-green-500/30 bg-green-500/5'
                : cert.status === 'in_progress'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-gray-800 bg-gray-900/50'
            }`}
          >
            <div className="text-2xl mb-2">{cert.icon}</div>
            <div className="text-sm font-medium text-white">{cert.name}</div>
            <div className={`text-[10px] mt-1 ${
              cert.status === 'certified' ? 'text-green-400' :
              cert.status === 'in_progress' ? 'text-yellow-400' : 'text-gray-500'
            }`}>
              {cert.status === 'certified' ? '✓ Certified' :
               cert.status === 'in_progress' ? '⏳ In Progress' : 'Available'}
            </div>
          </div>
        ))}
      </div>

      {/* Security Controls Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECURITY_CONTROLS.map((control) => (
          <div key={control.title} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <control.icon className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium text-white">{control.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {control.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Documents Section */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-3">Security Documentation</h2>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-800">
          {filteredDocs.map((doc) => (
            <div key={doc.id}>
              <div
                className="p-4 flex items-center gap-4 hover:bg-gray-800/30 cursor-pointer"
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
              >
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{doc.title}</div>
                  <div className="text-xs text-gray-500">{doc.description}</div>
                </div>
                <div className="text-xs text-gray-600">
                  Updated {new Date(doc.lastUpdated).toLocaleDateString()}
                </div>
                {doc.downloadable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id);
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <AnimatePresence>
                {expandedDoc === doc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-16">
                      <DocumentPreview docId={doc.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Data Handling Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataHandlingCard
          icon={Database}
          title="Data Storage"
          items={[
            'Encrypted at rest (AES-256)',
            'EU and US data centers available',
            'Customer-controlled retention',
            'Automatic backup with encryption',
          ]}
        />
        <DataHandlingCard
          icon={Globe}
          title="Data Transfer"
          items={[
            'TLS 1.3 encryption in transit',
            'Standard Contractual Clauses',
            'No third-party data sharing',
            'Regional data residency options',
          ]}
        />
        <DataHandlingCard
          icon={Key}
          title="Access & Control"
          items={[
            'Customer owns all data',
            'Export anytime (JSON/CSV)',
            'Right to deletion (GDPR)',
            'Full audit trail',
          ]}
        />
      </div>

      {/* Security Contact */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Report a Security Vulnerability</h3>
        <p className="text-gray-500 text-sm mb-4 max-w-lg mx-auto">
          We take security seriously. If you've discovered a potential security issue,
          please report it responsibly.
        </p>
        <a
          href="mailto:security@shieldscan.io"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500"
        >
          Contact Security Team
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function DataHandlingCard({ 
  icon: Icon, 
  title, 
  items 
}: { 
  icon: any; 
  title: string; 
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentPreview({ docId }: { docId: string }) {
  const previews: Record<string, React.ReactNode> = {
    'security-whitepaper': (
      <div className="text-xs text-gray-400 space-y-2">
        <p><strong className="text-gray-300">Executive Summary:</strong> ShieldScan implements a defense-in-depth security architecture designed to protect customer data and ensure service availability.</p>
        <p><strong className="text-gray-300">Threat Model:</strong> We consider threats from external attackers, insider threats, supply chain attacks, and service disruptions.</p>
        <p><strong className="text-gray-300">Key Controls:</strong> Multi-factor authentication, end-to-end encryption, network segmentation, continuous monitoring, and regular security assessments.</p>
      </div>
    ),
    'incident-response': (
      <div className="text-xs text-gray-400 space-y-2">
        <p><strong className="text-gray-300">Detection:</strong> 24/7 monitoring with automated alerting for suspicious activities.</p>
        <p><strong className="text-gray-300">Response Time:</strong> Critical incidents acknowledged within 15 minutes, updates every hour.</p>
        <p><strong className="text-gray-300">Communication:</strong> Affected customers notified within 72 hours per GDPR requirements.</p>
        <p><strong className="text-gray-300">Post-Incident:</strong> Root cause analysis and remediation within 30 days.</p>
      </div>
    ),
    'soc2-report': (
      <div className="text-xs text-gray-400 space-y-2">
        <p><strong className="text-gray-300">Audit Period:</strong> October 2023 - September 2024</p>
        <p><strong className="text-gray-300">Trust Services Criteria:</strong> Security, Availability, Confidentiality</p>
        <p><strong className="text-gray-300">Result:</strong> Unqualified opinion - all controls operating effectively</p>
        <p className="text-yellow-400">Full report available under NDA for enterprise customers.</p>
      </div>
    ),
  };

  return previews[docId] || (
    <div className="text-xs text-gray-500">
      Document preview not available. Click download to access the full document.
    </div>
  );
}

function handleDownload(docId: string) {
  // Generate sample document content
  const content = {
    document: docId,
    generated: new Date().toISOString(),
    version: '1.0',
    classification: 'Confidential',
    content: `This is a sample ${docId} document for ShieldScan Security Platform.`,
  };

  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shieldscan_${docId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

