'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is ShieldScan?',
    answer: 'ShieldScan is a comprehensive website security scanner that checks your website for over 28 different vulnerabilities including SSL/TLS issues, security header misconfigurations, DNS security problems, and common web vulnerabilities like XSS and SQL injection patterns. Our tool provides actionable recommendations to help you fix any issues found.',
    category: 'general',
  },
  {
    question: 'How does the scanning work?',
    answer: 'When you enter your website URL, our scanner performs a series of non-intrusive security checks. We analyze your SSL certificate, HTTP security headers, DNS records, and look for common vulnerability patterns. All checks are passive and safe - we never attempt to exploit vulnerabilities or access restricted areas of your site.',
    category: 'general',
  },
  {
    question: 'Is my website data secure?',
    answer: 'Absolutely. We take security seriously. Scan results are encrypted and stored securely. We never share your data with third parties. Enterprise users can also set retention policies and request data deletion at any time. We are GDPR compliant and follow industry best practices for data security.',
    category: 'security',
  },
  {
    question: 'What vulnerabilities do you detect?',
    answer: 'We detect a wide range of vulnerabilities including: SSL/TLS misconfigurations, missing security headers (CSP, HSTS, X-Frame-Options), email security issues (SPF, DKIM, DMARC), exposed sensitive files, directory listing, insecure cookies, CORS misconfigurations, mixed content, and many more. Pro and Enterprise plans include additional advanced checks.',
    category: 'features',
  },
  {
    question: 'How often should I scan my website?',
    answer: 'We recommend scanning at least monthly for most websites. However, if you frequently update your site, deploy new code, or handle sensitive data, weekly or even daily scans are recommended. Our Pro and Business plans include scheduled scans that run automatically on your preferred schedule.',
    category: 'features',
  },
  {
    question: 'Can I automate scans?',
    answer: 'Yes! Pro, Business, and Enterprise plans include scheduled scanning capabilities. You can set up automated scans to run daily, weekly, or monthly. You\'ll receive email notifications when scans complete or when new vulnerabilities are detected. API access is available for Business and Enterprise plans for integration with CI/CD pipelines.',
    category: 'features',
  },
  {
    question: 'What\'s the difference between plans?',
    answer: 'Free plan includes 1 scan per month with basic security checks. Pro ($99/month) includes 40 scans, PDF reports, scan history, and email alerts. Business ($199/month) adds team access, API access, and 100 scans. Enterprise ($3,000/month) includes custom scan limits, dedicated infrastructure, SLA support, and private API access.',
    category: 'pricing',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes! Our Free plan lets you scan 1 website per month at no cost - forever. This allows you to experience our scanning capabilities before upgrading. No credit card required to sign up.',
    category: 'pricing',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. When you cancel, you\'ll continue to have access to your paid features until the end of your current billing period. After that, your account will be downgraded to the Free plan.',
    category: 'pricing',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee for new subscribers. If you\'re not satisfied with our service within the first 14 days, contact our support team for a full refund. After 14 days, refunds are evaluated on a case-by-case basis.',
    category: 'pricing',
  },
];

const categoryLabels: Record<string, string> = {
  all: 'All Questions',
  general: 'General',
  security: 'Security',
  features: 'Features',
  pricing: 'Pricing',
};

export default function FAQSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = faqItems.filter((item) => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(faqItems.map(item => item.category))];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-medium mb-4"
          >
            Got Questions?
          </motion.span>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Questions</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-gray-400 text-lg"
          >
            Everything you need to know about ShieldScan.
          </motion.p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-secondary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                  activeCategory === category
                    ? 'bg-yellow-500 text-black'
                    : 'bg-dark-accent text-gray-400 hover:text-white'
                }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No questions found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-dark-accent rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left bg-dark-secondary/50 hover:bg-dark-secondary transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium pr-4">{item.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-dark-secondary/30 border-t border-dark-accent">
                        <p className="text-gray-400 leading-relaxed">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center mt-12 p-8 bg-dark-secondary/50 border border-dark-accent rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <MessageCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-400 mb-4">
            Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
