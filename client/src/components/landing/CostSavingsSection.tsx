'use client';

import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, Zap, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function CostSavingsSection() {
  const manualScanCost = 350; // Average cost per manual scan
  const proScanCost = 99 / 40; // $99/month for 40 scans
  const annualSavings = (manualScanCost - proScanCost) * 40;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500/20 rounded-xl mb-6"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingDown className="w-7 h-7 text-yellow-500" />
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading leading-tight"
            >
              Save <span className="text-yellow-500">${(annualSavings / 1000).toFixed(0)}K+</span> Annually on Security Scans
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-gray-400 mb-8"
            >
              Why hire security professionals at ${manualScanCost}+ per scan when ShieldScan delivers the same results for just <span className="text-yellow-400 font-semibold">${proScanCost.toFixed(2)} per scan</span>?
            </motion.p>

            {/* Quick Comparison */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-8"
              variants={staggerContainer}
            >
              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-dark-secondary border border-red-500/30 rounded-xl p-6 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-semibold text-gray-400">Manual Scans</h3>
                </div>
                <div className="text-3xl font-bold text-red-400 mb-1">${manualScanCost}+</div>
                <div className="text-xs text-gray-500">Per scan</div>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-dark-secondary border border-yellow-500/30 rounded-xl p-6 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-gray-400">ShieldScan</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-500 mb-1">${proScanCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Per scan</div>
              </motion.div>
            </motion.div>

            {/* Savings Highlight */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-dark-secondary border border-yellow-500/30 rounded-xl p-6 mb-8 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Your Annual Savings</p>
                  <motion.p 
                    className="text-3xl font-bold text-white font-heading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    ${(annualSavings / 1000).toFixed(0)}K+
                  </motion.p>
                  <p className="text-xs text-gray-500 mt-1">For 40 scans/year on Pro Plan</p>
                </div>
                <motion.div 
                  className="text-5xl font-bold text-yellow-500/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {((manualScanCost / proScanCost).toFixed(0))}x
                </motion.div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-5 h-5" />
                  Start Saving Today
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/savings"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-accent rounded-lg text-white hover:border-yellow-500/50 transition-colors cursor-pointer"
                >
                  Learn More About Savings
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side - AI/Human Visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="relative rounded-2xl overflow-hidden border border-yellow-500/30"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Actual Image */}
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src="/images/humanAiVr.jpg"
                  alt="AI-powered security scanning replacing manual processes"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
                
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                
                {/* Overlay Stats */}
                <motion.div 
                  className="absolute top-4 right-4 bg-dark-secondary/95 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3 shadow-xl z-10"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <p className="text-xs text-gray-400 mb-1">Cost Per Scan</p>
                  <p className="text-2xl font-bold text-yellow-500">${proScanCost.toFixed(2)}</p>
                </motion.div>

                <motion.div 
                  className="absolute bottom-4 left-4 bg-dark-secondary/95 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3 shadow-xl z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <p className="text-xs text-gray-400 mb-1">Results in</p>
                  <p className="text-2xl font-bold text-yellow-400">2-5 min</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
