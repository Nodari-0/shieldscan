'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Lock, Crown, Zap, Shield, X, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { PlanTier, TIER_COLORS, getCheckCountByPlan } from '@/config/security-checks';
import { PLAN_CONFIG } from '@/config/pricing';

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: PlanTier;
  currentPlan: PlanTier;
}

const PLAN_ICONS = {
  essential: Shield,
  cloud: Zap,
  pro: Zap,
  enterprise: Crown,
};

const PLAN_GRADIENTS = {
  essential: 'from-gray-600 to-gray-500',
  cloud: 'from-blue-600 to-blue-500',
  pro: 'from-purple-600 to-purple-500',
  enterprise: 'from-yellow-600 to-yellow-500',
};

export default function LockedFeatureModal({
  isOpen,
  onClose,
  feature,
  requiredPlan,
  currentPlan,
}: LockedFeatureModalProps) {
  const checkCounts = getCheckCountByPlan();
  const requiredPlanConfig = PLAN_CONFIG[requiredPlan];
  const PlanIcon = PLAN_ICONS[requiredPlan];
  const colors = TIER_COLORS[requiredPlan];
  const gradient = PLAN_GRADIENTS[requiredPlan];

  // Determine upgrade options
  const upgradeOptions = [];
  
  if (requiredPlan === 'cloud' || requiredPlan === 'pro' || requiredPlan === 'enterprise') {
    if (currentPlan === 'essential') {
      upgradeOptions.push({
        plan: 'cloud' as PlanTier,
        name: 'Cloud',
        price: PLAN_CONFIG.cloud.price.monthly,
        checks: checkCounts.cloud,
        features: ['40 scans/month', 'Cloud Security', 'API Security', 'Email Support'],
      });
    }
    if (currentPlan === 'essential' || currentPlan === 'cloud') {
      upgradeOptions.push({
        plan: 'pro' as PlanTier,
        name: 'Pro',
        price: PLAN_CONFIG.pro.price.monthly,
        checks: checkCounts.pro,
        features: ['100 scans/month', 'Team Access (5 users)', 'API Access', 'Priority Support'],
      });
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-dark-secondary border border-dark-accent p-6 shadow-2xl transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} mb-4`}>
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <Dialog.Title className="text-2xl font-bold text-white mb-2">
                    Upgrade to Unlock
                  </Dialog.Title>
                  <p className="text-gray-400 max-w-md mx-auto">
                    <span className="text-white font-medium">{feature}</span> requires a{' '}
                    <span className={colors.text}>{requiredPlanConfig.name}</span> plan or higher.
                  </p>
                </div>

                {/* Current Plan */}
                <div className="mb-6 p-4 bg-dark-primary rounded-xl border border-dark-accent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${TIER_COLORS[currentPlan].bg} flex items-center justify-center`}>
                        {(() => {
                          const Icon = PLAN_ICONS[currentPlan];
                          return <Icon className={`w-5 h-5 ${TIER_COLORS[currentPlan].text}`} />;
                        })()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current Plan</p>
                        <p className="text-white font-medium">{PLAN_CONFIG[currentPlan].name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Security Checks</p>
                      <p className="text-white font-medium">{checkCounts[currentPlan]} checks</p>
                    </div>
                  </div>
                </div>

                {/* Upgrade Options */}
                {upgradeOptions.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <p className="text-sm text-gray-400 font-medium">Upgrade Options</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upgradeOptions.map((option) => (
                        <div
                          key={option.plan}
                          className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                            option.plan === requiredPlan
                              ? `${TIER_COLORS[option.plan].bg} ${TIER_COLORS[option.plan].border}`
                              : 'bg-dark-primary border-dark-accent hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = PLAN_ICONS[option.plan];
                                return <Icon className={`w-5 h-5 ${TIER_COLORS[option.plan].text}`} />;
                              })()}
                              <span className="font-bold text-white">{option.name}</span>
                              {option.plan === requiredPlan && (
                                <span className={`px-2 py-0.5 rounded text-xs ${TIER_COLORS[option.plan].bg} ${TIER_COLORS[option.plan].text}`}>
                                  Required
                                </span>
                              )}
                            </div>
                            <span className="text-white font-bold">${option.price}/mo</span>
                          </div>
                          
                          <p className={`text-sm ${TIER_COLORS[option.plan].text} mb-3`}>
                            {option.checks} security checks
                          </p>

                          <ul className="space-y-1.5">
                            {option.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/pricing"
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold text-center transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} text-white hover:opacity-90`}
                    onClick={onClose}
                  >
                    View All Plans
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold bg-dark-primary border border-dark-accent text-gray-300 hover:border-gray-700 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Security Badge */}
                <p className="mt-4 text-center text-xs text-gray-500">
                  <Shield className="w-3 h-3 inline mr-1" />
                  All plans include SSL encryption and secure scanning
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

