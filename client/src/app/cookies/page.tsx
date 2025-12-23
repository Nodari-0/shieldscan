'use client';

import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import CookieSettingsButton from '@/components/cookies/CookieSettingsButton';
import { Cookie, Lock, Settings, BarChart3, Target, Shield, Calendar, Globe, Mail } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Cookie className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-heading mb-4">
            Cookie Policy
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            This policy explains how ShieldScan uses cookies and similar technologies to recognize you when you visit our website.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: December 2024</span>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="mb-12 p-6 bg-dark-secondary border border-yellow-500/30 rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Manage Your Cookie Preferences</h2>
              <p className="text-sm text-gray-400">Update your cookie settings at any time</p>
            </div>
            <CookieSettingsButton variant="full" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 text-gray-300">
          {/* What Are Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-4 flex items-center gap-3">
              <Cookie className="w-6 h-6 text-yellow-500" />
              What Are Cookies?
            </h2>
            <p className="leading-relaxed mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p className="leading-relaxed">
              Cookies allow us to recognize your device and remember your preferences, providing you with a better browsing experience. They also help us understand how you use our website so we can improve it.
            </p>
          </section>

          {/* Types of Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-yellow-500" />
              Types of Cookies We Use
            </h2>

            <div className="space-y-6">
              {/* Essential */}
              <div className="p-6 bg-green-500/5 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Essential Cookies</h3>
                    <span className="text-xs text-green-400">Always Active</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  These cookies are strictly necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-accent">
                        <th className="px-4 py-2 text-left text-gray-500">Cookie Name</th>
                        <th className="px-4 py-2 text-left text-gray-500">Purpose</th>
                        <th className="px-4 py-2 text-left text-gray-500">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-400">
                      <tr className="border-b border-dark-accent/50">
                        <td className="px-4 py-2 font-mono text-xs">session_id</td>
                        <td className="px-4 py-2">User session management</td>
                        <td className="px-4 py-2">Session</td>
                      </tr>
                      <tr className="border-b border-dark-accent/50">
                        <td className="px-4 py-2 font-mono text-xs">csrf_token</td>
                        <td className="px-4 py-2">Security protection</td>
                        <td className="px-4 py-2">Session</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-xs">cookie_consent</td>
                        <td className="px-4 py-2">Stores your cookie preferences</td>
                        <td className="px-4 py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Functional */}
              <div className="p-6 bg-blue-500/5 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Functional Cookies</h3>
                    <span className="text-xs text-blue-400">Optional</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we use on our pages.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Remember your login state</li>
                  <li>• Store your language preferences</li>
                  <li>• Remember your theme settings (dark/light mode)</li>
                  <li>• Store your recently viewed scans</li>
                </ul>
              </div>

              {/* Analytics */}
              <div className="p-6 bg-purple-500/5 border border-purple-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Analytics Cookies</h3>
                    <span className="text-xs text-purple-400">Optional</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our services.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Track page views and navigation paths</li>
                  <li>• Measure feature usage statistics</li>
                  <li>• Monitor errors and performance</li>
                  <li>• Conduct A/B testing for improvements</li>
                </ul>
              </div>

              {/* Marketing */}
              <div className="p-6 bg-yellow-500/5 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Marketing Cookies</h3>
                    <span className="text-xs text-yellow-400">Optional</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.
                </p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Show personalized recommendations</li>
                  <li>• Enable social media integration</li>
                  <li>• Measure advertising effectiveness</li>
                  <li>• Track referral sources</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to Control Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-4 flex items-center gap-3">
              <Settings className="w-6 h-6 text-yellow-500" />
              How to Control Cookies
            </h2>
            <p className="leading-relaxed mb-4">
              You can control and manage cookies in various ways:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span><strong className="text-white">Cookie Settings:</strong> Use our cookie preference center to manage which types of cookies you accept.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span><strong className="text-white">Browser Settings:</strong> Most browsers allow you to refuse cookies or delete existing cookies through their settings.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span><strong className="text-white">Opt-out Tools:</strong> You can opt out of analytics cookies using tools like Google Analytics Opt-out Browser Add-on.</span>
              </li>
            </ul>
            <div className="p-4 bg-dark-secondary rounded-xl">
              <CookieSettingsButton variant="full" />
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-yellow-500" />
              Third-Party Cookies
            </h2>
            <p className="leading-relaxed mb-4">
              Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. These include:
            </p>
            <ul className="space-y-2 text-gray-400">
              <li>• <strong className="text-white">Google Analytics</strong> - Web analytics service</li>
              <li>• <strong className="text-white">Firebase</strong> - Authentication and hosting services</li>
              <li>• <strong className="text-white">Stripe</strong> - Payment processing (if you make a purchase)</li>
            </ul>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-4 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-yellow-500" />
              Updates to This Policy
            </h2>
            <p className="leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We encourage you to review this policy periodically. The date at the top of this page indicates when this policy was last updated.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white font-heading mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-yellow-500" />
              Contact Us
            </h2>
            <p className="leading-relaxed mb-4">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <div className="p-4 bg-dark-secondary border border-dark-accent rounded-xl">
              <p className="text-yellow-500 font-semibold">privacy@shieldscan.com</p>
              <p className="text-gray-400 text-sm mt-1">ShieldScan Privacy Team</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

