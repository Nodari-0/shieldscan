'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, Settings, Check, X, ChevronDown, ChevronUp, Lock, BarChart3, Target, Zap } from 'lucide-react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean; // Always true - required for site to function
  functional: boolean; // Remember preferences, login state
  analytics: boolean; // Usage tracking, performance
  marketing: boolean; // Personalization, ads
  timestamp: string;
  version: string;
}

const COOKIE_CONSENT_KEY = 'shieldscan_cookie_consent';
const COOKIE_VERSION = '1.0';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false,
    timestamp: '',
    version: COOKIE_VERSION,
  });

  useEffect(() => {
    // Check if consent already given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent) as CookiePreferences;
        // Check if version matches, if not, show banner again
        if (parsed.version !== COOKIE_VERSION) {
          setShowBanner(true);
        } else {
          setPreferences(parsed);
          applyPreferences(parsed);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      // Small delay before showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Apply cookie preferences to your analytics/tracking services
    if (typeof window !== 'undefined') {
      // Store in window for other scripts to check
      (window as any).__cookieConsent = prefs;

      // Enable/disable analytics
      if (prefs.analytics) {
        // Enable analytics tracking
        console.log('[Cookies] Analytics enabled');
        // Example: window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
      } else {
        console.log('[Cookies] Analytics disabled');
        // Example: window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      }

      // Enable/disable marketing
      if (prefs.marketing) {
        console.log('[Cookies] Marketing enabled');
      } else {
        console.log('[Cookies] Marketing disabled');
      }
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    const finalPrefs = {
      ...prefs,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
      version: COOKIE_VERSION,
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    applyPreferences(finalPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: '',
      version: COOKIE_VERSION,
    });
  };

  const handleAcceptNecessary = () => {
    savePreferences({
      necessary: true,
      functional: true, // Functional is needed for good UX
      analytics: false,
      marketing: false,
      timestamp: '',
      version: COOKIE_VERSION,
    });
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  const cookieCategories = [
    {
      id: 'necessary',
      name: 'Essential Cookies',
      icon: <Lock className="w-5 h-5" />,
      color: 'green',
      required: true,
      description: 'Required for the website to function. Cannot be disabled.',
      details: [
        'Session management & authentication',
        'Security tokens (CSRF protection)',
        'Cookie consent preferences',
        'Load balancing & server routing',
      ],
      cookies: [
        { name: 'session_id', purpose: 'User session identifier', duration: 'Session' },
        { name: 'csrf_token', purpose: 'Security protection', duration: 'Session' },
        { name: 'cookie_consent', purpose: 'Store your preferences', duration: '1 year' },
      ],
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      icon: <Settings className="w-5 h-5" />,
      color: 'blue',
      required: false,
      description: 'Remember your preferences and enhance your experience.',
      details: [
        'Remember login state',
        'Language & region preferences',
        'Theme settings (dark/light mode)',
        'Recently viewed scans',
      ],
      cookies: [
        { name: 'user_prefs', purpose: 'Store UI preferences', duration: '1 year' },
        { name: 'locale', purpose: 'Language preference', duration: '1 year' },
        { name: 'theme', purpose: 'Dark/light mode', duration: '1 year' },
      ],
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'purple',
      required: false,
      description: 'Help us understand how you use our service to improve it.',
      details: [
        'Page views & navigation paths',
        'Feature usage statistics',
        'Error & performance monitoring',
        'A/B testing for improvements',
      ],
      cookies: [
        { name: '_ga', purpose: 'Google Analytics ID', duration: '2 years' },
        { name: '_gid', purpose: 'Analytics session', duration: '24 hours' },
        { name: 'performance_id', purpose: 'Performance tracking', duration: '30 days' },
      ],
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      icon: <Target className="w-5 h-5" />,
      color: 'yellow',
      required: false,
      description: 'Used to show relevant content and measure ad effectiveness.',
      details: [
        'Personalized recommendations',
        'Social media integration',
        'Advertising effectiveness',
        'Referral tracking',
      ],
      cookies: [
        { name: 'fbp', purpose: 'Facebook tracking', duration: '90 days' },
        { name: 'referral', purpose: 'Track referral source', duration: '30 days' },
      ],
    },
  ];

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {!showSettings ? (
            // Main Banner
            <div className="bg-gradient-to-b from-dark-secondary to-black border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-7 h-7 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white font-heading mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-yellow-500" />
                      We Value Your Privacy
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
                      You can customize your preferences or accept all cookies to get the best experience.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <Lock className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <div className="text-xs text-green-400">Essential</div>
                    <div className="text-xs text-gray-500">Always on</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                    <Settings className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <div className="text-xs text-blue-400">Functional</div>
                    <div className="text-xs text-gray-500">Recommended</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                    <BarChart3 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <div className="text-xs text-purple-400">Analytics</div>
                    <div className="text-xs text-gray-500">Optional</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <Target className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                    <div className="text-xs text-yellow-400">Marketing</div>
                    <div className="text-xs text-gray-500">Optional</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 py-3 px-6 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="flex-1 py-3 px-6 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors font-medium"
                >
                  Essential Only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-3 px-6 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept All
                </button>
              </div>

              {/* Footer Links */}
              <div className="px-6 pb-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link href="/cookies" className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="bg-gradient-to-b from-dark-secondary to-black border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-dark-accent flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">Cookie Preferences</h2>
                    <p className="text-sm text-gray-400">Manage your cookie settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cookie Categories */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                {cookieCategories.map((category) => {
                  const isExpanded = expandedCategory === category.id;
                  const isEnabled = preferences[category.id as keyof CookiePreferences] as boolean;
                  const colorClasses = {
                    green: 'border-green-500/30 bg-green-500/5',
                    blue: 'border-blue-500/30 bg-blue-500/5',
                    purple: 'border-purple-500/30 bg-purple-500/5',
                    yellow: 'border-yellow-500/30 bg-yellow-500/5',
                  };

                  return (
                    <div
                      key={category.id}
                      className={`border rounded-xl overflow-hidden ${colorClasses[category.color as keyof typeof colorClasses]}`}
                    >
                      {/* Category Header */}
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          category.color === 'green' ? 'bg-green-500/20 text-green-500' :
                          category.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                          category.color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {category.name}
                            {category.required && (
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Required</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-400">{category.description}</p>
                        </div>
                        
                        {/* Toggle */}
                        <button
                          onClick={() => {
                            if (!category.required) {
                              setPreferences({
                                ...preferences,
                                [category.id]: !isEnabled,
                              });
                            }
                          }}
                          disabled={category.required}
                          className={`w-14 h-7 rounded-full transition-colors relative ${
                            isEnabled ? 'bg-green-500' : 'bg-gray-600'
                          } ${category.required ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-8' : 'translate-x-1'
                          }`} />
                        </button>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                          {/* What we use it for */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">What we use it for:</h4>
                            <ul className="space-y-1">
                              {category.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Cookies Table */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Cookies used:</h4>
                            <div className="bg-black/30 rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-dark-accent">
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Purpose</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {category.cookies.map((cookie, idx) => (
                                    <tr key={idx} className="border-b border-dark-accent/50 last:border-0">
                                      <td className="px-3 py-2 text-gray-300 font-mono text-xs">{cookie.name}</td>
                                      <td className="px-3 py-2 text-gray-400">{cookie.purpose}</td>
                                      <td className="px-3 py-2 text-gray-500">{cookie.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-dark-accent flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 px-6 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 px-6 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

