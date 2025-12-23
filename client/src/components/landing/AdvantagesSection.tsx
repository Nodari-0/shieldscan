'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function AdvantagesSection() {
  const advantages = [
    { text: 'Accessible 24/7 Support', icon: '💬' },
    { text: 'Impeccable User Experience', icon: '✨' },
    { text: 'Useful API Integrations', icon: '🔗' },
    { text: 'Future-Proof Technology', icon: '🚀' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Image with Dashboard Mockup */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image Container */}
            <motion.div 
              className="relative rounded-2xl overflow-hidden border border-dark-accent/50 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Placeholder for dashboard image - using gradient background */}
              <div className="aspect-[4/3] bg-gradient-to-br from-dark-secondary via-dark-tertiary to-dark-primary p-8">
                {/* Dashboard Mockup */}
                <div className="h-full rounded-xl bg-dark-primary/80 border border-dark-accent p-6 backdrop-blur">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                      </motion.div>
                      <div>
                        <div className="text-white font-semibold text-sm">Security Dashboard</div>
                        <div className="text-gray-500 text-xs">Real-time monitoring</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.span 
                        className="w-2 h-2 rounded-full bg-yellow-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-yellow-500 text-xs">Live</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div 
                      className="bg-dark-secondary/50 rounded-lg p-4 border border-dark-accent/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl font-bold text-yellow-500">847</div>
                      <div className="text-gray-400 text-xs">Threats Blocked</div>
                    </motion.div>
                    <motion.div 
                      className="bg-dark-secondary/50 rounded-lg p-4 border border-dark-accent/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl font-bold text-yellow-500">99.8%</div>
                      <div className="text-gray-400 text-xs">Security Score</div>
                    </motion.div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-dark-secondary/30 rounded-lg p-4 border border-dark-accent/30">
                    <div className="flex items-end justify-between h-20 gap-2">
                      {[40, 65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          style={{
                            background: i % 2 === 0 
                              ? 'linear-gradient(to top, #eab308, #facc15)' 
                              : 'linear-gradient(to top, #a855f7, #c084fc)'
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card */}
            <motion.div 
              className="absolute -bottom-8 -right-8 bg-dark-secondary border border-dark-accent rounded-xl p-4 shadow-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#2a3441" strokeWidth="4" fill="none" />
                    <motion.circle 
                      cx="32" cy="32" r="28" 
                      stroke="url(#gradient)" 
                      strokeWidth="4" 
                      fill="none"
                      strokeDasharray="176"
                      initial={{ strokeDashoffset: 176 }}
                      whileInView={{ strokeDashoffset: 26 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#eab308" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">85%</span>
                  </div>
                </div>
                <div>
                  <div className="text-white font-bold">Protected</div>
                  <div className="text-gray-400 text-xs">All systems secure</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-white mb-2 font-heading"
            >
              Advantages To Using
            </motion.h2>
            <motion.h3 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-yellow-500 mb-6 font-heading"
            >
              ShieldScan
            </motion.h3>

            <motion.p 
              variants={fadeInUp}
              className="text-gray-300 text-lg mb-8 leading-relaxed"
            >
              Thousands of businesses worldwide choose ShieldScan to manage their cybersecurity needs. 
              Experience the difference. Security updates are deployed automatically, ensuring your 
              system stays protected against the latest threats without intervention. 🛡️
            </motion.p>

            {/* Advantages Grid */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-8"
              variants={staggerContainer}
            >
              {advantages.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-3 cursor-pointer"
                  variants={fadeInUp}
                  whileHover={{ x: 10, scale: 1.02 }}
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">{item.icon} {item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-accent rounded-full text-white hover:border-yellow-500 transition-all group cursor-pointer"
              >
                <span>Why ShieldScan</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
