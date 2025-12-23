'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, Building2, DollarSign, User, Shield, TrendingUp } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  source: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const stats: Stat[] = [
  {
    value: 2500000,
    suffix: '+',
    label: 'Websites hacked daily',
    source: 'Forbes, 2024',
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  {
    value: 43,
    suffix: '%',
    label: 'Cyberattacks target small businesses',
    source: 'Verizon DBIR, 2024',
    icon: Building2,
    color: 'text-orange-500',
  },
  {
    value: 4.35,
    suffix: 'M',
    prefix: '$',
    label: 'Average cost of a data breach',
    source: 'IBM Security, 2024',
    icon: DollarSign,
    color: 'text-yellow-500',
  },
  {
    value: 95,
    suffix: '%',
    label: 'Breaches caused by human error',
    source: 'World Economic Forum',
    icon: User,
    color: 'text-blue-500',
  },
];

function AnimatedCounter({ value, suffix, prefix, isVisible }: { 
  value: number; 
  suffix: string; 
  prefix?: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const duration = 2000;

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(value * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, isVisible]);

  const formatNumber = (num: number) => {
    if (value >= 1000000) {
      return (num / 1000000).toFixed(num < value ? 1 : 1);
    }
    if (value >= 1000) {
      return (num / 1000).toFixed(0);
    }
    return num.toFixed(value % 1 !== 0 ? 2 : 0);
  };

  const displayValue = isVisible ? formatNumber(count) : '0';
  
  if (value === 2500000) {
    const displayNum = isVisible ? (count / 1000000).toFixed(1) : '0';
    return (
      <span className="tabular-nums">
        {displayNum}M{suffix}
      </span>
    );
  }

  return (
    <span className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  );
}

// Threat Level Gauge Component
function ThreatGauge({ isVisible }: { isVisible: boolean }) {
  const [progress, setProgress] = useState(0);
  const targetProgress = 78; // Threat level percentage

  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setProgress(targetProgress);
    }, 500);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const getThreatColor = (level: number) => {
    if (level < 30) return '#22c55e';
    if (level < 50) return '#eab308';
    if (level < 70) return '#f97316';
    return '#ef4444';
  };

  const color = getThreatColor(progress);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-56 h-56">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
        {/* Tick marks */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 75 * Math.cos(angle);
          const y1 = 100 + 75 * Math.sin(angle);
          const x2 = 100 + 85 * Math.cos(angle);
          const y2 = 100 + 85 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.span>
        <span className="text-gray-400 text-sm mt-1">Threat Level</span>
      </div>
    </div>
  );
}

export default function ThreatStatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section 
      ref={sectionRef}
      className="py-20 relative"
    >
      {/* Red/orange ambient glow - extends beyond section for smooth blend */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-transparent via-red-500/8 to-red-500/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-[400px] h-[300px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[300px] h-[200px] bg-red-600/8 rounded-full blur-[80px] pointer-events-none" />
      {/* Fade out glow at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-t from-transparent to-red-500/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-sm font-medium mb-4"
          >
            ⚠️ The Threat is Real
          </motion.span>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Cybersecurity <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Statistics</span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Don&apos;t become another statistic. Protect your website before it&apos;s too late.
          </motion.p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Threat Gauge */}
          <motion.div
            className="lg:col-span-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-dark-secondary/50 backdrop-blur-sm border border-dark-accent rounded-2xl p-8 flex flex-col items-center">
              <ThreatGauge isVisible={isInView} />
              <div className="mt-4 text-center">
                <p className="text-white font-semibold">Global Cyber Risk Index</p>
                <p className="text-gray-500 text-sm">Based on current threat landscape</p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-400">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-red-400">+12% YoY</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, y: -3 }}
                className="relative group cursor-pointer"
              >
                {/* Card */}
                <div className="relative bg-dark-secondary/50 backdrop-blur-sm border border-dark-accent rounded-2xl p-5 hover:border-gray-700 transition-all duration-300 h-full">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-dark-accent/50 flex items-center justify-center mb-3 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>

                  {/* Number */}
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1.5`}>
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      isVisible={isInView}
                    />
                  </div>

                  {/* Label */}
                  <p className="text-gray-300 text-sm mb-2">{stat.label}</p>

                  {/* Source */}
                  <p className="text-gray-500 text-xs">Source: {stat.source}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Threat indicators */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Ransomware', trend: '+156%', color: 'text-red-500' },
            { label: 'Phishing', trend: '+89%', color: 'text-orange-500' },
            { label: 'DDoS', trend: '+67%', color: 'text-yellow-500' },
            { label: 'Zero-Day', trend: '+234%', color: 'text-purple-500' },
          ].map((threat, idx) => (
            <motion.div
              key={threat.label}
              className="bg-dark-secondary/30 border border-dark-accent rounded-xl p-4 text-center"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-gray-400 text-sm mb-1">{threat.label} Attacks</p>
              <p className={`text-xl font-bold ${threat.color}`}>{threat.trend}</p>
              <p className="text-gray-600 text-xs">vs last year</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom message */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
            <Shield className="w-5 h-5 text-yellow-500" />
            <p className="text-gray-300">
              <span className="text-white font-semibold">Your website could be next.</span>{' '}
              Scan now to find vulnerabilities before hackers do.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
