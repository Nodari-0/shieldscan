'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Zap, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { 
  ALL_SECURITY_CHECKS, 
  CATEGORIES, 
  TIER_COLORS, 
  getCheckCountByPlan,
  PlanTier 
} from '@/config/security-checks';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const tierFilters: { id: PlanTier | 'all'; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Checks' },
  { id: 'essential', label: 'Essential', icon: Shield },
  { id: 'cloud', label: 'Cloud', icon: Zap },
  { id: 'pro', label: 'Pro', icon: Zap },
  { id: 'enterprise', label: 'Enterprise', icon: Crown },
];

// How many checks to show initially
const INITIAL_DISPLAY_COUNT = 18;

export default function SecurityChecksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<PlanTier | 'all'>('all');
  const [hoveredCheck, setHoveredCheck] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const checkCounts = getCheckCountByPlan();
  
  // Count of actually implemented checks (be honest!)
  const IMPLEMENTED_CHECKS = 28;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Filter checks by category and tier
  const filteredChecks = ALL_SECURITY_CHECKS.filter(check => {
    const categoryMatch = !activeCategory || check.category === activeCategory;
    const tierMatch = activeTier === 'all' || check.tier === activeTier;
    return categoryMatch && tierMatch;
  });

  // Limit display unless "Show All" is clicked
  const displayedChecks = showAll ? filteredChecks : filteredChecks.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = filteredChecks.length > INITIAL_DISPLAY_COUNT;

  const getCategoryInfo = (categoryId: string) => 
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  
  return (
    <section 
      ref={sectionRef}
      className="py-24 relative"
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        {/* Warm glow at bottom transitioning to ThreatStats red */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-red-500/10 via-orange-500/5 to-transparent rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-sm font-medium mb-4"
          >
            Comprehensive Coverage
          </motion.span>
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              {IMPLEMENTED_CHECKS}+
            </span> Security Checks
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Real security scans covering SSL, headers, DNS, and vulnerabilities.
            <span className="text-gray-500 text-sm block mt-1">
              {ALL_SECURITY_CHECKS.length - IMPLEMENTED_CHECKS} additional checks coming soon for Pro+ plans
            </span>
          </motion.p>
        </motion.div>

        {/* Plan Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          {[
            { tier: 'essential' as const, label: 'Essential', count: checkCounts.essential, implemented: true },
            { tier: 'cloud' as const, label: 'Cloud', count: checkCounts.cloud, implemented: false },
            { tier: 'pro' as const, label: 'Pro', count: checkCounts.pro, implemented: false },
            { tier: 'enterprise' as const, label: 'Enterprise', count: checkCounts.enterprise, implemented: false },
          ].map(({ tier, label, count, implemented }) => (
            <motion.div 
              key={tier}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border ${TIER_COLORS[tier].border} ${TIER_COLORS[tier].bg} text-center cursor-pointer transition-all`}
              onClick={() => setActiveTier(tier)}
            >
              <p className={`text-2xl font-bold ${TIER_COLORS[tier].text}`}>{count}</p>
              <p className="text-gray-400 text-sm">{label} Checks</p>
              {!implemented && tier !== 'essential' && (
                <span className="text-[10px] text-gray-500">expanding</span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Tier filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-6"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          {tierFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeTier === filter.id;
            const colors = filter.id === 'all' ? null : TIER_COLORS[filter.id];
            
            return (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveTier(filter.id);
                  setShowAll(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? colors
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : 'bg-white text-black'
                    : 'bg-dark-accent text-gray-400 hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {filter.label}
              </button>
            );
          })}
        </motion.div>

        {/* Category filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <button
            onClick={() => {
              setActiveCategory(null);
              setShowAll(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
              activeCategory === null
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-dark-accent text-gray-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((category) => {
            const count = ALL_SECURITY_CHECKS.filter(c => {
              const categoryMatch = c.category === category.id;
              const tierMatch = activeTier === 'all' || c.tier === activeTier;
              return categoryMatch && tierMatch;
            }).length;
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setShowAll(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeCategory === category.id
                    ? `${category.bgColor} ${category.color} border ${category.borderColor}`
                    : 'bg-dark-accent text-gray-400 hover:text-white'
                }`}
              >
                {category.name}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </motion.div>

        {/* Checks Grid */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <AnimatePresence mode="popLayout">
            {displayedChecks.map((check, index) => {
              const categoryInfo = getCategoryInfo(check.category);
              const tierColors = TIER_COLORS[check.tier];
              const Icon = check.icon;
              // Mark checks beyond implemented count as "coming soon"
              const isComingSoon = index >= IMPLEMENTED_CHECKS && check.tier !== 'essential';
              
              return (
                <motion.div
                  key={check.id}
                  layout
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredCheck(check.id)}
                  onMouseLeave={() => setHoveredCheck(null)}
                >
                  <div className={`relative p-4 rounded-xl border transition-all duration-300 h-full ${
                    hoveredCheck === check.id 
                      ? `${categoryInfo.bgColor} ${categoryInfo.borderColor} shadow-lg` 
                      : 'bg-dark-secondary/50 border-dark-accent hover:border-gray-700'
                  } ${isComingSoon ? 'opacity-60' : ''}`}>
                    {/* Tier badge */}
                    {check.tier !== 'essential' && (
                      <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                        {check.tier === 'enterprise' ? (
                          <Crown className="w-2.5 h-2.5" />
                        ) : check.tier === 'cloud' ? (
                          <Zap className="w-2.5 h-2.5" />
                        ) : (
                          <Zap className="w-2.5 h-2.5" />
                        )}
                        {check.tier.toUpperCase().slice(0, 3)}
                      </div>
                    )}

                    {/* Coming Soon overlay */}
                    {isComingSoon && (
                      <div className="absolute top-2 left-2">
                        <Lock className="w-3 h-3 text-gray-500" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${categoryInfo.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${categoryInfo.color}`} />
                    </div>

                    {/* Name */}
                    <p className="text-white text-xs font-medium leading-tight mb-1">
                      {check.name}
                    </p>

                    {/* Time estimate */}
                    <p className={`text-[10px] text-gray-500 transition-opacity duration-200 ${
                      hoveredCheck === check.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      {isComingSoon ? 'Coming soon' : `~${check.estimatedTime}`}
                    </p>
                  </div>

                  {/* Tooltip on hover */}
                  {hoveredCheck === check.id && (
                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-dark-primary border border-dark-accent rounded-lg shadow-xl pointer-events-none">
                      <p className="text-white text-xs font-medium mb-1">{check.name}</p>
                      <p className="text-gray-400 text-[10px] leading-relaxed">{check.description}</p>
                      {isComingSoon && (
                        <p className="text-yellow-500 text-[10px] mt-1 font-medium">🔜 Coming in future update</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Load More / Show Less Button */}
        {hasMore && (
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-secondary border border-dark-accent rounded-xl text-gray-300 hover:text-white hover:border-yellow-500/50 transition-all cursor-pointer"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More ({filteredChecks.length - INITIAL_DISPLAY_COUNT} more)
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* No results */}
        {filteredChecks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No security checks match your filters.</p>
          </div>
        )}

        {/* Legend */}
        <motion.div 
          className="flex flex-wrap justify-center gap-6 mt-10"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4 text-gray-500" />
            <span>Free (Available Now)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>Pro</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Crown className="w-4 h-4 text-blue-500" />
            <span>Business</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>Enterprise</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
