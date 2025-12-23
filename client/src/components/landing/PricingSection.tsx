'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Shield, Cloud, Zap, Crown } from 'lucide-react';
import { PLAN_CONFIG, getYearlySavingsPercent } from '@/config/pricing';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function PricingSection() {
  const savingsPercent = getYearlySavingsPercent();
  
  // Show Essential, Cloud, and Pro plans (matching pricing page)
  const plans = [
    {
      id: 'essential',
      name: PLAN_CONFIG.essential.name,
      price: PLAN_CONFIG.essential.price.monthly,
      description: PLAN_CONFIG.essential.description,
      icon: Shield,
      iconColor: 'text-gray-400',
      borderColor: 'border-dark-accent',
      buttonColor: 'bg-gray-600 hover:bg-gray-500',
      features: PLAN_CONFIG.essential.features.slice(0, 4),
      blurredFeatures: PLAN_CONFIG.essential.features.slice(4),
      cta: 'Get Started Free',
      popular: false,
    },
    {
      id: 'cloud',
      name: PLAN_CONFIG.cloud.name,
      price: PLAN_CONFIG.cloud.price.monthly,
      description: PLAN_CONFIG.cloud.description,
      icon: Cloud,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/50',
      buttonColor: 'bg-blue-600 hover:bg-blue-500',
      features: PLAN_CONFIG.cloud.features.slice(0, 5),
      blurredFeatures: PLAN_CONFIG.cloud.features.slice(5),
      cta: 'Start Free Trial',
      popular: true,
      badge: 'BEST VALUE',
    },
    {
      id: 'pro',
      name: PLAN_CONFIG.pro.name,
      price: PLAN_CONFIG.pro.price.monthly,
      description: PLAN_CONFIG.pro.description,
      icon: Zap,
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/50',
      buttonColor: 'bg-purple-600 hover:bg-purple-500',
      features: PLAN_CONFIG.pro.features.slice(0, 5),
      blurredFeatures: PLAN_CONFIG.pro.features.slice(5),
      cta: 'Talk to Sales',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-sm mb-6"
          >
            <span>Save {savingsPercent}% with yearly billing</span>
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading"
          >
            Security that works for the 99%.
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-xl text-yellow-500 font-semibold mb-4"
          >
            Pricing that does too.
          </motion.p>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Choose the plan that fits your security needs
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                whileHover={{ 
                  y: -12, 
                  scale: 1.02,
                  boxShadow: plan.popular 
                    ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' 
                    : '0 25px 50px -12px rgba(168, 85, 247, 0.15)',
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25 
                }}
                className={`relative bg-dark-secondary border rounded-2xl p-6 lg:p-8 flex flex-col h-full cursor-pointer ${
                  plan.popular
                    ? `${plan.borderColor} shadow-lg shadow-blue-500/10`
                    : `${plan.borderColor} hover:border-purple-500/30`
                } ${index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}
              >
                {plan.popular && plan.badge && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {plan.badge}
                  </motion.div>
                )}

                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className={`w-8 h-8 ${plan.iconColor}`} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white font-heading">{plan.name}</h3>
                </div>

                <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline mb-2">
                  {plan.price === 0 ? (
                    <motion.span 
                      className="text-5xl font-bold text-white"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      Free
                    </motion.span>
                  ) : (
                    <>
                      <span className="text-xl text-gray-400 mr-1">Starting from</span>
                    </>
                  )}
                </div>
                {plan.price > 0 && (
                  <div className="flex items-baseline mb-6">
                    <motion.span 
                      className="text-5xl font-bold text-white"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      €{plan.price}
                    </motion.span>
                    <span className="text-xl text-gray-400 ml-2">/ month</span>
                  </div>
                )}
                {plan.price === 0 && <div className="mb-6" />}

                {/* Infrastructure licenses note */}
                <p className="text-xs text-gray-500 mb-4">
                  {plan.id === 'essential' 
                    ? 'Includes 1 infrastructure license' 
                    : 'Includes 5 infrastructure licenses'}
                </p>
                
                {/* Visible Features */}
                <ul className="space-y-3 mb-4 flex-grow">
                  {plan.features.map((feature, fIndex) => (
                    <motion.li 
                      key={fIndex} 
                      className="flex items-start text-gray-300"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: fIndex * 0.05 }}
                    >
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Blurred Features */}
                {plan.blurredFeatures.length > 0 && (
                  <div className="relative mb-8">
                    <ul className="space-y-3 blur-[3px] select-none">
                      {plan.blurredFeatures.slice(0, 3).map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start text-gray-400">
                          <Check className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Overlay hint */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-yellow-500 bg-dark-secondary/80 px-3 py-1 rounded-full border border-yellow-500/30">
                        + {plan.blurredFeatures.length} more features
                      </span>
                    </div>
                  </div>
                )}

                {/* Spacer to push button to bottom */}
                {plan.blurredFeatures.length === 0 && <div className="flex-grow mb-8" />}

                <motion.div 
                  whileHover={{ scale: 1.03 }} 
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Link
                    href={plan.cta === 'Talk to Sales' ? '/contact' : plan.id === 'essential' ? '/register' : '/pricing'}
                    className={`block w-full text-center py-3 rounded-xl font-semibold transition-colors ${plan.buttonColor} text-white`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div 
          className="mt-12 text-center p-8 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-blue-500/10 border border-dark-accent rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h3 className="text-2xl font-bold text-white font-heading">Enterprise</h3>
          </div>
          <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
            Best for managing sprawling attack surfaces. Get custom pricing, unlimited cloud accounts, 
            attack surface discovery, and dedicated support.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-colors"
          >
            Talk to Sales
          </Link>
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/pricing"
            className="text-yellow-500 hover:text-yellow-400 font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            View detailed pricing comparison and FAQ 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
