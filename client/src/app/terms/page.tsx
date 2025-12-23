'use client';

import Link from 'next/link';
import { FileText, Calendar } from 'lucide-react';
import Navigation from '@/components/landing/Navigation';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500/20 rounded-xl mb-6">
              <FileText className="w-7 h-7 text-yellow-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Terms of Service
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Please read these terms carefully before using ShieldScan.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-gray max-w-none">
            
            {/* 1. Acceptance */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                By accessing or using ShieldScan ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                These Terms apply to all visitors, users, and others who access or use the Service. By using ShieldScan, you represent that you are at least 18 years of age and have the legal capacity to enter into these Terms.
              </p>
            </section>

            {/* 2. Description */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                2. Description of Service
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                ShieldScan is a website security scanning service that analyzes websites for vulnerabilities, misconfigurations, and security issues. The Service includes:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Automated security scans for SSL/TLS, HTTP headers, DNS, and common vulnerabilities</li>
                <li>Security reports with findings and recommendations</li>
                <li>Scan history and tracking</li>
                <li>API access for programmatic scanning (on applicable plans)</li>
                <li>Scheduled and automated scanning (on applicable plans)</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                The Service is provided "as is" and we make no guarantees regarding the detection of all security vulnerabilities.
              </p>
            </section>

            {/* 3. User Accounts */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                3. User Accounts
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To access certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activity.
              </p>
            </section>

            {/* 4. Acceptable Use */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                4. Acceptable Use Policy
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You agree to use ShieldScan only for lawful purposes. You may NOT:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Scan websites you do not own or have explicit authorization to test</li>
                <li>Use the Service to conduct denial-of-service attacks or overwhelm target servers</li>
                <li>Attempt to exploit vulnerabilities discovered through scans</li>
                <li>Use scan results for malicious purposes, including hacking, data theft, or extortion</li>
                <li>Resell, redistribute, or commercialize scan results without authorization</li>
                <li>Circumvent rate limits, plan restrictions, or technical limitations</li>
                <li>Use automated tools to abuse or overload the Service</li>
                <li>Impersonate others or misrepresent your affiliation with any entity</li>
                <li>Interfere with the proper functioning of the Service</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Violation of this policy may result in immediate account termination and potential legal action.
              </p>
            </section>

            {/* 5. Authorization */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                5. Scanning Authorization
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                By initiating a scan, you represent and warrant that:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>You own the website or have explicit written authorization from the owner to perform security scans</li>
                <li>The scan will not violate any applicable laws, regulations, or third-party rights</li>
                <li>You accept full responsibility for any consequences resulting from the scan</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                ShieldScan is not responsible for any damages, legal issues, or disputes arising from unauthorized scanning. You agree to indemnify and hold us harmless from any claims related to your use of the Service.
              </p>
            </section>

            {/* 6. Subscription & Payment */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                6. Subscription and Payment
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                ShieldScan offers both free and paid subscription plans. For paid plans:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Payments are processed securely through Stripe</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>Refunds are available within 14 days of initial purchase for new subscribers</li>
                <li>Unused scans do not roll over to the next billing period</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access to paid features until the end of your current billing period.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any plan at any time with reasonable notice.
              </p>
            </section>

            {/* 7. Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                7. Intellectual Property
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Service, including its design, features, code, and content, is owned by ShieldScan and protected by intellectual property laws. You may not:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Copy, modify, or distribute any part of the Service without permission</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code</li>
                <li>Remove or alter any proprietary notices or labels</li>
                <li>Use our trademarks, logos, or branding without written consent</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Your scan results and data remain your property. We claim no ownership over the content you submit or generate through the Service.
              </p>
            </section>

            {/* 8. Disclaimer */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Merchantability and fitness for a particular purpose</li>
                <li>Accuracy, completeness, or reliability of scan results</li>
                <li>Detection of all security vulnerabilities</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Security of data transmitted through the Service</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Security scanning is not a substitute for comprehensive security audits, penetration testing, or professional security consultation. You are solely responsible for your website's security.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIELDSCAN SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, data, goodwill, or other intangible losses</li>
                <li>Damages resulting from unauthorized access or data breaches</li>
                <li>Damages resulting from errors, omissions, or inaccuracies in scan results</li>
                <li>Damages resulting from your reliance on the Service</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Our total liability for any claims arising from these Terms or use of the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </section>

            {/* 10. Indemnification */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                10. Indemnification
              </h2>
              <p className="text-gray-300 leading-relaxed">
                You agree to indemnify, defend, and hold harmless ShieldScan, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorney's fees) arising from:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mt-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Unauthorized scanning or misuse of scan results</li>
                <li>Any content you submit or transmit through the Service</li>
              </ul>
            </section>

            {/* 11. Termination */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                11. Termination
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment of subscription fees</li>
                <li>Upon your request</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
              </p>
            </section>

            {/* 12. Governing Law */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                12. Governing Law and Disputes
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Any disputes arising from these Terms or use of the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration or in a court of competent jurisdiction.
              </p>
            </section>

            {/* 13. Changes */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                13. Changes to Terms
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc ml-6 mb-4">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending email notification for significant changes</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using the Service.
              </p>
            </section>

            {/* 14. Miscellaneous */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                14. Miscellaneous
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Entire Agreement:</strong> These Terms constitute the entire agreement between you and ShieldScan regarding the Service and supersede all prior agreements.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
              </p>
            </section>

            {/* 15. Contact */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-dark-accent">
                15. Contact Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="text-gray-300 space-y-1">
                <p><strong className="text-white">Email:</strong> <a href="mailto:legal@shieldscan.io" className="text-yellow-400 hover:text-yellow-300">legal@shieldscan.io</a></p>
                <p><strong className="text-white">Support:</strong> <a href="mailto:support@shieldscan.io" className="text-yellow-400 hover:text-yellow-300">support@shieldscan.io</a></p>
              </div>
            </section>

          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 mt-8 border-t border-dark-accent text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

