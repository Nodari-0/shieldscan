'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import ColoredTypewriter from '@/components/ui/ColoredTypewriter';
import { useAuth } from '@/hooks/useAuth';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="max-w-5xl mx-auto text-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* New Platform Tag */}
        <motion.div 
          variants={fadeInUp}
          className="inline-flex items-center px-4 py-1.5 rounded-full border border-yellow-500/50 bg-yellow-500/10 mb-8"
          whileHover={{ scale: 1.05 }}
        >
          <Shield className="w-4 h-4 text-yellow-500 mr-2" />
          <span className="text-sm text-white font-medium">AI-Powered Security Platform</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          variants={fadeInUp}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-heading"
        >
          <span className="text-white">Secure Your Website with</span>
          <br />
          <span className="flex items-center justify-center gap-3 mt-4 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Lock className="w-12 h-12 md:w-16 md:h-16 text-yellow-500" />
            </motion.div>
            <span className="text-yellow-500 font-display">Advanced Security</span>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Eye className="w-12 h-12 md:w-16 md:h-16 text-purple-500" />
            </motion.div>
          </span>
          <ColoredTypewriter />
        </motion.h1>

        {/* Sub-headline */}
        <motion.p 
          variants={fadeInUp}
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Protect your websites from vulnerabilities with automated security scans. ShieldScan detects <span className="text-green-400 font-medium">SSL issues</span>, <span className="text-red-400 font-medium">XSS vulnerabilities</span>, <span className="text-orange-400 font-medium">SQL injection risks</span>, and provides detailed reports to keep your digital assets safe.
        </motion.p>

        {/* Feature Icons */}
        <motion.div 
          variants={fadeInUp}
          className="flex items-center justify-center gap-6 mb-10 flex-wrap"
        >
          {[
            { icon: CheckCircle, color: 'text-yellow-500', text: 'SSL Verified' },
            { icon: Shield, color: 'text-yellow-500', text: 'Real-time Protection' },
            { icon: Search, color: 'text-purple-500', text: 'Deep Analysis' },
            { icon: AlertTriangle, color: 'text-red-500', text: 'Threat Detection' },
          ].map((item, index) => (
            <motion.div 
              key={item.text}
              className="flex items-center gap-2 text-gray-400 cursor-pointer"
              whileHover={{ scale: 1.1, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-sm">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="cursor-pointer group px-8 py-3 border border-gray-400/50 rounded-lg text-white hover:border-yellow-500 transition-all font-medium flex items-center gap-2"
            >
              <Shield className="w-5 h-5 group-hover:text-yellow-500 transition-colors" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Scanning'}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a
              href="#pricing"
              className="cursor-pointer px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all font-semibold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              View Pricing
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
