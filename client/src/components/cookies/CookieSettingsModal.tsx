'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings, X, Check, ChevronDown, ChevronUp, Lock, BarChart3, Target, Trash2, RefreshCw } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettingsModal({ isOpen, onClose }: CookieSettingsModalProps) {
  const { preferences, updatePreferences, resetPreferences } = useCookieConsent();
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Sync local state when modal opens
  useState(() => {
    setLocalPrefs(preferences);
  });

  const handleSave = () => {
    updatePreferences(localPrefs);
    onClose();
  };

  const handleReset = () => {
    if (confirm('This will reset all cookie preferences. You will see the consent banner again. Continue?')) {
      resetPreferences();
      onClose();
      // Reload to show banner again
      window.location.reload();
    }
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
    },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-b from-dark-secondary to-black border border-purple-500/30 shadow-2xl shadow-purple-500/10 transition-all">
                {/* Header */}
                <div className="p-6 border-b border-dark-accent flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-white font-heading">
                        Cookie Preferences
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">Update your cookie settings anytime</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                  {cookieCategories.map((category) => {
                    const isExpanded = expandedCategory === category.id;
                    const isEnabled = localPrefs[category.id as keyof CookiePreferences] as boolean;
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
                          
                          <button
                            onClick={() => {
                              if (!category.required) {
                                setLocalPrefs({
                                  ...localPrefs,
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

                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <ul className="space-y-1">
                              {category.details.map((detail, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current Status */}
                {preferences.timestamp && (
                  <div className="px-6 py-3 bg-dark-secondary/50 border-t border-dark-accent">
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(preferences.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 border-t border-dark-accent flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 border border-red-500/30 text-red-400 rounded-xl hover:border-red-500 hover:bg-red-500/10 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 px-6 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

