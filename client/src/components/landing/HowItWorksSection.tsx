'use client';

import { motion } from 'framer-motion';
import { Globe, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Enter Your URL',
      description: 'Simply paste your website URL into our scanner. No installation, no configuration needed.',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
    },
    {
      number: '02',
      title: 'AI-Powered Scan',
      description: 'Our advanced algorithms scan for 28+ vulnerabilities including SSL, headers, XSS, and more.',
      icon: ShieldCheck,
      color: 'from-yellow-500 to-orange-500',
      bgGlow: 'bg-yellow-500/20',
    },
    {
      number: '03',
      title: 'Get Report & Fix',
      description: 'Receive a detailed security report with actionable recommendations to fix vulnerabilities.',
      icon: FileCheck,
      color: 'from-yellow-500 to-emerald-500',
      bgGlow: 'bg-yellow-500/20',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-sm font-medium mb-4"
          >
            Simple Process
          </motion.span>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Works</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Secure your website in three simple steps. No technical expertise required.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-yellow-500 to-yellow-500 transform -translate-y-1/2 opacity-20" />
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="relative cursor-pointer"
              >
                {/* Card */}
                <div className="relative group">
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 ${step.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative bg-dark-secondary/80 backdrop-blur-sm border border-dark-accent rounded-2xl p-8 hover:border-gray-700 transition-all duration-300 h-full">
                    {/* Step number */}
                    <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-sm">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} p-0.5 mb-6`}>
                      <div className="w-full h-full bg-dark-secondary rounded-xl flex items-center justify-center">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>

                    {/* Arrow connector for mobile */}
                    {index < steps.length - 1 && (
                      <div className="lg:hidden flex justify-center mt-6">
                        <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop arrow connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <div className="w-12 h-12 rounded-full bg-dark-secondary border border-dark-accent flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
          >
            Start Free Scan
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-3">No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}
