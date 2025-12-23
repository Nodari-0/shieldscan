'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, DollarSign, Shield, HelpCircle, BookOpen, Users, Code, Home, X, ArrowRight, Command } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'page' | 'section' | 'feature';
}

const searchItems: SearchItem[] = [
  // Pages
  { id: 'home', title: 'Home', description: 'Return to homepage', href: '/', icon: Home, category: 'page' },
  { id: 'dashboard', title: 'Dashboard', description: 'View your scans and analytics', href: '/dashboard', icon: Shield, category: 'page' },
  { id: 'pricing', title: 'Pricing', description: 'View plans and pricing options', href: '/pricing', icon: DollarSign, category: 'page' },
  { id: 'documentation', title: 'Documentation', description: 'Learn how to use ShieldScan', href: '/documentation', icon: BookOpen, category: 'page' },
  { id: 'api-docs', title: 'API Documentation', description: 'Developer API reference', href: '/api-docs', icon: Code, category: 'page' },
  { id: 'developers', title: 'Developers', description: 'API keys and integrations', href: '/developers', icon: Code, category: 'page' },
  { id: 'blog', title: 'Blog', description: 'Security news and updates', href: '/blog', icon: FileText, category: 'page' },
  { id: 'help', title: 'Help Center', description: 'Get support and FAQs', href: '/help', icon: HelpCircle, category: 'page' },
  { id: 'account', title: 'Account Settings', description: 'Manage your profile and preferences', href: '/account', icon: Users, category: 'page' },
  { id: 'privacy', title: 'Privacy Policy', description: 'How we handle your data', href: '/privacy', icon: FileText, category: 'page' },
  { id: 'terms', title: 'Terms of Service', description: 'Service terms and conditions', href: '/terms', icon: FileText, category: 'page' },
  { id: 'cookies', title: 'Cookie Policy', description: 'Cookie usage information', href: '/cookies', icon: FileText, category: 'page' },
  { id: 'partners', title: 'Partners', description: 'Partnership opportunities', href: '/partners', icon: Users, category: 'page' },
  { id: 'solutions', title: 'Solutions', description: 'Security solutions for teams', href: '/solutions', icon: Shield, category: 'page' },
  { id: 'products', title: 'Products', description: 'Our security products', href: '/products', icon: Shield, category: 'page' },
  { id: 'testimonials', title: 'Testimonials', description: 'Share your experience', href: '/testimonials', icon: Users, category: 'page' },
  
  // Sections on homepage
  { id: 'pricing-section', title: 'Pricing Plans', description: 'Jump to pricing section on homepage', href: '/#pricing', icon: DollarSign, category: 'section' },
  { id: 'features', title: 'Features', description: 'See what ShieldScan offers', href: '/#features', icon: Shield, category: 'section' },
  { id: 'how-it-works', title: 'How It Works', description: 'Learn the scanning process', href: '/#how-it-works', icon: BookOpen, category: 'section' },
  
  // Features
  { id: 'scan', title: 'Start a Scan', description: 'Scan a website for vulnerabilities', href: '/dashboard', icon: Shield, category: 'feature' },
  { id: 'api-keys', title: 'API Keys', description: 'Manage your API keys', href: '/dashboard/api-keys', icon: Code, category: 'feature' },
  { id: 'login', title: 'Login', description: 'Sign in to your account', href: '/login', icon: Users, category: 'feature' },
  { id: 'register', title: 'Register', description: 'Create a new account', href: '/register', icon: Users, category: 'feature' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const categoryVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on dashboard - dashboard has its own search
  const isDashboard = pathname?.startsWith('/dashboard');

  // Filter results based on query
  const filteredItems = query.trim() === ''
    ? searchItems.slice(0, 8)
    : searchItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const flatItems = Object.values(groupedItems).flat();

  // Handle keyboard shortcut - disabled on dashboard
  useEffect(() => {
    if (isDashboard) return; // Don't add listener on dashboard

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDashboard]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle navigation with arrow keys
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      e.preventDefault();
      navigateTo(flatItems[selectedIndex].href);
    }
  }, [flatItems, selectedIndex]);

  const navigateTo = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  const categoryLabels: Record<string, string> = {
    page: 'Pages',
    section: 'Sections',
    feature: 'Features',
  };

  // Don't render on dashboard - it has its own search
  if (isDashboard) {
    return null;
  }

  return (
    <>
      {/* Hint Badge - Bottom Left */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 bg-dark-secondary/90 backdrop-blur-sm border border-dark-accent rounded-lg text-gray-400 hover:text-white hover:border-yellow-500/50 transition-all cursor-pointer group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.02 }}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Search</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-dark-accent rounded text-[10px] font-mono text-gray-500 group-hover:text-gray-300">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Container - Centered with Flexbox */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
              <motion.div
                className="w-full max-w-2xl pointer-events-auto"
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="bg-dark-secondary/95 backdrop-blur-xl border border-dark-accent/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search pages, features, sections..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedIndex(0);
                      }}
                      onKeyDown={handleInputKeyDown}
                      className="w-full pl-14 pr-14 py-5 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
                    />
                    <button
                      onClick={() => setIsOpen(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white hover:bg-dark-accent rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Results */}
                  <div className="border-t border-dark-accent/60 max-h-[55vh] overflow-y-auto no-scrollbar">
                    {flatItems.length === 0 ? (
                      <motion.div 
                        className="p-12 text-center text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No results found for &quot;{query}&quot;</p>
                        <p className="text-sm mt-1 text-gray-600">Try searching for something else</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="py-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={query}
                      >
                        {Object.entries(groupedItems).map(([category, items]) => (
                          <div key={category}>
                            <motion.div 
                              className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                              variants={categoryVariants}
                            >
                              {categoryLabels[category]}
                            </motion.div>
                            {items.map((item) => {
                              const globalIndex = flatItems.findIndex(i => i.id === item.id);
                              const isSelected = globalIndex === selectedIndex;
                              const Icon = item.icon;
                              
                              return (
                                <motion.button
                                  key={item.id}
                                  variants={itemVariants}
                                  onClick={() => navigateTo(item.href)}
                                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                                  className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-yellow-500/10'
                                      : 'hover:bg-dark-accent/30'
                                  }`}
                                >
                                  <motion.div 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isSelected ? 'bg-yellow-500/20' : 'bg-dark-accent/60'
                                    }`}
                                    animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Icon className={`w-5 h-5 transition-colors ${isSelected ? 'text-yellow-500' : 'text-gray-400'}`} />
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                      {item.title}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                      {item.description}
                                    </div>
                                  </div>
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: isSelected ? 1 : 0, x: isSelected ? 0 : -10 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <ArrowRight className="w-4 h-4 text-yellow-500" />
                                  </motion.div>
                                </motion.button>
                              );
                            })}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dark-accent/60 px-5 py-3 flex items-center justify-between text-xs text-gray-500 bg-dark-primary/30">
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-dark-accent/80 rounded text-[10px] font-mono">↑↓</kbd>
                        <span>Navigate</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-dark-accent/80 rounded text-[10px] font-mono">↵</kbd>
                        <span>Open</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-dark-accent/80 rounded text-[10px] font-mono">Esc</kbd>
                        <span>Close</span>
                      </span>
                    </div>
                    <span className="text-gray-600">{flatItems.length} results</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
