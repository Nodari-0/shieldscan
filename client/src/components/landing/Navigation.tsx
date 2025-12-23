'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ChevronDown, 
  Shield, Globe, Cloud, Server, Code, Zap,
  Users, Building2, Rocket, Briefcase,
  BookOpen, FileText, HelpCircle,
  Info, Mail, Award
} from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavLink {
  href: string;
  label: string;
  dropdown?: DropdownItem[];
}

export default function Navigation() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navLinks: NavLink[] = [
    { 
      href: '/products', 
      label: 'Products',
      dropdown: [
        { label: 'Website Scanner', href: '/products#website-scanner', icon: Globe, description: 'Comprehensive vulnerability scanning' },
        { label: 'API Security', href: '/products#api-security', icon: Code, description: 'Protect your API endpoints' },
        { label: 'Cloud Security', href: '/products#cloud-security', icon: Cloud, description: 'AWS, Azure & GCP security' },
        { label: 'Internal Scanning', href: '/products#internal-scanning', icon: Server, description: 'Secure internal networks' },
        { label: 'DAST', href: '/products#threat-intelligence', icon: Zap, description: 'Dynamic app security testing' },
      ]
    },
    { 
      href: '/solutions', 
      label: 'Solutions',
      dropdown: [
        { label: 'For Developers', href: '/solutions#developers', icon: Code, description: 'Security tools for dev teams' },
        { label: 'For Startups', href: '/solutions#startups', icon: Rocket, description: 'Affordable security solutions' },
        { label: 'For Agencies', href: '/solutions#agencies', icon: Briefcase, description: 'Multi-client management' },
        { label: 'For Enterprises', href: '/solutions#enterprises', icon: Building2, description: 'Enterprise-grade security' },
      ]
    },
    { 
      href: '/resources', 
      label: 'Resources',
      dropdown: [
        { label: 'Documentation', href: '/documentation', icon: BookOpen, description: 'Guides and tutorials' },
        { label: 'API Reference', href: '/developers', icon: FileText, description: 'API documentation' },
        { label: 'Blog', href: '/blog', icon: FileText, description: 'Security insights' },
        { label: 'Help Center', href: '/help', icon: HelpCircle, description: 'FAQs and support' },
      ]
    },
    { href: '/pricing', label: 'Pricing' },
    { 
      href: '/about', 
      label: 'Company',
      dropdown: [
        { label: 'About Us', href: '/about', icon: Info, description: 'Our mission and team' },
        { label: 'Partners', href: '/partners', icon: Users, description: 'Partner program' },
        { label: 'Contact', href: 'mailto:contact@shieldscan.com', icon: Mail, description: 'Get in touch' },
        { label: 'Trust Center', href: '/about#certifications', icon: Award, description: 'Security & compliance' },
      ]
    },
  ];

  const menuItems = useMemo(() => [
    ...navLinks,
    ...(isAuthenticated 
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/account', label: 'Account' },
          { href: '#logout', label: 'Logout' },
        ]
      : [
          { href: '/login', label: 'Sign In' },
          { href: '/register', label: 'Get Started' },
        ]
    ),
  ], [isAuthenticated]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setSelectedIndex(0);
  };

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!mobileMenuOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % menuItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        const selectedItem = menuItems[selectedIndex];
        if (selectedItem.href === '#logout') {
          handleSignOut();
        } else {
          router.push(selectedItem.href);
          closeMobileMenu();
        }
        break;
      case 'Escape':
        closeMobileMenu();
        break;
    }
  }, [mobileMenuOpen, selectedIndex, menuItems, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setSelectedIndex(0);
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/90 backdrop-blur-md border-b border-dark-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-9 h-9 flex-shrink-0">
                  <Image
                    src="/logo/ShieldScanLogo.png"
                    alt="ShieldScan Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <span className="text-lg font-bold font-display text-yellow-500 group-hover:text-yellow-400 transition-colors hidden sm:block">
                  ShieldScan
                </span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="flex items-center space-x-1 lg:space-x-2">
                {navLinks.map((link) => (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => link.dropdown && handleDropdownEnter(link.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-1 px-3 py-2 text-gray-300 hover:text-yellow-400 transition-colors text-sm lg:text-base rounded-lg hover:bg-white/5 ${
                        activeDropdown === link.label ? 'text-yellow-400 bg-white/5' : ''
                      }`}
                    >
                      {link.label}
                      {link.dropdown && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                      )}
                    </Link>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {link.dropdown && activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 w-72 bg-dark-secondary border border-dark-accent rounded-xl shadow-xl overflow-hidden z-50"
                          onMouseEnter={() => handleDropdownEnter(link.label)}
                          onMouseLeave={handleDropdownLeave}
                        >
                          <div className="p-2">
                            {link.dropdown.map((item, idx) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={idx}
                                  href={item.href}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-accent transition-colors group"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  {Icon && (
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                                      <Icon className="w-5 h-5 text-yellow-500" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm group-hover:text-yellow-400 transition-colors">
                                      {item.label}
                                    </p>
                                    {item.description && (
                                      <p className="text-gray-500 text-xs mt-0.5">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:flex items-center space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border border-yellow-500/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-base max-w-[120px] truncate">
                      {user?.displayName || user?.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-1.5 text-gray-400 hover:text-red-400 transition-colors text-base"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition-colors text-base"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-semibold text-base"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto xl:ml-0 flex-shrink-0">
              <div className="hidden lg:flex xl:hidden items-center gap-2">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center text-gray-300 hover:text-white transition-colors"
                  >
                    {user?.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border border-yellow-500/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-semibold text-base"
                  >
                    Get Started
                  </Link>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileMenu}
            />

            <motion.div
              className="fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <nav className="flex flex-col items-center space-y-6">
                {navLinks.map((link, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="block"
                      >
                        <motion.div
                          className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${
                            isSelected ? 'text-yellow-400' : 'text-white'
                          }`}
                          animate={{
                            x: isSelected ? 12 : 0,
                            scale: isSelected ? 1.08 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            className="text-yellow-400"
                            animate={{ 
                              opacity: isSelected ? 1 : 0,
                              scale: isSelected ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>{link.label}</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div 
                  className="w-24 h-px bg-dark-accent my-2"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                />

                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.2 }}
                    >
                      <Link href="/dashboard" onClick={closeMobileMenu} className="block">
                        <motion.div
                          className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
                            selectedIndex === navLinks.length ? 'text-yellow-400' : 'text-white'
                          }`}
                          animate={{
                            x: selectedIndex === navLinks.length ? 12 : 0,
                            scale: selectedIndex === navLinks.length ? 1.08 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            className="text-yellow-400"
                            animate={{ 
                              opacity: selectedIndex === navLinks.length ? 1 : 0,
                              scale: selectedIndex === navLinks.length ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>Dashboard</span>
                        </motion.div>
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.2 }}
                    >
                      <Link href="/account" onClick={closeMobileMenu} className="block">
                        <motion.div
                          className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
                            selectedIndex === navLinks.length + 1 ? 'text-yellow-400' : 'text-white'
                          }`}
                          animate={{
                            x: selectedIndex === navLinks.length + 1 ? 12 : 0,
                            scale: selectedIndex === navLinks.length + 1 ? 1.08 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            className="text-yellow-400"
                            animate={{ 
                              opacity: selectedIndex === navLinks.length + 1 ? 1 : 0,
                              scale: selectedIndex === navLinks.length + 1 ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>Account</span>
                        </motion.div>
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.2 }}
                    >
                      <button onClick={handleSignOut} className="block">
                        <motion.div
                          className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
                            selectedIndex === navLinks.length + 2 ? 'text-red-400' : 'text-red-500'
                          }`}
                          animate={{
                            x: selectedIndex === navLinks.length + 2 ? 12 : 0,
                            scale: selectedIndex === navLinks.length + 2 ? 1.08 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            className="text-red-400"
                            animate={{ 
                              opacity: selectedIndex === navLinks.length + 2 ? 1 : 0,
                              scale: selectedIndex === navLinks.length + 2 ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>Logout</span>
                        </motion.div>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.2 }}
                    >
                      <Link href="/login" onClick={closeMobileMenu} className="block">
                        <motion.div
                          className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
                            selectedIndex === navLinks.length ? 'text-yellow-400' : 'text-white'
                          }`}
                          animate={{
                            x: selectedIndex === navLinks.length ? 12 : 0,
                            scale: selectedIndex === navLinks.length ? 1.08 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            className="text-yellow-400"
                            animate={{ 
                              opacity: selectedIndex === navLinks.length ? 1 : 0,
                              scale: selectedIndex === navLinks.length ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>Sign In</span>
                        </motion.div>
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.2 }}
                    >
                      <Link href="/register" onClick={closeMobileMenu}>
                        <motion.div
                          className={`px-8 py-3 text-lg sm:text-xl font-bold rounded-xl flex items-center gap-2 ${
                            selectedIndex === navLinks.length + 1 
                              ? 'bg-yellow-500 text-black' 
                              : 'bg-yellow-600 text-white'
                          }`}
                          animate={{
                            scale: selectedIndex === navLinks.length + 1 ? 1.05 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <motion.span
                            animate={{ 
                              opacity: selectedIndex === navLinks.length + 1 ? 1 : 0,
                              scale: selectedIndex === navLinks.length + 1 ? 1 : 0.5,
                            }}
                            transition={{ duration: 0.15 }}
                          >
                            ›
                          </motion.span>
                          <span>Get Started</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </>
                )}
              </nav>

              <motion.div
                className="fixed bottom-6 right-6 flex items-center gap-3 px-3 py-2 bg-dark-secondary/90 backdrop-blur-sm border border-dark-accent rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4 }}
              >
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <kbd className="px-1.5 py-0.5 bg-dark-accent rounded text-[10px] font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <kbd className="px-1.5 py-0.5 bg-dark-accent rounded text-[10px] font-mono">↵</kbd>
                  <span>Select</span>
                </span>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
