'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';
import { Building2, Users, Rocket, Code2, ArrowRight, X, Play, Sparkles, Clock, Zap } from 'lucide-react';

// Demo Modal Component
function DemoModal({ isOpen, onClose, solution }: { 
  isOpen: boolean; 
  onClose: () => void; 
  solution: { title: string; features: string[]; color: string } | null 
}) {
  if (!isOpen || !solution) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-dark-secondary border border-dark-accent rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 bg-${solution.color}-500/20 rounded-xl flex items-center justify-center`}>
            <Sparkles className={`w-6 h-6 text-${solution.color}-500`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{solution.title}</h2>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">In Development</span>
          </div>
          <p className="text-gray-300">
            We're actively building this feature! Join our waitlist to be the first to know when it launches.
          </p>
        </div>

        {/* Features Preview */}
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">What's Coming:</h3>
          <div className="grid grid-cols-2 gap-3">
            {solution.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-400">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Development Progress</span>
            <span className="text-yellow-500">60%</span>
          </div>
          <div className="h-2 bg-dark-accent rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: '60%' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/register"
            className="flex-1 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center"
          >
            Join Waitlist
          </Link>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-dark-accent rounded-lg text-white hover:border-yellow-500/50 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolutionsPage() {
  const router = useRouter();
  const [demoModal, setDemoModal] = useState<{ 
    isOpen: boolean; 
    solution: { title: string; features: string[]; color: string } | null 
  }>({ isOpen: false, solution: null });

  const solutions = [
    {
      icon: Code2,
      title: 'For Developers',
      description: 'Ship secure code with confidence. Integrate our scanning tools into your development workflow.',
      features: [
        'API integration for automated scanning',
        'CI/CD pipeline integration',
        'Real-time vulnerability alerts',
        'Developer-friendly documentation',
      ],
      status: 'coming_soon_demo',
      link: '/developers',
      color: 'green',
      demoAvailable: true,
    },
    {
      icon: Users,
      title: 'For Agencies',
      description: 'Manage multiple client websites with ease. Deliver security as a service to your clients.',
      features: [
        'Multi-website dashboard',
        'White-label PDF reports',
        'Client collaboration tools',
        'Bulk scanning capabilities',
      ],
      status: 'coming_soon',
      link: null,
      color: 'purple',
      demoAvailable: true,
    },
    {
      icon: Building2,
      title: 'For Enterprises',
      description: 'Enterprise-grade security scanning with advanced features and dedicated support.',
      features: [
        'Custom security rules',
        'SSO integration',
        'Dedicated account manager',
        'SLA guarantees',
      ],
      status: 'coming_soon',
      link: null,
      color: 'yellow',
      demoAvailable: true,
    },
    {
      icon: Rocket,
      title: 'For Startups',
      description: 'Build secure products from day one. Special pricing and support for early-stage companies.',
      features: [
        'Startup-friendly pricing',
        'Fast onboarding',
        'Growth-ready infrastructure',
        'Community support',
      ],
      status: 'coming_soon',
      link: null,
      color: 'red',
      demoAvailable: true,
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'hover:border-yellow-500/50' };
      case 'purple':
        return { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'hover:border-purple-500/50' };
      case 'yellow':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'hover:border-yellow-500/50' };
      case 'red':
        return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'hover:border-red-500/50' };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'hover:border-yellow-500/50' };
    }
  };

  const handleCardClick = (solution: typeof solutions[0]) => {
    if (solution.status === 'available' && solution.link) {
      router.push(solution.link);
    } else if (solution.demoAvailable) {
      setDemoModal({
        isOpen: true,
        solution: {
          title: solution.title,
          features: solution.features,
          color: solution.color,
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
            <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-400 mr-2" />
              <span className="text-purple-400 font-semibold text-sm">Building the Future</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-heading">
              Security Solutions for <span className="text-yellow-500">Everyone</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-body">
              Whether you're a developer, agency, enterprise, or startup, we have the right security solution for you.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              const colors = getColorClasses(solution.color);
              
              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(solution)}
                  className={`bg-dark-secondary border border-dark-accent rounded-2xl p-8 transition-all relative group cursor-pointer hover:scale-[1.02] hover:shadow-lg ${colors.border}`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {solution.status === 'coming_soon_demo' ? (
                      <span className="bg-yellow-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Play className="w-3 h-3" /> Preview Demo
                      </span>
                    ) : solution.status === 'coming_soon' ? (
                      <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Coming Soon
                      </span>
                    ) : (
                      <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                        Available <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  
                  <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 font-heading">{solution.title}</h3>
                  <p className="text-gray-300 mb-6 font-body">{solution.description}</p>
                  
                  <ul className="space-y-3 font-body">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-400">
                        <span className={`${colors.text} mr-2`}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Click indicator */}
                  <div className="mt-6 pt-6 border-t border-dark-accent">
                    <span className={`${colors.text} font-semibold flex items-center gap-2 group-hover:gap-3 transition-all`}>
                      {solution.status === 'coming_soon_demo' || solution.status === 'coming_soon' 
                        ? 'View Preview' 
                        : 'Explore Tools'
                      }
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 font-heading">
              Not sure which solution fits your needs?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto font-body">
              Our team is here to help you find the perfect security solution for your business. 
              Get in touch and we'll guide you through the process.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
              >
                Start Free Trial
              </Link>
              <Link
                href="mailto:contact@shieldscan.com"
                className="px-8 py-3 border border-gray-400/50 rounded-lg text-white hover:border-gray-300 transition-colors font-medium"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Demo Modal */}
      <DemoModal 
        isOpen={demoModal.isOpen} 
        onClose={() => setDemoModal({ isOpen: false, solution: null })}
        solution={demoModal.solution}
      />
    </div>
  );
}
