'use client';

import { useState } from 'react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';
import { BookOpen, FileText, Code, LifeBuoy, Newspaper, GraduationCap, ArrowRight, Clock, Sparkles, X, ExternalLink } from 'lucide-react';

// Coming Soon Modal
function ComingSoonModal({ isOpen, onClose, resource }: {
  isOpen: boolean;
  onClose: () => void;
  resource: { title: string; description: string } | null;
}) {
  if (!isOpen || !resource) return null;

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
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{resource.title}</h2>
            <p className="text-sm text-purple-400">Coming Soon</p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">{resource.description}</p>

        <div className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">Be the First to Know</span>
          </div>
          <p className="text-gray-400 text-sm">
            Join our waitlist to get early access when this resource launches.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/register"
            className="flex-1 px-4 py-2.5 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center text-sm"
          >
            Join Waitlist
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

export default function ResourcesPage() {
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    resource: { title: string; description: string } | null;
  }>({ isOpen: false, resource: null });

  const resources = [
    {
      icon: Newspaper,
      title: 'Blog',
      description: 'Latest insights, tutorials, and security best practices from our team.',
      link: '/blog',
      coming: false,
      external: false,
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Complete guides and documentation for all ShieldScan features.',
      link: '/documentation',
      coming: false,
      external: false,
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Detailed API documentation for developers integrating ShieldScan.',
      link: '/developers',
      coming: false,
      external: false,
    },
    {
      icon: LifeBuoy,
      title: 'Help Center',
      description: 'Get answers to common questions and troubleshooting guides.',
      link: '/help',
      coming: false,
      external: false,
    },
    {
      icon: GraduationCap,
      title: 'Security Academy',
      description: 'Learn cybersecurity fundamentals and best practices through interactive courses.',
      link: '/academy',
      coming: true,
      external: false,
    },
    {
      icon: FileText,
      title: 'Case Studies',
      description: 'Real-world examples of how companies use ShieldScan to improve security.',
      link: '/case-studies',
      coming: true,
      external: false,
    },
  ];

  const handleResourceClick = (resource: typeof resources[0]) => {
    if (resource.coming) {
      setComingSoonModal({
        isOpen: true,
        resource: {
          title: resource.title,
          description: resource.description,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
              <BookOpen className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-semibold text-sm">Knowledge Base</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Resources & <span className="text-yellow-500">Learning</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to master cybersecurity and get the most out of ShieldScan.
            </p>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              const isClickable = !resource.coming;
              
              return isClickable ? (
                <Link
                  key={index}
                  href={resource.link}
                  className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-yellow-500/50 transition-all relative group cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-yellow-500/30 transition-colors">
                    <Icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-500 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-300 mb-6">{resource.description}</p>
                  
                  <div className="flex items-center text-yellow-500 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                    Explore
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ) : (
                <div
                  key={index}
                  onClick={() => handleResourceClick(resource)}
                  className="bg-dark-secondary border border-dark-accent rounded-xl p-8 hover:border-purple-500/50 transition-all relative group cursor-pointer hover:scale-[1.02]"
                >
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-400 mb-6">{resource.description}</p>
                  
                  <div className="flex items-center text-purple-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                    View Preview
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Featured Resource */}
          <div className="bg-gradient-to-r from-yellow-500/5 to-purple-500/5 border border-dark-accent rounded-2xl p-8 mb-16">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">New: Interactive Security Scanner</h3>
                <p className="text-gray-300">
                  Try our free online security scanner and get instant results. No sign-up required for your first scan.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors whitespace-nowrap"
              >
                Try Now Free
              </Link>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/30 rounded-xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest security insights, product updates, and exclusive content. 
              We're building an amazing resource library for you!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                disabled
                className="w-full px-4 py-3 bg-dark-primary border border-dark-accent rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
              />
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4">Need immediate help?</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/pricing" className="text-yellow-500 hover:text-yellow-400 font-semibold flex items-center gap-1">
                View Pricing <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/products" className="text-yellow-500 hover:text-yellow-400 font-semibold flex items-center gap-1">
                Explore Products <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="mailto:contact@shieldscan.com" className="text-yellow-500 hover:text-yellow-400 font-semibold flex items-center gap-1">
                Contact Support <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonModal.isOpen}
        onClose={() => setComingSoonModal({ isOpen: false, resource: null })}
        resource={comingSoonModal.resource}
      />
    </div>
  );
}
