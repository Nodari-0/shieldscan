'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/landing/Navigation';
import { HelpCircle, Search, MessageCircle, Book, Video, Mail, ChevronDown, ChevronUp, Shield, FileText, Settings, CreditCard, Code } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I start my first security scan?',
    answer: 'Navigate to your dashboard and click "Start New Scan". Enter the website URL you want to scan and click "Scan Now". The scan will run automatically and show results in real-time.',
  },
  {
    category: 'Getting Started',
    question: 'What information do I need to create an account?',
    answer: 'You only need an email address to create an account. You can sign up with Google, Apple, or email/password. We also support anonymous display names for privacy.',
  },
  {
    category: 'Scanning',
    question: 'How long does a scan take?',
    answer: 'Most scans complete in 30-60 seconds. Complex websites with many checks may take up to 2 minutes. You can monitor progress in real-time through our terminal interface.',
  },
  {
    category: 'Scanning',
    question: 'What types of security checks are performed?',
    answer: 'ShieldScan performs comprehensive checks including SSL/TLS validation, security headers analysis, XSS and SQL injection testing, DNS security, email security (SPF/DMARC), cookie security, and more.',
  },
  {
    category: 'Plans & Pricing',
    question: 'What is included in the free plan?',
    answer: 'The free plan includes 1 scan per month, basic vulnerability scanning, SSL certificate checks, and core security analysis. Upgrade to Pro or Business for more scans and advanced features.',
  },
  {
    category: 'Plans & Pricing',
    question: 'How do I upgrade my plan?',
    answer: 'Go to the Pricing page and select your desired plan. You can choose monthly or annual billing. Payment is processed securely through Stripe.',
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Navigate to Account Settings > Security tab. Enter your current password and new password. Make sure your new password meets security requirements.',
  },
  {
    category: 'Account',
    question: 'Can I delete my account?',
    answer: 'Yes, you can delete your account at any time from Account Settings > Security. This will permanently remove all your data including scan history. This action cannot be undone.',
  },
  {
    category: 'Technical',
    question: 'Do you store my scan results?',
    answer: 'Yes, scan results are stored securely in Firebase Firestore and also cached locally in your browser. You can export or delete your scan history at any time.',
  },
  {
    category: 'Technical',
    question: 'Is my data encrypted?',
    answer: 'Yes, all data transmission is encrypted using HTTPS/TLS. Data at rest is encrypted using Firebase\'s enterprise-grade encryption. We follow industry best practices for data security.',
  },
];

const categories = ['All', 'Getting Started', 'Scanning', 'Plans & Pricing', 'Account', 'Technical'];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-2xl mb-6">
              <HelpCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Help Center
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Find answers to common questions and learn how to get the most out of ShieldScan.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-dark-secondary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors text-lg"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link
              href="/documentation"
              className="p-6 bg-dark-secondary border border-dark-accent rounded-xl hover:border-green-500/50 transition-all group"
            >
              <Book className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">
                Documentation
              </h3>
              <p className="text-gray-400 text-sm">
                Comprehensive guides and API references
              </p>
            </Link>

            <Link
              href="/developers"
              className="p-6 bg-dark-secondary border border-dark-accent rounded-xl hover:border-green-500/50 transition-all group"
            >
              <Code className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">
                API Reference
              </h3>
              <p className="text-gray-400 text-sm">
                Developer guides and code examples
              </p>
            </Link>

            <Link
              href="mailto:support@shieldscan.io"
              className="p-6 bg-dark-secondary border border-dark-accent rounded-xl hover:border-green-500/50 transition-all group"
            >
              <MessageCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">
                Contact Support
              </h3>
              <p className="text-gray-400 text-sm">
                Get help from our support team
              </p>
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-gray-400 text-sm">Filter by:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-500 text-black'
                    : 'bg-dark-secondary border border-dark-accent text-gray-400 hover:text-white hover:border-green-500/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-4 mb-12">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-dark-secondary border border-dark-accent rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === `${idx}` ? null : `${idx}`)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-dark-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 mb-1 block">{faq.category}</span>
                        <h3 className="text-white font-semibold">{faq.question}</h3>
                      </div>
                    </div>
                    {expandedFAQ === `${idx}` ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                    )}
                  </button>
                  {expandedFAQ === `${idx}` && (
                    <div className="px-6 pb-6 pl-18">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-dark-secondary border border-dark-accent rounded-xl">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No results found. Try a different search term.</p>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
            <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Still Need Help?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="mailto:support@shieldscan.io"
                className="px-6 py-3 bg-green-500 text-black rounded-lg font-semibold hover:bg-green-400 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-dark-primary border border-dark-accent rounded-lg font-semibold hover:border-green-500/50 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

