'use client';

import { useState, useEffect } from 'react';
import { LucideIcon, Bell, CheckCircle, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: Feature[];
  estimatedLaunch?: string;
  backLink?: string;
  backLabel?: string;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
  features = [],
  estimatedLaunch,
  backLink = '/dashboard',
  backLabel = 'Back to Dashboard',
}: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - TODO: Save to Firestore waitingList collection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubscribed(true);
    setIsLoading(false);
    toast.success('You\'ll be notified when this feature launches!');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Back link */}
        <div
          className={`absolute top-8 left-8 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}
        >
          <Link
            href={backLink}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto text-center">
          {/* Animated icon */}
          <div
            className={`mb-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-3xl flex items-center justify-center">
                <Icon className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-yellow-400 to-purple-400">
              {title}
            </span>
          </h1>

          {/* Description */}
          <p
            className={`text-lg text-gray-400 mb-8 max-w-md mx-auto transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            {description}
          </p>

          {/* Estimated launch badge */}
          {estimatedLaunch && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-full mb-10 transition-all duration-500 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-sm">Estimated Launch:</span>
              <span className="text-white font-medium">{estimatedLaunch}</span>
            </div>
          )}

          {/* Features grid */}
          {features.length > 0 && (
            <div
              className={`mb-10 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                What to Expect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className={`p-4 bg-dark-secondary/50 border border-dark-accent rounded-xl text-left hover:border-purple-500/30 transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                  >
                    <feature.icon className="w-6 h-6 text-purple-400 mb-2" />
                    <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email subscription */}
          <div
            className={`max-w-md mx-auto transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '700ms' }}
          >
            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-dark-secondary border border-dark-accent rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Notify Me
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-400">You're on the list! We'll email you when this launches.</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p
            className={`mt-8 text-gray-600 text-sm transition-all duration-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '900ms' }}
          >
            We're working hard to bring you the best experience.
          </p>
        </div>
      </div>
    </div>
  );
}
