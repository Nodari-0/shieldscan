'use client';

import { X, Check, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import { PLAN_CONFIG, PlanType } from '@/config/pricing';

// Lazy load Stripe only when needed
let stripePromise: Promise<any> | null = null;

function getStripe() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return null;
  }
  
  if (!stripePromise) {
    // Dynamic import to avoid loading Stripe.js if not configured
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) => 
      loadStripe(publishableKey)
    ).catch(() => null);
  }
  
  return stripePromise;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  scansRemaining: number;
  resetDate?: Date;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  scansRemaining,
  resetDate,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const upgradePlans: PlanType[] = ['pro', 'business'];
  const planIcons = {
    pro: <Zap className="w-6 h-6 text-purple-500" />,
    business: <Shield className="w-6 h-6 text-yellow-500" />,
  };

  const handleUpgrade = async (plan: PlanType) => {
    try {
      // Check if Stripe is configured
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        alert('Payment processing is not yet configured. Please contact support at support@shieldscan.io for upgrade options.');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval: 'month', // Default to monthly
          userId: null, // Will be set on server if authenticated
          userEmail: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-secondary border border-yellow-500/30 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white font-heading mb-2">
              Monthly Scan Limit Reached
            </h2>
            <p className="text-gray-400">
              You've used all {scansRemaining === 0 ? 'your available scans' : `${scansRemaining} scans`} this month.
              {resetDate && (
                <span className="block mt-1 text-sm">
                  Resets on {resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Upgrade Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {upgradePlans.map((plan) => {
            const config = PLAN_CONFIG[plan];
            const isRecommended = plan === 'pro';

            return (
              <div
                key={plan}
                className={`relative p-6 rounded-xl border ${
                  isRecommended
                    ? 'border-purple-500/50 bg-purple-500/5'
                    : 'border-dark-accent bg-dark-primary/50'
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                    RECOMMENDED
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  {planIcons[plan]}
                  <div>
                    <h3 className="text-xl font-bold text-white">{config.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {config.scansLimit === -1
                        ? 'Custom limits'
                        : `${config.scansLimit} scans/month`}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">${config.price.monthly}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    or ${Math.round(config.price.yearly / 12)}/month if paid annually
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {config.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    isRecommended
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                  }`}
                >
                  Upgrade to {config.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-dark-accent">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-400">
              Need more?{' '}
              <button
                onClick={() => window.open('mailto:support@shieldscan.io', '_blank')}
                className="text-yellow-500 hover:text-yellow-400 underline"
              >
                Contact us for Enterprise plans
              </button>
            </p>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

