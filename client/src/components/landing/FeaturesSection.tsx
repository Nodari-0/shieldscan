'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Globe, Shield, Zap, Cloud, Server, Search, 
  AlertCircle, BarChart, FileCheck, Eye, Code, Radar,
  ArrowRight
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Shield, Zap, Cloud, Server, Search,
  AlertCircle, BarChart, FileCheck, Eye, Code, Radar
};

export default function FeaturesSection() {
  const mainFeatures = [
    {
      icon: 'Globe',
      title: 'External Scanning',
      subtitle: 'Infrastructure security',
      description: 'Comprehensive vulnerability scanning for your public-facing infrastructure, including web servers, APIs, and network services.',
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/10',
    },
    {
      icon: 'Radar',
      title: 'Attack Surface Monitoring',
      subtitle: 'Respond to changes',
      description: 'Continuous monitoring of your digital footprint to detect new assets, exposed services, and potential entry points.',
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/10',
    },
    {
      icon: 'Zap',
      title: 'DAST',
      subtitle: 'Secure web apps',
      description: 'Dynamic Application Security Testing that simulates real-world attacks to identify vulnerabilities before attackers do.',
      color: 'yellow',
      gradient: 'from-yellow-500/20 to-yellow-600/10',
    },
  ];

  const securityFeatures = [
    {
      icon: 'Shield',
      title: 'Website Security',
      description: '140k+ checks',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: 'AlertCircle',
      title: 'Risk-Based Prioritization',
      description: 'No more alert fatigue',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: 'Code',
      title: 'API Security',
      description: 'Test your APIs',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: 'Search',
      title: 'Asset Discovery',
      description: 'Reveal unknown targets',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: 'Eye',
      title: 'Emerging Threat Detection',
      description: 'Check and act fast',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: 'Cloud',
      title: 'CSPM',
      description: 'Daily cloud config checks',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: 'FileCheck',
      title: 'Compliance',
      description: 'SOC 2, ISO, HIPAA, DORA',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: 'BarChart',
      title: 'Cyber Hygiene Reporting',
      description: 'Demonstrate progress',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      icon: 'Server',
      title: 'Internal Scanning',
      description: 'Secure employee devices',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  const stats = [
    { value: '140K+', label: 'Security Checks', color: 'text-yellow-500' },
    { value: '50K+', label: 'Scans Completed', color: 'text-purple-500' },
    { value: '99.9%', label: 'Uptime Guarantee', color: 'text-blue-500' },
    { value: '24/7', label: 'Expert Support', color: 'text-green-500' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-[500px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm mb-6"
          >
            <Shield className="w-4 h-4" />
            <span>Complete Security Platform</span>
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading"
          >
            All-in-One Solution for
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold font-heading mb-6"
          >
            <span className="text-yellow-500">Enterprise</span>{' '}
            <span className="text-purple-500">Security</span>
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            From external scanning to internal security, we protect every layer of your infrastructure
          </motion.p>
        </motion.div>

        {/* Main Feature Cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {mainFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Shield;
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative bg-gradient-to-br ${feature.gradient} border border-dark-accent rounded-2xl p-8 hover:border-${feature.color}-500/50 transition-all duration-300 group cursor-pointer overflow-hidden`}
              >
                {/* Background decoration */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${feature.color}-500/10 rounded-full blur-2xl`} />
                
                {/* Icon */}
                <div 
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    feature.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                    feature.color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  <IconComponent className="w-7 h-7" />
                </div>
                
                {/* Subtitle */}
                <p className={`text-sm font-medium mb-2 ${
                  feature.color === 'blue' ? 'text-blue-400' :
                  feature.color === 'purple' ? 'text-purple-400' :
                  'text-yellow-400'
                }`}>
                  {feature.subtitle}
                </p>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3 font-heading group-hover:text-yellow-500 transition-colors">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Security Features Grid */}
        <motion.div
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h3 
            variants={fadeInUp}
            className="text-2xl font-bold text-white text-center mb-8"
          >
            Everything you need to stay secure
          </motion.h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {securityFeatures.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Shield;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-dark-secondary/50 border border-dark-accent rounded-xl p-5 hover:border-gray-700 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-sm mb-1 group-hover:text-yellow-500 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-gray-500 text-xs">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.1 }}
              className="text-center p-6 bg-dark-secondary/30 border border-dark-accent rounded-xl cursor-pointer"
            >
              <motion.div 
                className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-semibold transition-colors"
          >
            Explore all features
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
