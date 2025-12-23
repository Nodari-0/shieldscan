'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, X, Zap, Cloud, Crown, ArrowRight, 
  Sparkles, Clock, Users, Globe, Lock, FileText,
  Loader2, AlertCircle, CheckCircle, Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScanLimits } from '@/hooks/useScanLimits';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import toast from 'react-hot-toast';
import { PLAN_CONFIG, PlanType, getYearlySavingsPercent } from '@/config/pricing';
import { STRIPE_PRICE_IDS } from '@/config/pricing';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: typeof Shield;
  iconColor: string;
  borderColor: string;
  buttonColor: string;
  popular?: boolean;
  badge?: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
  cta: string;
  infrastructureLicenses: number;
}

// Build plans from PLAN_CONFIG
const plans: Plan[] = [
  {
    id: 'essential',
    name: PLAN_CONFIG.essential.name,
    description: PLAN_CONFIG.essential.description,
    monthlyPrice: PLAN_CONFIG.essential.price.monthly,
    yearlyPrice: PLAN_CONFIG.essential.price.yearly,
    icon: Shield,
    iconColor: 'text-gray-400',
    borderColor: 'border-dark-accent',
    buttonColor: 'bg-gray-600 hover:bg-gray-500',
    features: [
      { text: '1 scheduled scan', included: true },
      { text: 'Unlimited ad hoc scans', included: true, highlight: true },
      { text: 'Issues enriched with enhanced risk data', included: true },
      { text: 'Unlimited users', included: true },
      { text: 'Evidence-based findings', included: true },
      { text: 'API-first security scanning', included: true },
      { text: 'Developer-friendly fix suggestions', included: true },
      { text: 'Risk-based scoring', included: true },
    ],
    cta: 'Start Free Trial',
    infrastructureLicenses: PLAN_CONFIG.essential.infrastructureLicenses,
  },
  {
    id: 'cloud',
    name: PLAN_CONFIG.cloud.name,
    description: PLAN_CONFIG.cloud.description,
    monthlyPrice: PLAN_CONFIG.cloud.price.monthly,
    yearlyPrice: PLAN_CONFIG.cloud.price.yearly,
    icon: Cloud,
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/50',
    buttonColor: 'bg-blue-600 hover:bg-blue-500',
    popular: true,
    badge: 'BEST VALUE',
    features: [
      { text: 'All Essential features', included: true, highlight: true },
      { text: 'Cloud security for up to 3 AWS, Azure and Google Cloud accounts', included: true },
      { text: 'Unlimited scheduled scans', included: true },
      { text: 'Emerging Threat Scans', included: true },
      { text: 'AI security analyst', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Role based access', included: true },
      { text: '15+ integrations', included: true },
    ],
    cta: 'Start Free Trial',
    infrastructureLicenses: PLAN_CONFIG.cloud.infrastructureLicenses,
  },
  {
    id: 'pro',
    name: PLAN_CONFIG.pro.name,
    description: PLAN_CONFIG.pro.description,
    monthlyPrice: PLAN_CONFIG.pro.price.monthly,
    yearlyPrice: PLAN_CONFIG.pro.price.yearly,
    icon: Zap,
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/50',
    buttonColor: 'bg-purple-600 hover:bg-purple-500',
    features: [
      { text: 'All Cloud features', included: true, highlight: true },
      { text: 'Cloud security for up to 10 AWS, Azure and Google Cloud accounts', included: true },
      { text: 'Internal target scanning', included: true },
      { text: 'Mass deployment options for internal targets', included: true },
      { text: 'Human-verified findings (24-72h SLA)', included: true },
      { text: 'PR comments with exploit summary', included: true },
      { text: 'SARIF output', included: true },
      { text: 'Build failure on exploitable issues only', included: true },
    ],
    cta: 'Talk to Sales',
    infrastructureLicenses: PLAN_CONFIG.pro.infrastructureLicenses,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { planInfo, stripeCustomerId } = useScanLimits();
  
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [refundExpanded, setRefundExpanded] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const paymentStatus = searchParams.get('payment');
  const savingsPercent = getYearlySavingsPercent();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === 'essential') {
      if (!isAuthenticated) {
        router.push('/register');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (!isAuthenticated) {
      sessionStorage.setItem('intendedPlan', plan.id);
      sessionStorage.setItem('billingPeriod', billingPeriod);
      router.push('/login?redirect=/pricing');
      return;
    }

    if (planInfo.id === plan.id) {
      toast('You already have this plan!', { icon: '✓' });
      return;
    }

    if (plan.id === 'enterprise' || plan.cta === 'Talk to Sales') {
      window.open('mailto:sales@shieldscan.io?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      toast.error('Payment processing is not yet configured. Please contact support at support@shieldscan.io');
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
          userId: user?.uid || null,
          userEmail: user?.email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      toast.error('No subscription found');
      return;
    }

    setLoadingPlan('manage');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navigation />

      <main className="pt-24 pb-16">
        {/* Payment Status Messages */}
        {paymentStatus === 'success' && (
          <div className="max-w-3xl mx-auto px-4 mb-8">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium">Payment successful!</p>
                <p className="text-gray-400 text-sm">Your account has been upgraded. Enjoy your new features!</p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'canceled' && (
          <div className="max-w-3xl mx-auto px-4 mb-8">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-medium">Payment canceled</p>
                <p className="text-gray-400 text-sm">No worries! You can try again whenever you're ready.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center px-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
            Security that works for the 99%.
          </h1>
          <p className="text-xl text-yellow-500 font-semibold mb-4">
            Pricing that does too.
          </p>

          {isAuthenticated && planInfo && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-dark-secondary border border-dark-accent rounded-full">
              <span className="text-gray-400">Current plan:</span>
              <span className={`font-semibold ${
                planInfo.id === 'pro' || planInfo.id === 'enterprise' ? 'text-purple-400' :
                planInfo.id === 'cloud' ? 'text-blue-400' :
                'text-gray-300'
              }`}>
                {planInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-dark-secondary border border-dark-accent rounded-xl p-1.5 flex gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                billingPeriod === 'yearly'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                Save {savingsPercent}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isCurrentPlan = planInfo?.id === plan.id;
            const isLoading = loadingPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.02,
                  boxShadow: plan.popular 
                    ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' 
                    : '0 25px 50px -12px rgba(168, 85, 247, 0.15)',
                }}
                className={`relative bg-dark-secondary border rounded-2xl p-6 flex flex-col h-full cursor-pointer ${
                  plan.popular ? plan.borderColor + ' shadow-lg shadow-blue-500/10' : plan.borderColor
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                {(plan.id === 'essential' || plan.id === 'cloud') && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                      {plan.id === 'essential' ? '14-DAY FREE TRIAL' : '14-DAY FREE TRIAL'}
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
                    style={{ transformOrigin: 'center center' }}
                  >
                    <plan.icon className={`w-12 h-12 ${plan.iconColor}`} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-400 mb-1">Starting from</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">
                      {billingPeriod === 'monthly' 
                        ? (price === 0 ? 'Free' : `€${price}`)
                        : (price === 0 ? 'Free' : `€${Math.round(price / 12)}`)
                      }
                    </span>
                    {price > 0 && <span className="text-gray-400">/ month</span>}
                  </div>
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-green-400 text-sm mt-1 font-medium">
                      €{price} billed yearly
                    </p>
                  )}
                </div>

                {/* Infrastructure licenses note */}
                <p className="text-xs text-gray-500 text-center mb-4">
                  Includes {plan.infrastructureLicenses} infrastructure license{plan.infrastructureLicenses > 1 ? 's' : ''}
                </p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + i * 0.03 }}
                    >
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${feature.highlight ? 'text-green-500' : 'text-green-500'}`} />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? (feature.highlight ? 'text-white font-medium' : 'text-gray-300') : 'text-gray-500'}`}>
                        {feature.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <div className="flex-grow" />

                {isCurrentPlan ? (
                  <motion.button
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === 'manage' || plan.id === 'essential'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-semibold transition-colors bg-dark-primary border border-dark-accent text-gray-300 hover:border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingPlan === 'manage' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading...
                      </>
                    ) : plan.id === 'essential' ? (
                      'Your Current Plan'
                    ) : (
                      'Manage Subscription'
                    )}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isLoading}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${plan.buttonColor} text-white disabled:opacity-70`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                    {plan.id === 'cloud' && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Or buy via{' '}
                        <a 
                          href="https://aws.amazon.com/marketplace" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          AWS Marketplace
                        </a>
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto px-4 mt-16">
          <motion.h2 
            className="text-3xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Compare Plans
          </motion.h2>
          
          <div className="bg-dark-secondary border border-dark-accent rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-accent">
                    <th className="text-left p-4 text-white font-semibold">Features</th>
                    <th className="text-center p-4 text-white font-semibold">Essential</th>
                    <th className="text-center p-4 text-white font-semibold bg-blue-500/10">Cloud</th>
                    <th className="text-center p-4 text-white font-semibold">Pro</th>
                    <th className="text-center p-4 text-white font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Scheduled scans', essential: '1', cloud: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Ad hoc scans', essential: 'Unlimited', cloud: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Infrastructure licenses', essential: '5', cloud: '5', pro: '5', enterprise: 'Unlimited' },
                    { feature: 'Evidence-based findings', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'API-first security scanning', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'OpenAPI / Swagger ingestion', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'Developer-friendly fix suggestions', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'Risk-based scoring', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'One-click auth scanning', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'Privacy-first (GDPR-ready)', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'CI/CD integration', essential: true, cloud: true, pro: true, enterprise: true },
                    { feature: 'Cloud security (AWS, Azure, GCP)', essential: false, cloud: 'Up to 3 accounts', pro: 'Up to 10 accounts', enterprise: 'Unlimited' },
                    { feature: 'Emerging Threat Scans', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: 'AI security analyst', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: 'Advanced analytics', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: 'Role based access', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: '15+ integrations', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: 'PDF report generation', essential: false, cloud: true, pro: true, enterprise: true },
                    { feature: 'Internal target scanning', essential: false, cloud: false, pro: true, enterprise: true },
                    { feature: 'Mass deployment options', essential: false, cloud: false, pro: true, enterprise: true },
                    { feature: 'Human-verified findings (SLA)', essential: false, cloud: false, pro: '24-72h', enterprise: '24-72h' },
                    { feature: 'PR comments with exploit summary', essential: false, cloud: false, pro: true, enterprise: true },
                    { feature: 'SARIF output', essential: false, cloud: false, pro: true, enterprise: true },
                    { feature: 'Attack surface discovery', essential: false, cloud: false, pro: false, enterprise: true },
                    { feature: '1000+ attack surface checks', essential: false, cloud: false, pro: false, enterprise: true },
                    { feature: 'Proactive threat response', essential: false, cloud: false, pro: false, enterprise: true },
                    { feature: 'Custom Intruder checks', essential: false, cloud: false, pro: false, enterprise: true },
                    { feature: 'On-prem scan agent', essential: false, cloud: false, pro: false, enterprise: true },
                    { feature: 'Dedicated support', essential: false, cloud: false, pro: false, enterprise: '24/7' },
                    { feature: 'Compliance automation', essential: false, cloud: false, pro: false, enterprise: true },
                  ].map((row, i) => (
                    <motion.tr 
                      key={i}
                      className="border-b border-dark-accent/50 hover:bg-dark-primary/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                    >
                      <td className="p-4 text-gray-300">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.essential === 'boolean' ? (
                          row.essential ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-300 text-sm">{row.essential}</span>
                        )}
                      </td>
                      <td className="p-4 text-center bg-blue-500/5">
                        {typeof row.cloud === 'boolean' ? (
                          row.cloud ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-300 text-sm">{row.cloud}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-300 text-sm">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-300 text-sm">{row.enterprise}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <motion.div 
            className="p-8 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-blue-500/10 border border-dark-accent rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-heading">Enterprise</h3>
                  <p className="text-gray-400">Best for managing sprawling attack surfaces</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center sm:text-right">
                  <p className="text-3xl font-bold text-white">Custom</p>
                  <p className="text-sm text-gray-500">Contact us for pricing</p>
                </div>
                <Link
                  href="mailto:sales@shieldscan.io?subject=Enterprise Plan Inquiry"
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  Talk to Sales
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                'Attack surface discovery',
                '1000+ attack surface checks',
                'Unlimited cloud accounts',
                'Dedicated support',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto px-4 mt-20">
          <h2 
            className={`text-2xl font-bold text-white text-center mb-8 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            Why Choose ShieldScan?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe, color: 'text-blue-500', title: 'Real Security Checks', desc: 'Not simulations - actual network requests and vulnerability tests' },
              { icon: Lock, color: 'text-yellow-500', title: 'Safe & Non-Intrusive', desc: 'Passive scanning only - never exploits or damages your sites' },
              { icon: Clock, color: 'text-purple-500', title: 'Fast Results', desc: 'Complete security audit in under 30 seconds' },
              { icon: FileText, color: 'text-green-500', title: 'Detailed Reports', desc: 'Actionable insights and fixes for every issue found' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="text-center p-6 bg-dark-secondary border border-dark-accent rounded-xl cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <feature.icon className={`w-10 h-10 ${feature.color} mx-auto mb-3`} />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 mt-20">
          <motion.h2 
            className="text-2xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {[
              {
                q: "What's included in the free trial?",
                a: 'The 14-day free trial includes full access to the Cloud plan features. You can explore all scanning capabilities, cloud security integrations, and advanced analytics without any commitment.',
              },
              {
                q: 'Can I change the number of targets after I\'ve signed up?',
                a: 'Yes! You can adjust your target count at any time. Upgrades take effect immediately, and changes to your license count will be prorated.',
              },
              {
                q: 'How is your pricing calculated?',
                a: 'Pricing is based on the number of infrastructure licenses you need. Each license covers one target (domain, IP, or cloud account). Volume discounts are available for larger deployments.',
              },
              {
                q: 'Does your pricing include VAT?',
                a: 'Prices shown are exclusive of VAT. VAT will be added at checkout based on your location and applicable tax rates.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 14-day money-back guarantee on all paid plans.',
                fullText: `We offer a 14-day money-back guarantee on all paid plans.

If you are not satisfied with the service within the first 14 days, you may request a refund by contacting our support team.

Refunds apply only if less than 20% of your monthly scan allocation has been used. If excessive usage is detected, refunds may be partially or fully declined due to infrastructure and API costs.

After 14 days, all purchases are non-refundable.

Refunds are processed back to the original payment method within 5–10 business days.`
              },
              {
                q: 'Is my payment information secure?',
                a: 'Absolutely. We use Stripe for payment processing, which is PCI-DSS Level 1 certified - the highest level of payment security.',
              },
              {
                q: 'Can I use ShieldScan to meet security compliance requirements?',
                a: 'Yes! ShieldScan helps you meet requirements for SOC 2, ISO 27001, PCI DSS, HIPAA, and DORA. Our Enterprise plan includes compliance automation features.',
              },
              {
                q: 'Do you offer discounts for non-profit organizations?',
                a: 'Yes, we offer special pricing for registered non-profit organizations. Please contact our sales team for more information.',
              },
            ].map((faq, i) => {
              const isRefund = faq.q.includes('refund');
              const isExpanded = isRefund && refundExpanded === i;
              const displayText = isRefund && (faq as any).fullText 
                ? (isExpanded ? (faq as any).fullText : faq.a)
                : faq.a;

              return (
                <motion.div 
                  key={i} 
                  className="bg-dark-secondary border border-dark-accent rounded-xl p-5 hover:border-gray-700 transition-colors overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-white mb-2 flex-1">{faq.q}</h3>
                    {isRefund && (faq as any).fullText && (
                      <motion.button
                        onClick={() => setRefundExpanded(isExpanded ? null : i)}
                        className="text-yellow-500 hover:text-yellow-400 text-sm font-medium flex items-center gap-1 mt-1 flex-shrink-0 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isExpanded ? 'Read less' : 'Read more'}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isExpanded ? 'expanded' : 'collapsed'}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: 1, 
                        height: 'auto',
                        transition: { 
                          height: { duration: 0.3, ease: 'easeOut' },
                          opacity: { duration: 0.2, delay: 0.1 }
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        transition: { 
                          height: { duration: 0.2, ease: 'easeIn' },
                          opacity: { duration: 0.1 }
                        }
                      }}
                    >
                      <p className="text-gray-400 text-sm whitespace-pre-line">
                        {displayText}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto px-4 mt-20 text-center">
          <motion.div
            className="p-8 bg-dark-secondary border border-dark-accent rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Sign up for your free 14-day trial
            </h3>
            <p className="text-gray-400 mb-6">
              No credit card required. Start scanning your infrastructure today.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors"
            >
              Start today
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
