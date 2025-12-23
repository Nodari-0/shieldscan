'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Server, Cookie, Users, FileText, Mail, Calendar, AlertCircle, Globe } from 'lucide-react';
import Navigation from '@/components/landing/Navigation';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how ShieldScan collects, uses, and protects your information.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-500" />
                1. Introduction
              </h2>
              <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                <p>
                  ShieldScan ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website security scanning service (the "Service").
                </p>
                <p>
                  By using ShieldScan, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-500" />
                2. Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2.1 Account Information</h3>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>Email address (required for account creation)</li>
                    <li>Display name (optional, you can use an anonymous name)</li>
                    <li>Profile photo (optional, stored securely in Firebase Storage)</li>
                    <li>Authentication provider (Google, Apple, Email/Password)</li>
                    <li>Account creation and last login timestamps</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2.2 Scan Data</h3>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>URLs you scan (stored for your scan history)</li>
                    <li>Scan results and security findings</li>
                    <li>Scan timestamps and metadata</li>
                    <li>Custom tags you assign to scans</li>
                    <li>Scan duration and performance metrics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2.3 Usage Information</h3>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>Number of scans performed (to enforce plan limits)</li>
                    <li>Subscription plan and billing information (via Stripe)</li>
                    <li>Feature usage and preferences</li>
                    <li>Session information and device details</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2.4 Technical Information</h3>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>IP address (for rate limiting and security)</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Device information</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Server className="w-6 h-6 text-purple-500" />
                3. How We Use Your Information
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>We use the collected information for the following purposes:</p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li><strong className="text-white">Service Delivery:</strong> To provide, maintain, and improve our security scanning service</li>
                  <li><strong className="text-white">Account Management:</strong> To create and manage your account, authenticate users, and enforce plan limits</li>
                  <li><strong className="text-white">Scan History:</strong> To store and display your scan history, allowing you to track security changes over time</li>
                  <li><strong className="text-white">Billing:</strong> To process payments, manage subscriptions, and handle billing inquiries (via Stripe)</li>
                  <li><strong className="text-white">Communication:</strong> To send you service-related notifications, security alerts, and support responses</li>
                  <li><strong className="text-white">Analytics:</strong> To analyze usage patterns, improve our service, and develop new features</li>
                  <li><strong className="text-white">Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                  <li><strong className="text-white">Compliance:</strong> To comply with legal obligations and enforce our terms of service</li>
                </ul>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Lock className="w-6 h-6 text-purple-500" />
                4. Data Storage and Security
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We take data security seriously and implement industry-standard measures to protect your information:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li><strong className="text-white">Encryption:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS</li>
                  <li><strong className="text-white">Firebase Security:</strong> User data is stored in Google Firebase (Firestore), which provides enterprise-grade security and encryption at rest</li>
                  <li><strong className="text-white">Access Control:</strong> We implement strict access controls and authentication to ensure only authorized personnel can access your data</li>
                  <li><strong className="text-white">Regular Audits:</strong> We regularly review and update our security practices</li>
                  <li><strong className="text-white">Data Retention:</strong> We retain your data only as long as necessary to provide the Service or as required by law</li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium mb-1">Important Security Note</p>
                      <p className="text-sm text-gray-400">
                        While we implement strong security measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to protecting your data to the best of our ability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-500" />
                5. Third-Party Services
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">5.1 Google Firebase</h3>
                  <p className="text-gray-300 mb-2">
                    We use Google Firebase for:
                  </p>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>User authentication (Firebase Auth)</li>
                    <li>Database storage (Firestore)</li>
                    <li>File storage (Firebase Storage for profile photos)</li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-2">
                    Your data is subject to Google's Privacy Policy. Firebase processes data according to their security and privacy practices.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">5.2 Stripe</h3>
                  <p className="text-gray-300 mb-2">
                    We use Stripe for payment processing:
                  </p>
                  <ul className="space-y-2 text-gray-300 ml-6 list-disc">
                    <li>Payment card information is never stored on our servers</li>
                    <li>All payment data is handled securely by Stripe</li>
                    <li>We only receive transaction status and subscription information</li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-2">
                    Payment data is subject to Stripe's Privacy Policy and PCI DSS compliance standards.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">5.3 Other Services</h3>
                  <p className="text-gray-300">
                    We may use additional third-party services for analytics, error tracking, and performance monitoring. These services only receive anonymized or aggregated data and cannot personally identify you.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Cookie className="w-6 h-6 text-purple-500" />
                6. Cookies and Tracking Technologies
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li><strong className="text-white">Essential Cookies:</strong> Required for authentication and core functionality (always enabled)</li>
                  <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how you use our service (can be disabled in cookie settings)</li>
                  <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="mt-4">
                  You can manage your cookie preferences at any time by visiting our <Link href="/cookies" className="text-purple-400 hover:text-purple-300 underline">Cookie Settings</Link> page.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-500" />
                7. Your Privacy Rights
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>Depending on your location, you may have the following rights:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-dark-primary rounded-lg">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Right to Access</h4>
                      <p className="text-sm text-gray-400">Request a copy of all personal data we hold about you</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-dark-primary rounded-lg">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Right to Correction</h4>
                      <p className="text-sm text-gray-400">Update or correct inaccurate information in your account settings</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-dark-primary rounded-lg">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Right to Deletion</h4>
                      <p className="text-sm text-gray-400">Request deletion of your account and associated data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-dark-primary rounded-lg">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Server className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Right to Data Portability</h4>
                      <p className="text-sm text-gray-400">Export your scan data in a machine-readable format (CSV/JSON)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-dark-primary rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Right to Object</h4>
                      <p className="text-sm text-gray-400">Opt-out of certain data processing activities (e.g., marketing emails)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-400 font-medium mb-2">How to Exercise Your Rights</p>
                  <p className="text-sm text-gray-400">
                    You can exercise most of these rights directly in your <Link href="/account" className="text-purple-400 hover:text-purple-300 underline">Account Settings</Link>. For requests that cannot be handled through the settings, please contact us at <a href="mailto:privacy@shieldscan.io" className="text-purple-400 hover:text-purple-300 underline">privacy@shieldscan.io</a>.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-500" />
                8. Data Sharing and Disclosure
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li><strong className="text-white">Service Providers:</strong> With trusted third parties who assist in operating our service (Firebase, Stripe) under strict confidentiality agreements</li>
                  <li><strong className="text-white">Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                  <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with advance notice)</li>
                  <li><strong className="text-white">Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users</li>
                  <li><strong className="text-white">With Your Consent:</strong> When you explicitly authorize us to share information</li>
                </ul>
                <p className="mt-4">
                  We never share your scan URLs or results with third parties for marketing or advertising purposes.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-500" />
                9. Children's Privacy
              </h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  ShieldScan is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
                </p>
                <p>
                  If you believe we have inadvertently collected information from a child, please contact us immediately at <a href="mailto:privacy@shieldscan.io" className="text-purple-400 hover:text-purple-300 underline">privacy@shieldscan.io</a>, and we will take steps to delete such information.
                </p>
              </div>
            </section>

            {/* International Users */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Globe className="w-6 h-6 text-purple-500" />
                10. International Data Transfers
              </h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your country.
                </p>
                <p>
                  We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy, including:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Using Firebase's global infrastructure with appropriate security measures</li>
                  <li>Implementing Standard Contractual Clauses (SCCs) where applicable</li>
                  <li>Complying with GDPR requirements for EU users</li>
                </ul>
              </div>
            </section>

            {/* Policy Updates */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Calendar className="w-6 h-6 text-purple-500" />
                11. Changes to This Privacy Policy
              </h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the "Last Updated" date at the top of this policy</li>
                  <li>Sending an email notification for significant changes</li>
                  <li>Displaying a prominent notice on our website</li>
                </ul>
                <p>
                  Your continued use of the Service after any changes constitutes acceptance of the updated Privacy Policy.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-dark-secondary border border-dark-accent rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4 font-heading flex items-center gap-3">
                <Mail className="w-6 h-6 text-purple-500" />
                12. Contact Us
              </h2>
              <div className="text-gray-300 space-y-4">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="p-4 bg-dark-primary rounded-lg space-y-2">
                  <p><strong className="text-white">Email:</strong> <a href="mailto:privacy@shieldscan.io" className="text-purple-400 hover:text-purple-300 underline">privacy@shieldscan.io</a></p>
                  <p><strong className="text-white">Support:</strong> <a href="mailto:support@shieldscan.io" className="text-purple-400 hover:text-purple-300 underline">support@shieldscan.io</a></p>
                </div>
                <p className="text-sm text-gray-400">
                  We will respond to your inquiry within 30 days.
                </p>
              </div>
            </section>

            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-dark-accent">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy
              </Link>
              <Link href="/account" className="text-gray-400 hover:text-white transition-colors text-sm">
                Account Settings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

