'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-dark-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo/ShieldScanLogo.png"
                  alt="ShieldScan Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold font-display text-yellow-500">ShieldScan</span>
            </Link>
            <Link href="/" className="text-gray-300 hover:text-yellow-500 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 text-center bg-gradient-to-b from-black to-dark-secondary">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
              <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-yellow-500 font-semibold text-sm">PARTNERSHIP PROGRAM</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-heading">
              Partner with <span className="text-yellow-500">ShieldScan</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Join our growing ecosystem of partners and help businesses worldwide secure their digital assets.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-semibold shadow-lg shadow-yellow-500/20"
            >
              Become a Partner
            </Link>
          </div>
        </section>

        {/* Partnership Types */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Partnership <span className="text-yellow-500">Opportunities</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose the partnership model that aligns with your business goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Technology Partners */}
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-yellow-500/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">Technology Partners</h3>
              <p className="text-gray-300 mb-6">
                Integrate ShieldScan into your security stack and enhance your offerings.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• API Access</li>
                <li>• White-label Options</li>
                <li>• Revenue Share</li>
              </ul>
            </div>

            {/* Agency Partners */}
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-yellow-500/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">Agency Partners</h3>
              <p className="text-gray-300 mb-6">
                Offer premium security scanning services to your clients under your brand.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Custom Branding</li>
                <li>• Priority Support</li>
                <li>• Volume Discounts</li>
              </ul>
            </div>

            {/* Reseller Partners */}
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-yellow-500/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">Reseller Partners</h3>
              <p className="text-gray-300 mb-6">
                Distribute ShieldScan to your customer base and earn competitive margins.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Attractive Margins</li>
                <li>• Sales Support</li>
                <li>• Marketing Materials</li>
              </ul>
            </div>

            {/* Global Partners */}
            <div className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-yellow-500/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">Global Partners</h3>
              <p className="text-gray-300 mb-6">
                Expand ShieldScan's reach in your region as an exclusive distribution partner.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Territory Rights</li>
                <li>• Co-marketing</li>
                <li>• Dedicated Manager</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-dark-secondary">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
                Why Partner with <span className="text-yellow-500">Us</span>?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-dark-primary border border-dark-accent rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Revenue Growth</h3>
                <p className="text-gray-400 text-sm">Generate new revenue streams</p>
              </div>

              <div className="bg-dark-primary border border-dark-accent rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Trusted Security</h3>
                <p className="text-gray-400 text-sm">Enterprise-grade solutions</p>
              </div>

              <div className="bg-dark-primary border border-dark-accent rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Fast Integration</h3>
                <p className="text-gray-400 text-sm">Quick and easy setup</p>
              </div>

              <div className="bg-dark-primary border border-dark-accent rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Partner Benefits</h3>
                <p className="text-gray-400 text-sm">Exclusive tools & support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Network */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Our Growing <span className="text-yellow-500">Network</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join hundreds of partners already working with ShieldScan
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {['CloudSec', 'WebGuard', 'SecureHost', 'DataShield', 'CyberDefense', 'NetProtect', 'SafeWeb', 'TechSecure'].map((partner, index) => (
              <div
                key={index}
                className="bg-dark-secondary border border-dark-accent rounded-lg p-8 flex items-center justify-center hover:border-yellow-500/50 transition-all cursor-pointer h-28"
              >
                <span className="text-gray-500 font-semibold">{partner}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm italic">
            *Partner names are placeholders. Partnerships are actively being established.
          </p>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-t from-black to-dark-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
              Ready to <span className="text-yellow-500">Partner</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Let's discuss how we can grow together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
              >
                Apply Now
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gray-400/50 text-white rounded-lg hover:border-yellow-500 transition-colors font-medium"
              >
                View Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark-secondary border-t border-dark-accent/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ShieldScan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

